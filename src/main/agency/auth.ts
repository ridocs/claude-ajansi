import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type { AuthStatus } from '../../shared/types'

/**
 * Giris: ajans yalnizca bu makinede acik olan Claude oturumuyla calisir.
 *
 * Ayri bir API anahtari istenmez, saklanmaz ve ortama enjekte edilmez;
 * SDK kurulu oturumu kendisi bulur.
 */

/** Claude bu makinede oturum acmis mi? Dosyanin icerigi okunmaz, yalnizca varligi. */
export function claudeOturumuVar(): boolean {
  return existsSync(join(homedir(), '.claude', '.credentials.json'))
}

export function authDurumu(): AuthStatus {
  if (claudeOturumuVar()) {
    return {
      ready: true,
      detail: 'Bu makinedeki Claude oturumu kullanılıyor. Ajans senin aboneliğinle çalışır.'
    }
  }
  return {
    ready: false,
    detail: 'Claude oturumu bulunamadı. Terminalde "claude" komutunu çalıştırıp giriş yap.'
  }
}
