import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves from /<repo>/; set BASE_PATH=/ for root hosting (Vercel, Netlify)
  base: process.env.BASE_PATH ?? '/4D-portfolio/',
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1200,
    // No manual chunk groups: splitting them by hand reordered internal dependencies and
    // broke the production bundle ("x is not a function"). React.lazy already isolates the
    // heavy paths (rapier physics, postprocessing, touch controls) into their own chunks.
  },
  server: { port: 5173 },
})
