import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [react(), VitePWA({
    registerType: 'autoUpdate',
    manifest: { name: 'Топливный учёт', short_name: 'Топливо', description: 'Личный учёт заправок', display: 'standalone', theme_color: '#0d6b52', background_color: '#f4f7f5', icons: [] },
    workbox: { globPatterns: ['**/*.{js,css,html,svg}'] }
  })]
})
