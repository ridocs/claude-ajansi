// Teslimat tespiti testi: gercek dosya sistemi kullanir, API cagrisi yapmaz.
// Calistirmak icin: npm run test:teslimat

import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { anlikAl, farkAl } from '../src/main/agency/teslimat.ts'

const kok = join(tmpdir(), `ajans-teslimat-testi-${Date.now()}`)
mkdirSync(join(kok, 'src'), { recursive: true })
mkdirSync(join(kok, 'node_modules', 'paket'), { recursive: true })

writeFileSync(join(kok, 'src', 'mevcut.ts'), 'eski icerik')
writeFileSync(join(kok, 'dokunulmayan.md'), 'sabit')
writeFileSync(join(kok, 'node_modules', 'paket', 'index.js'), 'bagimlilik')

const sonuclar: Array<[string, boolean, string]> = []
const bekle = (ad: string, ok: boolean, detay = ''): void => {
  sonuclar.push([ad, ok, detay])
}

const once = anlikAl(kok)
bekle('node_modules taranmadi', ![...once.keys()].some((y) => y.includes('node_modules')))
bekle('Normal dosyalar tarandi', once.size === 2, `gelen: ${once.size}`)

// Ajans calisiyormus gibi: bir dosya olustur, birini degistir, birine dokunma.
await new Promise((r) => setTimeout(r, 12))
writeFileSync(join(kok, 'src', 'yeni.ts'), 'yeni dosya')
writeFileSync(join(kok, 'src', 'mevcut.ts'), 'guncellenmis icerik')
writeFileSync(join(kok, 'node_modules', 'paket', 'index.js'), 'degisti ama sayilmaz')

const fark = farkAl(once, anlikAl(kok), kok)

bekle('Iki dosya degisikligi bulundu', fark.length === 2, `gelen: ${fark.length}`)
bekle('Yeni dosya olusturuldu sayildi',
  fark.find((f) => f.ad === 'yeni.ts')?.islem === 'olusturuldu')
bekle('Degisen dosya duzenlendi sayildi',
  fark.find((f) => f.ad === 'mevcut.ts')?.islem === 'duzenlendi')
bekle('Dokunulmayan dosya listede yok', !fark.some((f) => f.ad === 'dokunulmayan.md'))
bekle('node_modules degisikligi sayilmadi', !fark.some((f) => f.yol.includes('node_modules')))

// Hic degisiklik yoksa bos donmeli.
const bos = farkAl(anlikAl(kok), anlikAl(kok), kok)
bekle('Degisiklik yoksa liste bos', bos.length === 0, `gelen: ${bos.length}`)

// Var olmayan klasor cokmemeli.
const yokAnlik = anlikAl(join(kok, 'olmayan-klasor'))
bekle('Olmayan klasor bos anlik verir', yokAnlik.size === 0)

rmSync(kok, { recursive: true, force: true })

let kaldi = 0
for (const [ad, ok, detay] of sonuclar) {
  console.log(`  ${ok ? 'gecti ' : 'KALDI '} ${ad}${!ok && detay ? ' -> ' + detay : ''}`)
  if (!ok) kaldi++
}
console.log(`\n${sonuclar.length - kaldi} gecti, ${kaldi} kaldi (toplam ${sonuclar.length})`)
process.exit(kaldi === 0 ? 0 : 1)
