// Uctan uca test: mudur -> takim lideri -> uzman zinciri kuruluyor mu, ve
// motorun yaydigi olaylar arayuzun bekledigi duruma donusuyor mu?
//
// Calistirmak icin: node --run test:hiyerarsi -- <calisma-klasoru>
//
// Gercek bir gorev calistirir; makinedeki Claude oturumunu kullanir.

import { mkdirSync } from 'node:fs'
import { briefCalistir } from '../src/main/agency/engine.ts'
import { ajanAdi, ajansDurumuHesapla } from '../src/renderer/src/ajansDurumu.ts'
import type { AgencyEvent } from '../src/shared/types.ts'

const klasor = process.argv[2]
if (!klasor) {
  console.error('Kullanim: npx tsx betikler/hiyerarsi-testi.ts <calisma-klasoru>')
  process.exit(1)
}
mkdirSync(klasor, { recursive: true })

const BRIEF =
  'Frontend departmani bu klasorde ornek.html adinda tek bir sayfa olustursun. ' +
  'Sayfada "Ajans calisiyor" basligi ve altinda bir cumlelik aciklama olsun. ' +
  'Baska hicbir dosya olusturmayin, mevcut dosyalari degistirmeyin.'

// Arayuzun gordugu akisin aynisini biriktiriyoruz.
const olaylar: AgencyEvent[] = []

const kontrol = briefCalistir(
  { text: BRIEF, workspace: klasor },
  (olay: AgencyEvent) => {
    olaylar.push(olay)
    if (olay.kind === 'ajan-basladi') {
      console.log(`  [gorev] ${String(olay.meta?.atayan ?? 'mudur')} -> ${olay.agentKey}`)
    }
    if (olay.kind === 'ajan-bitti') {
      const m = olay.meta ?? {}
      console.log(`  [bitti] ${olay.agentKey} · ${m.aracSayisi} arac · ${m.tokenler} token`)
    }
    if (olay.kind === 'dosya-degisti') console.log(`  [dosya] ${olay.meta?.islem}: ${olay.text}`)
    if (olay.kind === 'onay-gerekli') console.log(`  [onay]  ${olay.text}`)
    if (olay.kind === 'hata') console.log(`  [hata]  ${olay.text}`)
  },
  // Testte kimse onay veremez; riskli is otomatik reddedilir.
  async () => false
)

console.log('Brief ajansa verildi. Calisma alani:', klasor, '\n')
const ozet = await kontrol.sonuc

// --- Arayuzun turettigi durum
const d = ajansDurumuHesapla(olaylar)

console.log('\n--- SONUC ---')
console.log('Durum   :', ozet.ok ? 'basarili' : `basarisiz (${ozet.subtype})`)
console.log('Maliyet :', ozet.costUsd.toFixed(4), 'USD')
console.log('Sure    :', Math.round(ozet.durationMs / 1000), 'sn')

console.log('\n--- GOREV PANOSU (arayuzun gordugu) ---')
for (const a of d.ajanlar) {
  const olcu = [
    a.sureMs ? `${Math.round(a.sureMs / 1000)} sn` : '',
    a.aracSayisi ? `${a.aracSayisi} arac` : '',
    a.eklenenSatir ? `+${a.eklenenSatir} satir` : ''
  ]
    .filter(Boolean)
    .join(' · ')
  console.log(`  ${a.durum.padEnd(10)} ${ajanAdi(a.key).padEnd(28)} ${olcu}`)
}

console.log('\n--- TESLIMAT DEPOSU ---')
if (d.teslimatlar.length === 0) console.log('  (bos)')
for (const t of d.teslimatlar) console.log(`  ${t.islem === 'olusturuldu' ? '+' : '~'} ${t.ad}`)

console.log('\n--- DENETIM ---')
const zincir = d.ajanlar.filter((a) => a.atayan !== 'mudur').length > 0
const kontroller: Array<[string, boolean]> = [
  ['Uc katmanli zincir kuruldu', d.ajanlar.some((a) => a.atayan === 'mudur') && zincir],
  ['Her ajan bir sonuca ulasti', d.ajanlar.every((a) => a.durum !== 'calisiyor')],
  ['Bitis istatistikleri geldi', d.ajanlar.some((a) => (a.aracSayisi ?? 0) > 0)],
  ['Token sayaci doldu', d.toplamToken > 0],
  ['Teslimat yakalandi', d.teslimatlar.length > 0],
  ['Maliyet raporlandi', d.maliyetUsd > 0]
]

let kaldi = 0
for (const [ad, ok] of kontroller) {
  console.log(`  ${ok ? 'gecti ' : 'KALDI '} ${ad}`)
  if (!ok) kaldi++
}

console.log('\n--- MUDURUN SUNUMU ---')
console.log(ozet.result.slice(0, 900))

process.exit(kaldi === 0 && ozet.ok ? 0 : 1)
