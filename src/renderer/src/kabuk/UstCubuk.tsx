import { Search, Settings, User } from 'lucide-react'
import { useEffect, useState } from 'react'

interface Props {
  hazir: boolean
  calisiyor: boolean
  onAyarlar: () => void
}

/** Saat her dakika basi yenilenir; saniye gostermiyoruz. */
function useSaat(): Date {
  const [an, setAn] = useState(() => new Date())
  useEffect(() => {
    const zamanlayici = setInterval(() => setAn(new Date()), 30_000)
    return () => clearInterval(zamanlayici)
  }, [])
  return an
}

export default function UstCubuk({ hazir, calisiyor, onAyarlar }: Props): React.JSX.Element {
  const an = useSaat()

  return (
    <header className="ust">
      <div className="arama">
        <Search size={15} />
        <input type="search" placeholder="Ekipte, görevde veya çalışanda ara..." spellCheck={false} />
        <span className="arama-kisayol">Ctrl + K</span>
      </div>

      <div className="ust-sag">
        <span className={hazir ? 'rozet iyi' : 'rozet kotu'}>
          <span className={calisiyor ? 'nokta canli' : 'nokta'} />
          {hazir ? (calisiyor ? 'Ajans Çalışıyor' : 'Sistem Aktif') : 'Bağlantı Yok'}
        </span>

        <div className="saat">
          <b>{an.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</b>
          <span>
            {an.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>

        <button type="button" className="ikon-dugme" onClick={onAyarlar} title="Ayarlar">
          <Settings size={16} />
          {!hazir && <span className="isaret" />}
        </button>

        <div className="kullanici">
          <span className="avatar">
            <User size={16} />
          </span>
          <span className="kullanici-ad">
            <b>Ajans Sahibi</b>
            <span>Yönetici</span>
          </span>
        </div>
      </div>
    </header>
  )
}
