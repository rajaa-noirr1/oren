// OREN's API as plain functions over a database connection. The same code runs in two places:
//   • on the laptop, behind Express, against PostgreSQL 17             (server/src/index.js)
//   • on GitHub Pages, inside the visitor's browser, against PGlite      (client/src/lib/browser-api.js)
// Every query is plain SQL. The database enforces the rules (checks, foreign keys, triggers)
// and builds member cards and skill trees in its views and functions.
//
// createApi({ query, transaction, hashPassword, checkPassword })
//   query(text, params)      → { rows }
//   transaction(fn)          → runs fn(client) in one transaction; client.query(text, params) → { rows }
// returns { handle(method, path, { userId, body }) → { status, data, signIn?, signOut? } }

const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
const DECISION_IN = { swap: 'like', pass: 'pass', save: 'save' }
const DECISION_OUT = { like: 'swap', pass: 'pass', save: 'save' }
const firstName = (name) => String(name).split(' ')[0]
const year = (v) => (/^\d{4}$/.test(String(v || '').trim()) ? +String(v).trim() : null)
const lessonId = (v) => Number(String(v).replace(/^l/, ''))

// Checks a card before it reaches the database, with messages people can act on.
export function cardProblem(card) {
  if (!card || typeof card !== 'object') return 'Send your card.'
  if (!card.name?.trim()) return 'Add your name.'
  if (!/^[a-z0-9._]{3,24}$/.test(card.handle || '')) return 'Pick a username: 3 to 24 lowercase letters, numbers, dots or underscores.'
  if (!card.field) return 'Pick the field that fits you best.'
  if (!card.teaches?.length) return 'Pick at least one skill you can teach.'
  if (!card.wants?.length) return 'Pick at least one skill you want to learn.'
  if (card.teaches.some((t) => !(t.level >= 1 && t.level <= 4))) return 'Give every skill you teach a level.'
  if (!card.format?.length) return 'Say whether you meet online, in person or both.'
  return null
}

// The database's rules, said in plain words.
export function explainError(err) {
  const known = {
    23505: err.constraint === 'users_email_key' ? 'That email already has an account. Sign in instead.' : err.constraint === 'users_handle_key' ? 'That username is taken. Try another one.' : 'That already exists.',
    23503: 'Something on the card does not exist any more (a skill or a field). Refresh and try again.',
    23514: `The database refused a value (${err.constraint || 'a check'}).`,
    P0001: /have not matched/.test(err.message) ? 'You two have not matched yet. Swap with each other first.' : /did not take part/.test(err.message) ? 'That session is not yours.' : err.message,
  }[err.code]
  return known || null
}

export function createApi({ query, transaction, hashPassword, checkPassword }) {
  const q = (text, params) => query(text, params)
  const one = async (text, params) => (await q(text, params)).rows[0] ?? null
  const userByHandle = (handle) => one('SELECT id, handle, name, is_sample FROM users WHERE handle = $1', [handle])

  // ── Reading ──

  // Every other member's card, plus whether they already liked the viewer (a like is a swap request).
  async function readPeople(viewer) {
    const { rows } = await q(`
      SELECT mc.card || jsonb_build_object(
               'likesYou', EXISTS (SELECT 1 FROM swipes s WHERE s.swiper_id = mc.user_id AND s.target_id = $1 AND s.decision = 'like'),
               'requestedYou', EXISTS (SELECT 1 FROM swipes s WHERE s.swiper_id = mc.user_id AND s.target_id = $1 AND s.decision = 'like')) AS card
      FROM member_cards mc
      WHERE mc.user_id IS DISTINCT FROM $1
      ORDER BY mc.user_id`, [viewer])
    return rows.map((r) => r.card)
  }

  const readCounts = async () => (await one(`SELECT jsonb_build_object(
      'area', (SELECT jsonb_object_agg(area_id, members) FROM area_counts),
      'field', (SELECT jsonb_object_agg(field_id, members) FROM field_counts)) AS counts`)).counts

  async function readMe(viewer) {
    const row = await one(`SELECT mc.card || jsonb_build_object('id', 'me', 'email', u.email) AS card
      FROM member_cards mc JOIN users u ON u.id = mc.user_id WHERE mc.user_id = $1`, [viewer])
    return row?.card ?? null
  }

  const readGrowth = async (viewer) => (await one('SELECT skill_tree($1) AS tree', [viewer])).tree

  async function readDecisions(viewer) {
    const { rows } = await q('SELECT u.handle, s.decision FROM swipes s JOIN users u ON u.id = s.target_id WHERE s.swiper_id = $1', [viewer])
    return Object.fromEntries(rows.map((r) => [r.handle, DECISION_OUT[r.decision]]))
  }

  // Sessions from the viewer's side, in their own time zone.
  async function readSessions(viewer) {
    const { rows } = await q(`
      WITH me AS (SELECT tz_offset FROM users WHERE id = $1)
      SELECT s.id::text AS id, o.handle AS "with",
             CASE WHEN s.proposer_id = $1 THEN s.proposer_teaches ELSE s.partner_teaches END AS teach,
             CASE WHEN s.proposer_id = $1 THEN s.partner_teaches ELSE s.proposer_teaches END AS learn,
             to_char((s.starts_at AT TIME ZONE 'UTC') + make_interval(mins => (me.tz_offset * 60)::int), 'YYYY-MM-DD') AS date,
             to_char((s.starts_at AT TIME ZONE 'UTC') + make_interval(mins => (me.tz_offset * 60)::int), 'HH24:MI') AS time,
             s.minutes / 2 AS mins, s.format AS "where", s.place, s.meeting_link AS link, s.invite_note AS note,
             CASE s.status WHEN 'proposed' THEN 'pending' ELSE s.status END AS status,
             (SELECT l.note FROM learning_log l WHERE l.session_id = s.id AND l.learner_id = $1) AS logged,
             (extract(epoch FROM s.created_at) * 1000)::bigint AS "createdAt"
      FROM swap_sessions s
      CROSS JOIN me
      JOIN users o ON o.id = CASE WHEN s.proposer_id = $1 THEN s.partner_id ELSE s.proposer_id END
      WHERE (s.proposer_id = $1 OR s.partner_id = $1) AND s.status <> 'cancelled'
      ORDER BY s.starts_at`, [viewer])
    return rows
  }

  async function readThreads(viewer) {
    const { rows } = await q(`
      SELECT o.handle, CASE WHEN m.sender_id = $1 THEN 'me' ELSE 'them' END AS "from", m.body AS text,
             (extract(epoch FROM m.sent_at) * 1000)::bigint AS at
      FROM messages m
      JOIN users o ON o.id = CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END
      WHERE m.sender_id = $1 OR m.receiver_id = $1
      ORDER BY m.sent_at, m.id`, [viewer])
    const threads = {}
    for (const r of rows) (threads[r.handle] ||= []).push({ from: r.from, text: r.text, at: r.at })
    return threads
  }

  // Everything the website needs on load, for a guest (viewer = null) or a signed-in member.
  async function readState(viewer) {
    const [people, counts] = await Promise.all([readPeople(viewer), readCounts()])
    if (!viewer) return { me: null, growth: null, people, counts, decisions: {}, sessions: [], threads: {} }
    const [me, growth, decisions, sessions, threads] = await Promise.all([readMe(viewer), readGrowth(viewer), readDecisions(viewer), readSessions(viewer), readThreads(viewer)])
    return { me, growth, people, counts, decisions, sessions, threads }
  }

  // ── Saving a card ──
  // Writes the users row, then languages, education, availability and skills.
  // Skills keep the day they were first added, so the skill tree does not rearrange itself.
  async function writeCard(c, userId, card) {
    await c.query(`UPDATE users SET handle = $2, name = $3, headline = $4, bio = $5, teach_style = $6, city = $7, country = $8,
        tz_offset = $9, main_field = $10, meets_online = $11, meets_in_person = $12, github = $13, avatar_seed = $14
      WHERE id = $1`, [userId, card.handle, card.name.trim(), card.headline?.trim() || null, card.bio?.trim() || null, card.style?.trim() || null,
      card.city?.trim() || null, card.country?.trim() || null, Number(card.tz) || 0, card.field || null,
      (card.format || []).includes('online'), (card.format || []).includes('in-person'), card.github || null, card.avatarSeed || null])
    await c.query('DELETE FROM user_languages WHERE user_id = $1', [userId])
    const langs = [...new Set((card.languages || []).map((l) => String(l).trim()).filter(Boolean))]
    if (langs.length) await c.query('INSERT INTO user_languages (user_id, language) SELECT $1, unnest($2::text[])', [userId, langs])

    await c.query('DELETE FROM education WHERE user_id = $1', [userId])
    const edu = (card.education || []).filter((e) => e.title?.trim())
    for (const [i, e] of edu.entries()) {
      const ongoing = String(e.to || '').trim().toLowerCase() === 'now'
      await c.query('INSERT INTO education (user_id, kind, title, place, from_year, to_year, ongoing, position) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [userId, e.kind, e.title.trim(), e.place?.trim() || null, year(e.from), ongoing ? null : year(e.to), ongoing, i])
    }

    await c.query('DELETE FROM availability WHERE user_id = $1', [userId])
    const slots = [...new Set(card.avail || [])].map((code) => { const [d, part] = String(code).split('-'); return [DAYS.indexOf(d), part] }).filter(([d, p]) => d >= 0 && p && 'mae'.includes(p))
    if (slots.length) await c.query('INSERT INTO availability (user_id, day, part) SELECT $1, unnest($2::smallint[]), unnest($3::text[])', [userId, slots.map((s) => s[0]), slots.map((s) => s[1])])

    const skills = [
      ...(card.teaches || []).map((t, i) => ({ skill: t.skill, role: 'teach', level: t.level, years: t.years ?? 0, goal: null, position: i })),
      ...(card.wants || []).map((w, i) => ({ skill: w.skill, role: 'learn', level: null, years: null, goal: w.goal?.trim() || null, position: i })),
    ]
    await c.query('DELETE FROM user_skills WHERE user_id = $1 AND NOT (skill_id = ANY ($2::text[]))', [userId, skills.map((s) => s.skill)])
    for (const s of skills) {
      await c.query(`INSERT INTO user_skills (user_id, skill_id, role, level, years, goal, position) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (user_id, skill_id) DO UPDATE SET role = EXCLUDED.role, level = EXCLUDED.level, years = EXCLUDED.years, goal = EXCLUDED.goal,
          position = EXCLUDED.position, added_on = CASE WHEN user_skills.role = EXCLUDED.role THEN user_skills.added_on ELSE current_date END`,
      [userId, s.skill, s.role, s.level, s.years, s.goal, s.position])
    }
  }

  // ── Routes ──
  const bad = (error, status = 400) => ({ status, data: { error } })
  const routes = [
    // Everything for the first screen
    ['GET', '/state', false, async ({ userId }) => readState(userId)],

    // Sign-in
    ['POST', '/auth/register', false, async ({ body }) => {
      const { email, password, card } = body
      if (!/^\S+@\S+\.\S+$/.test(email || '')) return bad('Add an email address like name@example.com.')
      if (String(password || '').length < 8) return bad('Use a password with at least 8 characters.')
      const problem = cardProblem(card)
      if (problem) return bad(problem)
      const hash = await hashPassword(password)
      const id = await transaction(async (c) => {
        const { rows } = await c.query(`INSERT INTO users (handle, email, password_hash, name, member_no)
          VALUES ($1, $2, $3, $4, (SELECT lpad((COALESCE(max(member_no::int), 0) + 1)::text, 4, '0') FROM users WHERE member_no ~ '^[0-9]+$'))
          RETURNING id`, [card.handle, email.trim(), hash, card.name.trim()])
        await writeCard(c, rows[0].id, card)
        return rows[0].id
      })
      return { status: 201, data: await readState(id), signIn: id }
    }],
    ['POST', '/auth/login', false, async ({ body }) => {
      const user = await one('SELECT id, password_hash FROM users WHERE lower(email) = lower($1)', [String(body.email || '').trim()])
      if (!user || !(await checkPassword(String(body.password || ''), user.password_hash))) return bad('That email and password do not match.', 401)
      return { data: await readState(user.id), signIn: user.id }
    }],
    // The demo member, for presentations: signs in as Ari without a password.
    ['POST', '/auth/demo', false, async () => {
      const user = await one("SELECT id FROM users WHERE email = 'demo@oren.test'")
      if (!user) return bad('The demo member is missing. Rebuild the database (npm run db:reset).', 404)
      return { data: await readState(user.id), signIn: user.id }
    }],
    ['POST', '/auth/logout', false, async () => ({ data: await readState(null), signOut: true })],

    // Your card
    ['PUT', '/me', true, async ({ userId, body }) => {
      const problem = cardProblem(body.card)
      if (problem) return bad(problem)
      await transaction((c) => writeCard(c, userId, body.card))
      const [me, growth] = await Promise.all([readMe(userId), readGrowth(userId)])
      return { me, growth }
    }],

    // Swiping: swap (like), pass or save
    ['PUT', '/decisions/:handle', true, async ({ userId, body, params }) => {
      const decision = DECISION_IN[body.decision]
      const other = await userByHandle(params.handle)
      if (!decision || !other) return bad('Pick swap, pass or save for an existing member.')
      await q(`INSERT INTO swipes (swiper_id, target_id, decision) VALUES ($1, $2, $3)
        ON CONFLICT (swiper_id, target_id) DO UPDATE SET decision = EXCLUDED.decision, decided_at = now()`, [userId, other.id, decision])
      const matched = !!(await one('SELECT 1 FROM matches WHERE user_id = $1 AND partner_id = $2', [userId, other.id]))
      // a sample member says hello when you match
      if (matched && other.is_sample && !(await one('SELECT 1 FROM messages WHERE sender_id = $1 AND receiver_id = $2', [other.id, userId]))) {
        await q('INSERT INTO messages (sender_id, receiver_id, body) VALUES ($1, $2, $3)', [other.id, userId, body.greeting || 'Hey! Happy to trade. Which evening works for you?'])
      }
      return { matched, decisions: await readDecisions(userId), threads: await readThreads(userId) }
    }],
    ['DELETE', '/decisions/:handle', true, async ({ userId, params }) => {
      await q('DELETE FROM swipes WHERE swiper_id = $1 AND target_id = (SELECT id FROM users WHERE handle = $2)', [userId, params.handle])
      return { decisions: await readDecisions(userId) }
    }],

    // Messages
    ['POST', '/messages/:handle', true, async ({ userId, body, params }) => {
      const other = await userByHandle(params.handle)
      const text = String(body.text || '').trim()
      if (!other || !text) return bad('Write a message to an existing member.')
      await q('INSERT INTO messages (sender_id, receiver_id, body) VALUES ($1, $2, $3)', [userId, other.id, text])
      // sample members answer once in each conversation, and always acknowledge a session invite
      if (other.is_sample) {
        const replies = (await one('SELECT count(*)::int AS n FROM messages WHERE sender_id = $1 AND receiver_id = $2', [other.id, userId])).n
        const answer = body.reply || (replies < 2 ? 'Sounds good. Send me a session invite when you are ready.' : null)
        if (answer) await q("INSERT INTO messages (sender_id, receiver_id, body, sent_at) VALUES ($1, $2, $3, now() + interval '1 second')", [other.id, userId, answer])
      }
      return { threads: await readThreads(userId) }
    }],

    // Swap sessions
    ['POST', '/sessions', true, async ({ userId, body: s }) => {
      const other = await userByHandle(s.with)
      if (!other) return bad('Pick who the session is with.')
      if (!/^\d{4}-\d{2}-\d{2}$/.test(s.date || '') || !/^\d{2}:\d{2}$/.test(s.time || '')) return bad('Pick a day and a time.')
      await q(`INSERT INTO swap_sessions (proposer_id, partner_id, proposer_teaches, partner_teaches, starts_at, minutes, format, meeting_link, place, invite_note)
        SELECT $1, $2, $3, $4, (($5 || ' ' || $6)::timestamp - make_interval(mins => (u.tz_offset * 60)::int)) AT TIME ZONE 'UTC',
               $7, $8, $9, $10, $11
        FROM users u WHERE u.id = $1`,
      [userId, other.id, s.teach, s.learn, s.date, s.time, (Number(s.mins) || 60) * 2, s.where === 'in-person' ? 'in-person' : 'online', s.link || null, s.place || null, s.note || null])
      return { status: 201, data: { sessions: await readSessions(userId), confirmedBy: other.is_sample ? firstName(other.name) : null } }
    }],
    ['DELETE', '/sessions/:id', true, async ({ userId, params }) => {
      await q("UPDATE swap_sessions SET status = 'cancelled' WHERE id = $1 AND (proposer_id = $2 OR partner_id = $2) AND status <> 'completed'", [Number(params.id), userId])
      return { sessions: await readSessions(userId) }
    }],
    // After a session: write down what you learned. The database checks it, completes the session,
    // and (for sample partners) endorses you after your third session together.
    ['POST', '/sessions/:id/log', true, async ({ userId, body, params }) => {
      const text = String(body.text || '').trim()
      if (!text) return bad('Write what you learned.')
      const before = await one('SELECT count(*)::int AS n FROM endorsements WHERE user_id = $1', [userId])
      // the skill is filled in by the learning_log_check trigger: whatever the partner taught in that session
      const row = await one('INSERT INTO learning_log (session_id, learner_id, skill_id, note) VALUES ($1, $2, NULL, $3) RETURNING skill_id', [Number(params.id), userId, text])
      const latest = await one(`SELECT u.name FROM endorsements e JOIN users u ON u.id = e.endorser_id
        WHERE e.user_id = $1 ORDER BY e.endorsed_on DESC, e.skill_id LIMIT 1`, [userId])
      const endorsedNow = (await one('SELECT count(*)::int AS n FROM endorsements WHERE user_id = $1', [userId])).n > before.n
      return { skill: row.skill_id, endorsedBy: endorsedNow ? firstName(latest.name) : null, growth: await readGrowth(userId), sessions: await readSessions(userId) }
    }],

    // The skill tree
    ['PUT', '/confidence/:skill', true, async ({ userId, body, params }) => {
      await q(`INSERT INTO skill_confidence (user_id, skill_id, confident) VALUES ($1, $2, $3)
        ON CONFLICT (user_id, skill_id) DO UPDATE SET confident = EXCLUDED.confident, updated_at = now()`, [userId, params.skill, !!body.confident])
      return { growth: await readGrowth(userId) }
    }],
    ['POST', '/lessons', true, async ({ userId, body: l }) => {
      await q(`INSERT INTO lessons (user_id, skill_id, title, tried, why_failed, learned, photo, visibility, happened_on)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9::date, current_date))`,
      [userId, l.skill, String(l.title || '').trim(), l.tried || null, l.why || null, String(l.lesson || '').trim(), l.photo || null, l.visibility === 'public' ? 'public' : 'private', l.at || null])
      return { status: 201, data: { growth: await readGrowth(userId) } }
    }],
    ['PATCH', '/lessons/:id', true, async ({ userId, body: l, params }) => {
      const cols = { title: 'title', skill: 'skill_id', tried: 'tried', why: 'why_failed', lesson: 'learned', photo: 'photo', visibility: 'visibility' }
      const sets = [], vals = [lessonId(params.id), userId]
      for (const [k, col] of Object.entries(cols)) if (k in l) { vals.push(l[k] === '' ? null : l[k]); sets.push(`${col} = $${vals.length}`) }
      if (sets.length) await q(`UPDATE lessons SET ${sets.join(', ')} WHERE id = $1 AND user_id = $2`, vals)
      return { growth: await readGrowth(userId) }
    }],
    ['DELETE', '/lessons/:id', true, async ({ userId, params }) => {
      await q('DELETE FROM lessons WHERE id = $1 AND user_id = $2', [lessonId(params.id), userId])
      return { growth: await readGrowth(userId) }
    }],

    // Matching, computed by the database
    ['GET', '/fit', true, async ({ userId }) => {
      const { rows } = await q(`SELECT u.handle, f.kind, f.score, f.give, f.get, f.shared_slots, f.shared_language, f.tz_gap
        FROM trade_fit($1) f JOIN users u ON u.id = f.other_id ORDER BY f.score DESC, u.handle`, [userId])
      return { fit: rows }
    }],
    ['GET', '/loops', true, async ({ userId }) => {
      const { rows } = await q(`SELECT (SELECT array_agg(u.handle ORDER BY k) FROM unnest(l.people) WITH ORDINALITY AS p(id, k) JOIN users u ON u.id = p.id) AS people,
          l.skills, l.weight
        FROM swap_loops($1, 2) l ORDER BY l.weight DESC LIMIT 20`, [userId])
      return { loops: rows }
    }],
  ].map(([method, path, member, run]) => {
    const names = []
    const pattern = new RegExp(`^${path.replace(/:([a-z]+)/g, (_, n) => { names.push(n); return '([^/]+)' })}$`)
    return { method, member, run, match: (p) => { const m = pattern.exec(p); return m && Object.fromEntries(names.map((n, i) => [n, decodeURIComponent(m[i + 1])])) } }
  })

  // One request: find the route, check sign-in, run it, and turn database errors into plain words.
  async function handle(method, path, { userId = null, body = {} } = {}) {
    for (const r of routes) {
      if (r.method !== method) continue
      const params = r.match(path)
      if (!params) continue
      if (r.member && !userId) return { status: 401, data: { error: 'Sign in first.' } }
      try {
        const out = await r.run({ userId, body: body || {}, params })
        return out && 'data' in out && ('status' in out || 'signIn' in out || 'signOut' in out) ? { status: 200, ...out } : { status: 200, data: out }
      } catch (err) {
        const known = explainError(err)
        if (known) return { status: 400, data: { error: known } }
        console.error(err)
        return { status: 500, data: { error: 'Something went wrong with the database.' } }
      }
    }
    return { status: 404, data: { error: 'There is no such page in the API.' } }
  }

  return { handle, readState }
}
