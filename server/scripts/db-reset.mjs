// Builds the OREN database from scratch: the website's own database user, the database, the schema and the seed.
// Run: npm run db:reset   (reads server/.env; everything in the oren database is replaced)
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const here = dirname(fileURLToPath(import.meta.url))
const { PGHOST = 'localhost', PGPORT = '5432', PGDATABASE = 'oren', PGUSER = 'oren_app', PGPASSWORD, POSTGRES_PASSWORD } = process.env
if (!POSTGRES_PASSWORD || !PGPASSWORD) throw new Error('server/.env needs POSTGRES_PASSWORD and PGPASSWORD')
const ident = (s) => `"${s.replace(/"/g, '""')}"`
const literal = (s) => `'${s.replace(/'/g, "''")}'`

// 1. As the database superuser: the website's own user and a fresh database it owns.
const admin = new pg.Client({ host: PGHOST, port: +PGPORT, user: 'postgres', password: POSTGRES_PASSWORD, database: 'postgres' })
await admin.connect()
const exists = (await admin.query('SELECT 1 FROM pg_roles WHERE rolname = $1', [PGUSER])).rowCount > 0
await admin.query(`${exists ? 'ALTER' : 'CREATE'} ROLE ${ident(PGUSER)} WITH LOGIN PASSWORD ${literal(PGPASSWORD)}`)
await admin.query(`DROP DATABASE IF EXISTS ${ident(PGDATABASE)} WITH (FORCE)`)
await admin.query(`CREATE DATABASE ${ident(PGDATABASE)} OWNER ${ident(PGUSER)} ENCODING 'UTF8' TEMPLATE template0`)
await admin.end()
console.log(`database "${PGDATABASE}" created, owned by "${PGUSER}"`)

// 2. As the website's user: the schema, then the seed, each in one transaction.
const db = new pg.Client({ host: PGHOST, port: +PGPORT, user: PGUSER, password: PGPASSWORD, database: PGDATABASE })
await db.connect()
await db.query('SET search_path = public')
for (const file of ['schema.sql', 'seed.sql']) {
  const sql = readFileSync(join(here, '..', 'db', file), 'utf8')
  await db.query('BEGIN')
  try { await db.query(sql); await db.query('COMMIT') } catch (e) { await db.query('ROLLBACK'); throw new Error(`${file}: ${e.message}`) }
  console.log(`ran ${file}`)
}
const counts = await db.query(`SELECT
  (SELECT count(*) FROM skills) AS skills, (SELECT count(*) FROM users) AS members,
  (SELECT count(*) FROM swap_sessions) AS sessions, (SELECT count(*) FROM learning_log) AS notes,
  (SELECT count(*) FROM endorsements) AS endorsements, (SELECT count(*) FROM lessons) AS lessons`)
console.log('rows:', counts.rows[0])
await db.end()
