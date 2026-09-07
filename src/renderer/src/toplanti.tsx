import { StrictMode, useCallback, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrainCog, Send, Square } from 'lucide-react'
import type { ToplantiMesaji } from '../../shared/types'
import Ahtapot from './bilesenler/Ahtapot'
import './styles.css'
import './toplanti.css'

/** Mudurle bas basa toplanti penceresi. */
function Toplanti(): React.JSX.Element {
  const [mesajlar, setMesajlar] = useState<ToplantiMesaji[]>([])
  const [metin, setMetin] = useState('')
  const [acik, setAcik] = useState(false)
  const [bekliyor, setBekliyor] = useState(false)
  const [kaydedildi, setKaydedildi] = useState<string | null>(null)
  const sonRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    return window.toplanti.mesajlariDinle((m) => {
      setMesajlar((o) => [...o, m])
      if (m.kim === 'mudur') setBekliyor(false)
    })
  }, [])

  useEffect(() => {
    return window.toplanti.durumDinle((d) => setAcik(d))
  }, [])

  useEffect(() => {
    sonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [mesajlar.length, bekliyor])

  const gonder = useCallback(async () => {
    const m = metin.trim()
    if (!m || bekliyor) return
    setMetin('')
    setBekliyor(true)
    await window.toplanti.gonder(m)
  }, [metin, bekliyor])

  const hafizayaYaz = useCallback(async () => {
    const sonuc = await window.toplanti.hafizayaYaz()
    setKaydedildi(sonuc.detail)
    setTimeout(() => setKaydedildi(null), 4000)
  }, [])

  return (
    <div className="toplanti">
      <header className="toplanti-tepe">
        <Ahtapot boyut={26} />
        <span className="marka-yazi">
          <span className="marka-ad">Müdürle Toplantı</span>
          <span className="marka-alt">fikir alışverişi ve karar alma</span>
        </span>
        <div className="toplanti-eylem">
          {mesajlar.length > 1 && (
            <button
              type="button"
              className="dugme"
              onClick={() => void hafizayaYaz()}
              disabled={bekliyor}
              title="Bu konuşmanın özetini müdürün kalıcı hafızasına yaz"
            >
              <BrainCog size={14} /> Hafızaya yaz
            </button>
          )}
          <span className={acik ? 'rozet iyi' : 'rozet'}>
            <span className={bekliyor ? 'nokta canli' : 'nokta'} />
            {bekliyor ? 'düşünüyor' : acik ? 'toplantı açık' : 'kapalı'}
          </span>
        </div>
      </header>

      <main className="toplanti-govde">
        {mesajlar.length === 0 && (
          <p className="bos">
            Müdüre ne düşündüğünü sor, bir fikri tartış ya da karar al. Bu oturumda kod yazılmaz;
            sadece konuşulur.
          </p>
        )}

        {mesajlar.map((m) => (
          <article key={m.id} className={m.kim === 'sen' ? 'balon balon-sen' : 'balon balon-mudur'}>
            <div className="balon-tepe">
              <b>{m.kim === 'sen' ? 'Sen' : 'Müdür'}</b>
              <time>
                {new Date(m.at).toLocaleTimeString('tr-TR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </time>
            </div>
            <p>{m.metin}</p>
          </article>
        ))}

        {bekliyor && (
          <article className="balon balon-mudur balon-bekliyor">
            <div className="balon-tepe">
              <b>Müdür</b>
            </div>
            <span className="yaziyor">
              <span />
              <span />
              <span />
            </span>
          </article>
        )}

        <div ref={sonRef} />
      </main>

      {kaydedildi && <div className="toplanti-bilgi">{kaydedildi}</div>}

      <footer className="toplanti-alt">
        <textarea
          value={metin}
          onChange={(e) => setMetin(e.target.value)}
          placeholder="Müdüre yaz... (Enter gönderir, Shift+Enter satır atlar)"
          rows={2}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void gonder()
            }
          }}
        />
        <div className="toplanti-dugmeler">
          {acik && (
            <button
              type="button"
              className="dugme dugme-tehlike"
              onClick={() => void window.toplanti.kapat()}
            >
              <Square size={13} /> Bitir
            </button>
          )}
          <button
            type="button"
            className="dugme dugme-birincil"
            onClick={() => void gonder()}
            disabled={metin.trim().length === 0 || bekliyor}
          >
            <Send size={14} /> Gönder
          </button>
        </div>
      </footer>
    </div>
  )
}

const kok = document.getElementById('kok')
if (!kok) throw new Error('Kök eleman bulunamadi')

createRoot(kok).render(
  <StrictMode>
    <Toplanti />
  </StrictMode>
)
