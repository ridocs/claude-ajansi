import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  AgencyEvent,
  AgentSpec,
  AuthStatus,
  Department,
  OnayIstegi,
  RunSummary,
  SetupCheck
} from '../../shared/types'
import { ajansDurumuHesapla } from './ajansDurumu'
import AramaPaleti from './bilesenler/AramaPaleti'
import OnayKutusu from './components/OnayKutusu'
import AltCubuk from './kabuk/AltCubuk'
import UstCubuk from './kabuk/UstCubuk'
import YanCubuk, { type Sayfa } from './kabuk/YanCubuk'
import type { OturumHali } from './sayfalar/KomutMerkezi'
import AnaSayfa from './sayfalar/AnaSayfa'
import Ayarlar from './sayfalar/Ayarlar'
import Dosyalar from './sayfalar/Dosyalar'
import Ekip from './sayfalar/Ekip'
import Gecmis from './sayfalar/Gecmis'
import Hafiza from './sayfalar/Hafiza'
import Gorevler from './sayfalar/Gorevler'
import KomutMerkezi from './sayfalar/KomutMerkezi'
import Ofis from './sayfalar/Ofis'
import Projeler from './sayfalar/Projeler'
import Raporlar from './sayfalar/Raporlar'
import Toplantilar from './sayfalar/Toplantilar'

const SURUM = '1.0.0'

export default function App(): React.JSX.Element {
  const [sayfa, setSayfa] = useState<Sayfa>('ana')

  const [durum, setDurum] = useState<AuthStatus | null>(null)
  const [kontroller, setKontroller] = useState<SetupCheck[]>([])
  const [departmanlar, setDepartmanlar] = useState<Department[]>([])
  const [ajanSayisi, setAjanSayisi] = useState(0)

  const [klasor, setKlasor] = useState<string>('')
  const [tamYetki, setTamYetki] = useState(false)
  const [kullaniciAdi, setKullaniciAdi] = useState('Ajans Sahibi')
  const [aramaAcik, setAramaAcik] = useState(false)
  const [kadro, setKadro] = useState<AgentSpec[]>([])
  const [olaylar, setOlaylar] = useState<AgencyEvent[]>([])
  const [hal, setHal] = useState<OturumHali>('bosta')
  const [ozet, setOzet] = useState<RunSummary | null>(null)
  const [onay, setOnay] = useState<OnayIstegi | null>(null)

  // Aynı anda birden çok onay gelirse sırayla gösterilir.
  const onayKuyrugu = useRef<OnayIstegi[]>([])

  // Bütün canlı görünümler tek bir türetilmiş durumdan beslenir.
  const ajans = useMemo(() => ajansDurumuHesapla(olaylar), [olaylar])

  const yenile = useCallback(async () => {
    const [d, k, kadro] = await Promise.all([
      window.ajans.durum(),
      window.ajans.kontroller(),
      window.ajans.kadro()
    ])
    setDurum(d)
    setKontroller(k)
    setDepartmanlar(kadro.departments)
    setKadro(kadro.agents)
    setAjanSayisi(kadro.agents.length + 1)
    return d
  }, [])

  useEffect(() => {
    void (async () => {
      await yenile()
      const ayarlar = await window.ajans.ayarlar()
      if (ayarlar.sonKlasor) setKlasor(ayarlar.sonKlasor)
      setTamYetki(ayarlar.tamYetki)
      setKullaniciAdi(ayarlar.kullaniciAdi)
    })()
  }, [yenile])

  useEffect(() => {
    return window.ajans.olaylariDinle((olay) => {
      setOlaylar((oncekiler) => [...oncekiler, olay])
      if (olay.kind === 'tur-bitti') setHal('bekliyor')
      if (olay.kind === 'kullanici-mesaji') setHal('calisiyor')
    })
  }, [])

  useEffect(() => {
    return window.ajans.bitisiDinle((sonuc) => {
      setOzet(sonuc)
      setHal('bosta')
    })
  }, [])

  useEffect(() => {
    return window.ajans.onaylariDinle((istek) => {
      setOnay((mevcut) => {
        if (mevcut) {
          onayKuyrugu.current.push(istek)
          return mevcut
        }
        return istek
      })
    })
  }, [])

  // Ctrl+K arama paletini acar.
  useEffect(() => {
    const tus = (e: KeyboardEvent): void => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setAramaAcik(true)
      }
    }
    window.addEventListener('keydown', tus)
    return () => window.removeEventListener('keydown', tus)
  }, [])

  const onayCevapla = useCallback((izin: boolean) => {
    setOnay((mevcut) => {
      if (mevcut) window.ajans.onayCevapla(mevcut.id, izin)
      return onayKuyrugu.current.shift() ?? null
    })
  }, [])

  const klasorSec = useCallback(async () => {
    const secilen = await window.ajans.klasorSec()
    if (secilen) setKlasor(secilen)
  }, [])

  const briefGonder = useCallback(
    async (metin: string) => {
      setOlaylar([])
      setOzet(null)
      setHal('calisiyor')
      const cevap = await window.ajans.briefCalistir({ text: metin, workspace: klasor })
      if (!cevap.ok) {
        setHal('bosta')
        setOzet({
          ok: false,
          subtype: 'baslatilamadi',
          costUsd: 0,
          durationMs: 0,
          result: cevap.detail
        })
      }
    },
    [klasor]
  )

  const mesajGonder = useCallback(async (metin: string) => {
    setHal('calisiyor')
    await window.ajans.mesajGonder(metin)
  }, [])

  const klasorKullan = useCallback(async (yol: string) => {
    await window.ajans.klasorKullan(yol)
    setKlasor(yol)
  }, [])

  const tamYetkiDegis = useCallback((deger: boolean) => {
    setTamYetki(deger)
    void window.ajans.ayarYaz({ tamYetki: deger })
  }, [])

  const egit = useCallback(async () => {
    setOlaylar([])
    setOzet(null)
    setHal('calisiyor')
    const cevap = await window.ajans.egit(klasor)
    if (!cevap.ok) {
      setHal('bosta')
      setOzet({
        ok: false,
        subtype: 'baslatilamadi',
        costUsd: 0,
        durationMs: 0,
        result: cevap.detail
      })
    } else {
      setSayfa('komut')
    }
  }, [klasor])

  /** Denetim: mudur klasoru ogrenir, ekip test eder, eksikler kapanir. */
  const denetle = useCallback(async () => {
    setOlaylar([])
    setOzet(null)
    setHal('calisiyor')
    const cevap = await window.ajans.denetle(klasor)
    if (!cevap.ok) {
      setHal('bosta')
      setOzet({
        ok: false,
        subtype: 'baslatilamadi',
        costUsd: 0,
        durationMs: 0,
        result: cevap.detail
      })
    } else {
      setSayfa('komut')
    }
  }, [klasor])

  const durdur = useCallback(() => void window.ajans.durdur(), [])
  const oturumuKapat = useCallback(() => void window.ajans.oturumuKapat(), [])

  const hazir = durum?.ready === true
  const calisan = ajans.ajanlar.filter((a) => a.durum === 'calisiyor').length
  const bitenGorev = ajans.ajanlar.filter((a) => a.durum === 'bitti').length

  const sayfaIcerigi = (): React.JSX.Element => {
    switch (sayfa) {
      case 'ana':
        return (
          <AnaSayfa
            departmanlar={departmanlar}
            ajanSayisi={ajanSayisi}
            ajans={ajans}
            olaylar={olaylar}
            hazir={hazir}
            tamYetki={tamYetki}
            onTamYetki={tamYetkiDegis}
            onDepartmanlar={() => setSayfa('ekip')}
          />
        )
      case 'komut':
        return (
          <KomutMerkezi
            klasor={klasor}
            hal={hal}
            ozet={ozet}
            olaylar={olaylar}
            ajans={ajans}
            onKlasorSec={klasorSec}
            onGonder={briefGonder}
            onMesaj={mesajGonder}
            onDurdur={durdur}
            onKapat={oturumuKapat}
          />
        )
      case 'gorevler':
        return <Gorevler ajanlar={ajans.ajanlar} />
      case 'dosyalar':
        return <Dosyalar teslimatlar={ajans.teslimatlar} klasor={klasor} />
      case 'ofis':
        return (
          <Ofis
            departmanlar={departmanlar}
            ajans={ajans}
            hazir={hazir}
            onEkip={() => setSayfa('ekip')}
          />
        )
      case 'projeler':
        return (
          <Projeler
            klasor={klasor}
            calisiyor={hal !== 'bosta'}
            onKlasorSec={klasorSec}
            onKlasorKullan={(y) => void klasorKullan(y)}
            onBaslat={async (brief) => {
              setSayfa('komut')
              await briefGonder(brief)
            }}
            onDenetle={denetle}
          />
        )
      case 'raporlar':
        return (
          <Raporlar
            departmanlar={departmanlar}
            ajans={ajans}
            onKomut={() => setSayfa('komut')}
          />
        )
      case 'toplantilar':
        return <Toplantilar olaylar={olaylar} onKomut={() => setSayfa('komut')} />
      case 'gecmis':
        return <Gecmis klasor={klasor} calisiyor={hal !== 'bosta'} />
      case 'hafiza':
        return (
          <Hafiza
            departmanlar={departmanlar}
            klasor={klasor}
            calisiyor={hal !== 'bosta'}
            hazir={hazir}
            onEgit={egit}
          />
        )
      case 'ekip':
        return (
          <Ekip
            departmanlar={departmanlar}
            ajans={ajans}
            hazir={hazir}
            klasor={klasor}
            calisiyor={hal !== 'bosta'}
            onEgit={egit}
          />
        )
      case 'ayarlar':
        return (
          <Ayarlar
            durum={durum}
            kontroller={kontroller}
            klasor={klasor}
            tamYetki={tamYetki}
            kullaniciAdi={kullaniciAdi}
            onTamYetki={tamYetkiDegis}
            onKullaniciAdi={(ad: string) => {
              setKullaniciAdi(ad)
              void window.ajans.ayarYaz({ kullaniciAdi: ad })
            }}
            onKlasorSec={klasorSec}
            onYenile={yenile}
          />
        )
      default:
        return (
          <Ofis
            departmanlar={departmanlar}
            ajans={ajans}
            hazir={hazir}
            onEkip={() => setSayfa('ekip')}
          />
        )
    }
  }

  return (
    <div className="uygulama">
      <YanCubuk sayfa={sayfa} onSayfa={setSayfa} surum={SURUM} />

      <div className="govde">
        <UstCubuk
          hazir={hazir}
          calisiyor={hal === 'calisiyor'}
          kullaniciAdi={kullaniciAdi}
          onAyarlar={() => setSayfa('ayarlar')}
          onArama={() => setAramaAcik(true)}
        />
        <main className="icerik">{sayfaIcerigi()}</main>
      </div>

      <AltCubuk
        surum={SURUM}
        ajanSayisi={ajanSayisi}
        departmanSayisi={departmanlar.length}
        aktifAjan={hazir ? ajanSayisi : 0}
        bitenGorev={bitenGorev}
        dosyaSayisi={ajans.teslimatlar.length}
        hazir={hazir}
        onYeniGorev={() => setSayfa('komut')}
        onAyarlar={() => setSayfa('ayarlar')}
      />

      <AramaPaleti
        acik={aramaAcik}
        kadro={kadro}
        teslimatlar={ajans.teslimatlar}
        onKapat={() => setAramaAcik(false)}
        onSayfa={setSayfa}
        onDosya={(y) => void window.ajans.dosyaAc(y)}
      />

      {onay && <OnayKutusu istek={onay} onCevap={onayCevapla} />}
    </div>
  )
}
