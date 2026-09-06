import { useMemo } from 'react'
import { ArrowRight, MessageSquare } from 'lucide-react'
import type { AgencyEvent } from '../../../shared/types'
import { ajanAdi } from '../ajansDurumu'
import { gorunumAl } from '../departmanMeta'

interface Props {
  olaylar: AgencyEvent[]
  onKomut: () => void
}

type SatirTur = 'brifing' | 'rapor' | 'soz' | 'sen' | 'karar'

interface Satir {
  id: string
  tur: SatirTur
  kim: string
  kime?: string
  metin: string
  at: number
}

const TUR_ETIKET: Record<SatirTur, string> = {
  brifing: 'görev verdi',
  rapor: 'rapor verdi',
  soz: 'konuştu',
  sen: 'sen',
  karar: 'turu kapattı'
}

/**
 * Olay akisindan toplanti transkripti cikarir: kim kime gorev verdi,
 * kim ne rapor etti. Arac cagrilari ve gurultu disarida kalir.
 */
function transkript(olaylar: AgencyEvent[]): Satir[] {
  const satirlar: Satir[] = []

  for (const o of olaylar) {
    if (o.kind === 'ajan-basladi') {
      satirlar.push({
        id: o.id,
        tur: 'brifing',
        kim: String(o.meta?.atayan ?? 'mudur'),
        kime: o.agentKey,
        metin: o.text,
        at: o.at
      })
    } else if (o.kind === 'ajan-bitti' && o.text.trim()) {
      satirlar.push({ id: o.id, tur: 'rapor', kim: o.agentKey, metin: o.text, at: o.at })
    } else if (o.kind === 'ajan-konustu' && o.agentKey === 'mudur' && o.text.trim().length > 40) {
      satirlar.push({ id: o.id, tur: 'soz', kim: 'mudur', metin: o.text, at: o.at })
    } else if (o.kind === 'kullanici-mesaji') {
      satirlar.push({ id: o.id, tur: 'sen', kim: 'sen', metin: o.text, at: o.at })
    } else if (o.kind === 'tur-bitti') {
      satirlar.push({ id: o.id, tur: 'karar', kim: 'mudur', metin: o.text, at: o.at })
    }
  }

  return satirlar
}

export default function Toplantilar({ olaylar, onKomut }: Props): React.JSX.Element {
  const satirlar = useMemo(() => transkript(olaylar), [olaylar])

  if (satirlar.length === 0) {
    return (
      <section className="kutu">
        <div className="kutu-govde yakinda">
          <span className="departman-ikon" style={{ color: 'var(--mor)' }}>
            <MessageSquare size={16} />
          </span>
          <h3>Henüz toplantı yapılmadı</h3>
          <p>
            Müdür bir brief aldığında takım liderlerini toplar ve görev dağıtır. O konuşmanın
            okunabilir kaydı burada tutulur.
          </p>
          <button type="button" className="dugme dugme-birincil" onClick={onKomut}>
            Komut Merkezi&apos;ne git
          </button>
        </div>
      </section>
    )
  }

  const brifing = satirlar.filter((s) => s.tur === 'brifing').length
  const rapor = satirlar.filter((s) => s.tur === 'rapor').length

  return (
    <div className="toplanti">
      <div className="karsilama">
        <div>
          <h1>Toplantı Kaydı</h1>
          <p>
            {brifing} görev dağıtımı, {rapor} rapor. Müdür ve takım liderlerinin bu oturumdaki
            konuşması.
          </p>
        </div>
      </div>

      <section className="kutu">
        <div className="kutu-govde">
          <ol className="transkript">
            {satirlar.map((s) => {
              const g = gorunumAl(s.kim.split('-')[1] ?? '')
              return (
                <li key={s.id} className={`konusma konusma-${s.tur}`}>
                  <span className="departman-ikon" style={{ color: s.tur === 'sen' ? 'var(--mor)' : g.renk }}>
                    <g.Ikon size={13} />
                  </span>
                  <div className="konusma-govde">
                    <div className="konusma-tepe">
                      <b>{ajanAdi(s.kim)}</b>
                      {s.kime && (
                        <>
                          <ArrowRight size={11} />
                          <b>{ajanAdi(s.kime)}</b>
                        </>
                      )}
                      <span className="konusma-tur">{TUR_ETIKET[s.tur]}</span>
                      <time>
                        {new Date(s.at).toLocaleTimeString('tr-TR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </time>
                    </div>
                    <p>{s.metin}</p>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      </section>
    </div>
  )
}
