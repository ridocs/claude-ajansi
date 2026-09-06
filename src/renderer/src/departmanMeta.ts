import {
  BarChart3,
  CheckCircle2,
  Database,
  LayoutTemplate,
  Palette,
  Server,
  Shield,
  TrendingUp,
  type LucideIcon
} from 'lucide-react'
import type { DepartmentId } from '../../shared/types'

export interface DepartmanGorunum {
  /** Panelde gorunen kisa ad. */
  ad: string
  Ikon: LucideIcon
  /** Kartin ikon kutusunda kullanilan renk degiskeni. */
  renk: string
}

/** Her departmanin gorsel kimligi: tasarimdaki renk kodlariyla eslesir. */
export const DEPARTMAN_GORUNUM: Record<DepartmentId, DepartmanGorunum> = {
  sistem: { ad: 'IT Uzmanları', Ikon: Server, renk: 'var(--mavi-acik)' },
  veri: { ad: 'Veri Analistleri', Ikon: BarChart3, renk: 'var(--yesil)' },
  seo: { ad: 'SEO Uzmanları', Ikon: TrendingUp, renk: 'var(--turuncu)' },
  frontend: { ad: 'Frontend Uzmanları', Ikon: LayoutTemplate, renk: 'var(--mor)' },
  backend: { ad: 'Backend Uzmanları', Ikon: Database, renk: 'var(--kirmizi)' },
  kalite: { ad: 'Test Uzmanları', Ikon: CheckCircle2, renk: 'var(--turkuaz)' },
  tasarim: { ad: 'UX/UI Uzmanları', Ikon: Palette, renk: 'var(--pembe)' },
  guvenlik: { ad: 'Güvenlik Uzmanları', Ikon: Shield, renk: 'var(--amber)' }
}

/** Bilinmeyen bir departman anahtari gelirse arayuz cokmez. */
export function gorunumAl(id: string): DepartmanGorunum {
  return (
    DEPARTMAN_GORUNUM[id as DepartmentId] ?? {
      ad: id,
      Ikon: Server,
      renk: 'var(--metin-3)'
    }
  )
}
