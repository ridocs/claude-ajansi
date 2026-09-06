import { useEffect, useState } from 'react'
import {
  CheckCircle2,
  FolderOpen,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  XCircle
} from 'lucide-react'
import type { AuthStatus, SetupCheck } from '../../../shared/types'
import { kisaKlasor } from '../ajansDurumu'

interface Props {
  durum: AuthStatus | null
  kontroller: SetupCheck[]
  klasor: string
  tamYetki: boolean
  kullaniciAdi: string
  onTamYetki: (deger: boolean) => void
  onKullaniciAdi: (ad: string) => void
  onKlasorSec: () => void
  onYenile: () => Promise<unknown>
}

export default function Ayarlar({
  durum,
  kontroller,
  klasor,
  tamYetki,
  kullaniciAdi,
  onTamYetki,
  onKullaniciAdi,
  onKlasorSec,
  onYenile
}: Props): React.JSX.Element {
  const [ad, setAd] = useState(kullaniciAdi)
  const hazir = durum?.ready === true

  useEffect(() => {
    setAd(kullaniciAdi)
  }, [kullaniciAdi])

  const adKaydet = (): void => {
    const temiz = ad.trim().slice(0, 40)
    if (temiz && temiz !== kullaniciAdi) onKullaniciAdi(temiz)
    else setAd(kullaniciAdi)
  }

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

      <section className={tamYetki ? 'kutu yetki-acik' : 'kutu'}>
        <div className="kutu-baslik">
          <h3>Yetki</h3>
          <span className={tamYetki ? 'rozet kotu' : 'rozet iyi'}>
            <span className="nokta" />
            {tamYetki ? 'tam yetki' : 'onay isteniyor'}
          </span>
        </div>
        <div className="kutu-govde yetki-govde">
          <span
            className="yetki-ikon"
            style={{ color: tamYetki ? 'var(--amber)' : 'var(--yesil)' }}
          >
            {tamYetki ? <ShieldAlert size={19} /> : <ShieldCheck size={19} />}
          </span>
          <p className="ipucu">
            {tamYetki
              ? 'Ajanlar tehlikeli komutları ve çalışma alanı dışına yazmayı sana sormadan yapar. Hızlıdır ama kontrol sende değildir.'
              : 'Tehlikeli komutlar (rm -rf, git reset --hard gibi) ve çalışma alanı dışına yazma girişimleri sana sorulur.'}
          </p>
          <button
            type="button"
            role="switch"
            aria-checked={tamYetki}
            className={tamYetki ? 'anahtar acik' : 'anahtar'}
            onClick={() => onTamYetki(!tamYetki)}
          >
            <span className="anahtar-yuva">
              <span className="anahtar-top" />
            </span>
            {tamYetki ? 'Tam yetki açık' : 'Tam yetki kapalı'}
          </button>
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
              yukarıdan Yenile&apos;ye bas.
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
            Ajansın dosyalarına dokunacağı klasör. Tam yetki kapalıyken bu klasörün dışına yazma
            girişimi sana sorulur.
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

      <section className="kutu">
        <div className="kutu-baslik">
          <h3>Görünen Ad</h3>
        </div>
        <div className="kutu-govde">
          <p className="ipucu">Üst çubukta ve karşılama satırında görünen isim.</p>
          <div className="yol-satir">
            <input
              className="giris"
              value={ad}
              maxLength={40}
              onChange={(e) => setAd(e.target.value)}
              onBlur={adKaydet}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
              }}
            />
            <button type="button" className="dugme" onClick={adKaydet}>
              Kaydet
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
