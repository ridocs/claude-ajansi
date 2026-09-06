import {
  Globe,
  LayoutDashboard,
  Server,
  Smartphone,
  MonitorSmartphone,
  Bot,
  type LucideIcon
} from 'lucide-react'

/**
 * Hazir proje sablonlari.
 *
 * Her sablon mudure verilecek briefi tasir. Brief kabul kriterlerini acikca
 * sayar; mudur zaten teslimati bu maddelere karsi denetliyor.
 */
export interface ProjeSablonu {
  id: string
  ad: string
  ozet: string
  Ikon: LucideIcon
  renk: string
  /** Kullanicinin doldurdugu konu brief'e eklenir. */
  brief: (konu: string) => string
}

const ORTAK_SON = [
  '',
  'Kabul kriterleri:',
  '- Proje bu klasörde çalışır durumda olacak; eksik dosya bırakılmayacak.',
  '- Bağımlılıklar kurulabilir olacak ve nasıl çalıştırılacağı README’de yazacak.',
  '- Testler yazılacak ve çalıştırılıp sonucu raporlanacak.',
  '- Teslimattan önce müdür dosyaları kendi açıp kontrol edecek.'
].join('\n')

export const PROJE_SABLONLARI: ProjeSablonu[] = [
  {
    id: 'web',
    ad: 'Web Sitesi',
    ozet: 'Tanıtım veya kurumsal site; duyarlı tasarım, erişilebilirlik ve SEO dahil.',
    Ikon: Globe,
    renk: 'var(--mavi-acik)',
    brief: (konu) =>
      [
        `Bu klasörde bir web sitesi kur. Konu: ${konu}`,
        '',
        'Beklenenler:',
        '- Modern, duyarlı (mobil dahil) ve erişilebilir bir arayüz.',
        '- Anlamlı sayfa yapısı, gerçek içerik; yer tutucu metin bırakma.',
        '- Temel SEO: başlıklar, meta açıklama, anlamlı HTML.',
        '- Frontend, Tasarım ve SEO departmanları birlikte çalışsın.',
        ORTAK_SON
      ].join('\n')
  },
  {
    id: 'panel',
    ad: 'Yönetim Paneli',
    ozet: 'Veri gösteren, filtrelenebilen bir arayüz; grafikler ve tablolar.',
    Ikon: LayoutDashboard,
    renk: 'var(--mor)',
    brief: (konu) =>
      [
        `Bu klasörde bir yönetim paneli kur. Konu: ${konu}`,
        '',
        'Beklenenler:',
        '- Özet kartları, filtrelenebilir tablo ve en az bir grafik.',
        '- Örnek veri üret; panel boş açılmasın.',
        '- Frontend, Tasarım ve Veri departmanları birlikte çalışsın.',
        ORTAK_SON
      ].join('\n')
  },
  {
    id: 'api',
    ad: 'REST API',
    ozet: 'Uç noktalar, girdi doğrulama, hata yönetimi ve testler.',
    Ikon: Server,
    renk: 'var(--kirmizi)',
    brief: (konu) =>
      [
        `Bu klasörde bir REST API kur. Konu: ${konu}`,
        '',
        'Beklenenler:',
        '- CRUD uç noktaları, girdi doğrulama ve anlamlı hata yanıtları.',
        '- Çalışır bir sunucu dosyası ve bağımlılık tanımı.',
        '- Backend ve Kalite departmanları birlikte çalışsın.',
        ORTAK_SON
      ].join('\n')
  },
  {
    id: 'mobil',
    ad: 'Mobil Uygulama',
    ozet: 'React Native tabanlı, iki platformda çalışan uygulama.',
    Ikon: Smartphone,
    renk: 'var(--yesil)',
    brief: (konu) =>
      [
        `Bu klasörde bir mobil uygulama kur. Konu: ${konu}`,
        '',
        'Beklenenler:',
        '- React Native (Expo) kullan; hem Android hem iOS için çalışsın.',
        '- En az üç ekran ve aralarında gezinme.',
        '- Nasıl çalıştırılacağı README’de adım adım yazsın.',
        '- Frontend, Tasarım ve Kalite departmanları birlikte çalışsın.',
        ORTAK_SON
      ].join('\n')
  },
  {
    id: 'masaustu',
    ad: 'Masaüstü / Cross-platform',
    ozet: 'Electron veya Tauri ile Windows, macOS ve Linux’ta çalışan uygulama.',
    Ikon: MonitorSmartphone,
    renk: 'var(--amber)',
    brief: (konu) =>
      [
        `Bu klasörde bir masaüstü uygulaması kur. Konu: ${konu}`,
        '',
        'Beklenenler:',
        '- Electron kullan; Windows, macOS ve Linux’ta derlenebilsin.',
        '- Çalışan bir pencere, gerçek bir işlev ve kalıcı ayar.',
        '- Sistem, Frontend ve Kalite departmanları birlikte çalışsın.',
        ORTAK_SON
      ].join('\n')
  },
  {
    id: 'otomasyon',
    ad: 'Otomasyon / Betik',
    ozet: 'Bir işi otomatikleştiren komut satırı aracı.',
    Ikon: Bot,
    renk: 'var(--turkuaz)',
    brief: (konu) =>
      [
        `Bu klasörde bir otomasyon aracı kur. Konu: ${konu}`,
        '',
        'Beklenenler:',
        '- Komut satırından çalışan, parametre alan bir araç.',
        '- Hata durumunda anlamlı mesaj ve doğru çıkış kodu.',
        '- Sistem ve Kalite departmanları birlikte çalışsın.',
        ORTAK_SON
      ].join('\n')
  }
]
