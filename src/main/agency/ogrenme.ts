/**
 * Hafizaya neyin yazilacagina karar veren kural.
 *
 * Ayri dosyada duruyor ki Electron'a bagli olmadan test edilebilsin:
 * hafizayi neyin kirlettigini anlamak icin ajans calistirmak gerekmemeli.
 */

/** Egitim ciktisinin hafizaya girmesi icin gereken en az uzunluk. */
const EN_AZ_UZUNLUK = 200

/**
 * Bir raporun kalici hafizaya yazilmaya deger olup olmadigi.
 *
 * Yalnizca uzmanlarin, istenen bolum basliklarini tasiyan ve gercekten dolu
 * ciktilari kabul edilir. Liderin ara notu ("uzmanlar hala calisiyor") bilgi
 * degildir ve hafizayi kirletir.
 */
export function ogrenmeyeDeger(ajanKey: string, rapor: string): boolean {
  if (!ajanKey.startsWith('uzman-')) return false
  const metin = rapor.trim()
  if (metin.length < EN_AZ_UZUNLUK) return false
  // Egitim ciktisi en az bir bolum basligi tasimali.
  return /###\s/.test(metin)
}
