import { query, type Options, type SDKUserMessage } from '@anthropic-ai/claude-agent-sdk'
import { randomUUID } from 'node:crypto'
import { hafizaBolumu } from './hafiza'

/**
 * Mudurle toplanti.
 *
 * Is verme kanali degil: fikir alisverisi ve karar alma icin acik bir sohbet.
 * Mudur bu oturumda dosya yazmaz, komut calistirmaz, ajan cagirmaz; yalnizca
 * konusur. Toplantida alinan kararlar istenirse mudurun hafizasina yazilir.
 */

import type { ToplantiMesaji } from '../../shared/types'

export type { ToplantiMesaji }

export type ToplantiDinleyici = (mesaj: ToplantiMesaji) => void

const TOPLANTI_PROMPTU = [
  'Sen bir dijital ajansın müdürüsün ve şu an ajans sahibiyle baş başa bir toplantıdasın.',
  '',
  'Bu bir iş emri kanalı değil: burada fikir alışverişi yapıyor, karar alıyor ve',
  'birlikte düşünüyorsunuz. Bu oturumda kod yazmaz, dosya oluşturmaz, komut',
  'çalıştırmaz ve ekibini göreve çağırmazsın. Yalnızca konuşursun.',
  '',
  'Nasıl konuşursun:',
  '- Kısa ve doğrudan. Uzun listeler yerine iki üç cümlelik net bir görüş ver.',
  '- Fikir sorulduğunda kendi görüşünü söyle; "her ikisi de olabilir" deme, bir',
  '  tarafı seç ve nedenini yaz.',
  '- Ajansın kadrosunu ve neler yapabileceğini biliyorsun; öneri verirken hangi',
  '  departmanın işe gireceğini de söyle.',
  '- Bilmediğin bir şey sorulursa bilmediğini söyle, uydurma.',
  '- Ajans sahibi bir karar aldığında onu net biçimde özetle ki sonra hatırlansın.',
  '',
  'Türkçe konuş. Teknik terimleri olduğu gibi bırak.'
].join('\n')

/** Acik kalan bir toplanti oturumu. */
export interface ToplantiOturumu {
  mesajGonder: (metin: string) => void
  kapat: () => void
  /** Oturum tamamen bitince cozulur. */
  bitti: Promise<void>
}

class Kuyruk implements AsyncIterable<SDKUserMessage> {
  private bekleyen: SDKUserMessage[] = []
  private uyandir: (() => void) | null = null
  private kapali = false

  ekle(metin: string): void {
    this.bekleyen.push({
      type: 'user',
      message: { role: 'user', content: metin },
      parent_tool_use_id: null
    })
    this.serbest()
  }

  kapat(): void {
    this.kapali = true
    this.serbest()
  }

  private serbest(): void {
    const c = this.uyandir
    this.uyandir = null
    c?.()
  }

  async *[Symbol.asyncIterator](): AsyncGenerator<SDKUserMessage> {
    while (true) {
      while (this.bekleyen.length > 0) yield this.bekleyen.shift() as SDKUserMessage
      if (this.kapali) return
      await new Promise<void>((c) => {
        this.uyandir = c
      })
    }
  }
}

export function toplantiBaslat(
  ilkMesaj: string,
  workspace: string,
  onMesaj: ToplantiDinleyici
): ToplantiOturumu {
  const kuyruk = new Kuyruk()
  const iptal = new AbortController()
  kuyruk.ekle(ilkMesaj)

  const options: Options = {
    cwd: workspace || process.cwd(),
    systemPrompt: TOPLANTI_PROMPTU + hafizaBolumu('mudur'),
    // Toplantida hicbir arac yok: yalnizca konusma.
    allowedTools: [],
    disallowedTools: ['Agent', 'Bash', 'Write', 'Edit', 'Read', 'Grep', 'Glob', 'WebSearch'],
    permissionMode: 'default',
    abortController: iptal,
    canUseTool: async () => ({
      behavior: 'deny' as const,
      message: 'Toplantıda araç kullanılmaz; yalnızca konuşuluyor.'
    })
  }

  const bitti = (async (): Promise<void> => {
    try {
      for await (const m of query({ prompt: kuyruk, options })) {
        const mesaj = m as Record<string, any>
        if (mesaj.type === 'assistant' && mesaj.message?.content) {
          for (const blok of mesaj.message.content) {
            if (blok.type === 'text' && blok.text?.trim()) {
              onMesaj({
                id: randomUUID(),
                kim: 'mudur',
                metin: blok.text.trim(),
                at: Date.now()
              })
            }
          }
        }
      }
    } catch (hata) {
      onMesaj({
        id: randomUUID(),
        kim: 'mudur',
        metin: `Toplantı kesildi: ${hata instanceof Error ? hata.message : String(hata)}`,
        at: Date.now()
      })
    }
  })()

  return {
    mesajGonder: (metin: string) => {
      onMesaj({ id: randomUUID(), kim: 'sen', metin, at: Date.now() })
      kuyruk.ekle(metin)
    },
    kapat: () => {
      kuyruk.kapat()
      iptal.abort()
    },
    bitti
  }
}
