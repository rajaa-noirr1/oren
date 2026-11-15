// End-to-end tests: a real API on a real database. Run with the API running (npm run dev), then: npm test
// Each run signs up a fresh member, so it can run again and again.
import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import pg from 'pg'

const BASE = process.env.API_URL || `http://localhost:${process.env.API_PORT || 4000}/api`
const tag = Date.now().toString(36)

// a tiny browser: keeps its sign-in cookie between requests
function client() {
  let cookie = ''
  return async (path, { method = 'GET', body } = {}) => {
    const res = await fetch(BASE + path, { method, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}) }, body: body ? JSON.stringify(body) : undefined })
    const set = res.headers.get('set-cookie')
    if (set) cookie = set.split(';')[0]
    return { status: res.status, data: await res.json().catch(() => ({})) }
  }
}

const card = (handle) => ({
  name: 'Test Member', handle, headline: 'Testing OREN', field: 'backend', city: 'Erbil', country: 'Iraq', tz: 3,
  languages: ['English', 'Kurdish'], bio: '', style: '', avatarSeed: handle,
  education: [{ kind: 'Degree', title: 'BSc Testing', place: 'Somewhere', from: '2020', to: 'now' }],
  teaches: [{ skill: 'git', level: 3, years: 2 }, { skill: 'python', level: 2, years: 1 }],
  wants: [{ skill: 'java', goal: 'Pass OOP' }, { skill: 'docker', goal: '' }],
  avail: ['tue-e', 'sat-m'], format: ['online'],
})

test('guests can load the site', async () => {
  const api = client()
  const { status, data } = await api('/state')
  assert.equal(status, 200)
  assert.equal(data.me, null)
  assert.ok(data.people.length >= 54, 'sample members are there')
  assert.ok(data.counts.field.backend > 0, 'the database counts members per field')
  const sam = data.people.find((p) => p.handle === 'samokoye')
  assert.deepEqual(sam.teaches[0], { skill: 'java', level: 4, years: 6, added: '2026-03-01' })
})

test('the demo member has the history the website shows', async () => {
  const api = client()
  const { data } = await api('/auth/demo', { method: 'POST' })
  assert.equal(data.me.handle, 'arinavarro')
  const java = data.growth.learned.java
  assert.equal(java.sessions, 7)
  assert.equal(java.endorsedBy, 'sofiajava', 'the trigger endorsed Ari after the third session')
  assert.equal(java.stage, 4, 'endorsed, 5+ sessions and confident: mastered')
  assert.equal(data.growth.lessons.length, 3)
  assert.ok(data.sessions.some((s) => s.status === 'confirmed' && s.with === 'danarashid'), 'an upcoming session')
  assert.ok(data.threads.danarashid?.length >= 2, 'a conversation')
})

test('signing up, matching, a session and the skill tree', async () => {
  const api = client()
  const handle = `t_${tag}`
  const email = `${handle}@oren.test`
  let r = await api('/auth/register', { method: 'POST', body: { email, password: 'correct horse battery', card: card(handle) } })
  assert.equal(r.status, 201, JSON.stringify(r.data))
  assert.equal(r.data.me.handle, handle)
  assert.deepEqual(r.data.me.avail, ['tue-e', 'sat-m'])
  assert.ok(r.data.people.some((p) => p.likesYou), 'friendly sample members already liked the newcomer (trigger)')

  // the same email again is refused in plain words
  const again = await client()('/auth/register', { method: 'POST', body: { email: email.toUpperCase(), password: 'another password', card: card(`${handle}x`) } })
  assert.equal(again.status, 400)
  assert.match(again.data.error, /already has an account/)

  // a session needs a match first: the database refuses it
  const stranger = r.data.people.find((p) => !p.likesYou && p.teaches.some((t) => t.skill !== 'git'))
  r = await api('/sessions', { method: 'POST', body: { with: stranger.handle, learn: stranger.teaches[0].skill, teach: 'git', date: '2026-12-01', time: '19:00', mins: 60, where: 'online' } })
  assert.equal(r.status, 400)
  assert.match(r.data.error, /have not matched/)

  // liking someone who already liked you is a match, and they say hello
  const fan = (await api('/state')).data.people.find((p) => p.likesYou && p.teaches.length)
  r = await api(`/decisions/${fan.handle}`, { method: 'PUT', body: { decision: 'swap' } })
  assert.equal(r.data.matched, true)
  assert.equal(r.data.decisions[fan.handle], 'swap')
  assert.equal(r.data.threads[fan.handle][0].from, 'them')

  // three sessions, three notes: the tree grows and the sample partner endorses (trigger)
  const learn = fan.teaches.find((t) => t.skill !== 'git').skill
  for (let k = 0; k < 3; k++) {
    r = await api('/sessions', { method: 'POST', body: { with: fan.handle, learn, teach: 'git', date: `2026-12-0${k + 1}`, time: '19:00', mins: 60, where: 'online' } })
    assert.equal(r.status, 201, JSON.stringify(r.data))
    assert.equal(r.data.confirmedBy, fan.name.split(' ')[0], 'sample members confirm at once (trigger)')
    const s = r.data.sessions.filter((x) => x.with === fan.handle && x.status === 'confirmed').at(-1)
    r = await api(`/sessions/${s.id}/log`, { method: 'POST', body: { text: `Note number ${k + 1} about ${learn}.` } })
    assert.equal(r.status, 200, JSON.stringify(r.data))
    assert.equal(r.data.skill, learn, 'the trigger filled in the skill the partner taught')
  }
  assert.equal(r.data.endorsedBy, fan.name.split(' ')[0])
  const leaf = r.data.growth.learned[learn]
  assert.equal(leaf.sessions, 3)
  assert.equal(leaf.stage, 3)
  assert.equal(r.data.growth.taught.git[0].who, fan.handle, 'teaching git grew a fruit')

  // lessons: plant, share, delete
  r = await api('/lessons', { method: 'POST', body: { title: 'Pushed on Friday', skill: 'git', tried: 'x', why: 'y', lesson: 'Never on Friday.', visibility: 'private' } })
  const lesson = r.data.growth.lessons.at(-1)
  r = await api(`/lessons/${lesson.id}`, { method: 'PATCH', body: { visibility: 'public' } })
  assert.equal(r.data.growth.lessons.at(-1).visibility, 'public')
  r = await api(`/lessons/${lesson.id}`, { method: 'DELETE' })
  assert.equal(r.data.growth.lessons.length, 0)

  // editing the card keeps the day each skill was added
  const me = (await api('/state')).data.me
  r = await api('/me', { method: 'PUT', body: { card: { ...me, teaches: [...me.teaches, { skill: 'sql', level: 2, years: 1 }] } } })
  assert.equal(r.status, 200, JSON.stringify(r.data))
  assert.equal(r.data.me.teaches.length, 3)
  assert.equal(r.data.me.teaches[0].added, me.teaches[0].added)

  // the database's matching and three-way loops
  r = await api('/fit')
  assert.ok(r.data.fit.length > 50)
  assert.ok(r.data.fit.every((f, i, a) => i === 0 || a[i - 1].score >= f.score), 'sorted by score')
  r = await api('/loops')
  assert.ok(Array.isArray(r.data.loops))

  // sign out, then back in with the password; a wrong password is refused
  await api('/auth/logout', { method: 'POST' })
  assert.equal((await api('/state')).data.me, null)
  assert.equal((await api('/auth/login', { method: 'POST', body: { email, password: 'wrong password' } })).status, 401)
  r = await api('/auth/login', { method: 'POST', body: { email, password: 'correct horse battery' } })
  assert.equal(r.data.me.handle, handle)
})

test('passwords and sign-in tokens are never stored in plain text', async () => {
  const db = new pg.Client()
  await db.connect()
  const u = (await db.query("SELECT password_hash FROM users WHERE email LIKE 't\\_%@oren.test' ORDER BY id DESC LIMIT 1")).rows[0]
  assert.match(u.password_hash, /^\$2[aby]\$10\$/, 'bcrypt hash')
  const t = (await db.query('SELECT token_hash FROM auth_sessions ORDER BY created_at DESC LIMIT 1')).rows[0]
  assert.match(t.token_hash, /^[0-9a-f]{64}$/, 'sha-256 of the token')
  await db.end()
})

// Leave no test members behind: deleting the account removes its swipes, sessions, notes and lessons too (ON DELETE CASCADE).
after(async () => {
  const db = new pg.Client()
  await db.connect()
  await db.query("DELETE FROM users WHERE email LIKE 't\\_%@oren.test'")
  await db.end()
})
