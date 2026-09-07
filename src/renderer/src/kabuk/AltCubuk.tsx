import { Bell, Maximize2, MessageSquare, Plus, Settings } from 'lucide-react'
import Ahtapot from '../bilesenler/Ahtapot'

interface Props {
  surum: string
  ajanSayisi: number
  departmanSayisi: number
  aktifAjan: number
  bitenGorev: number
  dosyaSayisi: number
  hazir: boolean
  onYeniGorev: () => void
  onAyarlar: () => void
}

export default function AltCubuk({
  surum,
  ajanSayisi,
  departmanSayisi,
  aktifAjan,
  bitenGorev,
  dosyaSayisi,
  hazir,
  onYeniGorev,
  onAyarlar
}: Props): React.JSX.Element {
  return (
    <footer className="alt">
      <div className="kullanici">
        <Ahtapot boyut={22} />
        <span className="kullanici-ad">
          <b>Claude Agency</b>
        </span>
        <span className="yan-surum" style={{ padding: 0 }}>
          v{surum}
        </span>
      </div>

      <div className="alt-ozet">
        <span className={hazir ? 'rozet iyi' : 'rozet'}>
          <span className="nokta" />
          {aktifAjan} / {ajanSayisi} Çalışan Aktif
        </span>
        <span>{departmanSayisi} Departman</span>
        <span>{dosyaSayisi} Dosya</span>
        <span>{bitenGorev} Tamamlanan Görev</span>
      </div>

      <div className="alt-sag">
        <button
          type="button"
          className="ikon-dugme"
          title="Müdürle toplantı"
          onClick={() => void window.ajans.toplantiAc()}
        >
          <MessageSquare size={15} />
        </button>
        <button type="button" className="ikon-dugme" title="Bildirimler">
          <Bell size={15} />
        </button>
        <button type="button" className="ikon-dugme" onClick={onAyarlar} title="Ayarlar">
          <Settings size={15} />
        </button>
        <button
          type="button"
          className="ikon-dugme"
          title="Tam ekran"
          onClick={() => void window.ajans.tamEkran()}
        >
          <Maximize2 size={15} />
        </button>
        <button type="button" className="dugme dugme-birincil" onClick={onYeniGorev}>
          <Plus size={15} />
          Yeni Görev Oluştur
        </button>
      </div>
    </footer>
  )
}
