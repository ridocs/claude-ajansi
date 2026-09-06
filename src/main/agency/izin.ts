import { isAbsolute, relative, resolve } from 'node:path'

/**
 * Onay kapısı kuralları.
 *
 * Ayrı bir dosyada duruyor ki API çağrısı yapmadan test edilebilsin:
 * güvenlik kuralını doğrulamak için ajans çalıştırmak gerekmemeli.
 */

export type IzinKarari =
  | { tur: 'izin' }
  | { tur: 'onay-gerekli'; ozet: string; redMesaji: string }

/** Ajanların kendi başına karar veremeyeceği, her zaman sorulan komut kalıpları. */
export const TEHLIKELI_KOMUT =
  /(^|[\s;&|])(rm\s+-[a-z]*[rf]|rmdir\s+\/s|del\s+\/[fs]|format\s|mkfs|dd\s+if=|shutdown|reg\s+delete|git\s+push\s+.*--force|git\s+reset\s+--hard)/i

/** Bir yolun çalışma alanının içinde kalıp kalmadığını söyler. */
export function icerideMi(workspace: string, hedef: string): boolean {
  const kok = resolve(workspace)
  const yol = isAbsolute(hedef) ? resolve(hedef) : resolve(kok, hedef)
  const fark = relative(kok, yol)
  return fark === '' || (!fark.startsWith('..') && !isAbsolute(fark))
}

/** Dosya yolu taşıyan araçlar; hepsinde çalışma alanı sınırı uygulanır. */
export const YAZAN_ARACLAR = new Set(['Write', 'Edit', 'NotebookEdit', 'MultiEdit'])

/**
 * Bir araç çağrısının kullanıcı onayı gerektirip gerektirmediğine karar verir.
 * Kendi başına hiçbir şeyi engellemez; kararı çağırana bildirir.
 */
export function izinDegerlendir(
  workspace: string,
  tool: string,
  input: Record<string, unknown>
): IzinKarari {
  if (tool === 'Bash') {
    const komut = String(input.command ?? '')
    if (TEHLIKELI_KOMUT.test(komut)) {
      return {
        tur: 'onay-gerekli',
        ozet: komut,
        redMesaji: 'Kullanıcı bu komutu onaylamadı. Bu komutu tekrar denemeyin.'
      }
    }
    return { tur: 'izin' }
  }

  if (YAZAN_ARACLAR.has(tool)) {
    const yol = String(input.file_path ?? input.notebook_path ?? '')
    if (yol && !icerideMi(workspace, yol)) {
      return {
        tur: 'onay-gerekli',
        ozet: `Çalışma alanı dışına yazma: ${yol}`,
        redMesaji:
          'Çalışma alanı dışına yazma reddedildi. Yalnızca proje klasörünün içinde çalışın.'
      }
    }
  }

  return { tur: 'izin' }
}
