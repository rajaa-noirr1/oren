import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

// npm run dev / build      → the website for the laptop, talking to the Express API (server/, port 4000)
// npm run build:pages      → the GitHub Pages version: served from /oren/, with the database in the browser
export default defineConfig(({ mode }) => ({
  base: mode === 'pages' ? '/oren/' : '/',
  plugins: [react(), mode === 'pages' && githubPages()],
  // PGlite ships its own WebAssembly files; Vite should not pre-bundle it
  optimizeDeps: { exclude: ['@electric-sql/pglite'] },
  // shared/api.js and server/db/*.sql live outside client/
  server: { port: 5173, strictPort: true, proxy: { '/api': 'http://localhost:4000' }, fs: { allow: ['..'] } },
}))

// GitHub Pages serves 404.html for any unknown address, so a copy of the app there makes links like
// /oren/tree work on refresh. .nojekyll tells Pages to serve the files exactly as built.
function githubPages() {
  return {
    name: 'github-pages',
    closeBundle() {
      copyFileSync(resolve('dist/index.html'), resolve('dist/404.html'))
      writeFileSync(resolve('dist/.nojekyll'), '')
    },
  }
}
