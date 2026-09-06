/// <reference types="vite/client" />
import type { AjansAPI } from '../../preload/index'

declare global {
  interface Window {
    ajans: AjansAPI
  }
}

export {}
