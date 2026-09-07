import { app } from 'electron'
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { ToplantiKaydi, ToplantiMesaji, ToplantiOzeti } from '../../shared/types'

/**
 * Mudurle yapilan toplantilarin kalici kaydi.
 *
 * Her mesajdan sonra diske yazilir; pencere kapansa, uygulama kapansa bile
 * konusma kaybolmaz. Kayitlar silinmez, gecmis panelinden okunur.
 */

const KLASOR = 'toplantilar'

function dizin(): string {
  const d = join(app.getPath('userData'), KLASOR)
  if (!existsSync(d)) mkdirSync(d, { recursive: true })
  return d
}

function yol(id: string): string {
  return join(dizin(), `${id.replace(/[^a-z0-9-]/gi, '_')}.json`)
}

/** Konusmanin ilk cumlesinden okunabilir bir baslik cikarir. */
function baslikCikar(mesajlar: ToplantiMesaji[]): string {
  const ilk = mesajlar.find((m) => m.kim === 'sen')
  if (!ilk) return 'Toplantı'
  return ilk.metin.replace(/\s+/g, ' ').trim().slice(0, 70) || 'Toplantı'
}

/** Toplantiyi diske yazar; her mesajdan sonra cagrilir. */
export function toplantiKaydet(id: string, basladi: number, mesajlar: ToplantiMesaji[]): void {
  if (mesajlar.length === 0) return
  const kayit: ToplantiKaydi = {
    id,
    basladi,
    guncellendi: Date.now(),
    baslik: baslikCikar(mesajlar),
    mesajlar
  }
  try {
    writeFileSync(yol(id), JSON.stringify(kayit), 'utf-8')
  } catch {
    // Kayit yazilamazsa toplanti yine de surer.
  }
}

function oku(dosyaYolu: string): ToplantiKaydi | null {
  try {
    return JSON.parse(readFileSync(dosyaYolu, 'utf-8')) as ToplantiKaydi
  } catch {
    return null
  }
}

export function toplantiListele(): ToplantiOzeti[] {
  try {
    return readdirSync(dizin())
      .filter((f) => f.endsWith('.json'))
      .map((f) => oku(join(dizin(), f)))
      .filter((k): k is ToplantiKaydi => k !== null)
      .map((k) => ({
        id: k.id,
        baslik: k.baslik,
        basladi: k.basladi,
        guncellendi: k.guncellendi,
        mesajSayisi: k.mesajlar.length
      }))
      .sort((a, b) => b.guncellendi - a.guncellendi)
  } catch {
    return []
  }
}

export function toplantiOku(id: string): ToplantiKaydi | null {
  const p = yol(id)
  return existsSync(p) ? oku(p) : null
}

export function toplantiSil(id: string): void {
  const p = yol(id)
  if (existsSync(p)) rmSync(p)
}
