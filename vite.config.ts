import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [react(), VitePWA({
    registerType: 'autoUpdate',
    manifest: {
      name: 'Топливный учёт', short_name: 'Топливо', description: 'Личный учёт заправок',
      display: 'standalone', theme_color: '#08795a', background_color: '#f3f6f4', lang: 'ru',
      icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }]
    },
    workbox: { globPatterns: ['**/*.{js,css,html,svg}'] }
  })]
})
