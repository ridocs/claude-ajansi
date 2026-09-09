import { contextBridge, ipcRenderer } from 'electron'
import type {
  AgencyEvent,
  AgentSpec,
  AuthStatus,
  Ayarlar,
  Brief,
  CalismaKaydi,
  CalismaOzeti,
  Department,
  HafizaKaydi,
  OnayIstegi,
  RunSummary,
  SetupCheck,
  ToplantiKaydi,
  ToplantiMesaji,
  ToplantiOzeti
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
  denetle: (workspace: string): Promise<{ ok: boolean; detail: string }> =>
    ipcRenderer.invoke('ajans:denetle', workspace),
  tasarla: (konu: string, workspace: string): Promise<{ ok: boolean; detail: string }> =>
    ipcRenderer.invoke('ajans:tasarla', konu, workspace),
  tasarimOnayi: (onaylandi: boolean, not: string): Promise<{ ok: boolean; detail: string }> =>
    ipcRenderer.invoke('ajans:tasarim-onayi', onaylandi, not),

  dosyaAc: (yol: string): Promise<{ ok: boolean; detail: string }> =>
    ipcRenderer.invoke('ajans:dosya-ac', yol),
  klasordeGoster: (yol: string): Promise<{ ok: boolean; detail: string }> =>
    ipcRenderer.invoke('ajans:klasorde-goster', yol),
  tamEkran: (): Promise<boolean> => ipcRenderer.invoke('ajans:tam-ekran'),

  gecmis: (workspace?: string): Promise<CalismaOzeti[]> =>
    ipcRenderer.invoke('ajans:gecmis', workspace),
  gecmisOku: (workspace: string, id: string): Promise<CalismaKaydi | null> =>
    ipcRenderer.invoke('ajans:gecmis-oku', workspace, id),
  gecmisSil: (workspace: string, id: string): Promise<CalismaOzeti[]> =>
    ipcRenderer.invoke('ajans:gecmis-sil', workspace, id),

  toplantiAc: (): Promise<{ ok: boolean; detail: string }> =>
    ipcRenderer.invoke('ajans:toplanti-ac'),

  hafiza: (): Promise<HafizaKaydi[]> => ipcRenderer.invoke('ajans:hafiza'),
  hafizaYaz: (ajanKey: string, metin: string): Promise<HafizaKaydi[]> =>
    ipcRenderer.invoke('ajans:hafiza-yaz', ajanKey, metin),
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

/** Toplanti penceresinin kendi kucuk koprusu. */
const toplanti = {
  gonder: (metin: string): Promise<{ ok: boolean; detail: string }> =>
    ipcRenderer.invoke('toplanti:gonder', metin),
  kapat: (): Promise<{ ok: boolean; detail: string }> => ipcRenderer.invoke('toplanti:kapat'),
  hafizayaYaz: (): Promise<{ ok: boolean; detail: string }> =>
    ipcRenderer.invoke('toplanti:hafizaya-yaz'),

  gecmis: (): Promise<ToplantiOzeti[]> => ipcRenderer.invoke('toplanti:gecmis'),
  gecmisOku: (id: string): Promise<ToplantiKaydi | null> =>
    ipcRenderer.invoke('toplanti:gecmis-oku', id),
  gecmisSil: (id: string): Promise<ToplantiOzeti[]> =>
    ipcRenderer.invoke('toplanti:gecmis-sil', id),
  yeni: (): Promise<{ ok: boolean; detail: string }> => ipcRenderer.invoke('toplanti:yeni'),

  mesajlariDinle: (geriCagir: (m: ToplantiMesaji) => void): (() => void) => {
    const sarmal = (_e: unknown, m: ToplantiMesaji): void => geriCagir(m)
    ipcRenderer.on('toplanti:mesaj', sarmal)
    return () => ipcRenderer.off('toplanti:mesaj', sarmal)
  },
  durumDinle: (geriCagir: (acik: boolean) => void): (() => void) => {
    const sarmal = (_e: unknown, d: boolean): void => geriCagir(d)
    ipcRenderer.on('toplanti:durum', sarmal)
    return () => ipcRenderer.off('toplanti:durum', sarmal)
  }
}

contextBridge.exposeInMainWorld('ajans', ajans)
contextBridge.exposeInMainWorld('toplanti', toplanti)

export type AjansAPI = typeof ajans
export type ToplantiAPI = typeof toplanti
