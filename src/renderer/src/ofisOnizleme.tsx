// Ofis senaryosunun gorsel testi. Gercek ajan calistirmadan, sahte olay
// akisiyla faks / sinyal / klavye animasyonlarini gozlemlemek icin.
// Depoya girmez; sadece elle test icindir.

import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import OfisGorunumu from './bilesenler/OfisGorunumu'
import { ajansDurumuHesapla } from './ajansDurumu'
import type { AgencyEvent, Department, DepartmentId } from '../../shared/types'
import './styles.css'
import './sayfalar.css'
import './ofis.css'
import './senaryo.css'
import './sayfalar2.css'
import './ek.css'

// Sabit fikstur: gorsel testin kadro degisikliklerinden etkilenmemesi icin
// buradaki liste elle tutuluyor, main tarafina bagli degil.
const KIMLIKLER: DepartmentId[] = [
  'sistem',
  'backend',
  'frontend',
  'kalite',
  'veri',
  'seo',
  'tasarim',
  'guvenlik'
]

const departments: Department[] = KIMLIKLER.map((id) => ({
  id,
  title: id,
  scope: '',
  leadKey: `lider-${id}`,
  specialistKeys: [0, 1, 2].map((i) => `uzman-${id}-${i}`)
}))
const lider = (d: number): string => departments[d].leadKey
const uzman = (d: number, i: number): string => departments[d].specialistKeys[i]

let sayac = 0
function olay(
  kind: AgencyEvent['kind'],
  agentKey: string,
  text: string,
  meta?: Record<string, unknown>
): AgencyEvent {
  sayac += 1
  return { id: `o${sayac}`, kind, agentKey, text, at: Date.now() + sayac, meta }
}

/** Senaryo: mudur plan yapar, liderlere gorev fakslar, ekipler calisir. */
function senaryoAdimlari(): AgencyEvent[][] {
  sayac = 0
  return [
    // 1) mudur masasinda plani cikariyor
    [
      olay('ajan-konustu', 'mudur', 'Plani cikardim, kabul olculerini yaziyorum.'),
      olay('gorev-guncellendi', 'mudur', '4 madde')
    ],
    // 2) mudur iki lidere gorev fakslar -> sinyal + faks kagidi
    [
      olay('ajan-basladi', lider(1), 'API katmanini kur', { atayan: 'mudur' }),
      olay('ajan-basladi', lider(2), 'Arayuzu tasarla', { atayan: 'mudur' }),
      olay('ajan-konustu', 'mudur', 'Backend ve frontend liderlerine faks gitti.')
    ],
    // 3) liderler ekiplerine dagitiyor
    [
      olay('ajan-basladi', uzman(1, 0), 'Uc noktalari yaz', { atayan: lider(1) }),
      olay('ajan-basladi', uzman(1, 1), 'Dogrulama katmani', { atayan: lider(1) }),
      olay('ajan-basladi', uzman(2, 0), 'Bilesen kutuphanesi', { atayan: lider(2) }),
      olay('ajan-konustu', lider(1), 'Faks geldi, ekibe dagittim.')
    ],
    // 4) diger departmanlar devreye giriyor
    [
      olay('ajan-basladi', lider(3), 'Testleri kur', { atayan: 'mudur' }),
      olay('ajan-basladi', uzman(3, 0), 'Uctan uca test', { atayan: lider(3) }),
      olay('ajan-basladi', lider(5), 'SEO denetimi', { atayan: 'mudur' }),
      olay('ajan-konustu', uzman(1, 0), 'Uc nokta semasi hazir, 6 rota yazildi.')
    ],
    // 5) teslimatlar geliyor
    [
      olay('dosya-degisti', uzman(1, 0), 'src/api/index.ts', {
        yol: 'src/api/index.ts',
        islem: 'olusturuldu'
      }),
      olay('ajan-bitti', uzman(1, 0), '### Uc noktalar\n- 6 rota yazildi', {
        tokenler: 12400,
        aracSayisi: 18
      }),
      olay('ajan-konustu', lider(2), 'Arayuz taslagi ekipten dondu.'),
      olay('maliyet', 'sistem', '', { toplamToken: 184000, costUsd: 0.42 })
    ]
  ]
}

function Onizleme(): React.JSX.Element {
  const url = new URLSearchParams(window.location.search)
  const sabit = Number(url.get('adim') || 0)
  const [adim, setAdim] = useState(sabit || 1)
  const [otomatik, setOtomatik] = useState(!sabit)
  const adimlar = senaryoAdimlari()

  useEffect(() => {
    if (!otomatik) return
    const zamanlayici = setInterval(() => {
      setAdim((n) => (n >= adimlar.length ? 1 : n + 1))
    }, 3400)
    return () => clearInterval(zamanlayici)
  }, [otomatik, adimlar.length])

  const olaylar = adimlar.slice(0, adim).flat()
  const ajans = ajansDurumuHesapla(olaylar)

  return (
    <div style={{ padding: 16, background: 'var(--zemin)', minHeight: '100vh' }}>
      <div
        style={{
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          marginBottom: 12,
          fontFamily: 'var(--f-mono)',
          fontSize: 12,
          color: 'var(--metin-2)'
        }}
      >
        <span style={{ marginRight: 8 }}>
          Adim {adim}/{adimlar.length}
        </span>
        {adimlar.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setOtomatik(false)
              setAdim(i + 1)
            }}
            style={{
              padding: '4px 11px',
              borderRadius: 6,
              border: '1px solid var(--cizgi)',
              background: adim === i + 1 ? 'var(--mavi)' : 'var(--panel)',
              color: 'var(--metin)',
              cursor: 'pointer'
            }}
          >
            {i + 1}
          </button>
        ))}
        <button
          onClick={() => setOtomatik((o) => !o)}
          style={{
            marginLeft: 10,
            padding: '4px 11px',
            borderRadius: 6,
            border: '1px solid var(--cizgi)',
            background: 'var(--panel)',
            color: 'var(--metin)',
            cursor: 'pointer'
          }}
        >
          {otomatik ? 'durdur' : 'oynat'}
        </button>
      </div>
      <OfisGorunumu departmanlar={departments} ajans={ajans} hazir={true} />
    </div>
  )
}

const kok = document.getElementById('kok')
if (!kok) throw new Error('Kok eleman bulunamadi')
createRoot(kok).render(
  <StrictMode>
    <Onizleme />
  </StrictMode>
)
