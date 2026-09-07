import {
  query,
  type AgentDefinition,
  type Options,
  type SDKUserMessage
} from '@anthropic-ai/claude-agent-sdk'
import { randomUUID } from 'node:crypto'
import { EGITIM_TALIMATI, egitimPrompt } from './egitim'
import { hafizaBolumu, hafizaDizini, hafizaDosyaYolu } from './hafiza'
import { ekipBilgisi } from './hafizaPaylasim'
import { ogrenmeyeDeger } from './ogrenme'
import { YAZAN_ARACLAR, izinDegerlendir } from './izin'
import { buildRoster, mudurPrompt } from './roster'
import { anlikAl, farkAl } from './teslimat'
import type {
  AgencyEvent,
  AgencyEventKind,
  Brief,
  DosyaIslem,
  RunSummary
} from '../../shared/types'

export type OlayDinleyici = (olay: AgencyEvent) => void

/** Onay kapısı: riskli bir iş için kullanıcıya sorar. */
export type Onaylayici = (istek: {
  agentKey: string
  tool: string
  ozet: string
}) => Promise<boolean>

function olay(kind: AgencyEventKind, agentKey: string, text: string, meta?: Record<string, unknown>): AgencyEvent {
  return { id: randomUUID(), kind, agentKey, text, at: Date.now(), meta }
}

/**
 * Ajana kendi hafiza dosyasinin yerini soyler.
 *
 * Boylece gecmise donuk bakabilir ve ogrendigini kendisi guncelleyebilir;
 * hafiza tek yonlu bir okuma degil, ajanin tuttugu canli bir defter olur.
 */
function hafizaDosyaNotu(ajanKey: string): string {
  return [
    '',
    '--- HAFIZA DEFTERİN ---',
    `Kalıcı hafızan şu dosyada: ${hafizaDosyaYolu(ajanKey)}`,
    'Bu dosyayı Read ile açıp geçmişte ne öğrendiğine bakabilirsin.',
    'Yeni ve doğruladığın bir bilgi edindiysen dosyayı Edit ile güncelle:',
    'en üste bugünün tarihiyle "## GG.AA.YYYY" başlığı aç ve altına yaz.',
    'Eskiyen bir bilgi gördüğünde onu düzelt; yanlış bilgiyi öylece bırakma.',
    'Dosyayı şişirme: her madde kısa, somut ve uygulanabilir olsun.',
    '--- DEFTER SONU ---',
    ''
  ].join('\n')
}

/** Egitim turunda herkes arastirabilsin, kimse yazamasin. */
const EGITIM_ARACLARI = ['Read', 'Grep', 'Glob', 'WebSearch', 'WebFetch', 'TodoWrite']
const EGITIM_LIDER_ARACLARI = [...EGITIM_ARACLARI, 'Agent', 'SendMessage']

/** Kadroyu Agent SDK'nın beklediği biçime çevirir. */
function ajanTanimlari(egitim: boolean): Record<string, AgentDefinition> {
  const { agents, departments } = buildRoster()
  const tanimlar: Record<string, AgentDefinition> = {}
  for (const a of agents) {
    const lider = a.role === 'lider'
    tanimlar[a.key] = {
      description: `${a.title}. ${a.expertise}`,
      // Ajanin kendi birikimi + ekibinin bildiklerinin ozeti.
      // Egitim turunda ekip bilgisi verilmez: herkes kendi arastirmasini yapar.
      prompt:
        a.prompt +
        hafizaDosyaNotu(a.key) +
        hafizaBolumu(a.key) +
        (egitim ? EGITIM_TALIMATI : ekipBilgisi({ ajanKey: a.key, departmanlar: departments, kadro: agents })),
      tools: egitim ? (lider ? EGITIM_LIDER_ARACLARI : EGITIM_ARACLARI) : a.tools,
      model: a.model,
      effort: a.effort,
      // Ates-et-unut kapali: cagiran ajan sonucu beklemek zorunda.
      // Acikken lider isini bitirmeden mudur devam ediyor, is yarim kaliyordu.
      background: false
    }
  }
  return tanimlar
}

/**
 * Mudure gonderilen mesajlarin kuyrugu.
 *
 * Oturum acik kaldigi surece bekler: mudur bir soru sordugunda kullanici
 * cevabini yazabilir ve konusma ayni baglamda devam eder.
 */
class MesajKuyrugu implements AsyncIterable<SDKUserMessage> {
  private bekleyen: SDKUserMessage[] = []
  private uyandir: (() => void) | null = null
  private kapali = false

  ekle(metin: string): void {
    this.bekleyen.push({
      type: 'user',
      message: { role: 'user', content: metin },
      parent_tool_use_id: null
    })
    this.serbestBirak()
  }

  kapat(): void {
    this.kapali = true
    this.serbestBirak()
  }

  private serbestBirak(): void {
    const coz = this.uyandir
    this.uyandir = null
    coz?.()
  }

  async *[Symbol.asyncIterator](): AsyncGenerator<SDKUserMessage> {
    while (true) {
      while (this.bekleyen.length > 0) {
        yield this.bekleyen.shift() as SDKUserMessage
      }
      if (this.kapali) return
      await new Promise<void>((coz) => {
        this.uyandir = coz
      })
    }
  }
}

export interface CalismaSecenek {
  /** Acikken riskli isler sorulmadan calistirilir. */
  tamYetki?: boolean
  /**
   * Egitim turu: ajanlar kendi alanlarini arastirir ve raporlari
   * hafizalarina yazilir. Verildiginde her ajan bitisinde cagrilir.
   */
  onOgrenme?: (ajanKey: string, rapor: string) => void
  /** Egitim turu: ajanlar arastirir, hicbir dosyaya dokunmaz. */
  egitim?: boolean
}

export interface CalismaKontrol {
  /** Ajansı durdurur; çalışan bütün ajanlar iptal edilir. */
  durdur: () => void
  /** Müdüre yeni bir mesaj gönderir: soru cevabı ya da ek talimat. */
  mesajGonder: (metin: string) => void
  /** Oturumu kapatır; müdür son sözünü söyleyip çıkar. */
  oturumuKapat: () => void
  /** Oturum tamamen bittiğinde son özet döner. */
  sonuc: Promise<RunSummary>
}

/**
 * Brief'i ajansa verir. Müdür ana oturumda çalışır, takım liderlerini alt ajan
 * olarak açar, liderler de kendi uzmanlarını açar.
 */
export function briefCalistir(
  brief: Brief,
  onEvent: OlayDinleyici,
  onayla: Onaylayici,
  secenek: CalismaSecenek = {}
): CalismaKontrol {
  const { departments } = buildRoster()
  const iptal = new AbortController()
  const kuyruk = new MesajKuyrugu()
  kuyruk.ekle(brief.text)

  // Alt ajanların hangi ajana ait olduğunu Agent aracının tool_use kimliğinden izleriz.
  const ajanKimligi = new Map<string, string>()
  const kimKonusuyor = (parentToolUseId: string | null | undefined): string =>
    (parentToolUseId && ajanKimligi.get(parentToolUseId)) || 'mudur'

  const egitim = secenek.egitim === true

  const options: Options = {
    cwd: brief.workspace,
    systemPrompt: egitim ? egitimPrompt(departments) : mudurPrompt(departments),
    agents: ajanTanimlari(egitim),
    // Müdürün kendi araçları: dağıtır, denetler, kendisi kod yazmaz.
    allowedTools: ['Agent', 'Read', 'Grep', 'Glob', 'TodoWrite', 'SendMessage'],
    // 'acceptEdits' yazma araclarini canUseTool'a ugramadan onaylardi;
    // kapinin calismasi icin karar bizde kaliyor.
    permissionMode: 'default',
    // Ajanlar kendi hafiza dosyalarini okuyup guncelleyebilsin.
    additionalDirectories: [hafizaDizini()],
    abortController: iptal,
    env: {
      // Ajan sureci kurulu Claude oturumunu kendisi bulur; anahtar enjekte etmiyoruz.
      ...process.env,
      // Müdür → lider → uzman: üç katman, daha derini yok.
      CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH: '2',
      // 8 lider + 24 uzman aynı anda çalışabilsin.
      CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS: '32',
      // Yerlesik ajanlar (Explore, general-purpose) kapali: herkes kendi
      // kadrosundan ajan cagirsin, yoksa uzmanlar devre disi kaliyor.
      CLAUDE_AGENT_SDK_DISABLE_BUILTIN_AGENTS: '1'
    },
    canUseTool: async (tool, input) => {
      // Egitim turu: hicbir sey yazilmaz, komut calistirilmaz.
      if (egitim && (YAZAN_ARACLAR.has(tool) || tool === 'Bash')) {
        return {
          behavior: 'deny' as const,
          message: 'Bu bir eğitim turu; dosya yazmak ve komut çalıştırmak kapalı. Yalnızca araştır ve öğrendiklerini özetle.'
        }
      }

      // Tam yetki: kullanici sorulmamasini secmis.
      if (secenek.tamYetki) return { behavior: 'allow' as const, updatedInput: input }

      const karar = izinDegerlendir(brief.workspace, tool, input, [hafizaDizini()])
      if (karar.tur === 'izin') return { behavior: 'allow' as const, updatedInput: input }

      onEvent(olay('onay-gerekli', 'sistem', karar.ozet))
      const izin = await onayla({ agentKey: 'sistem', tool, ozet: karar.ozet })
      return izin
        ? { behavior: 'allow' as const, updatedInput: input }
        : { behavior: 'deny' as const, message: karar.redMesaji }
    }
  }

  let toplamToken = 0
  let sonOzet: RunSummary = {
    ok: false,
    subtype: 'sonucsuz',
    costUsd: 0,
    durationMs: 0,
    result: ''
  }

  const sonuc = (async (): Promise<RunSummary> => {
    const basladi = Date.now()
    onEvent(olay('oturum-basladi', 'sistem', `Ajans toplandı. Çalışma alanı: ${brief.workspace}`))

    // Neyin uretildigini dosya sisteminden ogrenmek icin baslangic goruntusu.
    const oncekiDosyalar = anlikAl(brief.workspace)

    try {
      for await (const mesaj of query({ prompt: kuyruk, options })) {
        const m = mesaj as Record<string, any>

        if (m.type === 'assistant' && m.message?.content) {
          const konusan = kimKonusuyor(m.parent_tool_use_id)

          for (const blok of m.message.content) {
            if (blok.type === 'text' && blok.text?.trim()) {
              onEvent(olay('ajan-konustu', konusan, blok.text.trim()))
              continue
            }

            if (blok.type !== 'tool_use') continue

            // Agent aracı: yeni bir ajan göreve başlıyor.
            if (blok.name === 'Agent' || blok.name === 'Task') {
              const hedef = String(blok.input?.subagent_type ?? 'general-purpose')
              ajanKimligi.set(blok.id, hedef)
              onEvent(
                olay('ajan-basladi', hedef, String(blok.input?.prompt ?? '').slice(0, 400), {
                  atayan: konusan
                })
              )
              continue
            }

            onEvent(olay('arac-cagrildi', konusan, blok.name, { girdi: blok.input }))

            // Dosyaya dokunan araçlar teslimat deposunu besler.
            const yol = String(blok.input?.file_path ?? blok.input?.notebook_path ?? '')
            if (yol && YAZAN_ARACLAR.has(blok.name)) {
              const islem: DosyaIslem = blok.name === 'Write' ? 'olusturuldu' : 'duzenlendi'
              onEvent(olay('dosya-degisti', konusan, yol, { yol, islem }))
            }
          }
        }

        // Alt ajan bitti: raporu ve çalışma toplamları tool_use_result'ta gelir.
        if (m.type === 'user') {
          const cikti = m.tool_use_result as Record<string, any> | undefined
          if (cikti?.status === 'completed' && typeof cikti.agentId === 'string') {
            const kim = String(cikti.agentType ?? kimKonusuyor(m.parent_tool_use_id))
            const rapor = Array.isArray(cikti.content)
              ? cikti.content
                  .filter((c: Record<string, any>) => c?.type === 'text')
                  .map((c: Record<string, any>) => String(c.text ?? ''))
                  .join('\n')
                  .trim()
              : ''
            const istatistik = cikti.toolStats ?? {}

            toplamToken += Number(cikti.totalTokens ?? 0)
            // Hafizaya yalnizca uzmanlarin gercek arastirma ciktisi girer.
            // Liderin ara notu ("uzmanlar hala calisiyor") bilgi degildir ve
            // hafizayi kirletir.
            if (secenek.onOgrenme && ogrenmeyeDeger(kim, rapor)) {
              secenek.onOgrenme(kim, rapor)
            }
            onEvent(
              olay('ajan-bitti', kim, rapor.slice(0, 2000), {
                sureMs: Number(cikti.totalDurationMs ?? 0),
                tokenler: Number(cikti.totalTokens ?? 0),
                aracSayisi: Number(cikti.totalToolUseCount ?? 0),
                okuma: Number(istatistik.readCount ?? 0),
                duzenleme: Number(istatistik.editFileCount ?? 0),
                eklenenSatir: Number(istatistik.linesAdded ?? 0),
                silinenSatir: Number(istatistik.linesRemoved ?? 0)
              })
            )
            onEvent(
              olay('maliyet', 'sistem', `İşlenen token: ${toplamToken.toLocaleString('tr-TR')}`, {
                toplamToken
              })
            )
          }
        }

        // Bir tur bitti. Oturum acik kaldigi icin burada donmuyoruz:
        // kullanici cevap yazabilir, mudur ayni baglamda devam eder.
        if (m.type === 'result') {
          const ok = m.subtype === 'success'

          // Arac cagrilarindan kacan dosyalari da teslimat deposuna ekle.
          for (const f of farkAl(oncekiDosyalar, anlikAl(brief.workspace), brief.workspace)) {
            onEvent(olay('dosya-degisti', 'sistem', f.yol, { yol: f.yol, islem: f.islem }))
          }

          onEvent(
            olay('maliyet', 'sistem', `Toplam maliyet: ${(m.total_cost_usd ?? 0).toFixed(4)} USD`, {
              costUsd: m.total_cost_usd ?? 0
            })
          )
          onEvent(
            olay(
              'tur-bitti',
              'mudur',
              ok ? 'Müdür sözünü bitirdi; cevap yazabilir ya da oturumu kapatabilirsin.' : `Tur bitti: ${m.subtype}`
            )
          )

          sonOzet = {
            ok,
            subtype: String(m.subtype ?? 'bilinmiyor'),
            costUsd: m.total_cost_usd ?? 0,
            durationMs: Date.now() - basladi,
            result: String(m.result ?? '')
          }
        }
      }

      onEvent(olay('oturum-bitti', 'sistem', 'Oturum kapandı.'))
      return sonOzet
    } catch (hata) {
      const mesaj = hata instanceof Error ? hata.message : String(hata)
      onEvent(olay('hata', 'sistem', mesaj))
      return { ...sonOzet, ok: false, subtype: 'hata', result: mesaj }
    }
  })()

  return {
    durdur: () => {
      kuyruk.kapat()
      iptal.abort()
    },
    mesajGonder: (metin: string) => {
      onEvent(olay('kullanici-mesaji', 'sen', metin))
      kuyruk.ekle(metin)
    },
    oturumuKapat: () => kuyruk.kapat(),
    sonuc
  }
}
