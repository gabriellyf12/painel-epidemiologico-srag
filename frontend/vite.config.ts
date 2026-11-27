import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  // A API libera apenas esta origem no CORS
  server: { port: 5173, strictPort: true },
})
