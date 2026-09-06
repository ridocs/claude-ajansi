// Onay kapisi birim testi. API cagrisi yapmaz, para harcamaz.
// Calistirmak icin: npm run test:izin

import { izinDegerlendir } from '../src/main/agency/izin.ts'

const ALAN = process.platform === 'win32' ? 'C:\\proje\\ajans' : '/proje/ajans'
const DISARI = process.platform === 'win32' ? 'C:\\Windows\\System32' : '/etc'

interface Senaryo {
  ad: string
  tool: string
  input: Record<string, unknown>
  bekleniyor: 'izin' | 'onay-gerekli'
}

const senaryolar: Senaryo[] = [
  // --- calisma alani siniri
  {
    ad: 'Calisma alani icine yazma',
    tool: 'Write',
    input: { file_path: `${ALAN}${process.platform === 'win32' ? '\\' : '/'}src${process.platform === 'win32' ? '\\' : '/'}app.ts` },
    bekleniyor: 'izin'
  },
  {
    ad: 'Goreli yol ile icine yazma',
    tool: 'Write',
    input: { file_path: 'src/app.ts' },
    bekleniyor: 'izin'
  },
  {
    ad: 'Calisma alani disina yazma',
    tool: 'Write',
    input: { file_path: `${DISARI}${process.platform === 'win32' ? '\\' : '/'}hosts` },
    bekleniyor: 'onay-gerekli'
  },
  {
    ad: 'Ust klasore kacis (..)',
    tool: 'Edit',
    input: { file_path: '../../gizli.txt' },
    bekleniyor: 'onay-gerekli'
  },
  {
    ad: 'Ust klasore kacis, ic ice',
    tool: 'Write',
    input: { file_path: 'src/../../disarida.txt' },
    bekleniyor: 'onay-gerekli'
  },

  // --- tehlikeli komutlar
  { ad: 'Zararsiz komut: npm test', tool: 'Bash', input: { command: 'npm test' }, bekleniyor: 'izin' },
  { ad: 'Zararsiz komut: git status', tool: 'Bash', input: { command: 'git status' }, bekleniyor: 'izin' },
  {
    ad: 'Tehlikeli: rm -rf',
    tool: 'Bash',
    input: { command: 'rm -rf ./build' },
    bekleniyor: 'onay-gerekli'
  },
  {
    ad: 'Tehlikeli: zincirin ikinci komutu',
    tool: 'Bash',
    input: { command: 'npm run build && rm -rf dist' },
    bekleniyor: 'onay-gerekli'
  },
  {
    ad: 'Tehlikeli: git reset --hard',
    tool: 'Bash',
    input: { command: 'git reset --hard HEAD~3' },
    bekleniyor: 'onay-gerekli'
  },
  {
    ad: 'Tehlikeli: git push --force',
    tool: 'Bash',
    input: { command: 'git push origin main --force' },
    bekleniyor: 'onay-gerekli'
  },
  {
    ad: 'Tehlikeli: del /f',
    tool: 'Bash',
    input: { command: 'del /f C:\\Windows\\notepad.exe' },
    bekleniyor: 'onay-gerekli'
  },

  // --- kapinin kapsamadigi araclar
  { ad: 'Okuma her zaman serbest', tool: 'Read', input: { file_path: `${DISARI}/x` }, bekleniyor: 'izin' },
  { ad: 'Arama her zaman serbest', tool: 'Grep', input: { pattern: 'sifre' }, bekleniyor: 'izin' }
]

let gecti = 0
let kaldi = 0

for (const s of senaryolar) {
  const karar = izinDegerlendir(ALAN, s.tool, s.input)
  const ok = karar.tur === s.bekleniyor
  if (ok) {
    gecti++
    console.log(`  gecti  ${s.ad}`)
  } else {
    kaldi++
    console.log(`  KALDI  ${s.ad} -> beklenen "${s.bekleniyor}", gelen "${karar.tur}"`)
  }
}

console.log(`\n${gecti} gecti, ${kaldi} kaldi (toplam ${senaryolar.length})`)
process.exit(kaldi === 0 ? 0 : 1)
