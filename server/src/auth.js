import { createHash, randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { q, one } from './db.js'

const COOKIE = 'oren_sid'
const DAYS = 30
const hashToken = (token) => createHash('sha256').update(token).digest('hex')

export const hashPassword = (password) => bcrypt.hash(password, 10)
export const checkPassword = (password, hash) => (hash ? bcrypt.compare(password, hash) : Promise.resolve(false))

const readCookie = (req) => {
  const raw = req.headers.cookie || ''
  for (const part of raw.split(';')) {
    const [k, ...v] = part.trim().split('=')
    if (k === COOKIE) return decodeURIComponent(v.join('='))
  }
  return null
}

// Signs a member in: a random token goes to the browser, only its hash is stored.
export async function startSession(res, userId) {
  const token = randomBytes(32).toString('base64url')
  await q(`INSERT INTO auth_sessions (token_hash, user_id, expires_at) VALUES ($1, $2, now() + make_interval(days => $3))`, [hashToken(token), userId, DAYS])
  res.setHeader('Set-Cookie', `${COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${DAYS * 86400}`)
}

export async function endSession(req, res) {
  const token = readCookie(req)
  if (token) await q('DELETE FROM auth_sessions WHERE token_hash = $1', [hashToken(token)])
  res.setHeader('Set-Cookie', `${COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`)
}

// Every request: who is signed in, if anyone.
export async function identify(req, _res, next) {
  try {
    const token = readCookie(req)
    req.userId = null
    if (token) {
      const row = await one('SELECT user_id FROM auth_sessions WHERE token_hash = $1 AND expires_at > now()', [hashToken(token)])
      req.userId = row?.user_id ?? null
    }
    next()
  } catch (e) { next(e) }
}

export function requireMember(req, res, next) {
  if (!req.userId) return res.status(401).json({ error: 'Sign in first.' })
  next()
}
