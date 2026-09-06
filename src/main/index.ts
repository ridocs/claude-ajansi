import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import { randomUUID } from 'node:crypto'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { authDurumu, claudeOturumuVar } from './agency/auth'
import { ayarlariOku, ayarlariYaz, klasorKullan, type Ayarlar } from './agency/ayarlar'
import { EGITIM_BRIEFI } from './agency/egitim'
import { briefCalistir, type CalismaKontrol } from './agency/engine'
import { calismaKaydet, gecmisListele, gecmisOku, gecmisSil, kayitHazirla } from './agency/gecmis'
import { hafizaEkle, hafizaListele, hafizaSil, hafizaTemizle } from './agency/hafiza'
import { buildRoster } from './agency/roster'
import type { AgencyEvent, Brief, RunSummary, SetupCheck } from '../shared/types'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

let pencere: BrowserWindow | null = null
let calisma: CalismaKontrol | null = null

/** Suren calismanin olaylari; bitince gecmise yazilir. */
let calismaOlaylari: AgencyEvent[] = []
let calismaBilgi: { workspace: string; brief: string; egitim: boolean; basladi: number } | null =
  null

/** Bekleyen onay istekleri: id -> cevabı bekleyen çözücü. */
const bekleyenOnaylar = new Map<string, (izin: boolean) => void>()

function pencereOlustur(): void {
  pencere = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 1040,
    minHeight: 680,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#0D1413',
    title: 'Ajan Ajansı',
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  pencere.on('ready-to-show', () => pencere?.show())

  // Dış bağlantılar uygulamanın içinde değil, tarayıcıda açılır.
  pencere.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  const devSunucu = process.env.ELECTRON_RENDERER_URL
  if (devSunucu) {
    pencere.loadURL(devSunucu)
  } else {
    pencere.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function olayGonder(olay: AgencyEvent): void {
  calismaOlaylari.push(olay)
  pencere?.webContents.send('ajans:olay', olay)
}

/** Calisma bittiginde akisi ve ozeti kalici gecmise yazar. */
function gecmiseYaz(ozet: RunSummary): void {
  if (!calismaBilgi) return
  try {
    calismaKaydet(
      kayitHazirla(
        calismaBilgi.workspace,
        calismaBilgi.brief,
        calismaBilgi.egitim,
        calismaBilgi.basladi,
        ozet,
        calismaOlaylari
      )
    )
  } catch {
    // Gecmis yazilamazsa calisma yine de tamamlanmis sayilir.
  }
  calismaBilgi = null
  calismaOlaylari = []
}

/** Riskli bir iş için arayüze sorar ve cevabı bekler. */
function onayIste(istek: { agentKey: string; tool: string; ozet: string }): Promise<boolean> {
  if (!pencere) return Promise.resolve(false)
  const id = randomUUID()
  return new Promise<boolean>((cozumle) => {
    bekleyenOnaylar.set(id, cozumle)
    pencere?.webContents.send('ajans:onay-istegi', { id, ...istek })
  })
}

function kurulumKontrolleri(): SetupCheck[] {
  const durum = authDurumu()
  const { agents, departments } = buildRoster()
  const nodeSurum = process.versions.node
  const nodeYeterli = Number(nodeSurum.split('.')[0]) >= 18

  return [
    {
      id: 'node',
      label: 'Çalışma ortamı',
      state: nodeYeterli ? 'tamam' : 'hata',
      detail: nodeYeterli ? `Node ${nodeSurum}` : `Node ${nodeSurum} çok eski, en az 18 gerekli.`
    },
    {
      id: 'baglanti',
      label: 'Claude bağlantısı',
      state: durum.ready ? 'tamam' : 'hata',
      detail: durum.detail
    },
    {
      id: 'kadro',
      label: 'Ajans kadrosu',
      state: 'tamam',
      detail: `${departments.length} departman, ${agents.length + 1} ajan hazır (1 müdür, ${departments.length} lider, ${agents.length - departments.length} uzman).`
    }
  ]
}

// ------------------------------------------------------------------ IPC

ipcMain.handle('ajans:durum', () => authDurumu())
ipcMain.handle('ajans:kontroller', () => kurulumKontrolleri())
ipcMain.handle('ajans:kadro', () => buildRoster())
ipcMain.handle('ajans:oturum-var', () => claudeOturumuVar())

ipcMain.handle('ajans:ayarlar', () => ayarlariOku())
ipcMain.handle('ajans:ayar-yaz', (_olay, guncel: Partial<Ayarlar>) => ayarlariYaz(guncel))

ipcMain.handle('ajans:klasor-kullan', (_olay, klasor: string) => klasorKullan(klasor))

ipcMain.handle('ajans:klasor-sec', async () => {
  if (!pencere) return null
  const secim = await dialog.showOpenDialog(pencere, {
    title: 'Ajansın çalışacağı klasörü seç',
    properties: ['openDirectory', 'createDirectory']
  })
  if (secim.canceled) return null
  const klasor = secim.filePaths[0]
  // Secilen klasor bir sonraki acilista hazir gelsin ve gecmise girsin.
  klasorKullan(klasor)
  return klasor
})

ipcMain.handle('ajans:brief-calistir', async (_olay, brief: Brief) => {
  if (calisma) return { ok: false, detail: 'Ajans şu anda başka bir işin üzerinde çalışıyor.' }
  if (!brief.workspace) return { ok: false, detail: 'Önce çalışma klasörünü seç.' }

  calismaOlaylari = []
  calismaBilgi = {
    workspace: brief.workspace,
    brief: brief.text,
    egitim: false,
    basladi: Date.now()
  }
  calisma = briefCalistir(brief, olayGonder, onayIste, { tamYetki: ayarlariOku().tamYetki })

  calisma.sonuc
    .then((ozet) => {
      gecmiseYaz(ozet)
      pencere?.webContents.send('ajans:bitti', ozet)
    })
    .catch((hata: unknown) => {
      pencere?.webContents.send('ajans:bitti', {
        ok: false,
        subtype: 'hata',
        costUsd: 0,
        durationMs: 0,
        result: hata instanceof Error ? hata.message : String(hata)
      })
    })
    .finally(() => {
      calisma = null
      // Cevapsız kalan onay istekleri reddedilmiş sayılır.
      for (const cozumle of bekleyenOnaylar.values()) cozumle(false)
      bekleyenOnaylar.clear()
    })

  return { ok: true, detail: 'Ajans işe başladı.' }
})

ipcMain.handle('ajans:egit', async (_olay, workspace: string) => {
  if (calisma) return { ok: false, detail: 'Ajans şu anda başka bir işin üzerinde çalışıyor.' }
  if (!workspace) return { ok: false, detail: 'Önce çalışma klasörünü seç.' }

  calismaOlaylari = []
  calismaBilgi = { workspace, brief: EGITIM_BRIEFI, egitim: true, basladi: Date.now() }
  calisma = briefCalistir({ text: EGITIM_BRIEFI, workspace }, olayGonder, onayIste, {
    egitim: true,
    // Egitim turunda her ajanin raporu kendi hafizasina yazilir.
    onOgrenme: (ajanKey, rapor) => hafizaEkle(ajanKey, rapor)
  })

  calisma.sonuc
    .then((ozet) => {
      gecmiseYaz(ozet)
      pencere?.webContents.send('ajans:bitti', ozet)
    })
    .catch((hata: unknown) => {
      pencere?.webContents.send('ajans:bitti', {
        ok: false,
        subtype: 'hata',
        costUsd: 0,
        durationMs: 0,
        result: hata instanceof Error ? hata.message : String(hata)
      })
    })
    .finally(() => {
      calisma = null
      for (const cozumle of bekleyenOnaylar.values()) cozumle(false)
      bekleyenOnaylar.clear()
    })

  return { ok: true, detail: 'Eğitim turu başladı.' }
})

ipcMain.handle('ajans:dosya-ac', async (_olay, yol: string) => {
  // shell.openPath bos string donerse acilis basarili demektir.
  const hata = await shell.openPath(yol)
  return hata ? { ok: false, detail: hata } : { ok: true, detail: 'Dosya açıldı.' }
})

ipcMain.handle('ajans:klasorde-goster', (_olay, yol: string) => {
  shell.showItemInFolder(yol)
  return { ok: true, detail: 'Klasörde gösteriliyor.' }
})

ipcMain.handle('ajans:tam-ekran', () => {
  if (!pencere) return false
  const yeni = !pencere.isFullScreen()
  pencere.setFullScreen(yeni)
  return yeni
})

ipcMain.handle('ajans:gecmis', (_olay, workspace?: string) => gecmisListele(workspace))
ipcMain.handle('ajans:gecmis-oku', (_olay, workspace: string, id: string) =>
  gecmisOku(workspace, id)
)
ipcMain.handle('ajans:gecmis-sil', (_olay, workspace: string, id: string) => {
  gecmisSil(workspace, id)
  return gecmisListele(workspace)
})

ipcMain.handle('ajans:hafiza', () => hafizaListele())
ipcMain.handle('ajans:hafiza-sil', (_olay, ajanKey: string) => {
  hafizaSil(ajanKey)
  return hafizaListele()
})
ipcMain.handle('ajans:hafiza-temizle', () => {
  hafizaTemizle()
  return hafizaListele()
})

ipcMain.handle('ajans:durdur', () => {
  calisma?.durdur()
  return { ok: true, detail: 'Durdurma isteği gönderildi.' }
})

ipcMain.handle('ajans:mesaj-gonder', (_olay, metin: string) => {
  if (!calisma) return { ok: false, detail: 'Açık bir oturum yok.' }
  calisma.mesajGonder(metin)
  return { ok: true, detail: 'Mesaj müdüre iletildi.' }
})

ipcMain.handle('ajans:oturum-kapat', () => {
  if (!calisma) return { ok: false, detail: 'Açık bir oturum yok.' }
  calisma.oturumuKapat()
  return { ok: true, detail: 'Oturum kapatılıyor.' }
})

ipcMain.on('ajans:onay-cevabi', (_olay, cevap: { id: string; izin: boolean }) => {
  const cozumle = bekleyenOnaylar.get(cevap.id)
  if (cozumle) {
    bekleyenOnaylar.delete(cevap.id)
    cozumle(cevap.izin)
  }
})

// ------------------------------------------------------------------ yaşam döngüsü

app.whenReady().then(() => {
  app.setAppUserModelId('com.ajanajansi.app')
  pencereOlustur()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) pencereOlustur()
  })
})

app.on('window-all-closed', () => {
  calisma?.durdur()
  if (process.platform !== 'darwin') app.quit()
})
