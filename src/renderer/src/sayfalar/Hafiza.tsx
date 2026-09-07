import { useCallback, useEffect, useMemo, useState } from 'react'
import { Brain, GraduationCap, Pencil, Save, Search, Trash2, X } from 'lucide-react'
import type { AgentSpec, Department, HafizaKaydi } from '../../../shared/types'
import { ajanAdi } from '../ajansDurumu'
import { gorunumAl } from '../departmanMeta'

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
    <div className="hafiza-sayfa">
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
                  <pre className="hafiza-metin">{seciliKayit.metin}</pre>
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
    </div>
  )
}
