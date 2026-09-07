// Ajanlar arasi bilgi paylasiminin ozet cikarma testi.
// API cagrisi yapmaz. Calistirmak icin: npm run test:paylasim

import { ozetCikar } from '../src/main/agency/ozet.ts'

const HAFIZA = `## 07.09.2026

### Araçlar ve sürümler
- Vitest 3.2 — birim test için; hızlı başlar
- Playwright 1.50 — uçtan uca test
- Jest 29 — eski projelerde hâlâ görülür
- Karma — artık önerilmiyor

### İyi uygulamalar
- Testleri kaynak dosyanın yanında tut
- Her testte tek davranış doğrula

### Kaçınılacaklar
- Enzyme yerine Testing Library kullan`

const sonuclar: Array<[string, boolean, string]> = []
const bekle = (ad: string, ok: boolean, detay = ''): void => {
  sonuclar.push([ad, ok, detay])
}

const ozet = ozetCikar(HAFIZA)

bekle('Bolum basliklari tasiniyor', ozet.includes('• Araçlar ve sürümler'), ozet.slice(0, 60))
bekle('Ikinci baslik da var', ozet.includes('• İyi uygulamalar'))
bekle('Ilk madde tasiniyor', ozet.includes('Vitest 3.2'))
bekle(
  'Bolum basina madde siniri uygulaniyor',
  !ozet.includes('Karma'),
  'dorduncu madde disarida kalmali'
)
bekle('Tarih basligi tasinmiyor', !ozet.includes('07.09.2026'))
bekle('Bos hafiza bos ozet verir', ozetCikar('') === '')
bekle('Sadece duz metin madde uretmez', ozetCikar('bir iki uc') === '')

// Uzun madde kirpiliyor mu
{
  const uzun = `### Araçlar\n- ${'x'.repeat(300)}`
  const o = ozetCikar(uzun)
  const maddeSatiri = o.split('\n').find((s) => s.trim().startsWith('-')) ?? ''
  bekle('Uzun madde kirpiliyor', maddeSatiri.length < 130, `${maddeSatiri.length} karakter`)
}

// Madde sayisi parametresi
{
  const o = ozetCikar(HAFIZA, 1)
  bekle('Madde siniri ayarlanabilir', o.includes('Vitest') && !o.includes('Playwright'))
}

let kaldi = 0
for (const [ad, ok, detay] of sonuclar) {
  console.log(`  ${ok ? 'gecti ' : 'KALDI '} ${ad}${!ok && detay ? ' -> ' + detay : ''}`)
  if (!ok) kaldi++
}
console.log(`\n${sonuclar.length - kaldi} gecti, ${kaldi} kaldi (toplam ${sonuclar.length})`)
process.exit(kaldi === 0 ? 0 : 1)
