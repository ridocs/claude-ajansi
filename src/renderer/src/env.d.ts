/// <reference types="vite/client" />
import type { AjansAPI, ToplantiAPI } from '../../preload/index'

declare global {
  interface Window {
    ajans: AjansAPI
    toplanti: ToplantiAPI
  }
}

export {}
