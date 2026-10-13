import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Rutas relativas: el sitio se publica en /armario/, no en la raíz del dominio
  base: './',
  plugins: [react()],
})
