import { useEffect, useState } from 'react'
import { Check, FolderOpen, FolderPlus, Rocket } from 'lucide-react'
import { kisaKlasor } from '../ajansDurumu'
import { PROJE_SABLONLARI, type ProjeSablonu } from '../projeSablonlari'

interface Props {
  klasor: string
  calisiyor: boolean
  onKlasorSec: () => void
  onKlasorKullan: (klasor: string) => void
  onBaslat: (brief: string) => Promise<void>
}

function projeAdi(yol: string): string {
  const p = yol.replace(/[\\/]+$/, '').split(/[\\/]/)
  return p[p.length - 1] || yol
}

export default function Projeler({
  klasor,
  calisiyor,
  onKlasorSec,
  onKlasorKullan,
  onBaslat
}: Props): React.JSX.Element {
  const [gecmis, setGecmis] = useState<string[]>([])
  const [secili, setSecili] = useState<ProjeSablonu | null>(null)
  const [konu, setKonu] = useState('')

  useEffect(() => {
    void window.ajans.ayarlar().then((a) => setGecmis(a.klasorGecmisi))
  }, [klasor])

  const baslatilabilir = Boolean(secili) && konu.trim().length > 4 && !!klasor && !calisiyor

  const baslat = async (): Promise<void> => {
    if (!secili || !baslatilabilir) return
    await onBaslat(secili.brief(konu.trim()))
  }

  return (
    <div className="projeler">
      <div className="karsilama">
        <div>
          <h1>Projeler</h1>
          <p>Bir tür seç, konusunu yaz ve başlat. Ajans işi bölüşüp klasörde üretir.</p>
        </div>
        <button
          type="button"
          className="dugme"
          onClick={onKlasorSec}
          disabled={calisiyor}
        >
          <FolderPlus size={15} />
          Klasör seç
        </button>
      </div>

      {/* --- yeni proje başlat --- */}
      <section className="kutu">
        <div className="kutu-baslik">
          <h3>Yeni Proje Başlat</h3>
          {klasor && <span className="bag">{projeAdi(klasor)} klasöründe</span>}
        </div>
        <div className="kutu-govde baslat-govde">
          <div className="sablon-izgara">
            {PROJE_SABLONLARI.map((s) => (
              <button
                key={s.id}
                type="button"
                className={secili?.id === s.id ? 'sablon sablon-secili' : 'sablon'}
                onClick={() => setSecili(secili?.id === s.id ? null : s)}
                disabled={calisiyor}
              >
                <span className="departman-ikon" style={{ color: s.renk }}>
                  <s.Ikon size={15} />
                </span>
                <span className="sablon-metin">
                  <b>{s.ad}</b>
                  <span>{s.ozet}</span>
                </span>
              </button>
            ))}
          </div>

          {secili && (
            <div className="baslat-alan">
              <label className="ipucu" htmlFor="konu">
                <b>{secili.ad}</b> — konusu ne olsun?
              </label>
              <input
                id="konu"
                className="giris"
                placeholder="örn. bir kahve dükkânı için tanıtım sitesi"
                value={konu}
                onChange={(e) => setKonu(e.target.value)}
                disabled={calisiyor}
                autoFocus
              />
              <div className="komut-eylem">
                <button
                  type="button"
                  className="dugme dugme-birincil"
                  onClick={() => void baslat()}
                  disabled={!baslatilabilir}
                  title={
                    !klasor
                      ? 'Önce klasör seç'
                      : konu.trim().length <= 4
                        ? 'Konuyu biraz daha açık yaz'
                        : undefined
                  }
                >
                  <Rocket size={15} />
                  Başlat
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* --- çalışma alanları --- */}
      <section className="kutu">
        <div className="kutu-baslik">
          <h3>Çalışma Alanları</h3>
          <span className="bag">{gecmis.length} klasör</span>
        </div>
        <div className="kutu-govde">
          {gecmis.length === 0 ? (
            <p className="bos">
              Henüz klasör seçilmedi. Bir klasör seçtiğinde burada listelenir ve sonraki
              açılışlarda tek tıkla dönebilirsin.
            </p>
          ) : (
            <div className="proje-izgara">
              {gecmis.map((y) => {
                const acik = y === klasor
                return (
                  <button
                    key={y}
                    type="button"
                    className={acik ? 'proje-kart proje-secili' : 'proje-kart'}
                    onClick={() => !acik && !calisiyor && onKlasorKullan(y)}
                    disabled={calisiyor && !acik}
                    title={y}
                  >
                    <span className="proje-tepe">
                      <span
                        className="departman-ikon"
                        style={{ color: acik ? 'var(--yesil)' : 'var(--amber)' }}
                      >
                        {acik ? <Check size={14} /> : <FolderOpen size={14} />}
                      </span>
                      <b>{projeAdi(y)}</b>
                    </span>
                    <span className="proje-yol">{kisaKlasor(y, 3)}</span>
                    <span className="proje-durum">
                      <span
                        className="uye-durum"
                        style={{ color: acik ? 'var(--yesil)' : 'var(--metin-3)' }}
                      >
                        {acik && <span className="nokta" />}
                        {acik ? 'açık proje' : 'geç'}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
