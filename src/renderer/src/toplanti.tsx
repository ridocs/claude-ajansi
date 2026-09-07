import { StrictMode, useCallback, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrainCog, History, Plus, Send, Square, Trash2, X } from 'lucide-react'
import type { ToplantiMesaji, ToplantiOzeti } from '../../shared/types'
import Ahtapot from './bilesenler/Ahtapot'
import './styles.css'
import './toplanti.css'
import './beyin.css'

/** Mudurle bas basa toplanti penceresi. */
function Toplanti(): React.JSX.Element {
  const [mesajlar, setMesajlar] = useState<ToplantiMesaji[]>([])
  const [metin, setMetin] = useState('')
  const [acik, setAcik] = useState(false)
  const [bekliyor, setBekliyor] = useState(false)
  const [kaydedildi, setKaydedildi] = useState<string | null>(null)
  const [gecmisAcik, setGecmisAcik] = useState(false)
  const [gecmis, setGecmis] = useState<ToplantiOzeti[]>([])
  const [okunan, setOkunan] = useState<string | null>(null)
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
    // Eski bir kayda bakarken yazmak yeni toplanti baslatir.
    if (okunan) {
      await window.toplanti.yeni()
      setMesajlar([])
      setOkunan(null)
    }
    setMetin('')
    setBekliyor(true)
    await window.toplanti.gonder(m)
  }, [metin, bekliyor, okunan])

  const gecmisYenile = useCallback(async () => {
    setGecmis(await window.toplanti.gecmis())
  }, [])

  useEffect(() => {
    if (gecmisAcik) void gecmisYenile()
  }, [gecmisAcik, gecmisYenile])

  /** Eski bir toplantiyi salt okunur olarak acar. */
  const gecmisAc = useCallback(async (id: string) => {
    const kayit = await window.toplanti.gecmisOku(id)
    if (!kayit) return
    setMesajlar(kayit.mesajlar)
    setOkunan(id)
    setGecmisAcik(false)
  }, [])

  /** Temiz sayfa: suren toplantiyi kapatir. */
  const yeniToplanti = useCallback(async () => {
    await window.toplanti.yeni()
    setMesajlar([])
    setOkunan(null)
    setGecmisAcik(false)
    setBekliyor(false)
  }, [])

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
          <button
            type="button"
            className="ikon-dugme"
            title="Geçmiş toplantılar"
            onClick={() => setGecmisAcik((v) => !v)}
          >
            {gecmisAcik ? <X size={15} /> : <History size={15} />}
          </button>
          {(mesajlar.length > 0 || okunan) && (
            <button
              type="button"
              className="ikon-dugme"
              title="Yeni toplantı"
              onClick={() => void yeniToplanti()}
            >
              <Plus size={15} />
            </button>
          )}
          {mesajlar.length > 1 && !okunan && (
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

      {gecmisAcik && (
        <div className="gecmis-panel">
          {gecmis.length === 0 ? (
            <p className="bos">Henüz kayıtlı toplantı yok.</p>
          ) : (
            <ul>
              {gecmis.map((g) => (
                <li key={g.id} className={okunan === g.id ? 'gecmis-oge secili' : 'gecmis-oge'}>
                  <button type="button" onClick={() => void gecmisAc(g.id)}>
                    <span className="gecmis-oge-baslik">{g.baslik}</span>
                    <span className="gecmis-oge-alt">
                      {new Date(g.guncellendi).toLocaleString('tr-TR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}{' '}
                      · {g.mesajSayisi} mesaj
                    </span>
                  </button>
                  <button
                    type="button"
                    className="bag"
                    title="Sil"
                    onClick={() => void window.toplanti.gecmisSil(g.id).then(setGecmis)}
                  >
                    <Trash2 size={11} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {okunan && (
        <div className="toplanti-bilgi okunan">
          Geçmiş bir toplantıyı okuyorsun. Yazmaya başlarsan yeni bir toplantı açılır.
        </div>
      )}

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
