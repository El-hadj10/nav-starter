// --- Vite config ---
// - base: pour GitHub Pages
// - proxy: redirige /api vers le backend local en dev
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/nav-starter/',
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:4000', // Proxy API backend local
    },
  },
})
