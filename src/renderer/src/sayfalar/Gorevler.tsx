import { useState } from 'react'
import type { AjanKaydi } from '../../../shared/types'
import { ajanAdi } from '../ajansDurumu'
import { gorunumAl } from '../departmanMeta'

interface Props {
  ajanlar: AjanKaydi[]
}

function sure(ms: number): string {
  if (!ms) return ''
  const sn = Math.round(ms / 1000)
  return sn < 60 ? `${sn} sn` : `${Math.floor(sn / 60)} dk ${sn % 60} sn`
}

function Kart({ a }: { a: AjanKaydi }): React.JSX.Element {
  const [acik, setAcik] = useState(false)
  const g = gorunumAl(a.key.split('-')[1] ?? '')
  const olculer = [
    a.sureMs ? sure(a.sureMs) : '',
    a.aracSayisi ? `${a.aracSayisi} araç` : '',
    a.eklenenSatir || a.silinenSatir ? `+${a.eklenenSatir ?? 0} / −${a.silinenSatir ?? 0}` : ''
  ].filter(Boolean)

  return (
    <article className={`gorev-kart gorev-${a.durum}`}>
      <div className="gorev-tepe">
        <span className="departman-ikon" style={{ color: g.renk }}>
          <g.Ikon size={14} />
        </span>
        <b>{ajanAdi(a.key)}</b>
        {a.durum === 'calisiyor' && <span className="nokta canli" style={{ background: 'var(--mavi-acik)' }} />}
      </div>
      <p className="gorev-metin">{a.gorev || 'görev metni yok'}</p>
      <div className="gorev-alt">
        <span>{ajanAdi(a.atayan)} verdi</span>
        {olculer.length > 0 && <span>{olculer.join(' · ')}</span>}
      </div>
      {a.rapor && (
        <>
          <button type="button" className="bag" onClick={() => setAcik((v) => !v)}>
            {acik ? 'Raporu gizle' : 'Raporu gör'}
          </button>
          {acik && <pre className="gorev-rapor">{a.rapor}</pre>}
        </>
      )}
    </article>
  )
}

export default function Gorevler({ ajanlar }: Props): React.JSX.Element {
  const sutunlar = [
    { id: 'calisiyor', ad: 'Devam eden', liste: ajanlar.filter((a) => a.durum === 'calisiyor') },
    { id: 'bitti', ad: 'Tamamlanan', liste: ajanlar.filter((a) => a.durum === 'bitti') },
    { id: 'hata', ad: 'Takılan', liste: ajanlar.filter((a) => a.durum === 'hata') }
  ]

  if (ajanlar.length === 0) {
    return (
      <div className="kutu">
        <div className="kutu-govde">
          <p className="bos">
            Görev panosu boş. Komut Merkezi'nden bir brief verdiğinde müdürün dağıttığı işler
            kart olarak buraya düşer.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="pano">
      {sutunlar.map((s) => (
        <section key={s.id} className="kutu">
          <div className="kutu-baslik">
            <h3>{s.ad}</h3>
            <span className="bag">{s.liste.length}</span>
          </div>
          <div className="kutu-govde pano-sutun">
            {s.liste.length === 0 ? (
              <p className="bos">yok</p>
            ) : (
              s.liste.map((a) => <Kart key={a.key} a={a} />)
            )}
          </div>
        </section>
      ))}
    </div>
  )
}
