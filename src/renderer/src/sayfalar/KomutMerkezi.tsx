import { useEffect, useRef, useState } from 'react'
import { Check, FolderOpen, PenLine, Send, Square, X } from 'lucide-react'
import type { AgencyEvent, RunSummary } from '../../../shared/types'
import { ajanAdi, isaretiAyikla, kisaKlasor, type AjansDurumu } from '../ajansDurumu'
import { gorunumAl } from '../departmanMeta'

/** Oturumun uc hali: is bekleniyor, ajans calisiyor, mudur cevap bekliyor. */
export type OturumHali = 'bosta' | 'calisiyor' | 'bekliyor'

interface Props {
  klasor: string
  hal: OturumHali
  ozet: RunSummary | null
  olaylar: AgencyEvent[]
  ajans: AjansDurumu
  onKlasorSec: () => void
  onGonder: (metin: string) => Promise<void>
  onMesaj: (metin: string) => Promise<void>
  onDurdur: () => void
  onKapat: () => void
  /** Tasarim onayi: true onaylar, false revizyon ister. */
  onTasarimOnayi: (onaylandi: boolean, not: string) => Promise<void>
}

const ORNEK = 'Bu klasördeki projeyi incele ve mimarisini anlatan bir README hazırla.'

const OLAY_ETIKET: Record<string, string> = {
  'oturum-basladi': 'başladı',
  'ajan-basladi': 'göreve başladı',
  'ajan-bitti': 'bitirdi',
  'ajan-konustu': '',
  'arac-cagrildi': 'araç',
  'dosya-degisti': 'dosya',
  'tur-bitti': 'sözü bitti',
  'kullanici-mesaji': 'sen yazdın',
  maliyet: 'maliyet',
  'onay-gerekli': 'onay bekliyor',
  'oturum-bitti': 'bitti',
  hata: 'hata'
}

export default function KomutMerkezi({
  klasor,
  hal,
  ozet,
  olaylar,
  ajans,
  onKlasorSec,
  onGonder,
  onMesaj,
  onDurdur,
  onKapat,
  onTasarimOnayi
}: Props): React.JSX.Element {
  const [metin, setMetin] = useState('')
  const [cevap, setCevap] = useState('')
  const [revizyon, setRevizyon] = useState('')
  const [revizyonAcik, setRevizyonAcik] = useState(false)
  const sonRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    sonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [olaylar.length])

  const gonderilebilir = metin.trim().length > 10 && klasor.length > 0 && hal === 'bosta'

  const cevapGonder = async (): Promise<void> => {
    const m = cevap.trim()
    if (!m) return
    setCevap('')
    await onMesaj(m)
  }

  return (
    <div className="komut">
      {/* Tasarim onayi: mudur isareti yazip durdugunda acilir. */}
      {ajans.tasarimOnayiBekliyor && (
        <section className="kutu onay-karti">
          <div className="kutu-baslik">
            <h3>Tasarım onayını bekliyor</h3>
            <span className="rozet uyari">
              <span className="nokta canli" />
              karar senin
            </span>
          </div>
          <div className="kutu-govde onay-govde">
            <p className="onay-sunum">{ajans.tasarimSunumu}</p>

            {revizyonAcik ? (
              <div className="onay-revizyon">
                <textarea
                  value={revizyon}
                  onChange={(e) => setRevizyon(e.target.value)}
                  placeholder="Neyin değişmesini istiyorsun? Tasarım ekibine iletilecek."
                  rows={3}
                  spellCheck={false}
                />
                <div className="onay-eylem">
                  <button
                    type="button"
                    className="dugme"
                    onClick={() => {
                      setRevizyonAcik(false)
                      setRevizyon('')
                    }}
                  >
                    Vazgeç
                  </button>
                  <button
                    type="button"
                    className="dugme dugme-birincil"
                    disabled={revizyon.trim().length < 3}
                    onClick={() => {
                      const not = revizyon
                      setRevizyon('')
                      setRevizyonAcik(false)
                      void onTasarimOnayi(false, not)
                    }}
                  >
                    <Send size={14} />
                    Revizyon notunu gönder
                  </button>
                </div>
              </div>
            ) : (
              <div className="onay-eylem">
                <button
                  type="button"
                  className="dugme"
                  onClick={() => setRevizyonAcik(true)}
                >
                  <PenLine size={14} />
                  Revizyon iste
                </button>
                <button
                  type="button"
                  className="dugme dugme-birincil"
                  onClick={() => void onTasarimOnayi(true, '')}
                >
                  <Check size={14} />
                  Onayla, inşaya başla
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="kutu komut-sol">
        <div className="kutu-baslik">
          <h3>{hal === 'bekliyor' ? 'Müdür cevabını bekliyor' : 'Yeni Görev'}</h3>
          <span className={hal === 'calisiyor' ? 'rozet iyi' : 'rozet'}>
            <span className={hal === 'calisiyor' ? 'nokta canli' : 'nokta'} />
            {hal === 'calisiyor' ? 'çalışıyor' : hal === 'bekliyor' ? 'cevap bekliyor' : 'boşta'}
          </span>
        </div>

        <div className="kutu-govde komut-govde">
          {hal === 'bekliyor' ? (
            <>
              <p className="ipucu">
                Sorusunu yanıtlayabilir, ek talimat verebilir ya da işi onaylayıp oturumu
                kapatabilirsin. Konuşma aynı bağlamda sürer, ajans baştan başlamaz.
              </p>
              <textarea
                className="alan"
                placeholder="Müdüre yazacakların — örn. server.js ve testler eksik, tamamlat"
                value={cevap}
                onChange={(e) => setCevap(e.target.value)}
                rows={7}
                autoFocus
              />
              <div className="komut-eylem">
                <button type="button" className="dugme dugme-sessiz" onClick={onKapat}>
                  <X size={14} /> Oturumu kapat
                </button>
                <button
                  type="button"
                  className="dugme"
                  onClick={() => void onMesaj('Devam et ve eksik kalan maddeleri tamamla.')}
                >
                  Devam et
                </button>
                <button
                  type="button"
                  className="dugme dugme-birincil"
                  onClick={() => void cevapGonder()}
                  disabled={cevap.trim().length === 0}
                >
                  <Send size={14} /> Gönder
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="ipucu">
                İşi tarif et. Müdür brief&apos;i kabul kriterlerine bölüp hangi departmanların
                gerektiğine karar verecek.
              </p>
              <textarea
                className="alan"
                placeholder={ORNEK}
                value={metin}
                onChange={(e) => setMetin(e.target.value)}
                disabled={hal !== 'bosta'}
                rows={9}
              />
              <div className="yol-satir">
                <FolderOpen size={14} />
                <span className="yol" title={klasor}>
                  {klasor ? kisaKlasor(klasor) : 'çalışma klasörü seçilmedi'}
                </span>
                <button
                  type="button"
                  className="bag"
                  onClick={onKlasorSec}
                  disabled={hal !== 'bosta'}
                >
                  Değiştir
                </button>
              </div>
              <div className="komut-eylem">
                {hal === 'calisiyor' ? (
                  <button type="button" className="dugme dugme-tehlike" onClick={onDurdur}>
                    <Square size={13} /> Ajansı durdur
                  </button>
                ) : (
                  <button
                    type="button"
                    className="dugme dugme-birincil"
                    onClick={() => void onGonder(metin)}
                    disabled={!gonderilebilir}
                    title={
                      klasor.length === 0
                        ? 'Önce çalışma klasörü seç'
                        : metin.trim().length <= 10
                          ? 'Brief biraz daha açık olmalı'
                          : undefined
                    }
                  >
                    <Send size={14} /> Ajansa ver
                  </button>
                )}
              </div>
            </>
          )}

          {ozet && hal !== 'calisiyor' && (
            <div className={ozet.ok ? 'sunum' : 'sunum sunum-hata'}>
              <div className="sunum-tepe">
                <b>{ozet.ok ? 'Müdürün sunumu' : `Çalışma bitmedi (${ozet.subtype})`}</b>
                <span>
                  {ozet.costUsd.toFixed(4)} USD · {Math.round(ozet.durationMs / 1000)} sn
                </span>
              </div>
              {ozet.result && <pre>{ozet.result}</pre>}
            </div>
          )}
        </div>
      </section>

      <section className="kutu komut-sag">
        <div className="kutu-baslik">
          <h3>Canlı Akış</h3>
          <span className="bag">
            {ajans.ajanlar.filter((a) => a.durum === 'calisiyor').length} çalışan ·{' '}
            {ajans.toplamToken.toLocaleString('tr-TR')} token
          </span>
        </div>
        <div className="akis">
          {olaylar.length === 0 ? (
            <p className="bos">
              Henüz olay yok. Brief&apos;i verdiğinde müdürün toplantısı buradan akmaya başlar.
            </p>
          ) : (
            olaylar.map((o) => {
              const g = gorunumAl(o.agentKey.split('-')[1] ?? '')
              return (
                <article key={o.id} className={`olay olay-${o.kind}`}>
                  <span className="departman-ikon" style={{ color: g.renk }}>
                    <g.Ikon size={13} />
                  </span>
                  <div className="olay-govde">
                    <div className="olay-tepe">
                      <b>{ajanAdi(o.agentKey)}</b>
                      {OLAY_ETIKET[o.kind] && <span className="olay-tur">{OLAY_ETIKET[o.kind]}</span>}
                      <time>
                        {new Date(o.at).toLocaleTimeString('tr-TR', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </time>
                    </div>
                    {o.text && <p>{isaretiAyikla(o.text)}</p>}
                  </div>
                </article>
              )
            })
          )}
          <div ref={sonRef} />
        </div>
      </section>
    </div>
  )
}
