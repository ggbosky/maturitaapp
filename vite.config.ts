import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Relativní cesty, aby build fungoval i přes file:// v Electronu.
  base: './',
  plugins: [react(), tailwindcss()],
  server: { port: 5173, strictPort: true },
})
