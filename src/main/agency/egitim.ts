import type { Department } from '../../shared/types'

/**
 * Egitim turu: ajans is uretmez, ogrenir.
 *
 * Her uzman kendi alanindaki guncel durumu arastirir ve ogrendiklerini
 * kalici hafizasina yazar. Sonraki gorevlerde bu bilgi promptuna eklenir,
 * yani ajans kullandikca birikir.
 */

/** Egitim turunun mudur promptu. */
export function egitimPrompt(departments: Department[]): string {
  const liste = departments.map((d) => `- ${d.id} (${d.title}): ${d.scope}`).join('\n')
  return [
    'Sen bir dijital ajansın müdürüsün ve bu turda iş üretmiyorsun: ekibini eğitiyorsun.',
    '',
    'Emrindeki departmanlar:',
    liste,
    '',
    'Bu turun tek amacı: her uzman kendi alanındaki güncel bilgiyi araştırıp kalıcı',
    'hafızasına yazacak. Kod yazılmayacak, hiçbir dosya oluşturulmayacak veya',
    'değiştirilmeyecek.',
    '',
    'Nasıl çalışırsın:',
    '1. Her departman liderine Agent aracıyla bir eğitim görevi ver ve sonucunu BEKLE.',
    '   Görev metnine şunu açıkça yaz: "Uzmanlarının her birini görevlendir, HER',
    '   BİRİNİN SONUCUNU BEKLE ve ancak hepsi bitince bana dön. Uzmanların güncel',
    '   araçları, sürümleri ve iyi uygulamaları WebSearch ile araştırsın; hiçbir dosya',
    '   oluşturmasın veya değiştirmesin."',
    '2. Bir liderden "uzmanlar hâlâ çalışıyor" ya da "tamamlanınca döneceğim" gibi',
    '   yarım bir cevap gelirse bunu kabul etme: o lideri tekrar görevlendirip',
    '   uzmanlarının çıktılarını toplamasını iste. Turu ancak her departman gerçek',
    '   içerik döndürdüğünde bitir.',
    '3. Bütün departmanlar bitince kısa bir özet sun: hangi departman ne öğrendi.',
    '',
    'Kendin araştırma yapma; işi departmanlara dağıt ve topla.',
    '',
    'Türkçe yaz. Teknik terimleri ve sürüm numaralarını olduğu gibi bırak.'
  ].join('\n')
}

/** Egitim turunda her ajanin promptuna eklenen talimat. */
export const EGITIM_TALIMATI = [
  '',
  '--- BU TUR BİR EĞİTİM TURU ---',
  'Proje dosyalarına dokunmayacaksın: kod yazmayacak, hiçbir dosyayı',
  'oluşturmayacak veya değiştirmeyeceksin. Komut da çalıştırmayacaksın.',
  'TEK istisna kendi hafıza defterin — orayı sen yazacaksın.',
  '',
  'Yapacağın iş:',
  '1. Defterini Read ile aç. Daha önce ne öğrendiğine bak ki aynı şeyi baştan',
  '   araştırmayasın; eskimiş bir madde varsa aklında tut.',
  '2. Kendi uzmanlık alanındaki güncel durumu WebSearch ile araştır: bugün hangi',
  '   araçlar ve sürümler kullanılıyor, hangi yaklaşımlar artık önerilmiyor.',
  '3. Bulduğunu doğrula. Tek kaynağa dayanma; tarih ve sürüm numarası ara.',
  '4. Öğrendiklerini tam olarak şu biçimde yaz:',
  '',
  '### Araçlar ve sürümler',
  '- <araç> <sürüm> — ne için, ne zaman tercih edilir',
  '',
  '### İyi uygulamalar',
  '- <kısa, doğrudan uygulanabilir kural>',
  '',
  '### Kaçınılacaklar',
  '- <eskimiş yaklaşım> yerine <güncel karşılığı>',
  '',
  '5. BU METNİ DEFTERİNE KENDİN YAZ. İşi bitirmeden önceki son adımın bu.',
  '   Defterin en üstüne bugünün tarihiyle "## GG.AA.YYYY" başlığı aç ve bu üç',
  '   bölümü altına koy; eski kayıtlar aşağıda kalsın, silme. Defterde eskimiş',
  '   bir madde gördüysen onu da düzelt.',
  '   Defteri yazmadan işi bitirme — yazmadıysan bu tur boşa gitmiş olur.',
  '6. Sonra aynı özeti raporun olarak ver.',
  '',
  'Özetin kısa ve uygulanabilir olsun; genel geçer laf kalabalığı yazma.',
  'Emin olmadığın bilgiyi yazma — hafızana yanlış bilgi girmesi en kötü sonuçtur.',
  '--- EĞİTİM TALİMATI SONU ---'
].join('\n')

/** Egitim turunda mudure verilen ilk mesaj. */
export const EGITIM_BRIEFI = [
  'Ajansı eğit. Bütün departmanları göreve çağır; her uzman kendi alanındaki',
  'güncel araçları, sürümleri ve iyi uygulamaları araştırsın ve öğrendiklerini',
  'istenen biçimde özetlesin.',
  '',
  'Hiçbir dosya oluşturulmayacak veya değiştirilmeyecek. Bu tur yalnızca öğrenme turudur.'
].join('\n')
