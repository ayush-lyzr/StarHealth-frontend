import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://star-health-api.rapid.studio.lyzr.ai',
        changeOrigin: true
      },
      '/ws': {
        target: 'wss://star-health-api.rapid.studio.lyzr.ai',
        ws: true
      }
    }
  }
})











