import type { AgencyEvent, AjanKaydi, DosyaIslem, Teslimat } from '../../shared/types'

export interface Konusma {
  key: string
  metin: string
  at: number
}

/** Ofiste sinyal olarak gosterilen bir gorev atamasi. */
export interface Atama {
  id: string
  atayan: string
  atanan: string
  at: number
}

export interface AjansDurumu {
  /** Goreve cagrilma sirasina gore ajanlar. */
  ajanlar: AjanKaydi[]
  teslimatlar: Teslimat[]
  toplamToken: number
  /** Calisma bitene kadar 0; sonda gercek degerle dolar. */
  maliyetUsd: number
  bekleyenOnay: number
  /**
   * Butun konusmalar, yeniden eskiye.
   *
   * Ofisin sagindaki mesaj paneli bunu gosterir: kim ne dedi, sirasiyla.
   */
  tumKonusmalar: Konusma[]
  /** En son gorev atamalari; ofiste faks/sinyal animasyonunu tetikler. */
  sonAtamalar: Atama[]
  /** Ajan anahtari -> son olay zamani. Kim az once hareket etti? */
  sonHareket: Record<string, number>
}

/** Yol ayiricisindan bagimsiz dosya adi. */
function dosyaAdi(yol: string): string {
  const parcalar = yol.split(/[\\/]/)
  return parcalar[parcalar.length - 1] || yol
}

/**
 * Olay akisindan ajansin o anki durumunu turetir.
 *
 * Saf fonksiyon: ayni olay dizisi her zaman ayni durumu verir, bu yuzden
 * arayuz calistirmadan test edilebilir.
 */
export function ajansDurumuHesapla(olaylar: AgencyEvent[]): AjansDurumu {
  const ajanlar = new Map<string, AjanKaydi>()
  const teslimatlar = new Map<string, Teslimat>()
  let toplamToken = 0
  let maliyetUsd = 0
  let bekleyenOnay = 0
  const konusmalar: Konusma[] = []
  const atamalar: Atama[] = []
  const sonHareket: Record<string, number> = {}

  for (const o of olaylar) {
    // Sistem olaylari bir ajana ait degil; onlari hareket sayilmiyoruz.
    if (o.agentKey !== 'sistem') sonHareket[o.agentKey] = o.at

    // Mesaj panelinde gosterilecek konusmalar.
    if (o.kind === 'ajan-konustu' && o.text.trim()) {
      konusmalar.unshift({ key: o.agentKey, metin: o.text.trim(), at: o.at })
    } else if (o.kind === 'ajan-basladi' && o.text.trim()) {
      konusmalar.unshift({ key: o.agentKey, metin: o.text.trim(), at: o.at })
    }

    switch (o.kind) {
      case 'ajan-basladi': {
        atamalar.unshift({
          id: o.id,
          atayan: String(o.meta?.atayan ?? 'mudur'),
          atanan: o.agentKey,
          at: o.at
        })
        // Ayni ajan birden cok kez goreve cagrilabilir; en son gorev gecerlidir.
        ajanlar.set(o.agentKey, {
          key: o.agentKey,
          durum: 'calisiyor',
          atayan: String(o.meta?.atayan ?? 'mudur'),
          gorev: o.text,
          basladi: o.at
        })
        break
      }

      case 'ajan-bitti': {
        const mevcut = ajanlar.get(o.agentKey)
        const m = o.meta ?? {}
        ajanlar.set(o.agentKey, {
          key: o.agentKey,
          durum: 'bitti',
          atayan: mevcut?.atayan ?? 'mudur',
          gorev: mevcut?.gorev ?? '',
          basladi: mevcut?.basladi ?? o.at,
          bitti: o.at,
          sureMs: Number(m.sureMs ?? 0),
          tokenler: Number(m.tokenler ?? 0),
          aracSayisi: Number(m.aracSayisi ?? 0),
          okuma: Number(m.okuma ?? 0),
          duzenleme: Number(m.duzenleme ?? 0),
          eklenenSatir: Number(m.eklenenSatir ?? 0),
          silinenSatir: Number(m.silinenSatir ?? 0),
          rapor: o.text
        })
        break
      }

      case 'dosya-degisti': {
        const yol = String(o.meta?.yol ?? o.text)
        const islem = String(o.meta?.islem ?? 'duzenlendi') as DosyaIslem
        const onceki = teslimatlar.get(yol)
        teslimatlar.set(yol, {
          yol,
          ad: dosyaAdi(yol),
          // Bir kez olusturulduysa sonraki duzenlemeler onu "olusturuldu" birakir.
          islem: onceki?.islem === 'olusturuldu' ? 'olusturuldu' : islem,
          ajan: o.agentKey,
          at: o.at
        })
        break
      }

      case 'maliyet': {
        const m = o.meta ?? {}
        if (typeof m.toplamToken === 'number') toplamToken = m.toplamToken
        if (typeof m.costUsd === 'number') maliyetUsd = m.costUsd
        break
      }

      case 'onay-gerekli': {
        bekleyenOnay += 1
        break
      }

      case 'oturum-bitti': {
        // Calisma bittiyse kimse hala calisiyor olamaz. Alt ajanlarin bitisi
        // her zaman ana akisa dusmedigi icin bu kapanis kurali gerekli.
        for (const [k, a] of ajanlar) {
          if (a.durum === 'calisiyor') ajanlar.set(k, { ...a, durum: 'bitti', bitti: o.at })
        }
        break
      }

      case 'hata': {
        // Sistem hatasi tek bir ajana ait degilse kimseyi hataya dusurmeyiz.
        const mevcut = ajanlar.get(o.agentKey)
        if (mevcut && mevcut.durum === 'calisiyor') {
          ajanlar.set(o.agentKey, { ...mevcut, durum: 'hata', bitti: o.at })
        }
        break
      }
    }

    // Bir ajan raporunu verdiyse, onun goreve cagirdigi ajanlar da isini
    // bitirmis demektir: lider uzmanlarini beklemeden rapor veremez.
    if (o.kind === 'ajan-bitti') {
      for (const [k, a] of ajanlar) {
        if (a.durum === 'calisiyor' && a.atayan === o.agentKey) {
          ajanlar.set(k, { ...a, durum: 'bitti', bitti: o.at })
        }
      }
    }
  }

  return {
    ajanlar: [...ajanlar.values()].sort((a, b) => a.basladi - b.basladi),
    teslimatlar: [...teslimatlar.values()].sort((a, b) => b.at - a.at),
    toplamToken,
    maliyetUsd,
    bekleyenOnay,
    // Panel uzun akisi gosterir ama sinirsiz buyumesin.
    tumKonusmalar: konusmalar.slice(0, 200),
    sonAtamalar: atamalar.slice(0, 6),
    sonHareket
  }
}

/** Ajan anahtarini okunabilir isme cevirir: "lider-backend" -> "Backend Lideri". */
export function ajanAdi(key: string): string {
  if (key === 'mudur') return 'Müdür'
  if (key === 'sistem') return 'Sistem'
  if (key === 'sen') return 'Sen'
  const p = key.split('-')
  if (p[0] === 'lider') return `${basHarf(p[1])} Lideri`
  if (p[0] === 'uzman') return `${basHarf(p[1])} · ${p.slice(2).map(basHarf).join(' ')}`
  return key
}

/** Ajanin bagli oldugu departman anahtari; mudur ve sistemde bos doner. */
export function ajanDepartmani(key: string): string {
  const p = key.split('-')
  return p[0] === 'lider' || p[0] === 'uzman' ? p[1] : ''
}

function basHarf(s = ''): string {
  return s.charAt(0).toLocaleUpperCase('tr') + s.slice(1)
}

/**
 * Uzun bir klasor yolunu okunabilir kisaltir: son iki parca kalir.
 * Kullanici icin anlamli olan kisim sondadir, bu yuzden bas taraf atilir.
 */
export function kisaKlasor(yol: string, parca = 2): string {
  if (!yol) return ''
  // Hem Windows (\) hem POSIX (/) ayiricisi.
  const p = yol.replace(/[\\/]+$/, '').split(/[\\/]/)
  if (p.length <= parca) return yol
  return '…/' + p.slice(-parca).join('/')
}
