// Ana surec ile arayuz arasinda paylasilan tipler.

export type DepartmentId =
  | 'sistem'
  | 'backend'
  | 'frontend'
  | 'kalite'
  | 'veri'
  | 'seo'
  | 'tasarim'
  | 'guvenlik'

export type AgentRole = 'mudur' | 'lider' | 'uzman' | 'denetci'

/** Kadrodaki tek bir ajanin tanimi. */
export interface AgentSpec {
  /** Agent SDK'da kullanilan benzersiz anahtar, or. "lider-backend" */
  key: string
  role: AgentRole
  department?: DepartmentId
  /** Panelde gorunen ad, or. "Backend Lideri" */
  title: string
  /** Ajanin uzmanlik ozeti; mudur ve liderler gorev dagitirken bunu okur. */
  expertise: string
  /** Agent SDK'ya verilen sistem promptu. */
  prompt: string
  tools: string[]
  model: 'opus' | 'sonnet' | 'haiku'
  effort: 'low' | 'medium' | 'high'
}

export interface Department {
  id: DepartmentId
  title: string
  /** Departmanin hangi islerde devreye girdigi; mudur bunu okuyup secim yapar. */
  scope: string
  leadKey: string
  specialistKeys: string[]
}

// ---------------------------------------------------------------- giris

export interface AuthStatus {
  /** Makinede acik bir Claude oturumu var mi? */
  ready: boolean
  /** Kullaniciya gosterilecek aciklama. */
  detail: string
}

// ---------------------------------------------------------------- kurulum

export interface SetupCheck {
  id: string
  label: string
  state: 'bekliyor' | 'kontrol' | 'tamam' | 'hata'
  detail: string
}

// ---------------------------------------------------------------- gorev

export type TaskState = 'bekleyen' | 'atandi' | 'devam' | 'denetimde' | 'tamam' | 'hata'

export interface TaskCard {
  id: string
  title: string
  department: DepartmentId | null
  assignee: string
  state: TaskState
  startedAt: number
  endedAt?: number
}

export interface Brief {
  text: string
  /** Ajansin uzerinde calisacagi klasor. */
  workspace: string
}

// ---------------------------------------------------------------- canli olaylar

export type AgencyEventKind =
  | 'oturum-basladi'
  | 'ajan-basladi'
  | 'ajan-bitti'
  | 'ajan-konustu'
  | 'arac-cagrildi'
  | 'dosya-degisti'
  | 'gorev-guncellendi'
  | 'tur-bitti'
  | 'kullanici-mesaji'
  | 'maliyet'
  | 'onay-gerekli'
  | 'oturum-bitti'
  | 'hata'

export interface AgencyEvent {
  id: string
  kind: AgencyEventKind
  /** Olayi ureten ajanin anahtari; sistem olaylarinda "sistem". */
  agentKey: string
  text: string
  at: number
  meta?: Record<string, unknown>
}

export interface RunSummary {
  ok: boolean
  subtype: string
  costUsd: number
  durationMs: number
  result: string
}

/** Riskli bir is icin kullaniciya gosterilen onay istegi. */
export interface OnayIstegi {
  id: string
  agentKey: string
  tool: string
  ozet: string
}

// ---------------------------------------------------------------- ajans durumu

export type AjanDurum = 'calisiyor' | 'bitti' | 'hata'

/** Bir ajanin bu calismadaki karnesi; olay akisindan turetilir. */
export interface AjanKaydi {
  key: string
  durum: AjanDurum
  /** Bu ajani goreve cagiran ajanin anahtari. */
  atayan: string
  gorev: string
  basladi: number
  bitti?: number
  sureMs?: number
  tokenler?: number
  aracSayisi?: number
  okuma?: number
  duzenleme?: number
  eklenenSatir?: number
  silinenSatir?: number
  /** Ajanin bitirirken verdigi ozet. */
  rapor?: string
}

export type DosyaIslem = 'olusturuldu' | 'duzenlendi'

/** Calisma sirasinda uretilen veya degistirilen dosya. */
export interface Teslimat {
  yol: string
  ad: string
  islem: DosyaIslem
  ajan: string
  at: number
}

/** Uygulamanin acilislar arasinda hatirladigi tercihler. */
export interface Ayarlar {
  sonKlasor: string
  /** En son kullanilan calisma alanlari, yeniden eskiye. */
  klasorGecmisi: string[]
  /**
   * Tam yetki: acikken ajanlar riskli komutlari sormadan calistirir.
   * Kapaliyken calisma alani disina yazma ve tehlikeli komutlar sana sorulur.
   */
  tamYetki: boolean
  /** Ust cubukta ve karsilamada gorunen ad. */
  kullaniciAdi: string
}

/** Bir ajanin birikmis bilgisi. */
export interface HafizaKaydi {
  ajanKey: string
  metin: string
  boyut: number
  guncellendi: number
}

/** Diske yazilan tam calisma kaydi. */
export interface CalismaKaydi {
  id: string
  workspace: string
  brief: string
  egitim: boolean
  basladi: number
  bitti: number
  ozet: RunSummary
  olaylar: AgencyEvent[]
  dosyalar: string[]
  ajanSayisi: number
}

/** Listelerde gosterilen hafif ozet. */
export interface CalismaOzeti {
  id: string
  workspace: string
  brief: string
  basladi: number
  bitti: number
  egitim: boolean
  ok: boolean
  costUsd: number
  olaySayisi: number
  dosyaSayisi: number
  ajanSayisi: number
}

/** Mudurle yapilan toplantidaki tek bir soz. */
export interface ToplantiMesaji {
  id: string
  kim: 'sen' | 'mudur'
  metin: string
  at: number
}
