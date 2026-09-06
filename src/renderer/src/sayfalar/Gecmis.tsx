import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, Clock, FileText, GraduationCap, Trash2, Users } from 'lucide-react'
import type { CalismaKaydi, CalismaOzeti } from '../../../shared/types'
import { ajanAdi, ajansDurumuHesapla, kisaKlasor } from '../ajansDurumu'
import { gorunumAl } from '../departmanMeta'

interface Props {
  klasor: string
  /** Calisma bitince liste tazelensin. */
  calisiyor: boolean
}

function tarih(ms: number): string {
  return new Date(ms).toLocaleString('tr-TR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function sure(bas: number, bit: number): string {
  const sn = Math.max(0, Math.round((bit - bas) / 1000))
  return sn < 60 ? `${sn} sn` : `${Math.floor(sn / 60)} dk`
}

export default function Gecmis({ klasor, calisiyor }: Props): React.JSX.Element {
  const [kayitlar, setKayitlar] = useState<CalismaOzeti[]>([])
  const [acik, setAcik] = useState<CalismaKaydi | null>(null)
  const [tumProjeler, setTumProjeler] = useState(false)

  const yenile = useCallback(async () => {
    setKayitlar(await window.ajans.gecmis(tumProjeler ? undefined : klasor || undefined))
  }, [klasor, tumProjeler])

  useEffect(() => {
    void yenile()
  }, [yenile])

  // Bir çalışma bittiğinde yeni kayıt listeye düşsün.
  useEffect(() => {
    if (!calisiyor) void yenile()
  }, [calisiyor, yenile])

  const ac = async (o: CalismaOzeti): Promise<void> => {
    setAcik(await window.ajans.gecmisOku(o.workspace, o.id))
  }

  const sil = async (o: CalismaOzeti): Promise<void> => {
    await window.ajans.gecmisSil(o.workspace, o.id)
    await yenile()
  }

  // --- tek bir çalışmanın akışı
  if (acik) {
    const d = ajansDurumuHesapla(acik.olaylar)
    return (
      <div className="gecmis">
        <div className="karsilama">
          <div>
            <button type="button" className="bag" onClick={() => setAcik(null)}>
              <ArrowLeft size={13} /> Geçmişe dön
            </button>
            <h1>{acik.egitim ? 'Eğitim turu' : 'Çalışma kaydı'}</h1>
            <p>{tarih(acik.basladi)} · {kisaKlasor(acik.workspace, 2)}</p>
          </div>
          <div className="filtreler">
            <span className={acik.ozet.ok ? 'rozet iyi' : 'rozet kotu'}>
              <span className="nokta" />
              {acik.ozet.ok ? 'tamamlandı' : acik.ozet.subtype}
            </span>
            <span className="rozet">{acik.ozet.costUsd.toFixed(2)} $</span>
            <span className="rozet">{sure(acik.basladi, acik.bitti)}</span>
          </div>
        </div>

        <section className="kutu">
          <div className="kutu-baslik">
            <h3>Verilen İş</h3>
          </div>
          <div className="kutu-govde">
            <pre className="gecmis-brief">{acik.brief}</pre>
          </div>
        </section>

        {acik.dosyalar.length > 0 && (
          <section className="kutu">
            <div className="kutu-baslik">
              <h3>Üretilen Dosyalar</h3>
              <span className="bag">{acik.dosyalar.length}</span>
            </div>
            <div className="kutu-govde">
              <ul className="dosya-liste">
                {acik.dosyalar.map((y) => (
                  <li key={y} className="dosya-satir">
                    <span className="departman-ikon" style={{ color: 'var(--yesil)' }}>
                      <FileText size={13} />
                    </span>
                    <span className="dosya-metin">
                      <b>{y.split(/[\\/]/).pop()}</b>
                      <span title={y}>{kisaKlasor(y, 3)}</span>
                    </span>
                    <button
                      type="button"
                      className="bag"
                      onClick={() => void window.ajans.dosyaAc(y)}
                    >
                      Aç
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        <section className="kutu">
          <div className="kutu-baslik">
            <h3>Akış</h3>
            <span className="bag">{acik.olaylar.length} olay · {d.ajanlar.length} ajan</span>
          </div>
          <div className="kutu-govde">
            <div className="gecmis-akis">
              {acik.olaylar
                .filter((o) => o.kind !== 'arac-cagrildi')
                .map((o) => {
                  const g = gorunumAl(o.agentKey.split('-')[1] ?? '')
                  return (
                    <article key={o.id} className={`olay olay-${o.kind}`}>
                      <span className="departman-ikon" style={{ color: g.renk }}>
                        <g.Ikon size={13} />
                      </span>
                      <div className="olay-govde">
                        <div className="olay-tepe">
                          <b>{ajanAdi(o.agentKey)}</b>
                          <time>
                            {new Date(o.at).toLocaleTimeString('tr-TR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </time>
                        </div>
                        {o.text && <p>{o.text}</p>}
                      </div>
                    </article>
                  )
                })}
            </div>
          </div>
        </section>
      </div>
    )
  }

  // --- kayıt listesi
  return (
    <div className="gecmis">
      <div className="karsilama">
        <div>
          <h1>Geçmiş</h1>
          <p>
            {kayitlar.length > 0
              ? `${kayitlar.length} çalışma kaydı. Kayıtlar silinmez; hangi projede ne yapıldığı burada durur.`
              : 'Henüz kayıt yok. Ajans bir işi bitirdiğinde akışı burada saklanır.'}
          </p>
        </div>
        <button
          type="button"
          className={tumProjeler ? 'dugme dugme-birincil' : 'dugme'}
          onClick={() => setTumProjeler((v) => !v)}
        >
          {tumProjeler ? 'Tüm projeler' : 'Bu proje'}
        </button>
      </div>

      {kayitlar.length === 0 ? (
        <section className="kutu">
          <div className="kutu-govde yakinda">
            <span className="departman-ikon" style={{ color: 'var(--mavi-acik)' }}>
              <Clock size={16} />
            </span>
            <h3>Kayıt yok</h3>
            <p>Bir görev tamamlandığında akışı, üretilen dosyaları ve maliyetiyle burada saklanır.</p>
          </div>
        </section>
      ) : (
        <ul className="gecmis-liste">
          {kayitlar.map((k) => (
            <li key={k.id} className="gecmis-kart">
              <button type="button" className="gecmis-satir" onClick={() => void ac(k)}>
                <span
                  className="departman-ikon"
                  style={{ color: k.egitim ? 'var(--mor)' : k.ok ? 'var(--yesil)' : 'var(--kirmizi)' }}
                >
                  {k.egitim ? <GraduationCap size={14} /> : <Clock size={14} />}
                </span>
                <span className="gecmis-metin">
                  <b>{k.egitim ? 'Eğitim turu' : k.brief.split('\n')[0]}</b>
                  <span>
                    {tarih(k.basladi)} · {kisaKlasor(k.workspace, 2)}
                  </span>
                </span>
                <span className="gecmis-olcu">
                  <span title="ajan">
                    <Users size={11} /> {k.ajanSayisi}
                  </span>
                  <span title="dosya">
                    <FileText size={11} /> {k.dosyaSayisi}
                  </span>
                  <span>{k.costUsd.toFixed(2)} $</span>
                </span>
              </button>
              <button
                type="button"
                className="bag gecmis-sil"
                onClick={() => void sil(k)}
                title="Bu kaydı sil"
              >
                <Trash2 size={12} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
