import { app } from 'electron'
import { createHash, randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { AgencyEvent, CalismaKaydi, CalismaOzeti, RunSummary } from '../../shared/types'

/**
 * Calisma gecmisi.
 *
 * Her calisma bittiginde olay akisi ve ozeti diske yazilir. Kayitlar proje
 * (calisma alani) basina ayri klasorde durur, silinmez; boylece hangi projede
 * ne yapildigi sonradan okunabilir.
 */

const KLASOR = 'gecmis'

/** Klasor yolunu dosya adi olarak kullanilabilir sabit bir kimlige cevirir. */
function projeKimligi(workspace: string): string {
  const duz = workspace.replace(/[\\/]+$/, '').toLowerCase()
  return createHash('sha1').update(duz).digest('hex').slice(0, 16)
}

function projeDizini(workspace: string): string {
  const d = join(app.getPath('userData'), KLASOR, projeKimligi(workspace))
  if (!existsSync(d)) mkdirSync(d, { recursive: true })
  return d
}

function kokDizin(): string {
  const d = join(app.getPath('userData'), KLASOR)
  if (!existsSync(d)) mkdirSync(d, { recursive: true })
  return d
}

/** Bir calismayi kalici olarak kaydeder ve kaydin kimligini doner. */
export function calismaKaydet(kayit: Omit<CalismaKaydi, 'id'>): string {
  const id = `${kayit.basladi}-${randomUUID().slice(0, 8)}`
  const tam: CalismaKaydi = { ...kayit, id }
  writeFileSync(join(projeDizini(kayit.workspace), `${id}.json`), JSON.stringify(tam), 'utf-8')
  return id
}

function ozetle(kayit: CalismaKaydi): CalismaOzeti {
  return {
    id: kayit.id,
    workspace: kayit.workspace,
    brief: kayit.brief.slice(0, 220),
    basladi: kayit.basladi,
    bitti: kayit.bitti,
    egitim: kayit.egitim,
    ok: kayit.ozet.ok,
    costUsd: kayit.ozet.costUsd,
    olaySayisi: kayit.olaylar.length,
    dosyaSayisi: kayit.dosyalar.length,
    ajanSayisi: kayit.ajanSayisi
  }
}

function kayitOku(yol: string): CalismaKaydi | null {
  try {
    return JSON.parse(readFileSync(yol, 'utf-8')) as CalismaKaydi
  } catch {
    return null
  }
}

/**
 * Kayitlari listeler. workspace verilirse yalnizca o projenin kayitlari,
 * verilmezse butun projelerinkiler doner (yeniden eskiye).
 */
export function gecmisListele(workspace?: string): CalismaOzeti[] {
  try {
    const dizinler = workspace
      ? [projeDizini(workspace)]
      : readdirSync(kokDizin()).map((d) => join(kokDizin(), d))

    const ozetler: CalismaOzeti[] = []
    for (const d of dizinler) {
      let dosyalar: string[]
      try {
        dosyalar = readdirSync(d).filter((f) => f.endsWith('.json'))
      } catch {
        continue
      }
      for (const f of dosyalar) {
        const kayit = kayitOku(join(d, f))
        if (kayit) ozetler.push(ozetle(kayit))
      }
    }
    return ozetler.sort((a, b) => b.basladi - a.basladi)
  } catch {
    return []
  }
}

/** Tek bir calismanin tam kaydini, olay akisiyla birlikte doner. */
export function gecmisOku(workspace: string, id: string): CalismaKaydi | null {
  const yol = join(projeDizini(workspace), `${id}.json`)
  return existsSync(yol) ? kayitOku(yol) : null
}

export function gecmisSil(workspace: string, id: string): void {
  const yol = join(projeDizini(workspace), `${id}.json`)
  if (existsSync(yol)) rmSync(yol)
}

/** Bir calismanin kaydini olay akisindan olusturur. */
export function kayitHazirla(
  workspace: string,
  brief: string,
  egitim: boolean,
  basladi: number,
  ozet: RunSummary,
  olaylar: AgencyEvent[]
): Omit<CalismaKaydi, 'id'> {
  const dosyalar = [
    ...new Set(
      olaylar
        .filter((o) => o.kind === 'dosya-degisti')
        .map((o) => String(o.meta?.yol ?? o.text))
        .filter(Boolean)
    )
  ]
  const ajanlar = new Set(
    olaylar.filter((o) => o.kind === 'ajan-basladi').map((o) => o.agentKey)
  )

  return {
    workspace,
    brief,
    egitim,
    basladi,
    bitti: Date.now(),
    ozet,
    olaylar,
    dosyalar,
    ajanSayisi: ajanlar.size
  }
}
