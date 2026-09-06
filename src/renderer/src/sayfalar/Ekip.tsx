import { useCallback, useEffect, useState } from 'react'
import { Brain, GraduationCap, Trash2 } from 'lucide-react'
import type { AgentSpec, Department, HafizaKaydi } from '../../../shared/types'
import { ajanAdi, type AjansDurumu } from '../ajansDurumu'
import { gorunumAl } from '../departmanMeta'

interface Props {
  departmanlar: Department[]
  ajans: AjansDurumu
  hazir: boolean
  klasor: string
  calisiyor: boolean
  onEgit: () => Promise<void>
}

export default function Ekip({
  departmanlar,
  ajans,
  hazir,
  klasor,
  calisiyor,
  onEgit
}: Props): React.JSX.Element {
  const [kadro, setKadro] = useState<AgentSpec[]>([])
  const [hafiza, setHafiza] = useState<HafizaKaydi[]>([])
  const [acik, setAcik] = useState<string | null>(null)

  const hafizaYenile = useCallback(async () => {
    setHafiza(await window.ajans.hafiza())
  }, [])

  useEffect(() => {
    void window.ajans.kadro().then((k) => setKadro(k.agents))
    void hafizaYenile()
  }, [hafizaYenile])

  // Çalışma bitince yeni öğrenilenler listeye düşsün.
  useEffect(() => {
    if (!calisiyor) void hafizaYenile()
  }, [calisiyor, hafizaYenile])

  const hafizaAl = (key: string): HafizaKaydi | undefined =>
    hafiza.find((h) => h.ajanKey === key)

  const durumu = (key: string): { etiket: string; renk: string } => {
    const kayit = ajans.ajanlar.find((a) => a.key === key)
    if (kayit?.durum === 'calisiyor') return { etiket: 'çalışıyor', renk: 'var(--mavi-acik)' }
    if (kayit?.durum === 'hata') return { etiket: 'takıldı', renk: 'var(--kirmizi)' }
    if (kayit?.durum === 'bitti') return { etiket: 'bitirdi', renk: 'var(--yesil)' }
    return { etiket: hazir ? 'hazır' : 'bağlantı yok', renk: hazir ? 'var(--yesil)' : 'var(--gri)' }
  }

  const ogrenmisSayi = hafiza.length
  const toplamBilgi = hafiza.reduce((t, h) => t + h.boyut, 0)

  const sil = async (key: string): Promise<void> => {
    setHafiza(await window.ajans.hafizaSil(key))
  }

  return (
    <div className="ekip-sayfa">
      <div className="karsilama">
        <div>
          <h1>Ekip</h1>
          <p>
            {ogrenmisSayi > 0
              ? `${ogrenmisSayi} ajanın hafızasında ${(toplamBilgi / 1000).toFixed(1)}k karakter bilgi birikmiş.`
              : 'Ajanlar henüz eğitilmedi. Eğitim turunda her uzman kendi alanını araştırıp öğrendiklerini hafızasına yazar.'}
          </p>
        </div>
        <button
          type="button"
          className="dugme dugme-birincil"
          onClick={() => void onEgit()}
          disabled={calisiyor || !hazir || !klasor}
          title={
            !hazir
              ? 'Claude bağlantısı yok'
              : !klasor
                ? 'Önce çalışma klasörü seç'
                : calisiyor
                  ? 'Ajans şu an meşgul'
                  : 'Bütün departmanlar kendi alanını araştırır'
          }
        >
          <GraduationCap size={15} />
          Ajansı Eğit
        </button>
      </div>

      <div className="ekip">
        {departmanlar.map((d) => {
          const g = gorunumAl(d.id)
          const uyeler = [d.leadKey, ...d.specialistKeys]
            .map((k) => kadro.find((a) => a.key === k))
            .filter((a): a is AgentSpec => Boolean(a))
          const ogrenen = uyeler.filter((u) => hafizaAl(u.key)).length

          return (
            <section key={d.id} className="kutu">
              <div className="kutu-baslik">
                <div className="departman-tepe">
                  <span className="departman-ikon" style={{ color: g.renk }}>
                    <g.Ikon size={15} />
                  </span>
                  <span className="departman-ad">
                    <b>{g.ad}</b>
                    <span>{uyeler.length} çalışan</span>
                  </span>
                </div>
                {ogrenen > 0 && (
                  <span className="rozet iyi" title="hafızasında bilgi olan ajan sayısı">
                    <Brain size={12} />
                    {ogrenen}
                  </span>
                )}
              </div>

              <div className="kutu-govde">
                <p className="ipucu">{d.scope}</p>

                <ul className="uye-liste">
                  {uyeler.map((u, i) => {
                    const h = hafizaAl(u.key)
                    const seciliMi = acik === u.key
                    return (
                      <li key={u.key} className={i === 0 ? 'uye uye-lider' : 'uye'}>
                        <button
                          type="button"
                          className="uye-satir"
                          onClick={() => setAcik(seciliMi ? null : u.key)}
                          disabled={!h}
                          title={h ? 'Hafızasını gör' : 'Henüz bir şey öğrenmedi'}
                        >
                          <span className="uye-metin">
                            <b>{u.title}</b>
                            <span>{u.expertise}</span>
                          </span>
                          {h && (
                            <span className="hafiza-rozet">
                              <Brain size={11} />
                              {(h.boyut / 1000).toFixed(1)}k
                            </span>
                          )}
                          <span className="uye-durum" style={{ color: durumu(u.key).renk }}>
                            <span className="nokta" />
                            {durumu(u.key).etiket}
                          </span>
                        </button>

                        {seciliMi && h && (
                          <div className="hafiza-kutu">
                            <div className="hafiza-tepe">
                              <b>{ajanAdi(u.key)} hafızası</b>
                              <button type="button" className="bag" onClick={() => void sil(u.key)}>
                                <Trash2 size={12} /> Sil
                              </button>
                            </div>
                            <pre>{h.metin}</pre>
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
