// OREN API on the laptop: Express in front of PostgreSQL 17.
// The routes and their SQL live in shared/api.js, so the GitHub Pages version (which runs the same
// database inside the browser) uses exactly the same code. This file only adds HTTP and sign-in cookies.
import express from 'express'
import { pool, one, tx } from './db.js'
import { identify, startSession, endSession, hashPassword, checkPassword } from './auth.js'
import { createApi } from '../../shared/api.js'

const api = createApi({ query: (text, params) => pool.query(text, params), transaction: tx, hashPassword, checkPassword })

const app = express()
app.use(express.json({ limit: '3mb' }))   // lesson photos travel as small JPEG data URLs
app.use(identify)

app.get('/api/health', async (_req, res, next) => {
  try { res.json({ ok: true, members: (await one('SELECT count(*)::int AS n FROM users')).n }) } catch (e) { next(e) }
})

// Every other request goes to the shared API.
app.all('/api/*', async (req, res, next) => {
  try {
    const out = await api.handle(req.method, req.path.slice('/api'.length), { userId: req.userId, body: req.body })
    if (out.signIn) await startSession(res, out.signIn)
    if (out.signOut) await endSession(req, res)
    res.status(out.status).json(out.data)
  } catch (e) { next(e) }
})

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: 'Something went wrong on the server.' })
})

const port = Number(process.env.API_PORT) || 4000
const server = app.listen(port, () => console.log(`OREN API on http://localhost:${port}`))
const stop = () => server.close(() => pool.end().then(() => process.exit(0)))
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
