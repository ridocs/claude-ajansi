/**
 * Hafiza ozetleme.
 *
 * Ayri dosyada duruyor ki Electron'a bagli olmadan test edilebilsin: bir
 * ajanin ekibine ne aktardigini gormek icin uygulama calistirmak gerekmemeli.
 */

/** Bir ozet satirinin en fazla uzunlugu. */
const SATIR_SINIRI = 110

/** Ozette yer alacak en fazla satir. */
const SATIR_SAYISI = 14

/**
 * Bir hafiza metninden yalnizca bolum basliklarini ve ilk maddeleri cikarir.
 *
 * Amac promptu sismeden ekibin ne bildigini aktarmak: basliklar yon verir,
 * ilk maddeler somut karari tasir.
 */
export function ozetCikar(metin: string, enFazlaMadde = 3): string {
  if (!metin.trim()) return ''
  const parcalar: string[] = []
  let maddeSayaci = 0

  for (const ham of metin.split('\n')) {
    const satir = ham.trim()
    if (!satir) continue

    // Yalnizca bolum basliklari (###) tasinir; tarih basliklari (##) atlanir.
    if (/^#{3,}\s/.test(satir)) {
      parcalar.push(satir.replace(/^#+\s*/, '• '))
      maddeSayaci = 0
      continue
    }
    if (/^[-*]\s/.test(satir) && maddeSayaci < enFazlaMadde) {
      parcalar.push('  ' + satir.replace(/^[-*]\s*/, '- ').slice(0, SATIR_SINIRI))
      maddeSayaci++
    }
  }

  return parcalar.slice(0, SATIR_SAYISI).join('\n')
}
