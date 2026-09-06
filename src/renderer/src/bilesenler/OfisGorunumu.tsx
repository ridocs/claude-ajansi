import { useMemo } from 'react'
import type { Department, DepartmentId } from '../../../shared/types'
import type { AjansDurumu } from '../ajansDurumu'
import { ajanAdi } from '../ajansDurumu'
import { gorunumAl } from '../departmanMeta'

interface Props {
  departmanlar: Department[]
  ajans: AjansDurumu
  hazir: boolean
  onDepartman?: (id: string) => void
}

type AjanDurum = 'hazir' | 'calisiyor' | 'bitti' | 'hata' | 'kapali'

const G = 1320
const Y = 618

/** Mudurun masasi solda; ekipler onun karsisinda yay ciziyor. */
const MERKEZ = { x: 208, y: 336 }
const YARICAP = 830
const ACI_UC = 66
const DIKEY_ORAN = 0.44

// ---------------------------------------------------------------- şehir

function Sehir(): React.JSX.Element {
  const binalar = useMemo(() => {
    let t = 11
    const rast = (): number => {
      t = (t * 1103515245 + 12345) % 2147483648
      return t / 2147483648
    }
    return Array.from({ length: 30 }, (_, i) => {
      const g = 24 + rast() * 32
      const y = 34 + rast() * 84
      return {
        x: i * 45 - 8,
        y,
        g,
        yuk: 176 - y,
        pencereler: Array.from({ length: Math.max(1, Math.floor((176 - y) / 14)) }, (_, j) => ({
          j,
          yanar: rast() > 0.42,
          gecikme: rast() * 8
        }))
      }
    })
  }, [])

  return (
    <g>
      {binalar.map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={b.y} width={b.g} height={b.yuk} fill="#0b1322" />
          {b.pencereler.map((p) =>
            p.yanar ? (
              <rect
                key={p.j}
                className="pencere"
                x={b.x + 4}
                y={b.y + 7 + p.j * 14}
                width={b.g - 8}
                height="5"
                rx="1"
                fill="#4b82c4"
                style={{ animationDelay: `${p.gecikme}s` }}
              />
            ) : null
          )}
        </g>
      ))}
    </g>
  )
}

// ---------------------------------------------------------------- ekran içerikleri

/** Her departman kendi isine dair veri gosterir. */
function EkranIcerik({
  dept,
  renk,
  canli,
  gecikme
}: {
  dept: DepartmentId | 'mudur'
  renk: string
  canli: boolean
  gecikme: number
}): React.JSX.Element {
  const stil = { animationDelay: `${gecikme}s` }
  const c = canli ? ' canli' : ''

  switch (dept) {
    // Kod satırları yukarı akar
    case 'backend':
    case 'sistem':
      return (
        <g className={`ic-kod${c}`} style={stil}>
          {Array.from({ length: 16 }, (_, i) => (
            <rect
              key={i}
              x={2.5 + (i % 3) * 1.6}
              y={i * 4}
              width={5 + ((i * 7) % 16)}
              height="1.8"
              rx="0.8"
              fill={renk}
              opacity={0.4 + ((i * 13) % 10) / 16}
            />
          ))}
        </g>
      )

    // Yükselip alçalan çubuklar
    case 'seo':
    case 'veri':
      return (
        <g className={`ic-grafik${c}`}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect
              key={i}
              className="cubuk"
              x={3 + i * 3.9}
              y="3"
              width="2.6"
              height="15"
              rx="0.5"
              fill={renk}
              style={{ animationDelay: `${gecikme + i * 0.18}s` }}
            />
          ))}
        </g>
      )

    // Arayüz iskeleti: bloklar sırayla parlar
    case 'frontend':
    case 'tasarim':
      return (
        <g className={`ic-arayuz${c}`}>
          <rect className="blok" x="3" y="3" width="18" height="3.4" rx="1" fill={renk} style={{ animationDelay: `${gecikme}s` }} />
          <rect className="blok" x="3" y="8.5" width="8" height="9" rx="1" fill={renk} style={{ animationDelay: `${gecikme + 0.5}s` }} />
          <rect className="blok" x="13" y="8.5" width="8" height="4" rx="1" fill={renk} style={{ animationDelay: `${gecikme + 1}s` }} />
          <rect className="blok" x="13" y="14" width="8" height="3.5" rx="1" fill={renk} style={{ animationDelay: `${gecikme + 1.5}s` }} />
        </g>
      )

    // Test listesi: tikler sırayla yeşerir
    case 'kalite':
      return (
        <g className={`ic-test${c}`}>
          {[0, 1, 2, 3].map((i) => (
            <g key={i} className="satir" style={{ animationDelay: `${gecikme + i * 0.45}s` }}>
              <path
                d={`M4 ${5 + i * 4.2} l1.6 1.6 l3 -3.2`}
                fill="none"
                stroke={renk}
                strokeWidth="1.3"
                strokeLinecap="round"
              />
              <rect x="11" y={4 + i * 4.2} width={7 + ((i * 5) % 8)} height="1.6" rx="0.8" fill={renk} opacity="0.55" />
            </g>
          ))}
        </g>
      )

    // Güvenlik taraması: kalkan ve tarama çizgisi
    case 'guvenlik':
      return (
        <g className={`ic-tarama${c}`}>
          <path
            d="M14 3 l7 2.6 v5.2 c0 4-3 6.6-7 7.8 -4-1.2-7-3.8-7-7.8V5.6Z"
            fill="none"
            stroke={renk}
            strokeWidth="1.3"
            opacity="0.75"
          />
          <rect className="tarama-cizgi" x="4" y="3" width="20" height="1.6" rx="0.8" fill={renk} style={stil} />
        </g>
      )

    // Müdür ekranı: dalga
    default:
      return (
        <g className={`ic-dalga${c}`}>
          <path
            className="dalga"
            d="M2 12 q4 -7 8 0 t8 0 t8 0 t8 0"
            fill="none"
            stroke={renk}
            strokeWidth="1.4"
            style={stil}
          />
        </g>
      )
  }
}

function Monitor({
  x,
  y,
  dept,
  renk,
  canli,
  gecikme,
  kimlik
}: {
  x: number
  y: number
  dept: DepartmentId | 'mudur'
  renk: string
  canli: boolean
  gecikme: number
  kimlik: string
}): React.JSX.Element {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="11.5" y="21" width="5" height="5" fill="#1b2740" />
      <rect x="6" y="25" width="16" height="2.2" rx="1.1" fill="#25334e" />
      <rect x="0" y="0" width="28" height="22" rx="2.5" fill="#080f1c" stroke="#2b3c5e" />

      <defs>
        <clipPath id={kimlik}>
          <rect x="2" y="2" width="24" height="18" rx="1.5" />
        </clipPath>
      </defs>

      <rect
        className={canli ? 'ekran-yuzey canli' : 'ekran-yuzey'}
        x="2"
        y="2"
        width="24"
        height="18"
        rx="1.5"
        fill={renk}
        style={{ animationDelay: `${gecikme}s` }}
      />
      <g clipPath={`url(#${kimlik})`}>
        <EkranIcerik dept={dept} renk={renk} canli={canli} gecikme={gecikme} />
      </g>
      {canli && <rect className="ekran-glow" x="1" y="1" width="26" height="20" rx="2" fill={renk} />}
    </g>
  )
}

// ---------------------------------------------------------------- ajan

function Baloncuk({ metin, renk }: { metin: string; renk: string }): React.JSX.Element {
  const kisa = metin.replace(/\s+/g, ' ').trim().slice(0, 26)
  // Metin genisligi tahmini; textLength ile tasma kesin engelleniyor.
  const yazi = Math.max(24, kisa.length * 3.5)
  const g = Math.min(yazi + 14, 112)
  const h = 15

  return (
    <g className="baloncuk" transform={`translate(${-g / 2} -38)`}>
      <rect
        width={g}
        height={h}
        rx="4"
        fill="rgba(9,15,27,.95)"
        stroke={renk}
        strokeOpacity="0.55"
        strokeWidth="0.7"
      />
      {/* kuyruk: ince ve kisa */}
      <path
        d={`M${g / 2 - 3} ${h} l3 4 l3 -4 Z`}
        fill="rgba(9,15,27,.95)"
        stroke={renk}
        strokeOpacity="0.55"
        strokeWidth="0.7"
      />
      <text
        x={g / 2}
        y={h - 4.6}
        className="baloncuk-yazi"
        fill="var(--metin-2)"
        textLength={g - 10}
        lengthAdjust="spacingAndGlyphs"
      >
        {kisa}
      </text>
    </g>
  )
}

function YaziyorBaloncuk({ renk }: { renk: string }): React.JSX.Element {
  const g = 26
  const h = 13
  return (
    <g className="baloncuk" transform={`translate(${-g / 2} -36)`}>
      <rect
        width={g}
        height={h}
        rx="4"
        fill="rgba(9,15,27,.95)"
        stroke={renk}
        strokeOpacity="0.5"
        strokeWidth="0.7"
      />
      <path
        d={`M${g / 2 - 2.5} ${h} l2.5 3.5 l2.5 -3.5 Z`}
        fill="rgba(9,15,27,.95)"
        stroke={renk}
        strokeOpacity="0.5"
        strokeWidth="0.7"
      />
      {[0, 1, 2].map((i) => (
        <circle
          key={i}
          className="yaziyor-nokta"
          cx={7.5 + i * 5.5}
          cy={h / 2}
          r="1.5"
          fill={renk}
          style={{ animationDelay: `${i * 0.18}s` }}
        />
      ))}
    </g>
  )
}

function Ajan({
  renk,
  durum,
  gecikme,
  baslik,
  soz,
  olcek = 1
}: {
  renk: string
  durum: AjanDurum
  gecikme: number
  baslik: string
  soz?: string
  olcek?: number
}): React.JSX.Element {
  const calisiyor = durum === 'calisiyor'

  return (
    <g className={`ajan ajan-${durum}`} style={{ animationDelay: `${gecikme}s` }}>
      <title>{baslik}</title>

      {/* Baloncuk ajanın ölçeğine tabi değil: her masada aynı boyutta kalır. */}
      {soz !== undefined &&
        (soz ? <Baloncuk metin={soz} renk={renk} /> : <YaziyorBaloncuk renk={renk} />)}

      <g transform={`scale(${olcek})`}>
        <ellipse cx="0" cy="15" rx="11" ry="3" fill="rgba(0,0,0,.5)" />

        {/* klavyede gezinen kollar */}
        <g className="kollar" stroke={renk} strokeWidth="2.4" strokeLinecap="round" fill="none">
          <path className="kol kol-sol" d="M-7 5 c-3 3.5 -4.5 6 -4 8.5" style={{ animationDelay: `${gecikme}s` }} />
          <path className="kol" d="M-2.5 8 c-1.2 3 -1.8 5.5 -1.2 8" style={{ animationDelay: `${gecikme + 0.14}s` }} />
          <path className="kol" d="M2.5 8 c1.2 3 1.8 5.5 1.2 8" style={{ animationDelay: `${gecikme + 0.28}s` }} />
          <path className="kol kol-sag" d="M7 5 c3 3.5 4.5 6 4 8.5" style={{ animationDelay: `${gecikme + 0.42}s` }} />
        </g>

        <path
          d="M0 -12c-6.4 0-11 4.6-11 10.7 0 4 1.7 7 4.1 8.9 1.1.8 2.5-.2 3.5-.8 1-.7 2.2-1.2 3.4-1.2s2.4.5 3.4 1.2c1 .6 2.4 1.6 3.5.8 2.4-1.9 4.1-4.9 4.1-8.9C11 -7.4 6.4-12 0-12Z"
          fill={renk}
        />
        <path
          d="M0 -12c-6.4 0-11 4.6-11 10.7 0 1.1.1 2.1.4 3 1.6-4.6 5.6-7.7 10.6-7.7s9 3.1 10.6 7.7c.3-.9.4-1.9.4-3C11 -7.4 6.4-12 0-12Z"
          fill="rgba(255,255,255,.22)"
        />

        <ellipse cx="-3.6" cy="-2" rx="2.7" ry="3.2" fill="#fff" />
        <ellipse cx="3.6" cy="-2" rx="2.7" ry="3.2" fill="#fff" />
        <circle className="goz" cx="-3.4" cy="-1.3" r="1.45" fill="#0a1020" />
        <circle className="goz" cx="3.8" cy="-1.3" r="1.45" fill="#0a1020" />

        {calisiyor && <circle className="isik" cx="0" cy="-17" r="2.2" fill={renk} />}
      </g>
    </g>
  )
}

// ---------------------------------------------------------------- masa

function Klavye({
  x,
  y = 0,
  canli,
  renk,
  gecikme
}: {
  x: number
  y?: number
  canli: boolean
  renk: string
  gecikme: number
}): React.JSX.Element {
  return (
    <g transform={`translate(${x} ${y})`} className={canli ? 'klavye canli' : 'klavye'}>
      <rect x="-12" y="0" width="24" height="7" rx="1.6" fill="#162034" stroke="#26334f" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect
          key={i}
          className="tus"
          x={-10 + i * 3.4}
          y="1.6"
          width="2.4"
          height="1.7"
          rx="0.5"
          fill={renk}
          style={{ animationDelay: `${gecikme + i * 0.13}s` }}
        />
      ))}
      <rect className="tus" x="-6" y="4.2" width="12" height="1.5" rx="0.6" fill={renk} style={{ animationDelay: `${gecikme + 0.5}s` }} />
    </g>
  )
}

interface Uye {
  key: string
  durum: AjanDurum
  soz?: string
}

function Masa({
  x,
  y,
  olcek,
  egim,
  id,
  ad,
  renk,
  uyeler,
  calisan,
  onTikla
}: {
  x: number
  y: number
  olcek: number
  egim: number
  id: DepartmentId
  ad: string
  renk: string
  uyeler: Uye[]
  calisan: number
  onTikla?: () => void
}): React.JSX.Element {
  const G_MASA = 214
  // Masa yuzeyi yarim daire: ust kenar yukari bombeli bir yay.
  const KAVIS = -34
  const UST = 30
  const KALINLIK = 26

  // Bezier uzerindeki nokta: x dogrusal, y kavise gore.
  const kavisY = (t: number): number => (1 - t) ** 2 * UST + 2 * (1 - t) * t * KAVIS + t ** 2 * UST

  const yerler = uyeler.map((u, i) => {
    const t = (i + 0.5) / uyeler.length
    return { u, t, x: G_MASA * t, y: kavisY(t) }
  })

  return (
    <g
      transform={`translate(${x} ${y}) rotate(${egim}) scale(${olcek})`}
      className={onTikla ? 'masa-grup tiklanir' : 'masa-grup'}
      onClick={onTikla}
      role={onTikla ? 'button' : undefined}
      tabIndex={onTikla ? 0 : undefined}
      onKeyDown={(e) => {
        if (onTikla && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onTikla()
        }
      }}
    >
      {/* zemin ışığı */}
      <ellipse
        className="masa-isik"
        cx={G_MASA / 2}
        cy="96"
        rx={G_MASA / 1.7}
        ry="30"
        fill={renk}
        opacity={calisan > 0 ? 0.17 : 0.055}
      />

      {/* monitörler: kavisin dışında, her ajanın önünde */}
      {yerler.map(({ u, x: mx, y: my }, i) => (
        <Monitor
          key={`m-${u.key}`}
          kimlik={`ek-${id}-${i}`}
          x={mx - 14}
          y={my - 34}
          dept={id}
          renk={renk}
          canli={u.durum === 'calisiyor'}
          gecikme={i * 0.42}
        />
      ))}

      {/* kavisli masa yüzeyi */}
      <path
        d={`M0 ${UST} Q ${G_MASA / 2} ${KAVIS} ${G_MASA} ${UST} L ${G_MASA} ${UST + KALINLIK} Q ${G_MASA / 2} ${KAVIS + KALINLIK} 0 ${UST + KALINLIK} Z`}
        fill="#1a2540"
        stroke="#2b3c5e"
      />
      {/* masanın ön kenarı */}
      <path
        d={`M0 ${UST + KALINLIK} Q ${G_MASA / 2} ${KAVIS + KALINLIK} ${G_MASA} ${UST + KALINLIK} L ${G_MASA} ${UST + KALINLIK + 5} Q ${G_MASA / 2} ${KAVIS + KALINLIK + 5} 0 ${UST + KALINLIK + 5} Z`}
        fill="#121b2e"
      />

      {/* klavyeler: masa yüzeyinde, kavisi izler */}
      {yerler.map(({ u, x: kx, y: ky }, i) => (
        <Klavye
          key={`k-${u.key}`}
          x={kx}
          y={ky + 12}
          canli={u.durum === 'calisiyor'}
          renk={renk}
          gecikme={i * 0.3}
        />
      ))}

      {/* ajanlar: masanın önünde, kavis boyunca oturur */}
      {yerler.map(({ u, x: ax, y: ay, t }, i) => (
        <g key={u.key} transform={`translate(${ax} ${ay + 60})`}>
          <Ajan
            renk={renk}
            durum={u.durum}
            gecikme={(i % 4) * 0.55}
            baslik={`${ajanAdi(u.key)} — ${u.durum}`}
            soz={u.soz}
            olcek={0.96 + Math.abs(t - 0.5) * 0.12}
          />
        </g>
      ))}

      {/* Etiket masanın eğimini almaz: karşı rotasyonla düz kalır. */}
      <g className="masa-etiket" transform={`rotate(${-egim} ${G_MASA / 2} -62)`}>
        <rect
          x={G_MASA / 2 - 75}
          y="-72"
          width="150"
          height="21"
          rx="6"
          fill="rgba(7,12,22,.92)"
          stroke={renk}
          strokeOpacity="0.5"
        />
        <circle
          cx={G_MASA / 2 - 64}
          cy="-61.5"
          r="3.2"
          fill={renk}
          className={calisan > 0 ? 'nabizli' : ''}
        />
        <text x={G_MASA / 2 - 55} y="-57.5" className="masa-ad" fill="var(--metin)">
          {ad}
        </text>
      </g>
    </g>
  )
}

// ---------------------------------------------------------------- ofis

export default function OfisGorunumu({
  departmanlar,
  ajans,
  hazir,
  onDepartman
}: Props): React.JSX.Element {
  const durumAl = (key: string): AjanDurum => {
    const k = ajans.ajanlar.find((a) => a.key === key)
    if (k?.durum === 'calisiyor') return 'calisiyor'
    if (k?.durum === 'hata') return 'hata'
    if (k?.durum === 'bitti') return 'bitti'
    return hazir ? 'hazir' : 'kapali'
  }

  // En son konusan üç ajan baloncuk gosterir.
  const sozler = useMemo(() => {
    const m = new Map<string, string>()
    for (const k of ajans.sonKonusmalar.slice(0, 3)) m.set(k.key, k.metin)
    return m
  }, [ajans.sonKonusmalar])

  const masalar = useMemo(() => {
    // Amfi duzeni: mudur solda, ekipler onun karsisinda iki sirada.
    // Kenardaki masalar hafifce asagi kayar; satirlar yay gibi bukulur.
    const SUTUN_X = [452, 668, 884, 1100]
    const SATIR = [
      { y: 244, olcek: 0.74 },
      { y: 438, olcek: 0.88 }
    ]

    return departmanlar.slice(0, 8).map((d, i) => {
      const sutun = i % 4
      const satir = SATIR[Math.floor(i / 4)]
      const merkezdenUzaklik = Math.abs(sutun - 1.5)
      const uyeler: Uye[] = [d.leadKey, ...d.specialistKeys].map((k) => ({
        key: k,
        durum: durumAl(k),
        soz: sozler.has(k) ? sozler.get(k) : undefined
      }))
      return {
        id: d.id,
        x: SUTUN_X[sutun] - (214 * satir.olcek) / 2,
        // Yay etkisi: kenarlar merkeze gore asagida
        y: satir.y + merkezdenUzaklik * 13,
        olcek: satir.olcek,
        // Masalar mudure doner
        egim: (sutun - 1.5) * -2.6,
        ad: gorunumAl(d.id).ad,
        renk: gorunumAl(d.id).renk,
        uyeler,
        calisan: uyeler.filter((u) => u.durum === 'calisiyor').length
      }
    })
  }, [departmanlar, ajans, hazir, sozler])

  // Arkadakiler once cizilsin ki on masalar ustte kalsin.
  const sirali = [...masalar].sort((a, b) => a.y - b.y)

  const mudurDurum = durumAl('mudur')
  const mudurSoz = sozler.get('mudur')
  const calisanSayi = ajans.ajanlar.filter((a) => a.durum === 'calisiyor').length

  return (
    <div className="ofis-sahne">
      <svg viewBox={`0 0 ${G} ${Y}`} className="ofis-svg" role="img" aria-label="Ajans ofisi">
        <defs>
          <linearGradient id="gk" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0e1c33" />
            <stop offset="100%" stopColor="#1a2f4e" />
          </linearGradient>
          <linearGradient id="zemin" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#121d33" />
            <stop offset="100%" stopColor="#070c16" />
          </linearGradient>
          <radialGradient id="mudurIsik" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(249,115,22,.22)" />
            <stop offset="100%" stopColor="rgba(249,115,22,0)" />
          </radialGradient>
          <radialGradient id="tavan" cx="62%" cy="8%" r="72%">
            <stop offset="0%" stopColor="rgba(130,180,255,.17)" />
            <stop offset="100%" stopColor="rgba(130,180,255,0)" />
          </radialGradient>
          <linearGradient id="cam" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,.09)" />
            <stop offset="60%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>

        {/* cam duvar + şehir */}
        <rect width={G} height="182" fill="url(#gk)" />
        <Sehir />
        <rect width={G} height="182" fill="url(#cam)" />
        {Array.from({ length: 10 }, (_, i) => (
          <rect key={i} x={i * 148 - 3} y="0" width="6" height="182" fill="#091120" opacity="0.9" />
        ))}
        <rect y="176" width={G} height="8" fill="#152238" />

        {/* zemin */}
        <rect y="184" width={G} height={Y - 184} fill="url(#zemin)" />
        <rect y="184" width={G} height={Y - 184} fill="url(#tavan)" />

        {/* yay biçimli zemin çizgileri: masaların dizilimini vurgular */}
        <g fill="none" stroke="rgba(150,185,245,.09)">
          {[300, 520, 740, 960].map((r, i) => (
            <ellipse key={i} cx={MERKEZ.x} cy={MERKEZ.y + 40} rx={r} ry={r * DIKEY_ORAN} />
          ))}
        </g>
        <g stroke="rgba(150,185,245,.055)">
          {Array.from({ length: 9 }, (_, i) => {
            const a = ((-ACI_UC - 6 + i * ((ACI_UC * 2 + 12) / 8)) * Math.PI) / 180
            return (
              <path
                key={i}
                d={`M${MERKEZ.x} ${MERKEZ.y} L${MERKEZ.x + Math.cos(a) * (YARICAP + 120)} ${
                  MERKEZ.y + Math.sin(a) * (YARICAP + 120) * DIKEY_ORAN
                }`}
              />
            )
          })}
        </g>

        {/* --- müdür: solda, ekibin karşısında --- */}
        <g className="mudur-alan">
          <ellipse cx={MERKEZ.x} cy={MERKEZ.y + 40} rx="185" ry="150" fill="url(#mudurIsik)" />

          {/* arkasındaki büyük ekran */}
          <g transform={`translate(${MERKEZ.x - 92} ${MERKEZ.y - 168})`}>
            <rect width="184" height="62" rx="7" fill="#080f1c" stroke="#2b3c5e" />
            <rect
              className={calisanSayi > 0 ? 'ekran-yuzey canli' : 'ekran-yuzey'}
              x="4"
              y="4"
              width="176"
              height="54"
              rx="5"
              fill="var(--turuncu)"
            />
            <text x="92" y="26" className="merkez-ad" fill="#fff">
              Claude Agency
            </text>
            <text x="92" y="43" className="merkez-alt" fill="rgba(255,255,255,.75)">
              AI Workforce
            </text>
          </g>

          {/* müdür masası */}
          <path
            d={`M${MERKEZ.x - 104} ${MERKEZ.y - 6} h208 l16 30 h-240 Z`}
            fill="#1a2540"
            stroke="#2b3c5e"
          />
          <path d={`M${MERKEZ.x - 120} ${MERKEZ.y + 24} h240 v7 h-240 Z`} fill="#121b2e" />

          <g transform={`translate(${MERKEZ.x - 46} ${MERKEZ.y - 44})`}>
            <Monitor
              kimlik="ek-mudur"
              x={0}
              y={0}
              dept="mudur"
              renk="var(--turuncu)"
              canli={mudurDurum === 'calisiyor'}
              gecikme={0}
            />
          </g>
          <Klavye x={MERKEZ.x} canli={mudurDurum === 'calisiyor'} renk="var(--turuncu)" gecikme={0} />

          <g transform={`translate(${MERKEZ.x} ${MERKEZ.y + 6})`}>
            <Ajan
              renk="var(--turuncu)"
              durum={mudurDurum}
              gecikme={0}
              baslik="Müdür"
              soz={mudurSoz}
              olcek={1.4}
            />
          </g>

          <text x={MERKEZ.x} y={MERKEZ.y + 66} className="merkez-mudur" fill="var(--metin)">
            Müdür
          </text>
          <text x={MERKEZ.x} y={MERKEZ.y + 82} className="merkez-alt2" fill="var(--metin-3)">
            {calisanSayi > 0 ? `${calisanSayi} ajan görevde` : hazir ? 'ajans hazır' : 'bağlantı yok'}
          </text>
        </g>

        {/* --- ekip masaları: yarım daire --- */}
        {sirali.map((m) => (
          <Masa key={m.id} {...m} onTikla={onDepartman ? () => onDepartman(m.id) : undefined} />
        ))}
      </svg>
    </div>
  )
}
