import type { AgentSpec, Department, HafizaKaydi } from '../../shared/types'

/**
 * Beyin agi: ajanlarin hafizasini bir bilgi grafina cevirir.
 *
 * Dugumler ajanlar, baglar ise iki seyden gelir: hiyerarsi (mudur -> lider ->
 * uzman) ve ortak konular. Iki ajan ayni araci ya da kavrami ogrenmisse
 * aralarinda bir bilgi bagi kurulur; graf boylece "kim neyi biliyor, kimle
 * ortak zemini var" sorusunu gosterir.
 */

export type Asama = 'bos' | 'filiz' | 'gelisen' | 'olgun'

export interface Dugum {
  key: string
  ad: string
  kisaAd: string
  rol: 'mudur' | 'lider' | 'uzman'
  departman: string
  renk: string
  boyut: number
  asama: Asama
  bilgiBoyutu: number
  /** Hafizadan cikarilan konu basliklari. */
  konular: string[]
  x: number
  y: number
}

export interface Bag {
  a: string
  b: string
  /** 'yapi' hiyerarsi bagi, 'bilgi' ortak konudan dogan bag. */
  tur: 'yapi' | 'bilgi'
  guc: number
  ortak?: string[]
}

export interface Graf {
  dugumler: Dugum[]
  baglar: Bag[]
  /** Butun ajanlarda gecen konularin sikligi. */
  konuSikligi: Array<{ konu: string; sayi: number; ajanlar: string[] }>
  olgunluk: number
}

/** Hafiza boyutundan gelisim asamasi. */
export function asamaBul(boyut: number): Asama {
  if (boyut <= 0) return 'bos'
  if (boyut < 600) return 'filiz'
  if (boyut < 2000) return 'gelisen'
  return 'olgun'
}

export const ASAMA_ETIKET: Record<Asama, string> = {
  bos: 'boş',
  filiz: 'filiz',
  gelisen: 'gelişen',
  olgun: 'olgun'
}

export const ASAMA_RENK: Record<Asama, string> = {
  bos: 'var(--metin-3)',
  filiz: 'var(--amber)',
  gelisen: 'var(--mavi-acik)',
  olgun: 'var(--yesil)'
}

/** Grafta sigacak kisa ad: unvan eklerini atar. */
function kisalt(baslik: string): string {
  const temiz = baslik
    .replace(/\s*Uzmanı$/, '')
    .replace(/\s*Lideri$/, '')
    .replace(/\s*Mühendisi$/, '')
    .replace(/\s*Tasarımcısı$/, '')
    .replace(/\s*Araştırmacısı$/, '')
    .trim()
  return temiz.length > 16 ? temiz.slice(0, 15) + '…' : temiz
}

/** Metinde gecen teknik terimleri konu olarak cikarir. */
export function konulariCikar(metin: string): string[] {
  if (!metin) return []
  const konular = new Set<string>()

  // Madde basindaki arac adlari: "- Vitest 3.2 — ..." gibi
  for (const satir of metin.split('\n')) {
    const m = satir.match(/^\s*[-*]\s+([A-Za-zÇĞİÖŞÜçğıöşü][\w.@/+-]{2,28})/)
    if (m) konular.add(m[1].toLowerCase().replace(/[.,;:]$/, ''))
  }

  // Metin icinde gecen bilinen teknoloji adlari
  const bilinen = [
    'react', 'vue', 'svelte', 'next.js', 'vite', 'typescript', 'javascript',
    'node', 'express', 'fastify', 'postgresql', 'mysql', 'sqlite', 'mongodb',
    'redis', 'prisma', 'drizzle', 'docker', 'kubernetes', 'github actions',
    'playwright', 'vitest', 'jest', 'cypress', 'eslint', 'prettier', 'biome',
    'tailwind', 'figma', 'webpack', 'esbuild', 'rollup', 'graphql', 'rest',
    'oauth', 'jwt', 'wcag', 'core web vitals', 'lighthouse', 'seo', 'schema.org',
    'python', 'pandas', 'sql', 'electron', 'tauri', 'react native', 'expo'
  ]
  const kucuk = metin.toLowerCase()
  for (const b of bilinen) {
    if (kucuk.includes(b)) konular.add(b)
  }

  return [...konular].slice(0, 24)
}

interface Girdi {
  departmanlar: Department[]
  kadro: AgentSpec[]
  hafiza: HafizaKaydi[]
  renkAl: (departmanId: string) => string
}

/**
 * Grafi kurar. Dugum konumlari deterministiktir: ayni kadro her zaman ayni
 * yerlesimi verir, boylece graf her acilista zipla­maz.
 */
export function grafKur({ departmanlar, kadro, hafiza, renkAl }: Girdi): Graf {
  const hafizaAl = (key: string): HafizaKaydi | undefined =>
    hafiza.find((h) => h.ajanKey === key)

  const dugumler: Dugum[] = []
  const baglar: Bag[] = []

  const merkez = { x: 500, y: 400 }

  // --- müdür: merkezde
  const mudurHafiza = hafizaAl('mudur')
  const mudurBoyut = mudurHafiza?.boyut ?? 0
  dugumler.push({
    key: 'mudur',
    ad: 'Müdür',
    kisaAd: 'Müdür',
    rol: 'mudur',
    departman: '',
    renk: 'var(--turuncu)',
    boyut: 26,
    asama: asamaBul(mudurBoyut),
    bilgiBoyutu: mudurBoyut,
    konular: konulariCikar(mudurHafiza?.metin ?? ''),
    x: merkez.x,
    y: merkez.y
  })

  const n = Math.max(departmanlar.length, 1)

  departmanlar.forEach((d, i) => {
    const aci = (i / n) * Math.PI * 2 - Math.PI / 2
    const liderX = merkez.x + Math.cos(aci) * 196
    const liderY = merkez.y + Math.sin(aci) * 196
    const renk = renkAl(d.id)

    // --- lider
    const liderSpec = kadro.find((a) => a.key === d.leadKey)
    const liderHafiza = hafizaAl(d.leadKey)
    const liderBoyut = liderHafiza?.boyut ?? 0
    dugumler.push({
      key: d.leadKey,
      ad: liderSpec?.title ?? d.leadKey,
      kisaAd: kisalt(liderSpec?.title ?? d.leadKey),
      rol: 'lider',
      departman: d.id,
      renk,
      boyut: 17,
      asama: asamaBul(liderBoyut),
      bilgiBoyutu: liderBoyut,
      konular: konulariCikar(liderHafiza?.metin ?? ''),
      x: liderX,
      y: liderY
    })
    baglar.push({ a: 'mudur', b: d.leadKey, tur: 'yapi', guc: 1 })

    // --- uzmanlar: liderin etrafında yelpaze
    const uzmanSayisi = d.specialistKeys.length
    d.specialistKeys.forEach((key, j) => {
      const yayilma = 0.52
      const alt =
        aci - yayilma / 2 + (uzmanSayisi === 1 ? yayilma / 2 : (j / (uzmanSayisi - 1)) * yayilma)
      // Komsu etiketler cakismasin diye uzmanlar farkli yariçaplara dagilir.
      const uzaklik = j % 2 === 1 ? 415 : 322
      const spec = kadro.find((a) => a.key === key)
      const h = hafizaAl(key)
      const boyut = h?.boyut ?? 0
      dugumler.push({
        key,
        ad: spec?.title ?? key,
        kisaAd: kisalt(spec?.title ?? key),
        rol: 'uzman',
        departman: d.id,
        renk,
        boyut: 12,
        asama: asamaBul(boyut),
        bilgiBoyutu: boyut,
        konular: konulariCikar(h?.metin ?? ''),
        x: merkez.x + Math.cos(alt) * uzaklik,
        y: merkez.y + Math.sin(alt) * uzaklik
      })
      baglar.push({ a: d.leadKey, b: key, tur: 'yapi', guc: 1 })
    })
  })

  // --- bilgi bağları: ortak konusu olan ajanlar
  const konuSahipleri = new Map<string, string[]>()
  for (const d of dugumler) {
    for (const k of d.konular) {
      konuSahipleri.set(k, [...(konuSahipleri.get(k) ?? []), d.key])
    }
  }

  const bilgiBaglari = new Map<string, { guc: number; ortak: string[] }>()
  for (const [konu, sahipler] of konuSahipleri) {
    if (sahipler.length < 2) continue
    for (let i = 0; i < sahipler.length; i++) {
      for (let j = i + 1; j < sahipler.length; j++) {
        const [a, b] = [sahipler[i], sahipler[j]].sort()
        // Ayni departmandaki ajanlar zaten yapi bagiyla bagli; tekrar cizme.
        const da = dugumler.find((x) => x.key === a)
        const db = dugumler.find((x) => x.key === b)
        if (da && db && da.departman && da.departman === db.departman) continue

        const anahtar = `${a}|${b}`
        const mevcut = bilgiBaglari.get(anahtar)
        bilgiBaglari.set(anahtar, {
          guc: (mevcut?.guc ?? 0) + 1,
          ortak: [...(mevcut?.ortak ?? []), konu]
        })
      }
    }
  }

  for (const [anahtar, { guc, ortak }] of bilgiBaglari) {
    const [a, b] = anahtar.split('|')
    baglar.push({ a, b, tur: 'bilgi', guc, ortak: ortak.slice(0, 6) })
  }

  const konuSikligi = [...konuSahipleri.entries()]
    .map(([konu, ajanlar]) => ({ konu, sayi: ajanlar.length, ajanlar }))
    .sort((a, b) => b.sayi - a.sayi)
    .slice(0, 30)

  const dolu = dugumler.filter((d) => d.asama !== 'bos').length
  const olgunluk = dugumler.length > 0 ? dolu / dugumler.length : 0

  return { dugumler, baglar, konuSikligi, olgunluk }
}
