// Beyin agi grafinin testi. API cagrisi yapmaz.
// Calistirmak icin: npm run test:beyin

import { asamaBul, grafKur, konulariCikar } from '../src/renderer/src/beyinAgi.ts'
import type { AgentSpec, Department, HafizaKaydi } from '../src/shared/types.ts'

const sonuclar: Array<[string, boolean, string]> = []
const bekle = (ad: string, ok: boolean, detay = ''): void => {
  sonuclar.push([ad, ok, detay])
}

// ---------------------------------------------------------------- aşama
bekle('Bos hafiza bos asama', asamaBul(0) === 'bos')
bekle('Kucuk hafiza filiz', asamaBul(300) === 'filiz')
bekle('Orta hafiza gelisen', asamaBul(1200) === 'gelisen')
bekle('Buyuk hafiza olgun', asamaBul(5000) === 'olgun')

// ---------------------------------------------------------------- konu çıkarma
{
  const metin = `### Araçlar ve sürümler
- Playwright 1.50 — uçtan uca test
- Vitest 3.2 — birim test

### İyi uygulamalar
React bileşenlerinde Testing Library kullan.`

  const konular = konulariCikar(metin)
  bekle('Madde basindaki arac yakalandi', konular.includes('playwright'), konular.join(','))
  bekle('Ikinci arac yakalandi', konular.includes('vitest'))
  bekle('Metin icindeki teknoloji yakalandi', konular.includes('react'))
  bekle('Bos metin konu vermez', konulariCikar('').length === 0)
}

// ---------------------------------------------------------------- graf
{
  const departmanlar: Department[] = [
    { id: 'backend', title: 'Backend', scope: '', leadKey: 'lider-backend', specialistKeys: ['uzman-backend-api', 'uzman-backend-veritabani'] },
    { id: 'kalite', title: 'Kalite', scope: '', leadKey: 'lider-kalite', specialistKeys: ['uzman-kalite-birim'] }
  ]

  const kadro = [
    { key: 'lider-backend', title: 'Backend Lideri', expertise: '', department: 'backend' },
    { key: 'uzman-backend-api', title: 'API Uzmanı', expertise: '', department: 'backend' },
    { key: 'uzman-backend-veritabani', title: 'Veritabanı Uzmanı', expertise: '', department: 'backend' },
    { key: 'lider-kalite', title: 'Test Lideri', expertise: '', department: 'kalite' },
    { key: 'uzman-kalite-birim', title: 'Birim Test Uzmanı', expertise: '', department: 'kalite' }
  ] as unknown as AgentSpec[]

  // Backend API ve Kalite birim uzmani ayni araci ogrenmis: aralarinda bilgi bagi olmali.
  const hafiza: HafizaKaydi[] = [
    {
      ajanKey: 'uzman-backend-api',
      metin: '### Araçlar\n- Vitest 3.2 — test\nTypeScript ile yazılır.',
      boyut: 900,
      guncellendi: Date.now()
    },
    {
      ajanKey: 'uzman-kalite-birim',
      metin: '### Araçlar\n- Vitest 3.2 — birim test için',
      boyut: 3000,
      guncellendi: Date.now()
    }
  ]

  const graf = grafKur({
    departmanlar,
    kadro,
    hafiza,
    renkAl: () => 'var(--mavi)'
  })

  bekle('Mudur dahil butun ajanlar dugum oldu', graf.dugumler.length === 6, `${graf.dugumler.length}`)
  bekle('Mudur merkezde', graf.dugumler[0].key === 'mudur')

  const yapiBaglari = graf.baglar.filter((b) => b.tur === 'yapi')
  bekle('Hiyerarsi baglari kuruldu', yapiBaglari.length === 5, `${yapiBaglari.length}`)

  const bilgiBaglari = graf.baglar.filter((b) => b.tur === 'bilgi')
  bekle(
    'Farkli departmandaki ortak konu bag kurdu',
    bilgiBaglari.some(
      (b) =>
        (b.a === 'uzman-backend-api' && b.b === 'uzman-kalite-birim') ||
        (b.b === 'uzman-backend-api' && b.a === 'uzman-kalite-birim')
    ),
    `${bilgiBaglari.length} bilgi bagi`
  )

  bekle(
    'Ayni departman icinde bilgi bagi tekrarlanmaz',
    !bilgiBaglari.some((b) => b.a.includes('backend') && b.b.includes('backend'))
  )

  const olgun = graf.dugumler.find((d) => d.key === 'uzman-kalite-birim')
  bekle('Buyuk hafiza olgun gorunur', olgun?.asama === 'olgun', olgun?.asama)

  const bosDugum = graf.dugumler.find((d) => d.key === 'uzman-backend-veritabani')
  bekle('Hafizasi olmayan bos kalir', bosDugum?.asama === 'bos')

  bekle('Ortak konu listesi doldu', graf.konuSikligi.some((k) => k.konu === 'vitest'))
  bekle(
    'Olgunluk orani hesaplandi',
    graf.olgunluk > 0 && graf.olgunluk < 1,
    graf.olgunluk.toFixed(2)
  )

  // Ayni girdi ayni yerlesimi vermeli (deterministik).
  const graf2 = grafKur({ departmanlar, kadro, hafiza, renkAl: () => 'var(--mavi)' })
  bekle(
    'Yerlesim deterministik',
    graf.dugumler[3].x === graf2.dugumler[3].x && graf.dugumler[3].y === graf2.dugumler[3].y
  )
}

let kaldi = 0
for (const [ad, ok, detay] of sonuclar) {
  console.log(`  ${ok ? 'gecti ' : 'KALDI '} ${ad}${!ok && detay ? ' -> ' + detay : ''}`)
  if (!ok) kaldi++
}
console.log(`\n${sonuclar.length - kaldi} gecti, ${kaldi} kaldi (toplam ${sonuclar.length})`)
process.exit(kaldi === 0 ? 0 : 1)
