import { app } from 'electron'
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync
} from 'node:fs'
import { join } from 'node:path'

/**
 * Ajan hafizasi.
 *
 * Her ajanin kendi alanina dair ogrendikleri bir markdown dosyasinda durur ve
 * her gorevde o ajanin sistem promptuna eklenir. Boylece ajans kullandikca
 * birikir: arastirdigi yeni teknolojiler, kendi cikardigi dersler, tercihler.
 *
 * Dosyalar calisma alaninda degil, uygulamanin kendi veri klasorunde tutulur;
 * proje degistirince hafiza kaybolmaz.
 */

const KLASOR = 'hafiza'

/** Tek bir hafiza dosyasinin promptta kaplayacagi ust sinir. */
const EN_FAZLA_KARAKTER = 6000

/** Hafiza dosyalarinin bulundugu klasor; ajanlara bu yol acilir. */
export function hafizaDizini(): string {
  return dizin()
}

/** Bir ajanin hafiza dosyasinin tam yolu. */
export function hafizaDosyaYolu(ajanKey: string): string {
  return join(dizin(), dosyaAdi(ajanKey))
}

function dizin(): string {
  const d = join(app.getPath('userData'), KLASOR)
  if (!existsSync(d)) mkdirSync(d, { recursive: true })
  return d
}

/** Ajan anahtarini guvenli bir dosya adina cevirir. */
function dosyaAdi(ajanKey: string): string {
  return `${ajanKey.replace(/[^a-z0-9-]/gi, '_')}.md`
}

export function hafizaOku(ajanKey: string): string {
  try {
    const yol = join(dizin(), dosyaAdi(ajanKey))
    if (!existsSync(yol)) return ''
    return readFileSync(yol, 'utf-8').slice(0, EN_FAZLA_KARAKTER)
  } catch {
    return ''
  }
}

export function hafizaYaz(ajanKey: string, metin: string): void {
  const temiz = metin.trim().slice(0, EN_FAZLA_KARAKTER)
  const yol = join(dizin(), dosyaAdi(ajanKey))
  if (!temiz) {
    if (existsSync(yol)) rmSync(yol)
    return
  }
  writeFileSync(yol, temiz + '\n', 'utf-8')
}

import type { HafizaKaydi } from '../../shared/types'

export type { HafizaKaydi }

export function hafizaListele(): HafizaKaydi[] {
  try {
    const d = dizin()
    return readdirSync(d)
      .filter((f) => f.endsWith('.md'))
      .map((f) => {
        const yol = join(d, f)
        const metin = readFileSync(yol, 'utf-8')
        return {
          ajanKey: f.replace(/\.md$/, ''),
          metin,
          boyut: metin.length,
          guncellendi: statSync(yol).mtimeMs
        }
      })
      .sort((a, b) => b.guncellendi - a.guncellendi)
  } catch {
    return []
  }
}

export function hafizaSil(ajanKey: string): void {
  const yol = join(dizin(), dosyaAdi(ajanKey))
  if (existsSync(yol)) rmSync(yol)
}

export function hafizaTemizle(): void {
  const d = dizin()
  for (const f of readdirSync(d)) {
    if (f.endsWith('.md')) rmSync(join(d, f))
  }
}

/** Ajanin hafizasini sistem promptuna eklenecek bicimde dondurur. */
export function hafizaBolumu(ajanKey: string): string {
  const metin = hafizaOku(ajanKey)
  if (!metin.trim()) return ''
  return [
    '',
    '--- SENİN HAFIZAN ---',
    'Daha önce bu alanda öğrendiklerin. Görevini yaparken bunları kullan;',
    'geçerliliğini yitirmiş bir bilgi görürsen ona uyma ve raporunda belirt.',
    '',
    metin.trim(),
    '--- HAFIZA SONU ---',
    ''
  ].join('\n')
}

/** Egitim turunda ogrenilenleri ajanin hafizasina ekler. */
export function hafizaEkle(ajanKey: string, yeni: string): void {
  const temiz = yeni.trim()
  if (!temiz) return
  const mevcut = hafizaOku(ajanKey).trim()
  const tarih = new Date().toLocaleDateString('tr-TR')
  const blok = `## ${tarih}
${temiz}`
  // En yeni bilgi en ustte dursun; sinir asilirsa eski kayitlar dusulur.
  hafizaYaz(ajanKey, mevcut ? `${blok}

${mevcut}` : blok)
}

/** Arayuz icin: yazar ve guncel listeyi doner. */
export function hafizaYazVeListele(ajanKey: string, metin: string): HafizaKaydi[] {
  hafizaYaz(ajanKey, metin)
  return hafizaListele()
}
