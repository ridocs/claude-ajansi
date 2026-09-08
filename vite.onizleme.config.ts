import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  root: resolve(__dirname, 'src/renderer'),
  plugins: [react()],
  resolve: { alias: { '@': resolve(__dirname, 'src/renderer/src') } },
  server: {
    port: 5199,
    strictPort: true,
    // node_modules depo kokunde; worktree'den calisirken fontlara erisim gerek.
    fs: { allow: [resolve(__dirname, '..', '..', '..'), __dirname] }
  }
})
