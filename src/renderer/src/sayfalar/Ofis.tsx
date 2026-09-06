import type { Department } from '../../../shared/types'
import { ajanAdi, type AjansDurumu } from '../ajansDurumu'
import OfisGorunumu from '../bilesenler/OfisGorunumu'
import { gorunumAl } from '../departmanMeta'

interface Props {
  departmanlar: Department[]
  ajans: AjansDurumu
  hazir: boolean
  onEkip: () => void
}

export default function Ofis({ departmanlar, ajans, hazir, onEkip }: Props): React.JSX.Element {
  const calisanlar = ajans.ajanlar.filter((a) => a.durum === 'calisiyor')
  const takilanlar = ajans.ajanlar.filter((a) => a.durum === 'hata')

  return (
    <div className="ofis-sayfa">
      <div className="karsilama">
        <div>
          <h1>Ofis</h1>
          <p>
            {calisanlar.length > 0
              ? `${calisanlar.length} ajan şu an masasında çalışıyor.`
              : hazir
                ? 'Ofis sakin. Komut Merkezi’nden bir brief verdiğinde masalar canlanır.'
                : 'Claude oturumu yok; ofis kapalı görünüyor.'}
          </p>
        </div>
        <div className="filtreler">
          <span className="rozet iyi">
            <span className="nokta" />
            {hazir ? departmanlar.length * 4 + 1 : 0} hazır
          </span>
          <span className="rozet">
            <span className="nokta" style={{ background: 'var(--mavi-acik)' }} />
            {calisanlar.length} çalışıyor
          </span>
          {takilanlar.length > 0 && (
            <span className="rozet kotu">
              <span className="nokta" />
              {takilanlar.length} takıldı
            </span>
          )}
        </div>
      </div>

      <OfisGorunumu
        departmanlar={departmanlar}
        ajans={ajans}
        hazir={hazir}
        onDepartman={onEkip}
      />

      <section className="kutu">
        <div className="kutu-baslik">
          <h3>Masa Başında</h3>
          <button type="button" className="bag" onClick={onEkip}>
            Ekibi gör
          </button>
        </div>
        <div className="kutu-govde">
          {calisanlar.length === 0 && takilanlar.length === 0 ? (
            <p className="bos">
              Şu an çalışan ajan yok. Bir görev verdiğinde kimin ne yaptığını buradan
              izleyebilirsin.
            </p>
          ) : (
            <ul className="masa-liste">
              {[...calisanlar, ...takilanlar].map((a) => {
                const g = gorunumAl(a.key.split('-')[1] ?? '')
                return (
                  <li key={a.key} className={`masa masa-${a.durum}`}>
                    <span className="departman-ikon" style={{ color: g.renk }}>
                      <g.Ikon size={14} />
                    </span>
                    <span className="masa-metin">
                      <b>{ajanAdi(a.key)}</b>
                      <span>{a.gorev || 'görev metni yok'}</span>
                    </span>
                    <span
                      className="uye-durum"
                      style={{
                        color: a.durum === 'hata' ? 'var(--kirmizi)' : 'var(--mavi-acik)'
                      }}
                    >
                      <span className={a.durum === 'calisiyor' ? 'nokta canli' : 'nokta'} />
                      {a.durum === 'hata' ? 'takıldı' : 'çalışıyor'}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}
