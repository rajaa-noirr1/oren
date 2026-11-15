// The GitHub Pages version of OREN. GitHub Pages can only serve files, so the database runs inside the
// visitor's browser instead: PGlite is PostgreSQL compiled to WebAssembly. It loads the very same
// server/db/schema.sql and seed.sql as the laptop, and answers the website through the same shared API
// code (shared/api.js), so every query, view, function and trigger is identical.
// Each visitor gets a private copy, saved in their browser (IndexedDB). Add ?reset-demo to the address to start over.
import { PGlite, types } from '@electric-sql/pglite'
import bcrypt from 'bcryptjs'
import { createApi } from '../../../shared/api.js'
import schema from '../../../server/db/schema.sql?raw'
import seed from '../../../server/db/seed.sql?raw'

const SESSION_KEY = 'oren:browser-session'

// A new schema or seed gets a fresh database; the name carries a short fingerprint of both.
function fingerprint(text) {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619) }
  return (h >>> 0).toString(36)
}
const NAME = `oren-${fingerprint(schema + seed)}`
const parsers = { [types.INT8]: Number, [types.NUMERIC]: Number, [types.DATE]: (v) => v }

const readSession = () => { try { return Number(localStorage.getItem(SESSION_KEY)) || null } catch { return null } }
const writeSession = (id) => { try { if (id) localStorage.setItem(SESSION_KEY, String(id)); else localStorage.removeItem(SESSION_KEY) } catch { /* storage blocked */ } }

async function forgetDatabases(keep) {
  try {
    const all = (await indexedDB.databases?.()) || []
    for (const d of all) if (d.name?.startsWith('/pglite/oren-') && d.name !== keep) indexedDB.deleteDatabase(d.name)
  } catch { /* not supported: old copies just stay */ }
}

async function open() {
  if (new URLSearchParams(location.search).has('reset-demo')) {
    writeSession(null)
    await forgetDatabases(null)
  }
  let db
  try {
    db = await PGlite.create(`idb://${NAME}`, { parsers })
  } catch {
    db = await PGlite.create({ parsers })   // private windows may block IndexedDB: keep it in memory instead
  }
  const built = (await db.query("SELECT to_regclass('public.users') IS NOT NULL AS ok")).rows[0].ok
  if (!built) {
    await db.exec(schema)
    await db.exec(seed)
  }
  forgetDatabases(`/pglite/${NAME}`)
  return db
}

// Starts the database once and returns run(method, path, body) → { status, data }.
export async function start() {
  const db = await open()
  const api = createApi({
    query: (text, params) => db.query(text, params),
    transaction: (fn) => db.transaction((t) => fn({ query: (text, params) => t.query(text, params) })),
    hashPassword: (password) => bcrypt.hash(password, 10),
    checkPassword: (password, hash) => (hash ? bcrypt.compare(password, hash) : Promise.resolve(false)),
  })
  // a remembered sign-in only counts if that member is still in this browser's database
  const remembered = readSession()
  if (remembered && !(await db.query('SELECT 1 FROM users WHERE id = $1', [remembered])).rows.length) writeSession(null)

  return async (method, path, body) => {
    const out = await api.handle(method, path, { userId: readSession(), body })
    if (out.signIn) writeSession(out.signIn)
    if (out.signOut) writeSession(null)
    // the same shape a real server sends over the network
    return { status: out.status, data: JSON.parse(JSON.stringify(out.data)) }
  }
}
