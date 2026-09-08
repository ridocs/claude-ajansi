import { useCallback, useEffect, useMemo, useState } from 'react'
import { Brain, GraduationCap, List, Network, Pencil, Save, Search, Trash2, X } from 'lucide-react'
import type { AgentSpec, Department, HafizaKaydi } from '../../../shared/types'
import { ajanAdi } from '../ajansDurumu'
import { gorunumAl } from '../departmanMeta'
import { ASAMA_ETIKET, ASAMA_RENK, asamaBul, grafKur } from '../beyinAgi'
import BeyinGrafi from '../bilesenler/BeyinGrafi'

interface Props {
  departmanlar: Department[]
  klasor: string
  calisiyor: boolean
  hazir: boolean
  onEgit: () => Promise<void>
}

function tarih(ms: number): string {
  if (!ms) return ''
  return new Date(ms).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
}

/**
 * Hafizayi okunabilir bolumler halinde gosterir: tarih basliklari kart,
 * "### " basliklari alt baslik, maddeler liste olur.
 */
function HafizaGovdesi({ metin }: { metin: string }): React.JSX.Element {
  const bloklar: Array<{ tarih: string; satirlar: string[] }> = []

  for (const ham of metin.split('\n')) {
    const satir = ham.trimEnd()
    const tarihBasligi = satir.match(/^##\s+(.+)$/)
    if (tarihBasligi) {
      bloklar.push({ tarih: tarihBasligi[1].trim(), satirlar: [] })
      continue
    }
    if (bloklar.length === 0) bloklar.push({ tarih: '', satirlar: [] })
    bloklar[bloklar.length - 1].satirlar.push(satir)
  }

  return (
    <div className="hafiza-bloklar">
      {bloklar.map((b, i) => (
        <article key={i} className="hafiza-blok">
          {b.tarih && <header className="hafiza-blok-tarih">{b.tarih}</header>}
          <div className="hafiza-blok-govde">
            {b.satirlar.map((satir, j) => {
              const alt = satir.match(/^#{3,}\s+(.+)$/)
              if (alt) {
                return (
                  <h4 key={j} className="hafiza-alt-baslik">
                    {alt[1]}
                  </h4>
                )
              }
              const madde = satir.match(/^\s*[-*]\s+(.+)$/)
              if (madde) {
                return (
                  <p key={j} className="hafiza-madde">
                    {madde[1]}
                  </p>
                )
              }
              if (!satir.trim()) return null
              return (
                <p key={j} className="hafiza-paragraf">
                  {satir}
                </p>
              )
            })}
          </div>
        </article>
      ))}
    </div>
  )
}

export default function Hafiza({
  departmanlar,
  klasor,
  calisiyor,
  hazir,
  onEgit
}: Props): React.JSX.Element {
  const [kadro, setKadro] = useState<AgentSpec[]>([])
  const [hafiza, setHafiza] = useState<HafizaKaydi[]>([])
  const [secili, setSecili] = useState<string | null>(null)
  const [duzenle, setDuzenle] = useState(false)
  const [taslak, setTaslak] = useState('')
  const [sorgu, setSorgu] = useState('')
  const [gorunum, setGorunum] = useState<'liste' | 'ag'>('liste')
  const [vurguKonu, setVurguKonu] = useState<string | null>(null)

  const yenile = useCallback(async () => {
    setHafiza(await window.ajans.hafiza())
  }, [])

  useEffect(() => {
    void window.ajans.kadro().then((k) => setKadro(k.agents))
    void yenile()
  }, [yenile])

  // Eğitim turu bitince yeni bilgiler listeye düşsün.
  useEffect(() => {
    if (!calisiyor) void yenile()
  }, [calisiyor, yenile])

  const kayit = (key: string): HafizaKaydi | undefined => hafiza.find((h) => h.ajanKey === key)

  const seciliKayit = secili ? kayit(secili) : undefined
  const seciliAjan = secili ? kadro.find((a) => a.key === secili) : undefined

  const toplamBoyut = hafiza.reduce((t, h) => t + h.boyut, 0)

  const graf = useMemo(
    () => grafKur({ departmanlar, kadro, hafiza, renkAl: (id) => gorunumAl(id).renk }),
    [departmanlar, kadro, hafiza]
  )

  /** Arama: ajan adında, uzmanlıkta ve hafıza içeriğinde arar. */
  const eslesenler = useMemo(() => {
    if (!sorgu.trim()) return null
    const n = (s: string): string => s.toLocaleLowerCase('tr')
    const q = n(sorgu)
    return new Set(
      kadro
        .filter((a) => {
          const h = kayit(a.key)
          return (
            n(a.title).includes(q) ||
            n(a.expertise).includes(q) ||
            (h ? n(h.metin).includes(q) : false)
          )
        })
        .map((a) => a.key)
    )
  }, [sorgu, kadro, hafiza])

  const kaydet = async (): Promise<void> => {
    if (!secili) return
    setHafiza(await window.ajans.hafizaYaz(secili, taslak))
    setDuzenle(false)
  }

  const sil = async (key: string): Promise<void> => {
    setHafiza(await window.ajans.hafizaSil(key))
    if (secili === key) setSecili(null)
  }

  const hepsiniSil = async (): Promise<void> => {
    setHafiza(await window.ajans.hafizaTemizle())
    setSecili(null)
  }

  return (
    <div className="hafiza-sayfa hafiza-sabit">
      <div className="karsilama">
        <div>
          <h1>Hafıza</h1>
          <p>
            {hafiza.length > 0
              ? `${hafiza.length} ajanda ${(toplamBoyut / 1000).toFixed(1)}k karakter birikmiş bilgi. Ajanlar görev alırken bunu okur.`
              : 'Henüz bilgi birikmedi. Eğitim turunda her uzman kendi alanını araştırıp öğrendiklerini buraya yazar.'}
          </p>
        </div>
        <div className="filtreler">
          <div className="gorunum-secici">
            <button
              type="button"
              className={gorunum === 'liste' ? 'secici-dugme etkin' : 'secici-dugme'}
              onClick={() => setGorunum('liste')}
            >
              <List size={13} /> Liste
            </button>
            <button
              type="button"
              className={gorunum === 'ag' ? 'secici-dugme etkin' : 'secici-dugme'}
              onClick={() => setGorunum('ag')}
            >
              <Network size={13} /> Beyin ağı
            </button>
          </div>
          {hafiza.length > 0 && (
            <button type="button" className="dugme" onClick={() => void hepsiniSil()}>
              <Trash2 size={14} /> Tümünü sil
            </button>
          )}
          <button
            type="button"
            className="dugme dugme-birincil"
            onClick={() => void onEgit()}
            disabled={calisiyor || !hazir || !klasor}
            title={
              !hazir
                ? 'Claude bağlantısı yok'
                : !klasor
                  ? 'Önce çalışma klasörü seç'
                  : calisiyor
                    ? 'Ajans şu an meşgul'
                    : 'Bütün uzmanlar kendi alanını araştırır'
            }
          >
            <GraduationCap size={15} />
            Ajansı Eğit
          </button>
        </div>
      </div>

      {gorunum === 'ag' ? (
        <div className="ag-duzen">
          <BeyinGrafi
            graf={graf}
            secili={secili}
            onSec={(k) => {
              setSecili(k)
              setDuzenle(false)
            }}
            vurguKonu={vurguKonu}
          />

          <aside className="ag-yan">
            <section className="kutu">
              <div className="kutu-baslik">
                <h3>Ağın Olgunluğu</h3>
                <span className="bag">%{Math.round(graf.olgunluk * 100)}</span>
              </div>
              <div className="kutu-govde">
                <ul className="asama-liste">
                  {(['olgun', 'gelisen', 'filiz', 'bos'] as const).map((a) => {
                    const sayi = graf.dugumler.filter((d) => d.asama === a).length
                    return (
                      <li key={a}>
                        <span className="nokta" style={{ background: ASAMA_RENK[a] }} />
                        {ASAMA_ETIKET[a]}
                        <b>{sayi}</b>
                      </li>
                    )
                  })}
                </ul>
                <p className="ipucu">
                  Düğüm büyüdükçe o ajanın bilgisi artmış demektir. Renkli çizgiler ortak
                  öğrenilmiş konuları gösterir.
                </p>
              </div>
            </section>

            <section className="kutu">
              <div className="kutu-baslik">
                <h3>Ortak Konular</h3>
                {vurguKonu && (
                  <button type="button" className="bag" onClick={() => setVurguKonu(null)}>
                    <X size={12} /> temizle
                  </button>
                )}
              </div>
              <div className="kutu-govde">
                {graf.konuSikligi.length === 0 ? (
                  <p className="bos">Henüz konu çıkmadı. Ajansı eğit.</p>
                ) : (
                  <div className="konu-bulutu">
                    {graf.konuSikligi.map((k) => (
                      <button
                        key={k.konu}
                        type="button"
                        className={vurguKonu === k.konu ? 'konu secili' : 'konu'}
                        onClick={() => setVurguKonu(vurguKonu === k.konu ? null : k.konu)}
                        title={`${k.sayi} ajan biliyor`}
                      >
                        {k.konu}
                        <span>{k.sayi}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {seciliAjan && (
              <section className="kutu">
                <div className="kutu-baslik">
                  <h3>{seciliAjan.title}</h3>
                  <span
                    className="rozet"
                    style={{ color: ASAMA_RENK[asamaBul(seciliKayit?.boyut ?? 0)] }}
                  >
                    {ASAMA_ETIKET[asamaBul(seciliKayit?.boyut ?? 0)]}
                  </span>
                </div>
                <div className="kutu-govde">
                  <p className="ipucu">{seciliAjan.expertise}</p>
                  {seciliKayit ? (
                    <pre className="hafiza-metin">{seciliKayit.metin}</pre>
                  ) : (
                    <p className="bos">Bu ajan henüz bir şey öğrenmedi.</p>
                  )}
                </div>
              </section>
            )}
          </aside>
        </div>
      ) : (
      <div className="hafiza-duzen">
        {/* --- sol: ajan listesi --- */}
        <section className="kutu hafiza-liste">
          <div className="kutu-baslik">
            <div className="hafiza-arama">
              <Search size={14} />
              <input
                value={sorgu}
                onChange={(e) => setSorgu(e.target.value)}
                placeholder="Ajan veya bilgi ara..."
                spellCheck={false}
              />
            </div>
          </div>
          <div className="hafiza-govde">
            {departmanlar.map((d) => {
              const g = gorunumAl(d.id)
              const uyeler = [d.leadKey, ...d.specialistKeys]
                .map((k) => kadro.find((a) => a.key === k))
                .filter((a): a is AgentSpec => Boolean(a))
                .filter((a) => !eslesenler || eslesenler.has(a.key))

              if (uyeler.length === 0) return null

              return (
                <div key={d.id} className="hafiza-bolum">
                  <div className="hafiza-bolum-tepe">
                    <span className="departman-ikon" style={{ color: g.renk }}>
                      <g.Ikon size={13} />
                    </span>
                    <b>{g.ad}</b>
                  </div>
                  {uyeler.map((a) => {
                    const h = kayit(a.key)
                    return (
                      <button
                        key={a.key}
                        type="button"
                        className={secili === a.key ? 'hafiza-oge secili' : 'hafiza-oge'}
                        onClick={() => {
                          setSecili(a.key)
                          setDuzenle(false)
                        }}
                      >
                        <span className="hafiza-oge-ad">{a.title}</span>
                        {h ? (
                          <span className="hafiza-rozet">
                            <Brain size={10} />
                            {(h.boyut / 1000).toFixed(1)}k
                          </span>
                        ) : (
                          <span className="hafiza-bos-rozet">boş</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </section>

        {/* --- sağ: seçili ajanın hafızası --- */}
        <section className="kutu hafiza-detay">
          {!seciliAjan ? (
            <div className="kutu-govde yakinda">
              <span className="departman-ikon" style={{ color: 'var(--mor)' }}>
                <Brain size={16} />
              </span>
              <h3>Bir ajan seç</h3>
              <p>
                Soldaki listeden bir ajana tıkla; ne öğrendiğini görebilir, düzeltebilir veya
                silebilirsin. Yazdığın her şey o ajanın sonraki görevlerinde promptuna eklenir.
              </p>
            </div>
          ) : (
            <>
              <div className="kutu-baslik">
                <div className="departman-tepe">
                  <span
                    className="departman-ikon"
                    style={{ color: gorunumAl(seciliAjan.department ?? '').renk }}
                  >
                    <Brain size={14} />
                  </span>
                  <span className="departman-ad">
                    <b>{seciliAjan.title}</b>
                    <span>
                      {seciliKayit
                        ? `${seciliKayit.boyut} karakter · ${tarih(seciliKayit.guncellendi)}`
                        : 'henüz bir şey öğrenmedi'}
                    </span>
                  </span>
                </div>
                <div className="hafiza-eylem">
                  {duzenle ? (
                    <>
                      <button type="button" className="bag" onClick={() => setDuzenle(false)}>
                        <X size={13} /> Vazgeç
                      </button>
                      <button type="button" className="dugme" onClick={() => void kaydet()}>
                        <Save size={13} /> Kaydet
                      </button>
                    </>
                  ) : (
                    <>
                      {seciliKayit && (
                        <button
                          type="button"
                          className="bag"
                          onClick={() => void sil(seciliAjan.key)}
                        >
                          <Trash2 size={13} /> Sil
                        </button>
                      )}
                      <button
                        type="button"
                        className="dugme"
                        onClick={() => {
                          setTaslak(seciliKayit?.metin ?? '')
                          setDuzenle(true)
                        }}
                      >
                        <Pencil size={13} /> {seciliKayit ? 'Düzenle' : 'Bilgi ekle'}
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="kutu-govde hafiza-icerik">
                <p className="ipucu">{seciliAjan.expertise}</p>

                {duzenle ? (
                  <textarea
                    className="alan hafiza-alan"
                    value={taslak}
                    onChange={(e) => setTaslak(e.target.value)}
                    placeholder="Bu ajanın bilmesi gerekenler... Markdown yazabilirsin."
                    autoFocus
                  />
                ) : seciliKayit ? (
                  <HafizaGovdesi metin={seciliKayit.metin} />
                ) : (
                  <p className="bos">
                    Bu ajan henüz bir şey öğrenmedi. &quot;Ajansı Eğit&quot; ile araştırma yaptırabilir
                    ya da &quot;Bilgi ekle&quot; ile kendin yazabilirsin.
                  </p>
                )}
              </div>
            </>
          )}
        </section>
      </div>
      )}
    </div>
  )
}
