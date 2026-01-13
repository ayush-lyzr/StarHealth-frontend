import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://3.231.155.2:8000',
        changeOrigin: true
      },
      '/ws': {
        target: 'ws://3.231.155.2:8000',
        ws: true
      }
    }
  }
})











