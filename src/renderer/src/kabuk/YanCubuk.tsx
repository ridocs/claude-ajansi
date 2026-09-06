import {
  Building2,
  ClipboardList,
  History,
  FileText,
  FolderKanban,
  Home,
  LayoutGrid,
  Settings,
  Terminal,
  Users,
  Users2
} from 'lucide-react'
import Ahtapot from '../bilesenler/Ahtapot'

export type Sayfa =
  | 'ana'
  | 'ofis'
  | 'ekip'
  | 'gorevler'
  | 'projeler'
  | 'raporlar'
  | 'toplantilar'
  | 'gecmis'
  | 'komut'
  | 'dosyalar'
  | 'ayarlar'

interface Props {
  sayfa: Sayfa
  onSayfa: (s: Sayfa) => void
  surum: string
}

const MENU: Array<{ id: Sayfa; ad: string; Ikon: typeof Home }> = [
  { id: 'ana', ad: 'Ana Sayfa', Ikon: Home },
  { id: 'ofis', ad: 'Ofis', Ikon: Building2 },
  { id: 'ekip', ad: 'Ekip', Ikon: Users },
  { id: 'gorevler', ad: 'Görevler', Ikon: ClipboardList },
  { id: 'projeler', ad: 'Projeler', Ikon: FolderKanban },
  { id: 'raporlar', ad: 'Raporlar', Ikon: LayoutGrid },
  { id: 'toplantilar', ad: 'Toplantılar', Ikon: Users2 },
  { id: 'gecmis', ad: 'Geçmiş', Ikon: History },
  { id: 'komut', ad: 'Claude Command Center', Ikon: Terminal },
  { id: 'dosyalar', ad: 'Dosyalar', Ikon: FileText },
  { id: 'ayarlar', ad: 'Ayarlar', Ikon: Settings }
]

export default function YanCubuk({ sayfa, onSayfa, surum }: Props): React.JSX.Element {
  return (
    <aside className="yan">
      <div className="yan-marka">
        <Ahtapot boyut={32} />
        <span className="marka-yazi">
          <span className="marka-ad">
            Claude <em>Agency</em>
          </span>
          <span className="marka-alt">AI ile daha fazlasını başarmak.</span>
        </span>
      </div>

      <nav className="yan-menu">
        {MENU.map(({ id, ad, Ikon }) => (
          <button
            key={id}
            type="button"
            className={sayfa === id ? 'menu-oge etkin' : 'menu-oge'}
            onClick={() => onSayfa(id)}
            aria-current={sayfa === id ? 'page' : undefined}
          >
            <Ikon size={17} strokeWidth={1.9} />
            {ad}
          </button>
        ))}
      </nav>

      <p className="yan-alinti">
        “Harika işler, güçlü ekiplerle mümkün olur.”
        <span>— Claude</span>
      </p>

      <div className="yan-surum">v{surum}</div>
    </aside>
  )
}
