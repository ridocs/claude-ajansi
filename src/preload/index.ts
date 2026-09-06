import { contextBridge, ipcRenderer } from 'electron'
import type {
  AgencyEvent,
  AgentSpec,
  AuthStatus,
  Ayarlar,
  Brief,
  Department,
  HafizaKaydi,
  OnayIstegi,
  RunSummary,
  SetupCheck
} from '../shared/types'

export type { OnayIstegi }

/** Arayüzün ana sürece açılan tek kapısı. Node erişimi arayüze verilmez. */
const ajans = {
  durum: (): Promise<AuthStatus> => ipcRenderer.invoke('ajans:durum'),
  kontroller: (): Promise<SetupCheck[]> => ipcRenderer.invoke('ajans:kontroller'),
  kadro: (): Promise<{ agents: AgentSpec[]; departments: Department[] }> =>
    ipcRenderer.invoke('ajans:kadro'),
  oturumVar: (): Promise<boolean> => ipcRenderer.invoke('ajans:oturum-var'),

  ayarlar: (): Promise<Ayarlar> => ipcRenderer.invoke('ajans:ayarlar'),
  ayarYaz: (guncel: Partial<Ayarlar>): Promise<Ayarlar> =>
    ipcRenderer.invoke('ajans:ayar-yaz', guncel),

  klasorSec: (): Promise<string | null> => ipcRenderer.invoke('ajans:klasor-sec'),
  klasorKullan: (klasor: string): Promise<Ayarlar> =>
    ipcRenderer.invoke('ajans:klasor-kullan', klasor),

  briefCalistir: (brief: Brief): Promise<{ ok: boolean; detail: string }> =>
    ipcRenderer.invoke('ajans:brief-calistir', brief),
  egit: (workspace: string): Promise<{ ok: boolean; detail: string }> =>
    ipcRenderer.invoke('ajans:egit', workspace),

  hafiza: (): Promise<HafizaKaydi[]> => ipcRenderer.invoke('ajans:hafiza'),
  hafizaSil: (ajanKey: string): Promise<HafizaKaydi[]> =>
    ipcRenderer.invoke('ajans:hafiza-sil', ajanKey),
  hafizaTemizle: (): Promise<HafizaKaydi[]> => ipcRenderer.invoke('ajans:hafiza-temizle'),

  durdur: (): Promise<{ ok: boolean; detail: string }> => ipcRenderer.invoke('ajans:durdur'),
  mesajGonder: (metin: string): Promise<{ ok: boolean; detail: string }> =>
    ipcRenderer.invoke('ajans:mesaj-gonder', metin),
  oturumuKapat: (): Promise<{ ok: boolean; detail: string }> =>
    ipcRenderer.invoke('ajans:oturum-kapat'),

  onayCevapla: (id: string, izin: boolean): void => {
    ipcRenderer.send('ajans:onay-cevabi', { id, izin })
  },

  // --- dinleyiciler; hepsi aboneliği iptal eden bir fonksiyon döner

  olaylariDinle: (geriCagir: (olay: AgencyEvent) => void): (() => void) => {
    const sarmal = (_e: unknown, olay: AgencyEvent): void => geriCagir(olay)
    ipcRenderer.on('ajans:olay', sarmal)
    return () => ipcRenderer.off('ajans:olay', sarmal)
  },

  bitisiDinle: (geriCagir: (ozet: RunSummary) => void): (() => void) => {
    const sarmal = (_e: unknown, ozet: RunSummary): void => geriCagir(ozet)
    ipcRenderer.on('ajans:bitti', sarmal)
    return () => ipcRenderer.off('ajans:bitti', sarmal)
  },

  onaylariDinle: (geriCagir: (istek: OnayIstegi) => void): (() => void) => {
    const sarmal = (_e: unknown, istek: OnayIstegi): void => geriCagir(istek)
    ipcRenderer.on('ajans:onay-istegi', sarmal)
    return () => ipcRenderer.off('ajans:onay-istegi', sarmal)
  }
}

contextBridge.exposeInMainWorld('ajans', ajans)

export type AjansAPI = typeof ajans
