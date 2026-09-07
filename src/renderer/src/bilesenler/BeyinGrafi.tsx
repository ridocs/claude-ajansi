import { useMemo, useRef, useState } from 'react'
import { ASAMA_ETIKET, ASAMA_RENK, type Graf } from '../beyinAgi'

interface Props {
  graf: Graf
  secili: string | null
  onSec: (key: string | null) => void
  /** Vurgulanacak konu: o konuyu bilen düğümler öne çıkar. */
  vurguKonu?: string | null
}

const G = 1000
const Y = 800

/**
 * Beyin agi grafigi.
 *
 * Yapi baglari (mudur-lider-uzman) sonuk cizgilerle, bilgi baglari (ortak
 * ogrenilen konular) renkli ve kalin cizilir. Dugum boyutu birikmis bilginin
 * miktarini, halka rengi gelisim asamasini gosterir.
 */
export default function BeyinGrafi({ graf, secili, onSec, vurguKonu }: Props): React.JSX.Element {
  const [odak, setOdak] = useState<string | null>(null)
  const [yakinlik, setYakinlik] = useState(1)
  const [kaydir, setKaydir] = useState({ x: 0, y: 0 })
  const surukle = useRef<{ x: number; y: number; bx: number; by: number } | null>(null)

  const dugumHarita = useMemo(
    () => new Map(graf.dugumler.map((d) => [d.key, d])),
    [graf.dugumler]
  )

  /** Seçili/odaktaki düğümün komşuları vurgulanır. */
  const vurgulu = useMemo(() => {
    const hedef = odak ?? secili
    if (vurguKonu) {
      return new Set(graf.dugumler.filter((d) => d.konular.includes(vurguKonu)).map((d) => d.key))
    }
    if (!hedef) return null
    const kume = new Set<string>([hedef])
    for (const b of graf.baglar) {
      if (b.a === hedef) kume.add(b.b)
      if (b.b === hedef) kume.add(b.a)
    }
    return kume
  }, [odak, secili, vurguKonu, graf])

  const sonuk = (key: string): boolean => vurgulu !== null && !vurgulu.has(key)

  return (
    <div className="graf-sarmal">
      <svg
        viewBox={`0 0 ${G} ${Y}`}
        className="graf"
        role="img"
        aria-label="Ajan hafıza ağı"
        onMouseDown={(e) => {
          surukle.current = { x: e.clientX, y: e.clientY, bx: kaydir.x, by: kaydir.y }
        }}
        onMouseMove={(e) => {
          const s = surukle.current
          if (!s) return
          setKaydir({ x: s.bx + (e.clientX - s.x), y: s.by + (e.clientY - s.y) })
        }}
        onMouseUp={() => {
          surukle.current = null
        }}
        onMouseLeave={() => {
          surukle.current = null
          setOdak(null)
        }}
        onWheel={(e) => {
          const yeni = Math.min(2.4, Math.max(0.55, yakinlik - e.deltaY * 0.0012))
          setYakinlik(yeni)
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onSec(null)
        }}
      >
        <defs>
          <radialGradient id="graf-fon" cx="50%" cy="45%" r="62%">
            <stop offset="0%" stopColor="#111c31" />
            <stop offset="100%" stopColor="#070c16" />
          </radialGradient>
          <filter id="parla" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="7" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect width={G} height={Y} fill="url(#graf-fon)" />

        <g transform={`translate(${kaydir.x} ${kaydir.y}) scale(${yakinlik}) translate(${(G * (1 - 1 / yakinlik)) / -2} ${(Y * (1 - 1 / yakinlik)) / -2})`}>
          {/* --- bağlar --- */}
          <g>
            {graf.baglar.map((b, i) => {
              const da = dugumHarita.get(b.a)
              const db = dugumHarita.get(b.b)
              if (!da || !db) return null
              const solgun = sonuk(b.a) || sonuk(b.b)
              const bilgi = b.tur === 'bilgi'
              return (
                <line
                  key={`${b.a}-${b.b}-${i}`}
                  x1={da.x}
                  y1={da.y}
                  x2={db.x}
                  y2={db.y}
                  stroke={bilgi ? da.renk : '#4a5f8a'}
                  strokeWidth={bilgi ? Math.min(1.4 + b.guc * 0.5, 3.6) : 1.3}
                  strokeOpacity={solgun ? 0.07 : bilgi ? 0.5 : 0.42}
                  strokeDasharray={bilgi ? undefined : '4 5'}
                  className={bilgi ? 'bag bag-bilgi' : 'bag'}
                />
              )
            })}
          </g>

          {/* --- düğümler --- */}
          <g>
            {graf.dugumler.map((d) => {
              const solgun = sonuk(d.key)
              const seciliMi = secili === d.key
              const r = d.boyut + Math.min(Math.sqrt(d.bilgiBoyutu) * 0.28, 16)

              return (
                <g
                  key={d.key}
                  transform={`translate(${d.x} ${d.y})`}
                  className={`dugum${solgun ? ' sonuk' : ''}${seciliMi ? ' secili' : ''}`}
                  onMouseEnter={() => setOdak(d.key)}
                  onMouseLeave={() => setOdak(null)}
                  onClick={(e) => {
                    e.stopPropagation()
                    onSec(seciliMi ? null : d.key)
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onSec(seciliMi ? null : d.key)
                    }
                  }}
                >
                  <title>
                    {d.ad} — {ASAMA_ETIKET[d.asama]}
                    {d.bilgiBoyutu > 0 ? ` · ${(d.bilgiBoyutu / 1000).toFixed(1)}k karakter` : ''}
                  </title>

                  {/* dolu düğümlerde hafif parıltı */}
                  {d.asama !== 'bos' && (
                    <circle
                      r={r + 5}
                      fill={d.renk}
                      opacity={d.asama === 'olgun' ? 0.16 : 0.09}
                      filter="url(#parla)"
                      className="dugum-hale"
                    />
                  )}

                  <circle
                    r={r}
                    fill={d.asama === 'bos' ? 'var(--panel)' : d.renk}
                    fillOpacity={d.asama === 'bos' ? 0.85 : 0.28}
                    stroke={ASAMA_RENK[d.asama]}
                    strokeWidth={seciliMi ? 2.6 : 1.6}
                  />

                  {/* çekirdek: bilgi miktarını gösteren iç daire */}
                  {d.bilgiBoyutu > 0 && (
                    <circle
                      r={Math.max(3, Math.min(r - 5, Math.sqrt(d.bilgiBoyutu) * 0.2))}
                      fill={d.renk}
                      opacity="0.75"
                    />
                  )}

                  <text y={r + 13} className="dugum-ad" fill="var(--metin-2)">
                    {d.kisaAd}
                  </text>
                </g>
              )
            })}
          </g>
        </g>
      </svg>

      <div className="graf-yardim">
        <span>tekerlek: yakınlaştır</span>
        <span>sürükle: kaydır</span>
        <button
          type="button"
          className="bag"
          onClick={() => {
            setYakinlik(1)
            setKaydir({ x: 0, y: 0 })
          }}
        >
          sıfırla
        </button>
      </div>
    </div>
  )
}
