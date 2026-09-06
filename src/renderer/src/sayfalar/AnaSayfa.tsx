import { CheckCircle2, ChevronRight, FolderOpen, Layers, ShieldCheck, ShieldAlert, Users } from 'lucide-react'
import type { AjansDurumu } from '../ajansDurumu'
import { ajanAdi } from '../ajansDurumu'
import { gorunumAl } from '../departmanMeta'
import OfisGorunumu from '../bilesenler/OfisGorunumu'
import type { AgencyEvent, Department } from '../../../shared/types'

interface Props {
  departmanlar: Department[]
  ajanSayisi: number
  ajans: AjansDurumu
  olaylar: AgencyEvent[]
  hazir: boolean
  tamYetki: boolean
  onTamYetki: (deger: boolean) => void
  onDepartmanlar: () => void
}

/** Kadrodaki bir departmanin o anki durumu. */
interface DepartmanDurum {
  id: string
  ad: string
  toplam: number
  calisan: number
  takilan: number
  hazir: number
}

function departmanDurumlari(
  departmanlar: Department[],
  ajans: AjansDurumu,
  hazirMi: boolean
): DepartmanDurum[] {
  return departmanlar.map((d) => {
    const uyeler = [d.leadKey, ...d.specialistKeys]
    const kayitlar = uyeler.map((k) => ajans.ajanlar.find((a) => a.key === k))
    const calisan = kayitlar.filter((a) => a?.durum === 'calisiyor').length
    const takilan = kayitlar.filter((a) => a?.durum === 'hata').length
    return {
      id: d.id,
      ad: gorunumAl(d.id).ad,
      toplam: uyeler.length,
      calisan,
      takilan,
      hazir: hazirMi ? uyeler.length - takilan : 0
    }
  })
}

function zamanFarki(at: number): string {
  const dk = Math.floor((Date.now() - at) / 60000)
  if (dk < 1) return 'az önce'
  if (dk < 60) return `${dk} dk önce`
  return `${Math.floor(dk / 60)} sa önce`
}

/** Sag paneldeki halka grafik. */
function Halka({
  toplam,
  calisan,
  takilan,
  hazir
}: {
  toplam: number
  calisan: number
  takilan: number
  hazir: number
}): React.JSX.Element {
  const r = 45
  const cevre = 2 * Math.PI * r
  const guvenli = Math.max(toplam, 1)
  const dilimler = [
    { deger: calisan, renk: 'var(--mavi-acik)' },
    { deger: takilan, renk: 'var(--kirmizi)' },
    { deger: Math.max(hazir - calisan, 0), renk: 'var(--yesil)' }
  ]

  let kayma = 0
  return (
    <div className="halka-sarmal">
      <svg width="114" height="114" viewBox="0 0 114 114">
        <circle cx="57" cy="57" r={r} fill="none" stroke="var(--cizgi)" strokeWidth="12" />
        {dilimler.map((d, i) => {
          const uzunluk = (d.deger / guvenli) * cevre
          const daire = (
            <circle
              key={i}
              cx="57"
              cy="57"
              r={r}
              fill="none"
              stroke={d.renk}
              strokeWidth="12"
              strokeDasharray={`${uzunluk} ${cevre - uzunluk}`}
              strokeDashoffset={-kayma}
              transform="rotate(-90 57 57)"
              strokeLinecap="butt"
            />
          )
          kayma += uzunluk
          return daire
        })}
      </svg>
      <div className="halka-orta">
        <b>{toplam}</b>
        <span>Toplam Çalışan</span>
      </div>
    </div>
  )
}

export default function AnaSayfa({
  departmanlar,
  ajanSayisi,
  ajans,
  olaylar,
  hazir,
  tamYetki,
  onTamYetki,
  onDepartmanlar
}: Props): React.JSX.Element {
  const durumlar = departmanDurumlari(departmanlar, ajans, hazir)
  const calisan = ajans.ajanlar.filter((a) => a.durum === 'calisiyor').length
  const takilan = ajans.ajanlar.filter((a) => a.durum === 'hata').length
  const hazirSayi = hazir ? ajanSayisi - takilan : 0
  const bitenGorev = ajans.ajanlar.filter((a) => a.durum === 'bitti').length

  const sonAktiviteler = [...olaylar]
    .filter((o) => o.kind === 'ajan-bitti' || o.kind === 'ajan-basladi' || o.kind === 'dosya-degisti')
    .slice(-6)
    .reverse()

  const olcuKartlari = [
    {
      ad: 'Toplam Çalışan',
      deger: ajanSayisi,
      alt: hazir ? `${hazirSayi} hazır` : 'bağlantı yok',
      Ikon: Users,
      renk: 'var(--mavi-acik)'
    },
    {
      ad: 'Departman',
      deger: departmanlar.length,
      alt: 'Tüm departmanlar aktif',
      Ikon: Layers,
      renk: 'var(--mor)'
    },
    {
      ad: 'Üretilen Dosya',
      deger: ajans.teslimatlar.length,
      alt: ajans.teslimatlar.length > 0 ? 'bu oturumda' : 'henüz yok',
      Ikon: FolderOpen,
      renk: 'var(--amber)'
    },
    {
      ad: 'Tamamlanan Görev',
      deger: bitenGorev,
      alt: calisan > 0 ? `${calisan} görev sürüyor` : 'sıra boş',
      Ikon: CheckCircle2,
      renk: 'var(--yesil)'
    }
  ]

  return (
    <div className="icerik-panelli">
      <div className="ana-sol">
        <div className="karsilama">
          <div>
            <h1>
              Hoş geldin, <em>Ajans Sahibi</em>
            </h1>
            <p>
              {hazir
                ? `${ajanSayisi} ajan göreve hazır. ${calisan > 0 ? `${calisan} ajan şu an çalışıyor.` : 'Yeni bir brief bekleniyor.'}`
                : 'Claude oturumu bulunamadı. Ayarlar sayfasından kontrol et.'}
            </p>
          </div>
          <div className="filtreler">
            <span className="rozet">
              <span className="nokta" style={{ background: 'var(--mavi-acik)' }} />
              Tümü {ajanSayisi}
            </span>
            <span className="rozet iyi">
              <span className="nokta" />
              Hazır {hazirSayi}
            </span>
            <span className="rozet">
              <span className="nokta" style={{ background: 'var(--mavi-acik)' }} />
              Çalışan {calisan}
            </span>
            <span className={takilan > 0 ? 'rozet kotu' : 'rozet'}>
              <span className="nokta" />
              Takılan {takilan}
            </span>
          </div>
        </div>

        <div className="olcu-izgara">
          {olcuKartlari.map((k) => (
            <div key={k.ad} className="kutu olcu-kart">
              <span className="olcu-ikon" style={{ color: k.renk, borderColor: k.renk }}>
                <k.Ikon size={18} />
              </span>
              <span className="olcu-metin">
                <span className="olcu-ad">{k.ad}</span>
                <b className="olcu-deger">{k.deger}</b>
                <span className="olcu-alt">{k.alt}</span>
              </span>
            </div>
          ))}
        </div>

        <OfisGorunumu
          departmanlar={departmanlar}
          ajans={ajans}
          hazir={hazir}
          onDepartman={onDepartmanlar}
        />

        <section className="kutu">
          <div className="kutu-baslik">
            <h3>Departmanlar</h3>
            <button type="button" className="bag" onClick={onDepartmanlar}>
              Tümünü Gör <ChevronRight size={13} />
            </button>
          </div>
          <div className="kutu-govde">
            <div className="departman-izgara">
              {durumlar.map((d) => {
                const g = gorunumAl(d.id)
                return (
                  <div key={d.id} className="departman-kart">
                    <div className="departman-tepe">
                      <span className="departman-ikon" style={{ color: g.renk }}>
                        <g.Ikon size={15} />
                      </span>
                      <span className="departman-ad">
                        <b>{d.ad}</b>
                        <span>{d.toplam} Çalışan</span>
                      </span>
                    </div>
                    <ul className="departman-sayaclar">
                      <li>
                        <span className="nokta" style={{ background: 'var(--yesil)' }} />
                        {d.hazir} Hazır
                      </li>
                      <li>
                        <span className="nokta" style={{ background: 'var(--mavi-acik)' }} />
                        {d.calisan} Çalışan
                      </li>
                      <li>
                        <span className="nokta" style={{ background: 'var(--kirmizi)' }} />
                        {d.takilan} Takılan
                      </li>
                    </ul>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      </div>

      <aside className="ana-sag">
        <section className={tamYetki ? 'kutu yetki yetki-acik' : 'kutu yetki'}>
          <div className="kutu-baslik">
            <h3>Yetki</h3>
            <span className={tamYetki ? 'rozet kotu' : 'rozet iyi'}>
              <span className="nokta" />
              {tamYetki ? 'tam yetki' : 'onay isteniyor'}
            </span>
          </div>
          <div className="kutu-govde yetki-govde">
            <span className="yetki-ikon" style={{ color: tamYetki ? 'var(--amber)' : 'var(--yesil)' }}>
              {tamYetki ? <ShieldAlert size={19} /> : <ShieldCheck size={19} />}
            </span>
            <p className="ipucu">
              {tamYetki
                ? 'Ajanlar tehlikeli komutları ve çalışma alanı dışına yazmayı sana sormadan yapar.'
                : 'Tehlikeli komutlar ve çalışma alanı dışına yazma girişimleri sana sorulur.'}
            </p>
            <button
              type="button"
              role="switch"
              aria-checked={tamYetki}
              className={tamYetki ? 'anahtar acik' : 'anahtar'}
              onClick={() => onTamYetki(!tamYetki)}
            >
              <span className="anahtar-yuva">
                <span className="anahtar-top" />
              </span>
              {tamYetki ? 'Tam yetki açık' : 'Tam yetki kapalı'}
            </button>
          </div>
        </section>

        <section className="kutu">
          <div className="kutu-baslik">
            <h3>Çalışan Durumları</h3>
          </div>
          <div className="kutu-govde halka-govde">
            <Halka toplam={ajanSayisi} calisan={calisan} takilan={takilan} hazir={hazirSayi} />
            <ul className="halka-liste">
              <li>
                <span className="nokta" style={{ background: 'var(--yesil)' }} />
                Hazır <b>{Math.max(hazirSayi - calisan, 0)}</b>
              </li>
              <li>
                <span className="nokta" style={{ background: 'var(--mavi-acik)' }} />
                Çalışan <b>{calisan}</b>
              </li>
              <li>
                <span className="nokta" style={{ background: 'var(--kirmizi)' }} />
                Takılan <b>{takilan}</b>
              </li>
            </ul>
          </div>
        </section>

        <section className="kutu">
          <div className="kutu-baslik">
            <h3>Departman Dağılımı</h3>
          </div>
          <div className="kutu-govde">
            <ul className="dagilim">
              {durumlar.map((d) => {
                const g = gorunumAl(d.id)
                return (
                  <li key={d.id}>
                    <span className="departman-ikon" style={{ color: g.renk }}>
                      <g.Ikon size={14} />
                    </span>
                    <span className="dagilim-ad">{d.ad}</span>
                    <span className="dagilim-sayi">
                      {d.hazir}/{d.toplam}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        </section>

        <section className="kutu">
          <div className="kutu-baslik">
            <h3>Son Aktiviteler</h3>
          </div>
          <div className="kutu-govde">
            {sonAktiviteler.length === 0 ? (
              <p className="bos">Henüz aktivite yok.</p>
            ) : (
              <ul className="aktivite">
                {sonAktiviteler.map((o) => {
                  const g = gorunumAl(o.agentKey.split('-')[1] ?? '')
                  return (
                    <li key={o.id}>
                      <span className="departman-ikon" style={{ color: g.renk }}>
                        <g.Ikon size={14} />
                      </span>
                      <span className="aktivite-metin">
                        <b>{ajanAdi(o.agentKey)}</b>
                        <span>
                          {o.kind === 'ajan-basladi'
                            ? 'göreve başladı'
                            : o.kind === 'ajan-bitti'
                              ? 'görevini tamamladı'
                              : `dosya ${o.meta?.islem ?? 'değişti'}`}
                        </span>
                      </span>
                      <time>{zamanFarki(o.at)}</time>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </section>
      </aside>
    </div>
  )
}
