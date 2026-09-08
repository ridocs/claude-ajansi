// Hafiza sayfasinin gorsel testi icin temsili kayitlar.
//
// Gercek hafiza kullanicinin makinesinde duruyor ve depoya girmiyor; buradaki
// metinler onun bicimini ve uzunlugunu taklit eder: uzun maddeler, ic ice
// parantezler ve URL'ler. Tasma hatalari bu uzunlukta ortaya cikiyor.

import type { HafizaKaydi } from '../../shared/types'

const UZUN = `# uzman-sistem-ortam defteri

## 08.09.2026 (2. tur — teyit ve güncelleme)

### Araçlar ve sürümler
- Node.js 26 — Current (5 Mayıs 2026'da çıktı), LTS'ye terfisi Ekim 2026'da (resmî blog + ikinci kaynak ile çift kaynaklı doğrulandı); Ekim 2026'ya kadar üretimde Node 24 kullanılmaya devam edilmeli
- Node.js sürüm modeli: Node 27'den itibaren yılda tek major sürüm modeline geçiliyor — önceki turda yazılan "Ekim 2026'dan itibaren" notu ile uyumlu, teyit edildi
- pnpm 12.0.0 — 26.08.2026'da yayınlandı, doğrulandı; Rust'a tam geçiş, pnpm 11 komut/flag/lockfile uyumluluğu korunuyor; install süresi bazı senaryolarda %90'a varan hızlanma
- npm v12 — Temmuz 2026'da yayınlandı; en büyük değişiklik: install script'leri (preinstall/install/postinstall) artık proje bazında izin verilmedikçe çalışmıyor

### İyi uygulamalar
- Kilit dosyasını her zaman depoya koy; CI'da \`--frozen-lockfile\` ile kur
- Sürüm sabitlemede aralık yerine tam sürüm tercih et, güncellemeyi bilerek yap

### Kaçınılacaklar
- Global kurulum yerine proje bazlı bağımlılık; global paket sürümleri makineler arasında sessizce ayrışıyor
- Tek kaynağa dayanan sürüm iddiası yazma; ikinci bir kaynakla doğrulanmayan bilgi deftere girmemeli

## 07.09.2026

### Araçlar ve sürümler
- Node.js 24 — Active LTS, üretim için önerilen ana hat
- Python 3.14 — güncel, tam destek Ekim 2027'ye kadar
`

const KISA = `# lider-sistem defteri

## 08.09.2026

### Ekibin bugünkü tablosu
- Ortam: Node 24 LTS ana hat, Node 26 Ekim'de terfi edecek
- CI/CD: iş akışlarında sürüm sabitleme zorunlu
- İzleme: yapılandırılmış log + izleme, örnekleme oranı üretimde düşürülmüş
`

export const HAFIZA_FIKSTUR: HafizaKaydi[] = [
  {
    ajanKey: 'uzman-sistem-ortam',
    metin: UZUN,
    boyut: UZUN.length,
    guncellendi: Date.now()
  },
  {
    ajanKey: 'lider-sistem',
    metin: KISA,
    boyut: KISA.length,
    guncellendi: Date.now()
  },
  {
    ajanKey: 'uzman-backend-api',
    metin: UZUN.replace('uzman-sistem-ortam', 'uzman-backend-api'),
    boyut: UZUN.length,
    guncellendi: Date.now()
  }
]
