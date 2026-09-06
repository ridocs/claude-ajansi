import type { Department } from '../../../shared/types'
import { ajanAdi, type AjansDurumu } from '../ajansDurumu'
import { gorunumAl } from '../departmanMeta'

interface Props {
  departmanlar: Department[]
  ajans: AjansDurumu
  onKomut: () => void
}

function sure(ms: number): string {
  if (!ms) return '—'
  const sn = Math.round(ms / 1000)
  return sn < 60 ? `${sn} sn` : `${Math.floor(sn / 60)} dk ${sn % 60} sn`
}

/** Yatay oran cubugu; en yuksek degere gore olceklenir. */
function Cubuk({ oran, renk }: { oran: number; renk: string }): React.JSX.Element {
  return (
    <span className="cubuk">
      <span className="cubuk-dolu" style={{ width: `${Math.max(oran * 100, 2)}%`, background: renk }} />
    </span>
  )
}

export default function Raporlar({ departmanlar, ajans, onKomut }: Props): React.JSX.Element {
  const calismislar = ajans.ajanlar.filter((a) => a.durum === 'bitti' || a.durum === 'hata')

  if (calismislar.length === 0) {
    return (
      <section className="kutu">
        <div className="kutu-govde yakinda">
          <h3>Henüz raporlanacak iş yok</h3>
          <p>
            Ajans bir görevi tamamladığında burada kim ne kadar iş yaptı, ne kadar sürdü ve kaç
            token harcandı görebilirsin.
          </p>
          <button type="button" className="dugme dugme-birincil" onClick={onKomut}>
            Komut Merkezi&apos;ne git
          </button>
        </div>
      </section>
    )
  }

  // Departman bazlı toplamlar
  const departmanOzet = departmanlar
    .map((d) => {
      const uyeler = [d.leadKey, ...d.specialistKeys]
      const kayitlar = ajans.ajanlar.filter((a) => uyeler.includes(a.key))
      return {
        id: d.id,
        ad: gorunumAl(d.id).ad,
        renk: gorunumAl(d.id).renk,
        gorev: kayitlar.filter((a) => a.durum === 'bitti').length,
        tokenler: kayitlar.reduce((t, a) => t + (a.tokenler ?? 0), 0),
        arac: kayitlar.reduce((t, a) => t + (a.aracSayisi ?? 0), 0),
        satir: kayitlar.reduce((t, a) => t + (a.eklenenSatir ?? 0), 0)
      }
    })
    .filter((d) => d.gorev > 0 || d.tokenler > 0)
    .sort((a, b) => b.tokenler - a.tokenler)

  const enYuksekToken = Math.max(...departmanOzet.map((d) => d.tokenler), 1)

  const enCokCalisan = [...calismislar]
    .sort((a, b) => (b.tokenler ?? 0) - (a.tokenler ?? 0))
    .slice(0, 10)

  const toplamSatir = calismislar.reduce((t, a) => t + (a.eklenenSatir ?? 0), 0)
  const toplamArac = calismislar.reduce((t, a) => t + (a.aracSayisi ?? 0), 0)

  return (
    <div className="raporlar">
      <div className="olcu-izgara">
        <div className="kutu olcu-kart">
          <span className="olcu-metin">
            <span className="olcu-ad">Tamamlanan görev</span>
            <b className="olcu-deger">{calismislar.filter((a) => a.durum === 'bitti').length}</b>
            <span className="olcu-alt">{calismislar.length} ajan çalıştı</span>
          </span>
        </div>
        <div className="kutu olcu-kart">
          <span className="olcu-metin">
            <span className="olcu-ad">İşlenen token</span>
            <b className="olcu-deger">{ajans.toplamToken.toLocaleString('tr-TR')}</b>
            <span className="olcu-alt">tüm ajanlar</span>
          </span>
        </div>
        <div className="kutu olcu-kart">
          <span className="olcu-metin">
            <span className="olcu-ad">Araç çağrısı</span>
            <b className="olcu-deger">{toplamArac}</b>
            <span className="olcu-alt">okuma, yazma, komut</span>
          </span>
        </div>
        <div className="kutu olcu-kart">
          <span className="olcu-metin">
            <span className="olcu-ad">Eklenen satır</span>
            <b className="olcu-deger">{toplamSatir}</b>
            <span className="olcu-alt">{ajans.teslimatlar.length} dosyada</span>
          </span>
        </div>
      </div>

      <section className="kutu">
        <div className="kutu-baslik">
          <h3>Departman Yükü</h3>
          <span className="bag">işlenen token</span>
        </div>
        <div className="kutu-govde">
          <ul className="yuk-liste">
            {departmanOzet.map((d) => (
              <li key={d.id}>
                <span className="yuk-ad">{d.ad}</span>
                <Cubuk oran={d.tokenler / enYuksekToken} renk={d.renk} />
                <span className="yuk-sayi">{d.tokenler.toLocaleString('tr-TR')}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="kutu">
        <div className="kutu-baslik">
          <h3>Ajan Karnesi</h3>
          <span className="bag">en çok çalışan {enCokCalisan.length}</span>
        </div>
        <div className="kutu-govde">
          <div className="tablo-sarmal">
            <table className="tablo">
              <thead>
                <tr>
                  <th>Ajan</th>
                  <th>Durum</th>
                  <th className="sag">Süre</th>
                  <th className="sag">Araç</th>
                  <th className="sag">Token</th>
                  <th className="sag">Satır</th>
                </tr>
              </thead>
              <tbody>
                {enCokCalisan.map((a) => {
                  const g = gorunumAl(a.key.split('-')[1] ?? '')
                  return (
                    <tr key={a.key}>
                      <td>
                        <span className="tablo-ajan">
                          <span className="departman-ikon" style={{ color: g.renk }}>
                            <g.Ikon size={12} />
                          </span>
                          {ajanAdi(a.key)}
                        </span>
                      </td>
                      <td>
                        <span
                          className="uye-durum"
                          style={{
                            color: a.durum === 'hata' ? 'var(--kirmizi)' : 'var(--yesil)'
                          }}
                        >
                          <span className="nokta" />
                          {a.durum === 'hata' ? 'takıldı' : 'bitirdi'}
                        </span>
                      </td>
                      <td className="sag">{sure(a.sureMs ?? 0)}</td>
                      <td className="sag">{a.aracSayisi ?? 0}</td>
                      <td className="sag">{(a.tokenler ?? 0).toLocaleString('tr-TR')}</td>
                      <td className="sag">
                        {a.eklenenSatir ? `+${a.eklenenSatir}` : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}
