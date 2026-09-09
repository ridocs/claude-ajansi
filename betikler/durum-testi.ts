// Olay akisindan ajans durumu turetme testi. API cagrisi yapmaz.
// Calistirmak icin: npm run test:durum

import { ajanAdi, ajansDurumuHesapla, kisaKlasor } from '../src/renderer/src/ajansDurumu.ts'
import { ONAY_ISARETI } from '../src/shared/types.ts'
import type { AgencyEvent, AgencyEventKind } from '../src/shared/types.ts'

let sayac = 0
function o(
  kind: AgencyEventKind,
  agentKey: string,
  text = '',
  meta?: Record<string, unknown>
): AgencyEvent {
  sayac += 1
  return { id: `e${sayac}`, kind, agentKey, text, at: 1000 + sayac, meta }
}

const sonuclar: Array<{ ad: string; ok: boolean; detay: string }> = []
function bekle(ad: string, ok: boolean, detay = ''): void {
  sonuclar.push({ ad, ok, detay })
}

// --- 1. Tam bir calisma: mudur -> lider -> uzman, dosya, bitis
{
  const d = ajansDurumuHesapla([
    o('oturum-basladi', 'sistem'),
    o('ajan-basladi', 'lider-frontend', 'Sayfayi hazirla', { atayan: 'mudur' }),
    o('ajan-basladi', 'uzman-frontend-arayuz', 'ornek.html yaz', { atayan: 'lider-frontend' }),
    o('dosya-degisti', 'uzman-frontend-arayuz', 'C:/proje/ornek.html', {
      yol: 'C:/proje/ornek.html',
      islem: 'olusturuldu'
    }),
    o('ajan-bitti', 'uzman-frontend-arayuz', 'Sayfa hazir.', {
      sureMs: 42000,
      tokenler: 15000,
      aracSayisi: 3,
      eklenenSatir: 20
    }),
    o('maliyet', 'sistem', '', { toplamToken: 15000 }),
    o('ajan-bitti', 'lider-frontend', 'Departman isi bitti.', { sureMs: 60000, tokenler: 9000 }),
    o('maliyet', 'sistem', '', { toplamToken: 24000 }),
    o('maliyet', 'sistem', '', { costUsd: 0.81 }),
    o('oturum-bitti', 'sistem')
  ])

  bekle('Iki ajan kaydedildi', d.ajanlar.length === 2, `gelen: ${d.ajanlar.length}`)
  bekle('Ikisi de bitti durumunda', d.ajanlar.every((a) => a.durum === 'bitti'))
  bekle(
    'Atayan zinciri korundu',
    d.ajanlar.find((a) => a.key === 'uzman-frontend-arayuz')?.atayan === 'lider-frontend'
  )
  bekle('Gorev metni bitince kaybolmadi',
    d.ajanlar.find((a) => a.key === 'uzman-frontend-arayuz')?.gorev === 'ornek.html yaz')
  bekle('Istatistik tasindi',
    d.ajanlar.find((a) => a.key === 'uzman-frontend-arayuz')?.tokenler === 15000)
  bekle('Rapor saklandi',
    d.ajanlar.find((a) => a.key === 'lider-frontend')?.rapor === 'Departman isi bitti.')
  bekle('Toplam token son degeri aldi', d.toplamToken === 24000, `gelen: ${d.toplamToken}`)
  bekle('Maliyet okundu', d.maliyetUsd === 0.81, `gelen: ${d.maliyetUsd}`)
  bekle('Teslimat kaydedildi', d.teslimatlar.length === 1)
  bekle('Dosya adi ayristirildi', d.teslimatlar[0]?.ad === 'ornek.html')
  bekle('Siralama goreve cagrilma sirasinda', d.ajanlar[0]?.key === 'lider-frontend')
}

// --- 2. Ayni dosyaya birden cok dokunus
{
  const d = ajansDurumuHesapla([
    o('dosya-degisti', 'uzman-backend-api', '/p/a.ts', { yol: '/p/a.ts', islem: 'olusturuldu' }),
    o('dosya-degisti', 'uzman-backend-api', '/p/a.ts', { yol: '/p/a.ts', islem: 'duzenlendi' }),
    o('dosya-degisti', 'uzman-backend-api', '/p/b.ts', { yol: '/p/b.ts', islem: 'duzenlendi' })
  ])
  bekle('Ayni dosya tekillestirildi', d.teslimatlar.length === 2, `gelen: ${d.teslimatlar.length}`)
  bekle(
    'Olusturuldu etiketi duzenlemeyle silinmedi',
    d.teslimatlar.find((t) => t.yol === '/p/a.ts')?.islem === 'olusturuldu'
  )
}

// --- 3. Hata yalnizca calisan ajani etkiler
{
  const d = ajansDurumuHesapla([
    o('ajan-basladi', 'uzman-veri-analist', 'Analiz', { atayan: 'lider-veri' }),
    o('ajan-bitti', 'uzman-veri-analist', 'Bitti', { tokenler: 100 }),
    o('hata', 'uzman-veri-analist', 'Sonradan gelen hata')
  ])
  bekle('Biten ajan hataya dusurulmedi',
    d.ajanlar.find((a) => a.key === 'uzman-veri-analist')?.durum === 'bitti')
}
{
  const d = ajansDurumuHesapla([
    o('ajan-basladi', 'uzman-seo-teknik', 'Denetim', { atayan: 'lider-seo' }),
    o('hata', 'uzman-seo-teknik', 'Zaman asimi')
  ])
  bekle('Calisan ajan hataya dustu',
    d.ajanlar.find((a) => a.key === 'uzman-seo-teknik')?.durum === 'hata')
}

// --- 4. Bos akis ve onay sayaci
{
  const d = ajansDurumuHesapla([])
  bekle('Bos akis bos durum verir',
    d.ajanlar.length === 0 && d.teslimatlar.length === 0 && d.toplamToken === 0)
}
{
  const d = ajansDurumuHesapla([
    o('onay-gerekli', 'sistem', 'rm -rf'),
    o('onay-gerekli', 'sistem', 'disari yazma')
  ])
  bekle('Onay istekleri sayildi', d.bekleyenOnay === 2, `gelen: ${d.bekleyenOnay}`)
}

// --- 5. Ajan adlari
{
  bekle('Mudur adi', ajanAdi('mudur') === 'Müdür')
  bekle('Lider adi', ajanAdi('lider-backend') === 'Backend Lideri', ajanAdi('lider-backend'))
  bekle(
    'Uzman adi',
    ajanAdi('uzman-frontend-erisilebilirlik') === 'Frontend · Erisilebilirlik',
    ajanAdi('uzman-frontend-erisilebilirlik')
  )
  bekle(
    'Cok parcali uzman adi',
    ajanAdi('uzman-kalite-uctan-uca') === 'Kalite · Uctan Uca',
    ajanAdi('uzman-kalite-uctan-uca')
  )
}

// --- 5b. Kapanis kurallari: alt ajanlarin bitisi her zaman akisa dusmez
{
  const d = ajansDurumuHesapla([
    o('ajan-basladi', 'lider-frontend', 'Sayfa', { atayan: 'mudur' }),
    o('ajan-basladi', 'uzman-frontend-arayuz', 'HTML', { atayan: 'lider-frontend' }),
    // Uzmanin bitisi hic gelmiyor, yalnizca lider rapor veriyor.
    o('ajan-bitti', 'lider-frontend', 'Departman bitti', { tokenler: 900 })
  ])
  bekle(
    'Lider bitince uzmani da bitmis sayilir',
    d.ajanlar.find((a) => a.key === 'uzman-frontend-arayuz')?.durum === 'bitti'
  )
}
{
  const d = ajansDurumuHesapla([
    o('ajan-basladi', 'lider-veri', 'Analiz', { atayan: 'mudur' }),
    o('oturum-bitti', 'sistem')
  ])
  bekle(
    'Oturum bitince calisan kalmaz',
    d.ajanlar.every((a) => a.durum !== 'calisiyor')
  )
}
{
  const d = ajansDurumuHesapla([
    o('ajan-basladi', 'uzman-seo-teknik', 'Denetim', { atayan: 'lider-seo' }),
    o('hata', 'uzman-seo-teknik', 'Zaman asimi'),
    o('ajan-bitti', 'lider-seo', 'Rapor', {}),
    o('oturum-bitti', 'sistem')
  ])
  bekle(
    'Hataya dusen ajan kapanista bitti sayilmaz',
    d.ajanlar.find((a) => a.key === 'uzman-seo-teknik')?.durum === 'hata'
  )
}

// --- 6. Yol kisaltma: iki ayirici da desteklenmeli
{
  bekle(
    'Windows yolu kisaltildi',
    kisaKlasor('C:\\Users\\mstfa\\Desktop\\AJAN_AJANSI') === '…/Desktop/AJAN_AJANSI',
    kisaKlasor('C:\\Users\\mstfa\\Desktop\\AJAN_AJANSI')
  )
  bekle(
    'POSIX yolu kisaltildi',
    kisaKlasor('/home/mstfa/projeler/ajans') === '…/projeler/ajans',
    kisaKlasor('/home/mstfa/projeler/ajans')
  )
  bekle(
    'Sondaki ayirici atildi',
    kisaKlasor('C:\\proje\\ajans\\') === '…/proje/ajans',
    kisaKlasor('C:\\proje\\ajans\\')
  )
  bekle('Kisa yol oldugu gibi kalir', kisaKlasor('C:\\proje') === 'C:\\proje')
  bekle('Bos yol bos doner', kisaKlasor('') === '')
  bekle(
    'Parca sayisi ayarlanabilir',
    kisaKlasor('C:\\a\\b\\c\\d', 3) === '…/b/c/d',
    kisaKlasor('C:\\a\\b\\c\\d', 3)
  )
}

// --- Mesaj paneli: butun konusmalar sirasiyla tutulur
{
  const d = ajansDurumuHesapla([
    o('ajan-konustu', 'mudur', 'Plani cikardim.'),
    o('ajan-basladi', 'lider-backend', 'API kur', { atayan: 'mudur' }),
    o('ajan-konustu', 'lider-backend', 'Ekibe dagittim.'),
    o('ajan-konustu', 'lider-backend', 'Ilk rapor geldi.'),
    o('ajan-konustu', 'uzman-backend-api', 'Uc nokta hazir.')
  ])

  bekle(
    'Butun konusmalar tutuluyor',
    d.tumKonusmalar.length === 5,
    String(d.tumKonusmalar.length)
  )
  bekle(
    'Akis yeniden eskiye siralanir',
    d.tumKonusmalar[0].metin === 'Uc nokta hazir.',
    d.tumKonusmalar[0]?.metin
  )
  bekle(
    'Ayni ajanin birden cok sozu akista kalir',
    d.tumKonusmalar.filter((k) => k.key === 'lider-backend').length === 3,
    String(d.tumKonusmalar.filter((k) => k.key === 'lider-backend').length)
  )
  bekle(
    'Gorev metni de akisa dusuyor',
    d.tumKonusmalar.some((k) => k.metin === 'API kur'),
    d.tumKonusmalar.map((k) => k.metin).join(' | ')
  )
  bekle('Konusmasiz akis bos doner', ajansDurumuHesapla([]).tumKonusmalar.length === 0)
}

// --- Tasarim onayi: mudur isareti yazinca bekleyis baslar
{
  const bekleyen = ajansDurumuHesapla([
    o(
      'ajan-konustu',
      'mudur',
      ['Tasarim hazir. Figma: figma.com/file/abc', ONAY_ISARETI].join('\n')
    )
  ])
  bekle('Isaret gorulunce onay bekleniyor', bekleyen.tasarimOnayiBekliyor)
  bekle(
    'Sunum metninden isaret ayiklanir',
    !bekleyen.tasarimSunumu.includes(ONAY_ISARETI),
    bekleyen.tasarimSunumu
  )
  bekle(
    'Sunum metni korunur',
    bekleyen.tasarimSunumu.includes('figma.com/file/abc'),
    bekleyen.tasarimSunumu
  )

  const cevaplanan = ajansDurumuHesapla([
    o('ajan-konustu', 'mudur', ['Tasarim hazir.', ONAY_ISARETI].join('\n')),
    o('kullanici-mesaji', 'sen', 'Onayliyorum.')
  ])
  bekle('Kullanici cevap verince bekleyis biter', !cevaplanan.tasarimOnayiBekliyor)

  const isaretsiz = ajansDurumuHesapla([o('ajan-konustu', 'mudur', 'Plani cikardim.')])
  bekle('Isaretsiz konusma onay istemez', !isaretsiz.tasarimOnayiBekliyor)
}

let gecti = 0
for (const r of sonuclar) {
  if (r.ok) {
    gecti++
    console.log(`  gecti  ${r.ad}`)
  } else {
    console.log(`  KALDI  ${r.ad}${r.detay ? ' -> ' + r.detay : ''}`)
  }
}
const kaldi = sonuclar.length - gecti
console.log(`\n${gecti} gecti, ${kaldi} kaldi (toplam ${sonuclar.length})`)
process.exit(kaldi === 0 ? 0 : 1)
