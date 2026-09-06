// Ajans motorunun Claude'a gercekten baglanip baglanmadigini olcen kucuk test.
// Calistirmak icin: node betikler/baglanti-testi.mjs
//
// Kurulu Claude oturumunu kullanir; ANTHROPIC_API_KEY tanimliysa onu kullanir.
// Tek bir ucuz soru sorar, maliyeti kurus mertebesindedir.

import { query } from '@anthropic-ai/claude-agent-sdk'

const baslangic = Date.now()
let cevap = ''
let ozet = null

console.log('Claude baglantisi deneniyor...\n')

try {
  for await (const mesaj of query({
    prompt: 'Sadece su kelimeyi yaz, baska hicbir sey yazma: HAZIR',
    options: {
      model: 'haiku',
      allowedTools: [],
      maxTurns: 1,
      systemPrompt: 'Kisa ve tam olarak istenen sekilde cevap ver.'
    }
  })) {
    if (mesaj.type === 'assistant') {
      for (const blok of mesaj.message?.content ?? []) {
        if (blok.type === 'text') cevap += blok.text
      }
    }
    if (mesaj.type === 'result') ozet = mesaj
  }
} catch (hata) {
  console.error('BAGLANTI KURULAMADI')
  console.error(hata instanceof Error ? hata.message : String(hata))
  process.exit(1)
}

const sure = ((Date.now() - baslangic) / 1000).toFixed(1)

console.log('Modelin cevabi :', cevap.trim() || '(bos)')
console.log('Sonuc          :', ozet?.subtype ?? 'bilinmiyor')
console.log('Maliyet        :', (ozet?.total_cost_usd ?? 0).toFixed(6), 'USD')
console.log('Sure           :', sure, 'sn')
console.log(
  '\nBAGLANTI CALISIYOR:',
  process.env.ANTHROPIC_API_KEY ? 'API anahtari ile' : 'kurulu Claude oturumu ile'
)
