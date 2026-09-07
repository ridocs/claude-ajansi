// Hafizaya neyin yazilacagini belirleyen filtrenin testi.
// API cagrisi yapmaz. Calistirmak icin: npm run test:ogrenme

import { ogrenmeyeDeger } from '../src/main/agency/ogrenme.ts'

const GECERLI_RAPOR = `Kendi alanımdaki güncel durumu araştırdım.

### Araçlar ve sürümler
- Vitest 3.2 — birim test için; Jest'e göre daha hızlı başlıyor
- Playwright 1.50 — uçtan uca test, tarayıcı otomasyonu

### İyi uygulamalar
- Testleri kaynak dosyanın yanında tut, ayrı klasöre dağıtma
- Her testte tek bir davranışı doğrula

### Kaçınılacaklar
- Enzyme yerine Testing Library kullan; Enzyme React 18 desteklemiyor`

const sonuclar: Array<[string, boolean]> = []
const bekle = (ad: string, ok: boolean): void => {
  sonuclar.push([ad, ok])
}

// --- kabul edilenler
bekle(
  'Uzmanin dolu ve baslikli raporu kabul edilir',
  ogrenmeyeDeger('uzman-kalite-birim', GECERLI_RAPOR) === true
)

// --- reddedilenler
bekle(
  'Liderin raporu hafizaya girmez',
  ogrenmeyeDeger('lider-frontend', GECERLI_RAPOR) === false
)
bekle('Mudurun raporu hafizaya girmez', ogrenmeyeDeger('mudur', GECERLI_RAPOR) === false)
bekle(
  'Yarim ara not reddedilir',
  ogrenmeyeDeger(
    'uzman-frontend-arayuz',
    'Üç uzman da hâlâ araştırma yapıyor. Tamamlandıklarında birleşik raporu vereceğim.'
  ) === false
)
bekle('Bos rapor reddedilir', ogrenmeyeDeger('uzman-seo-icerik', '') === false)
bekle(
  'Basliksiz uzun metin reddedilir',
  ogrenmeyeDeger('uzman-veri-analist', 'a'.repeat(400)) === false
)
bekle(
  'Kisa ama baslikli metin reddedilir',
  ogrenmeyeDeger('uzman-veri-analist', '### Araçlar\n- bir şey') === false
)
bekle(
  'Bilinmeyen anahtar reddedilir',
  ogrenmeyeDeger('general-purpose', GECERLI_RAPOR) === false
)

let kaldi = 0
for (const [ad, ok] of sonuclar) {
  console.log(`  ${ok ? 'gecti ' : 'KALDI '} ${ad}`)
  if (!ok) kaldi++
}
console.log(`\n${sonuclar.length - kaldi} gecti, ${kaldi} kaldi (toplam ${sonuclar.length})`)
process.exit(kaldi === 0 ? 0 : 1)
