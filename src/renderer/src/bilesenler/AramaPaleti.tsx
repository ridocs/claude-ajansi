import { useEffect, useMemo, useRef, useState } from 'react'
import { CornerDownLeft, FileText, Search, Users } from 'lucide-react'
import type { AgentSpec, Teslimat } from '../../../shared/types'
import { ajanAdi } from '../ajansDurumu'
import { gorunumAl } from '../departmanMeta'
import type { Sayfa } from '../kabuk/YanCubuk'

interface Props {
  acik: boolean
  kadro: AgentSpec[]
  teslimatlar: Teslimat[]
  onKapat: () => void
  onSayfa: (s: Sayfa) => void
  onDosya: (yol: string) => void
}

interface Sonuc {
  id: string
  tur: 'sayfa' | 'ajan' | 'dosya'
  baslik: string
  alt: string
  renk?: string
  calistir: () => void
}

const SAYFALAR: Array<{ id: Sayfa; ad: string; alt: string }> = [
  { id: 'ana', ad: 'Ana Sayfa', alt: 'kadro özeti ve canlı ofis' },
  { id: 'ofis', ad: 'Ofis', alt: 'masa başındaki ajanlar' },
  { id: 'ekip', ad: 'Ekip', alt: '33 ajan ve hafızaları' },
  { id: 'gorevler', ad: 'Görevler', alt: 'görev panosu' },
  { id: 'projeler', ad: 'Projeler', alt: 'proje başlat, çalışma alanları' },
  { id: 'raporlar', ad: 'Raporlar', alt: 'departman yükü ve ajan karnesi' },
  { id: 'toplantilar', ad: 'Toplantılar', alt: 'müdür–lider transkripti' },
  { id: 'komut', ad: 'Claude Command Center', alt: 'brief ver, akışı izle' },
  { id: 'dosyalar', ad: 'Dosyalar', alt: 'üretilen teslimatlar' },
  { id: 'ayarlar', ad: 'Ayarlar', alt: 'bağlantı, yetki, çalışma alanı' }
]

/** Basit alt dizi eslesmesi; Turkce karakterleri normallestirir. */
function eslesir(metin: string, sorgu: string): boolean {
  const n = (s: string): string =>
    s
      .toLocaleLowerCase('tr')
      .replace(/ı/g, 'i')
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
  return n(metin).includes(n(sorgu))
}

export default function AramaPaleti({
  acik,
  kadro,
  teslimatlar,
  onKapat,
  onSayfa,
  onDosya
}: Props): React.JSX.Element | null {
  const [sorgu, setSorgu] = useState('')
  const [secili, setSecili] = useState(0)
  const girdiRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (acik) {
      setSorgu('')
      setSecili(0)
      girdiRef.current?.focus()
    }
  }, [acik])

  const sonuclar = useMemo<Sonuc[]>(() => {
    const liste: Sonuc[] = []

    for (const s of SAYFALAR) {
      if (!sorgu || eslesir(s.ad, sorgu) || eslesir(s.alt, sorgu)) {
        liste.push({
          id: `sayfa-${s.id}`,
          tur: 'sayfa',
          baslik: s.ad,
          alt: s.alt,
          calistir: () => onSayfa(s.id)
        })
      }
    }

    if (sorgu) {
      for (const a of kadro) {
        if (eslesir(a.title, sorgu) || eslesir(a.expertise, sorgu) || eslesir(a.key, sorgu)) {
          liste.push({
            id: `ajan-${a.key}`,
            tur: 'ajan',
            baslik: a.title,
            alt: a.expertise,
            renk: gorunumAl(a.department ?? '').renk,
            calistir: () => onSayfa('ekip')
          })
        }
      }

      for (const t of teslimatlar) {
        if (eslesir(t.ad, sorgu) || eslesir(t.yol, sorgu)) {
          liste.push({
            id: `dosya-${t.yol}`,
            tur: 'dosya',
            baslik: t.ad,
            alt: `${ajanAdi(t.ajan)} üretti`,
            calistir: () => onDosya(t.yol)
          })
        }
      }
    }

    return liste.slice(0, 24)
  }, [sorgu, kadro, teslimatlar, onSayfa, onDosya])

  if (!acik) return null

  const sec = (i: number): void => {
    const s = sonuclar[i]
    if (!s) return
    s.calistir()
    onKapat()
  }

  return (
    <div className="ortu palet-ortu" onClick={onKapat} role="presentation">
      <div
        className="palet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Arama"
      >
        <div className="palet-girdi">
          <Search size={16} />
          <input
            ref={girdiRef}
            value={sorgu}
            onChange={(e) => {
              setSorgu(e.target.value)
              setSecili(0)
            }}
            placeholder="Sayfa, ajan veya dosya ara..."
            spellCheck={false}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onKapat()
              else if (e.key === 'ArrowDown') {
                e.preventDefault()
                setSecili((i) => Math.min(i + 1, sonuclar.length - 1))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setSecili((i) => Math.max(i - 1, 0))
              } else if (e.key === 'Enter') {
                e.preventDefault()
                sec(secili)
              }
            }}
          />
          <span className="arama-kisayol">Esc</span>
        </div>

        <div className="palet-liste">
          {sonuclar.length === 0 ? (
            <p className="bos">Eşleşen bir şey yok.</p>
          ) : (
            sonuclar.map((s, i) => (
              <button
                key={s.id}
                type="button"
                className={i === secili ? 'palet-satir secili' : 'palet-satir'}
                onMouseEnter={() => setSecili(i)}
                onClick={() => sec(i)}
              >
                <span className="departman-ikon" style={{ color: s.renk ?? 'var(--metin-3)' }}>
                  {s.tur === 'ajan' ? (
                    <Users size={13} />
                  ) : s.tur === 'dosya' ? (
                    <FileText size={13} />
                  ) : (
                    <CornerDownLeft size={13} />
                  )}
                </span>
                <span className="palet-metin">
                  <b>{s.baslik}</b>
                  <span>{s.alt}</span>
                </span>
                <span className="palet-tur">{s.tur}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
