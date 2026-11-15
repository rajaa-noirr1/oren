// Copies the devicon SVGs the skill catalog needs into public/icons, and records which
// icons are dark single-colour marks (so the site can invert them in dark mode).
// Usage: node scripts/copy-icons.mjs [path-to-devicon-package]
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { SKILLS } from '../src/data/skills.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..')
const devicon = path.resolve(process.argv[2] || path.join(root, 'node_modules', 'devicon'))
const index = JSON.parse(fs.readFileSync(path.join(devicon, 'devicon.json'), 'utf8'))
const byName = Object.fromEntries(index.map((e) => [e.name, e]))
const order = ['original', 'plain', 'line', 'original-wordmark', 'plain-wordmark']
const outDir = path.join(root, 'public', 'icons')
fs.mkdirSync(outDir, { recursive: true })

const lum = (hex) => {
  let h = hex.replace('#', '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

const manifest = {}
let copied = 0
for (const s of SKILLS) {
  if (!s.icon) continue
  const entry = byName[s.icon]
  const version = entry && order.find((v) => entry.versions.svg.includes(v))
  if (!version) { console.warn('no icon for', s.id); continue }
  const src = path.join(devicon, 'icons', s.icon, `${s.icon}-${version}.svg`)
  const svg = fs.readFileSync(src, 'utf8')
  fs.writeFileSync(path.join(outDir, `${s.id}.svg`), svg)
  const colours = [...svg.matchAll(/(?:fill|stop-color)\s*[:=]\s*"?\s*(#[0-9a-fA-F]{3,6})\b/g)]
    .map((m) => m[1].toLowerCase())
    .filter((c) => !['#fff', '#ffffff'].includes(c))
  const mono = colours.length === 0 || colours.every((c) => lum(c) < 0.35)
  manifest[s.id] = { mono }
  copied++
}
fs.writeFileSync(path.join(root, 'src', 'data', 'icon-manifest.json'), JSON.stringify(manifest, null, 0))
console.log(`copied ${copied} icons; dark marks: ${Object.keys(manifest).filter((k) => manifest[k].mono).join(', ')}`)
