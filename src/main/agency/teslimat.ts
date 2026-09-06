import { readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

/**
 * Calisma alaninin dosya anlik goruntusu.
 *
 * Ajanlarin arac cagrilarini dinlemek teslimati yakalamak icin yeterli degil:
 * alt ajanlarin ic mesajlari her zaman ana akisa dusmuyor, ustelik bir ajan
 * dosyayi Bash ile de yazabiliyor. Bu yuzden neyin uretildigini dosya
 * sisteminden ogreniyoruz.
 */

export type Anlik = Map<string, number>

/** Taranmayacak klasorler: buyuk, gurultulu ve teslimat sayilmazlar. */
const ATLANAN = new Set([
  'node_modules',
  '.git',
  'dist',
  'out',
  'build',
  '.next',
  '.cache',
  '.venv',
  '__pycache__',
  '.turbo'
])

const MAX_DERINLIK = 8
const MAX_DOSYA = 20000

/** Klasordeki dosyalari ve son degistirilme zamanlarini toplar. */
export function anlikAl(kok: string): Anlik {
  const sonuc: Anlik = new Map()

  const gez = (dizin: string, derinlik: number): void => {
    if (derinlik > MAX_DERINLIK || sonuc.size >= MAX_DOSYA) return

    let girdiler
    try {
      girdiler = readdirSync(dizin, { withFileTypes: true })
    } catch {
      // Okunamayan klasor (yetki, kilit) taramayi durdurmamali.
      return
    }

    for (const g of girdiler) {
      if (sonuc.size >= MAX_DOSYA) return
      if (g.name.startsWith('.') && g.isDirectory()) continue
      if (ATLANAN.has(g.name)) continue

      const tam = join(dizin, g.name)
      if (g.isDirectory()) {
        gez(tam, derinlik + 1)
      } else if (g.isFile()) {
        try {
          sonuc.set(tam, statSync(tam).mtimeMs)
        } catch {
          // Tarama sirasinda silinen dosya: yok say.
        }
      }
    }
  }

  gez(kok, 0)
  return sonuc
}

export interface DosyaFarki {
  yol: string
  ad: string
  islem: 'olusturuldu' | 'duzenlendi'
}

/** Iki anlik goruntu arasinda olusan ve degisen dosyalari bulur. */
export function farkAl(once: Anlik, sonra: Anlik, kok: string): DosyaFarki[] {
  const fark: DosyaFarki[] = []

  for (const [yol, mtime] of sonra) {
    const oncekiZaman = once.get(yol)
    if (oncekiZaman === undefined) {
      fark.push({ yol, ad: adiAl(yol), islem: 'olusturuldu' })
    } else if (mtime > oncekiZaman) {
      fark.push({ yol, ad: adiAl(yol), islem: 'duzenlendi' })
    }
  }

  // Calisma alanina gore alfabetik: okurken tahmin edilebilir olsun.
  return fark.sort((a, b) => relative(kok, a.yol).localeCompare(relative(kok, b.yol), 'tr'))
}

function adiAl(yol: string): string {
  const p = yol.split(/[\\/]/)
  return p[p.length - 1] || yol
}
