import { app } from 'electron'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Ayarlar } from '../../shared/types'

export type { Ayarlar }

const VARSAYILAN: Ayarlar = {
  sonKlasor: '',
  klasorGecmisi: [],
  tamYetki: false,
  kullaniciAdi: 'Ajans Sahibi'
}

/** Gecmiste tutulacak en fazla calisma alani. */
const GECMIS_SINIR = 8

function dosya(): string {
  return join(app.getPath('userData'), 'ayarlar.json')
}

export function ayarlariOku(): Ayarlar {
  try {
    const yol = dosya()
    if (!existsSync(yol)) return { ...VARSAYILAN }
    const ham = JSON.parse(readFileSync(yol, 'utf-8')) as Partial<Ayarlar>

    // Klasor silinmis olabilir; var olmayan yolu geri vermeyiz.
    const klasor =
      typeof ham.sonKlasor === 'string' && existsSync(ham.sonKlasor) ? ham.sonKlasor : ''
    // Silinmis klasorler listede kalmasin.
    const gecmis = Array.isArray(ham.klasorGecmisi)
      ? ham.klasorGecmisi.filter((k) => typeof k === 'string' && existsSync(k)).slice(0, GECMIS_SINIR)
      : []
    return {
      sonKlasor: klasor,
      klasorGecmisi: gecmis,
      tamYetki: ham.tamYetki === true,
      kullaniciAdi:
        typeof ham.kullaniciAdi === 'string' && ham.kullaniciAdi.trim()
          ? ham.kullaniciAdi.trim().slice(0, 40)
          : VARSAYILAN.kullaniciAdi
    }
  } catch {
    // Bozuk ayar dosyasi uygulamayi acilmaz hale getirmemeli.
    return { ...VARSAYILAN }
  }
}

export function ayarlariYaz(guncel: Partial<Ayarlar>): Ayarlar {
  const yeni = { ...ayarlariOku(), ...guncel }
  const dizin = app.getPath('userData')
  if (!existsSync(dizin)) mkdirSync(dizin, { recursive: true })
  writeFileSync(dosya(), JSON.stringify(yeni, null, 2), 'utf-8')
  return yeni
}

/** Bir calisma alanini secili yapar ve gecmisin basina tasir. */
export function klasorKullan(klasor: string): Ayarlar {
  const mevcut = ayarlariOku()
  const gecmis = [klasor, ...mevcut.klasorGecmisi.filter((k) => k !== klasor)].slice(0, GECMIS_SINIR)
  return ayarlariYaz({ sonKlasor: klasor, klasorGecmisi: gecmis })
}
