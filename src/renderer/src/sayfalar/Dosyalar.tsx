import { ExternalLink, FileCode2, FilePlus2, FolderSearch } from 'lucide-react'
import type { Teslimat } from '../../../shared/types'
import { ajanAdi } from '../ajansDurumu'

interface Props {
  teslimatlar: Teslimat[]
  klasor: string
}

/** Calisma alanina gore kisa yol; disaridaki dosya tam yoluyla gosterilir. */
function kisaYol(yol: string, klasor: string): string {
  if (!klasor) return yol
  // Windows (\) ve POSIX (/) ayiricilarini tek bicime indirger.
  const duzle = (s: string): string => s.split(/[\\/]/).filter(Boolean).join('/')
  const y = duzle(yol)
  const k = duzle(klasor)
  return y.startsWith(k + '/') ? y.slice(k.length + 1) : yol
}

export default function Dosyalar({ teslimatlar, klasor }: Props): React.JSX.Element {
  const yeni = teslimatlar.filter((t) => t.islem === 'olusturuldu').length

  return (
    <section className="kutu">
      <div className="kutu-baslik">
        <h3>Teslimat Deposu</h3>
        <span className="bag">
          {yeni} yeni · {teslimatlar.length - yeni} değiştirilen
        </span>
      </div>
      <div className="kutu-govde">
        {teslimatlar.length === 0 ? (
          <p className="bos">
            Henüz dosya üretilmedi. Uzmanlar bir dosya oluşturduğunda veya değiştirdiğinde burada
            listelenir.
          </p>
        ) : (
          <ul className="dosya-liste">
            {teslimatlar.map((t) => (
              <li key={t.yol} className="dosya-satir">
                <span
                  className="departman-ikon"
                  style={{ color: t.islem === 'olusturuldu' ? 'var(--yesil)' : 'var(--amber)' }}
                >
                  {t.islem === 'olusturuldu' ? <FilePlus2 size={14} /> : <FileCode2 size={14} />}
                </span>
                <span className="dosya-metin">
                  <b>{t.ad}</b>
                  <span title={t.yol}>{kisaYol(t.yol, klasor)}</span>
                </span>
                <span className="dosya-ajan">{ajanAdi(t.ajan)}</span>
                <span className="dosya-eylem">
                  <button
                    type="button"
                    className="ikon-dugme"
                    title="Dosyayı aç"
                    onClick={() => void window.ajans.dosyaAc(t.yol)}
                  >
                    <ExternalLink size={13} />
                  </button>
                  <button
                    type="button"
                    className="ikon-dugme"
                    title="Klasörde göster"
                    onClick={() => void window.ajans.klasordeGoster(t.yol)}
                  >
                    <FolderSearch size={13} />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
