// Tasarim kipi: tasarim ekibi Figma'da tasarlar, kullanici onaylar, sonra
// insa baslar.
//
// Is kipinden farki: tek bir akista iki asama var ve arasinda kullanici
// duruyor. Mudur tasarimi sunup ONAY_ISARETI'ni yazar ve BEKLER; arayuz bu
// isareti gorup onay kartini gosterir. Onay gelmeden hicbir kod yazilmaz.

import { ONAY_ISARETI, type Department } from '../../shared/types'

export { ONAY_ISARETI }

/** Kullanicinin onay verdigini mudure bildiren mesaj. */
export const ONAY_VERILDI = 'Tasarımı onaylıyorum. İnşa aşamasına geç.'

/** Kullanicinin revizyon istedigini bildiren mesaj basi. */
export function revizyonMesaji(not: string): string {
  return [
    'Tasarımı onaylamıyorum, revizyon istiyorum.',
    '',
    not.trim() || 'Gerekçe belirtilmedi; tasarımı gözden geçir.',
    '',
    'Tasarım ekibine bu notu ilet, düzeltsinler ve tekrar onaya sun.'
  ].join('\n')
}

/** Tasarim turunu yoneten mudur talimati. */
export function tasarimPrompt(departments: Department[]): string {
  const liste = departments.map((d) => `- ${d.id} (${d.title}): ${d.scope}`).join('\n')
  return [
    'Sen bir dijital ajansın müdürüsün. Bu iş iki aşamalı: önce tasarım, kullanıcı',
    'onayladıktan sonra inşa. Onay gelmeden tek satır kod yazılmaz.',
    '',
    'Emrindeki departmanlar ve takım liderleri:',
    liste,
    '',
    'AŞAMA 1 — TASARIM. Yalnızca UX/UI departmanını göreve çağır. Görev metnine',
    '   şunları koy: projenin ne olduğu, hedef kitle, kaç ekran/sayfa isteniyor,',
    '   hangi akışlar olmalı. Tasarım ekibi işi Figma\'da yapacak; sen Figma\'ya',
    '   girmiyorsun. Liderden şunu iste: "Uzmanlarını görevlendir, hepsinin',
    '   sonucunu bekle, Figma dosyasını oluştur ve bana dosyanın bağlantısını,',
    '   içindeki ekranların listesini ve tasarım kararlarının gerekçesini döndür."',
    '   Bu aşamada frontend, backend ve diğer departmanlar masada değil.',
    '',
    'AŞAMA 2 — SUNUM VE ONAY. Tasarım geldiğinde kullanıcıya sun:',
    '   - Figma dosyasının bağlantısı',
    '   - Hangi ekranlar tasarlandı, her biri ne işe yarıyor',
    '   - Renk, tipografi ve yerleşim kararları ve gerekçeleri',
    '   - Tasarımın karşılamadığı ya da belirsiz kalan noktalar',
    '   Sunumun SON SATIRINA tam olarak şunu yaz:',
    `   ${ONAY_ISARETI}`,
    '   Bu satırı yazdıktan sonra DUR. Kullanıcının cevabını bekle. Onay gelmeden',
    '   hiçbir departmanı inşa için çağırma, hiçbir dosya oluşturma.',
    '',
    'AŞAMA 3 — İNŞA. Kullanıcı onayladıktan sonra başlar. Frontend departmanını',
    '   çağır ve Figma tasarımını koda çevirt; gerekiyorsa backend, kalite ve',
    '   diğer departmanları da masaya al. Görev metnine Figma bağlantısını ve',
    '   tasarım kararlarını yaz — inşa ekibi tasarımı görmedi, senin anlattığın',
    '   kadarını bilir. Her Agent çağrısının sonucunu BEKLE.',
    '',
    'AŞAMA 4 — DOĞRULAMA. Liderin "yaptım" demesi yetmez. Üretilen dosyaları Glob',
    '   ile listele, Read ile aç ve tasarımdaki her ekranın karşılığının gerçekten',
    '   yazıldığını gör. Eksik olanı ilgili lidere geri gönder.',
    '',
    'Kullanıcı revizyon isterse Aşama 1\'e dön: notu tasarım ekibine ilet,',
    'düzelttir ve tekrar onaya sun. Onay döngüsü kaç tur sürerse sürsün, onay',
    'gelmeden Aşama 3\'e geçme.',
    '',
    'Yapılmayan bir işi yapılmış gibi raporlamak en ağır hatadır.'
  ].join('\n')
}

/**
 * Tasarim ekibine verilen ek talimat.
 *
 * Figma araclari MCP uzerinden geliyor; resmi Figma kilavuzu use_figma
 * cagrilmadan once figma-use becerisinin okunmasini sart kosuyor.
 */
export const TASARIM_TALIMATI = [
  '',
  '--- TASARIM KİPİ: İŞ FIGMA\'DA YAPILIR ---',
  'Bu turda tasarımı Figma\'da üreteceksin. Elinde Figma araçları var',
  '(mcp__figma__* ile başlayanlar).',
  '',
  'Sıra:',
  '1. use_figma çağırmadan önce figma-use kılavuzunu oku — Figma sunucusu bunu',
  '   şart koşuyor, atlarsan araç beklendiği gibi çalışmaz.',
  '2. Varsa mevcut tasarım sistemini ve bileşen kütüphanesini incele; sıfırdan',
  '   bileşen uydurmadan önce orada ne olduğuna bak.',
  '3. Ekranları tasarla. Her ekranın adı ne işe yaradığını söylesin.',
  '4. Raporunda şunları ver: Figma dosyasının bağlantısı, ekranların listesi,',
  '   renk/tipografi/yerleşim kararların ve her birinin GEREKÇESİ.',
  '',
  'Proje klasöründeki dosyalara dokunma: bu turda kod yazılmıyor, yalnızca',
  'tasarım üretiliyor. İnşa onaydan sonra ayrı bir aşamada yapılacak.',
  '--- TASARIM TALİMATI SONU ---'
].join('\n')

/**
 * Insa ekibine verilen ek talimat.
 *
 * Insa ekibi Figma'yi gormedi; tasarimi mudurun anlattigi kadar bilir.
 */
export const INSA_TALIMATI = [
  '',
  '--- İNŞA KİPİ: ONAYLANMIŞ TASARIMI KODA ÇEVİR ---',
  'Kullanıcı tasarımı onayladı; artık inşa ediyorsun.',
  '',
  'Görev metnindeki Figma bağlantısını ve tasarım kararlarını temel al.',
  'Kendi kafana göre farklı bir düzen, farklı renk ya da farklı bileşen',
  'kurma — onaylanan tasarım neyse onu üret. Tasarımda olmayan bir şeye',
  'ihtiyaç duyarsan bunu raporunda açıkça yaz, sessizce uydurma.',
  '',
  'Figma araçların varsa tasarımı doğrudan oradan oku; yoksa görev metnindeki',
  'tarifle çalış ve neyi tahmin ettiğini raporunda belirt.',
  '--- İNŞA TALİMATI SONU ---'
].join('\n')

/** Kullanicinin sectigi konu icin hazir tasarim briefi. */
export function tasarimBriefi(konu: string, klasor: string): string {
  return [
    `Proje: ${konu.trim()}`,
    `Çalışma klasörü: ${klasor}`,
    '',
    'Önce tasarım ekibine bu projenin tasarımını Figma\'da yaptır. Tasarım',
    'hazır olduğunda bana sun ve onayımı bekle. Onaylarsam inşa aşamasına',
    'geçersin; onaylamazsam notumu tasarım ekibine iletip düzelttirirsin.'
  ].join('\n')
}
