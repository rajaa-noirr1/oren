// Starts the API (server/, port 4000) and the website (client/, port 5173) together. Ctrl+C stops both.
import { spawn } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const kids = []

function run(name, dir, color) {
  // one command string through the shell: npm is a .cmd script on Windows
  const child = spawn('npm run dev', { cwd: join(root, dir), shell: true, env: process.env })
  const tag = `\x1b[${color}m[${name}]\x1b[0m `
  const pipe = (stream, out) => {
    let rest = ''
    stream.on('data', (chunk) => {
      const lines = (rest + chunk).split(/\r?\n/)
      rest = lines.pop()
      for (const l of lines) if (l.trim()) out.write(tag + l + '\n')
    })
  }
  pipe(child.stdout, process.stdout)
  pipe(child.stderr, process.stderr)
  child.on('exit', (code) => { console.log(`${tag}stopped (${code ?? 'signal'})`); stop() })
  kids.push(child)
}

let stopping = false
function stop() {
  if (stopping) return
  stopping = true
  for (const k of kids) {
    if (process.platform === 'win32') spawn('taskkill', ['/pid', String(k.pid), '/T', '/F'], { stdio: 'ignore' })
    else k.kill('SIGTERM')
  }
  setTimeout(() => process.exit(0), 600)
}
process.on('SIGINT', stop)
process.on('SIGTERM', stop)

run('api', 'server', 36)
run('web', 'client', 35)
