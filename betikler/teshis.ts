// Teshis: gercek bir kod yazma gorevinde ajanlar isi bitiriyor mu?
//
// Acik oturumu kullanir: mudur sozunu bitirdiginde, isin gercekten bitip
// bitmedigini sorar ve gerekirse devam ettirir. Uygulamadaki "Devam et"
// dugmesinin otomatiklestirilmis hali.
//
// Calistirmak icin: npx tsx betikler/teshis.ts <calisma-klasoru>

import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { briefCalistir } from '../src/main/agency/engine.ts'
import { ajansDurumuHesapla } from '../src/renderer/src/ajansDurumu.ts'
import type { AgencyEvent } from '../src/shared/types.ts'

const klasor = process.argv[2]
if (!klasor) {
  console.error('Kullanim: npx tsx betikler/teshis.ts <calisma-klasoru>')
  process.exit(1)
}
mkdirSync(klasor, { recursive: true })

const BRIEF = `Bu klasorde basit bir "notlar" REST API'si kur.

Gereksinimler:
- Node.js ve Express kullan.
- Notlari bellekte tut (veritabani yok).
- Uc nokta: not listele, not ekle, not sil.
- Her uc nokta icin girdi dogrulamasi ve anlamli hata yanitlari olsun.
- Calisir bir package.json ve server.js uret.
- Testleri de yaz.`

const DEVAM =
  'Kabul listeni gozden gecir. Karsilanmamis madde varsa ilgili lideri tekrar gorevlendirip ' +
  'tamamlat. Hepsi karsilandiysa yalnizca TAMAMLANDI yaz ve kisa bir ozet ver.'

const EN_FAZLA_TUR = 3
let tur = 0

const olaylar: AgencyEvent[] = []

const kontrol = briefCalistir(
  { text: BRIEF, workspace: klasor },
  (olay: AgencyEvent) => {
    olaylar.push(olay)
    const kisa = olay.text.replace(/\s+/g, ' ').slice(0, 130)

    if (olay.kind === 'ajan-basladi') {
      console.log(`[GOREV] ${String(olay.meta?.atayan ?? 'mudur')} -> ${olay.agentKey}`)
    } else if (olay.kind === 'ajan-bitti') {
      console.log(`[BITTI] ${olay.agentKey} · ${olay.meta?.aracSayisi} arac`)
    } else if (olay.kind === 'dosya-degisti') {
      console.log(`[DOSYA] ${olay.meta?.islem}: ${kisa}`)
    } else if (olay.kind === 'hata') {
      console.log(`[HATA]  ${kisa}`)
    } else if (olay.kind === 'tur-bitti') {
      tur += 1
      const bittiMi = olaylar.some(
        (o) => o.kind === 'ajan-konustu' && o.agentKey === 'mudur' && /TAMAMLANDI/.test(o.text)
      )
      if (bittiMi || tur >= EN_FAZLA_TUR) {
        console.log(`[TUR ${tur}] ${bittiMi ? 'mudur TAMAMLANDI dedi' : 'tur siniri'} -> kapaniyor`)
        kontrol.oturumuKapat()
      } else {
        console.log(`[TUR ${tur}] mudur sozunu bitirdi -> devam ettiriliyor`)
        kontrol.mesajGonder(DEVAM)
      }
    }
  },
  async () => false
)

console.log('Brief ajansa verildi.\n')
const ozet = await kontrol.sonuc
const d = ajansDurumuHesapla(olaylar)

writeFileSync(join(klasor, '..', 'teshis-olaylar.json'), JSON.stringify({ ozet, olaylar }, null, 2))

console.log('\n=== OZET ===')
console.log('Durum   :', ozet.ok ? 'basarili' : `basarisiz (${ozet.subtype})`)
console.log('Tur     :', tur)
console.log('Maliyet :', ozet.costUsd.toFixed(4), 'USD')
console.log('Sure    :', Math.round(ozet.durationMs / 1000), 'sn')
console.log('Ajanlar :', d.ajanlar.map((a) => a.key).join(', '))
console.log('Dosyalar:', d.teslimatlar.map((t) => t.ad).join(', ') || '(hic dosya uretilmedi)')

console.log('\n=== KABUL DENETIMI ===')
const dosyalar = d.teslimatlar.map((t) => t.ad)
const kriterler: Array<[string, boolean]> = [
  ['server.js uretildi', dosyalar.includes('server.js')],
  ['package.json uretildi', dosyalar.includes('package.json')],
  ['test dosyasi uretildi', dosyalar.some((f) => /test|spec/i.test(f))],
  ['Backend departmani calisti', d.ajanlar.some((a) => a.key.includes('backend'))],
  ['Kalite departmani calisti', d.ajanlar.some((a) => a.key.includes('kalite'))],
  ['Yerlesik ajan cagrilmadi', !d.ajanlar.some((a) => /Explore|general-purpose/i.test(a.key))]
]
let kaldi = 0
for (const [ad, ok] of kriterler) {
  console.log(`  ${ok ? 'gecti ' : 'KALDI '} ${ad}`)
  if (!ok) kaldi++
}

console.log('\n=== MUDURUN SUNUMU ===')
console.log(ozet.result.slice(0, 1500))
process.exit(kaldi === 0 ? 0 : 1)
