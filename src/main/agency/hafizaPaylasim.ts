import type { AgentSpec, Department } from '../../shared/types'
import { hafizaOku } from './hafiza'
import { ozetCikar } from './ozet'

/**
 * Ajanlar arasi bilgi paylasimi.
 *
 * Bir ajan yalnizca kendi ogrendigini degil, ekibinin bildiklerinin ozetini de
 * gorur. Boylece backend uzmani, kalite ekibinin hangi test aracini sectigini
 * bilir ve ayni karari yeniden almaz.
 *
 * Paylasilan kisim kisa tutulur: promptu sismemek icin yalnizca baslik
 * satirlari ve ilk maddeler tasinir.
 */

interface Girdi {
  ajanKey: string
  departmanlar: Department[]
  kadro: AgentSpec[]
}

/**
 * Bir ajanin promptuna eklenecek "ekibin bildikleri" bolumu.
 *
 * Uzman kendi departmanindaki digerlerini gorur; lider hem kendi ekibini hem
 * diger departmanlarin liderlerini gorur. Mudur butun liderleri gorur.
 */
export function ekipBilgisi({ ajanKey, departmanlar, kadro }: Girdi): string {
  const adAl = (key: string): string => kadro.find((a) => a.key === key)?.title ?? key

  /** Kimlerin ozeti okunacak. */
  let hedefler: string[] = []

  if (ajanKey === 'mudur') {
    hedefler = departmanlar.map((d) => d.leadKey)
  } else {
    const dept = departmanlar.find(
      (d) => d.leadKey === ajanKey || d.specialistKeys.includes(ajanKey)
    )
    if (!dept) return ''

    if (dept.leadKey === ajanKey) {
      // Lider: kendi ekibi + diger liderler
      hedefler = [
        ...dept.specialistKeys,
        ...departmanlar.filter((d) => d.id !== dept.id).map((d) => d.leadKey)
      ]
    } else {
      // Uzman: kendi departmanindaki digerleri
      hedefler = [dept.leadKey, ...dept.specialistKeys].filter((k) => k !== ajanKey)
    }
  }

  const bolumler: string[] = []
  for (const key of hedefler) {
    const ozet = ozetCikar(hafizaOku(key))
    if (ozet) bolumler.push(`${adAl(key)}:\n${ozet}`)
  }

  if (bolumler.length === 0) return ''

  return [
    '',
    '--- EKİBİN BİLDİKLERİ ---',
    'Bunlar ekip arkadaşlarının kendi alanlarında öğrendiklerinin özeti.',
    'Kendi işini yaparken bunlarla çelişme; bir kararı yeniden almak yerine',
    'ekibin verdiği kararı kullan. Çeliştiğini düşünüyorsan raporunda belirt.',
    '',
    bolumler.join('\n\n'),
    '--- EKİP BİLGİSİ SONU ---',
    ''
  ].join('\n')
}
