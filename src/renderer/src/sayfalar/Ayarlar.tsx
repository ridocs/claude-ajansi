import { CheckCircle2, FolderOpen, RefreshCw, XCircle } from 'lucide-react'
import type { AuthStatus, SetupCheck } from '../../../shared/types'
import { kisaKlasor } from '../ajansDurumu'

interface Props {
  durum: AuthStatus | null
  kontroller: SetupCheck[]
  klasor: string
  onKlasorSec: () => void
  onYenile: () => Promise<unknown>
}

export default function Ayarlar({
  durum,
  kontroller,
  klasor,
  onKlasorSec,
  onYenile
}: Props): React.JSX.Element {
  const hazir = durum?.ready === true

  return (
    <div className="ayarlar">
      <section className="kutu">
        <div className="kutu-baslik">
          <h3>Sistem Durumu</h3>
          <button type="button" className="bag" onClick={() => void onYenile()}>
            <RefreshCw size={13} /> Yenile
          </button>
        </div>
        <div className="kutu-govde">
          <ul className="kontrol-liste">
            {kontroller.map((k) => (
              <li key={k.id} className={`kontrol kontrol-${k.state}`}>
                <span className="kontrol-ikon">
                  {k.state === 'tamam' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                </span>
                <span className="kontrol-metin">
                  <b>{k.label}</b>
                  <span>{k.detail}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="kutu">
        <div className="kutu-baslik">
          <h3>Claude Bağlantısı</h3>
          <span className={hazir ? 'rozet iyi' : 'rozet kotu'}>
            <span className="nokta" />
            {hazir ? 'bağlı' : 'bağlı değil'}
          </span>
        </div>
        <div className="kutu-govde">
          <p className="ipucu">
            Ajans bu makinede açık olan Claude oturumuyla çalışır. Ayrı bir API anahtarı istenmez,
            saklanmaz ve ajan sürecine geçirilmez; kullanım senin aboneliğinden düşer.
          </p>
          {!hazir && (
            <p className="ipucu uyari">
              Oturum bulunamadı. Terminalde <code>claude</code> komutunu çalıştırıp giriş yap, sonra
              yukarıdan Yenile'ye bas.
            </p>
          )}
        </div>
      </section>

      <section className="kutu">
        <div className="kutu-baslik">
          <h3>Çalışma Alanı</h3>
        </div>
        <div className="kutu-govde">
          <p className="ipucu">
            Ajansın dosyalarına dokunacağı klasör. Uzmanlar bu klasörün dışına yazmak isterse ya da
            tehlikeli bir komut çalıştıracaksa sana sorulur.
          </p>
          <div className="yol-satir">
            <FolderOpen size={14} />
            <span className="yol" title={klasor}>
              {klasor ? kisaKlasor(klasor, 3) : 'henüz klasör seçilmedi'}
            </span>
            <button type="button" className="dugme" onClick={onKlasorSec}>
              Klasör seç
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
