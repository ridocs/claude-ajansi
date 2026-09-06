import { useEffect, useRef } from 'react'
import type { OnayIstegi } from '../../../shared/types'

interface Props {
  istek: OnayIstegi
  onCevap: (izin: boolean) => void
}

export default function OnayKutusu({ istek, onCevap }: Props): React.JSX.Element {
  const reddetRef = useRef<HTMLButtonElement>(null)

  // Varsayılan odak reddetmede: yanlışlıkla Enter'a basmak izin vermesin.
  useEffect(() => {
    reddetRef.current?.focus()
  }, [istek.id])

  useEffect(() => {
    const tus = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onCevap(false)
    }
    window.addEventListener('keydown', tus)
    return () => window.removeEventListener('keydown', tus)
  }, [onCevap])

  return (
    <div className="ortu" role="dialog" aria-modal="true" aria-labelledby="onay-baslik">
      <div className="onay">
        <h3 id="onay-baslik">Onayın gerekiyor</h3>
        <p className="ipucu">
          <b>{istek.tool}</b> aracı riskli bir iş yapmak istiyor. İzin verirsen çalıştırılır.
        </p>
        <pre className="onay-ozet">{istek.ozet}</pre>
        <div className="onay-eylem">
          <button ref={reddetRef} type="button" className="dugme" onClick={() => onCevap(false)}>
            Reddet
          </button>
          <button type="button" className="dugme dugme-tehlike" onClick={() => onCevap(true)}>
            İzin ver
          </button>
        </div>
      </div>
    </div>
  )
}
