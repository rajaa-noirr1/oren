// How two members trade. Everything here mirrors queries the backend will run later.

export const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
export const DAY_NAME = { sun: 'Sun', mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat' }
export const PARTS = [
  { id: 'm', name: 'Morning', hours: '8–12' },
  { id: 'a', name: 'Afternoon', hours: '12–17' },
  { id: 'e', name: 'Evening', hours: '17–22' },
]

export const KIND = {
  perfect: { label: 'Perfect swap', note: 'You each teach something the other wants.' },
  get: { label: 'Can teach you', note: 'They teach something on your list, but want skills you do not have yet.' },
  give: { label: 'Wants your skills', note: 'They want something you know, but teach nothing on your list yet.' },
  none: { label: 'No overlap yet', note: 'Add more skills to your card to find trades.' },
}

export function trade(me, p) {
  if (!me || !p || me.id === p.id) return { give: [], get: [], kind: 'none', score: null, slots: [] }
  const myTeach = new Map(me.teaches.map((t) => [t.skill, t]))
  const myWant = new Set(me.wants.map((w) => w.skill))
  const get = p.teaches.filter((t) => myWant.has(t.skill))
  const give = p.wants.filter((w) => myTeach.has(w.skill)).map((w) => ({ ...w, level: myTeach.get(w.skill).level }))
  const kind = get.length && give.length ? 'perfect' : get.length ? 'get' : give.length ? 'give' : 'none'
  const slots = (me.avail || []).filter((s) => (p.avail || []).includes(s))
  const sharedLanguage = (me.languages || []).some((l) => p.languages.includes(l))
  const tzGap = Math.abs((me.tz ?? 0) - (p.tz ?? 0))

  let score = { perfect: 62, get: 34, give: 24, none: 4 }[kind]
  score += Math.min(2, Math.max(0, get.length + give.length - 1)) * 5
  score += Math.max(0, ...get.map((t) => t.level)) * 3
  score += Math.min(3, slots.length) * 3
  score += sharedLanguage ? 4 : 0
  score += tzGap <= 2 ? 5 : tzGap <= 5 ? 2 : 0
  return { give, get, kind, score: Math.min(99, score), slots, sharedLanguage, tzGap }
}

// Three-way trades: you teach A, A teaches B, B teaches you.
// "Pure" loops are trades that could not happen as a direct swap.
export function findLoops(me, people, limit = 3) {
  if (!me) return []
  const myTeach = new Set(me.teaches.map((t) => t.skill))
  const myWant = new Set(me.wants.map((w) => w.skill))
  const teachesTo = (from, to) => from.find((t) => to.has(t.skill))
  const out = []
  for (const a of people) {
    const youToA = a.wants.find((w) => myTeach.has(w.skill))
    if (!youToA) continue
    for (const b of people) {
      if (b.id === a.id) continue
      const bWants = new Set(b.wants.map((w) => w.skill))
      const aToB = teachesTo(a.teaches, bWants)
      const bToYou = teachesTo(b.teaches, myWant)
      if (!aToB || !bToYou) continue
      const pure = !a.teaches.some((t) => myWant.has(t.skill)) && !b.wants.some((w) => myTeach.has(w.skill))
      out.push({ a, b, youToA: youToA.skill, aToB: aToB.skill, bToYou: bToYou.skill, pure, weight: (pure ? 10 : 0) + aToB.level + bToYou.level })
    }
  }
  return out.sort((x, y) => y.weight - x.weight).slice(0, limit)
}

export const tzLabel = (tz) => {
  const sign = tz < 0 ? '−' : '+'
  const abs = Math.abs(tz)
  const h = Math.floor(abs)
  const m = Math.round((abs - h) * 60)
  return `UTC${sign}${h}${m ? ':' + String(m).padStart(2, '0') : ''}`
}

export const localTime = (tz, now = new Date()) => {
  const utc = now.getTime() + now.getTimezoneOffset() * 60000
  const d = new Date(utc + tz * 3600000)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export const slotLabel = (code) => {
  const [d, p] = code.split('-')
  return `${DAY_NAME[d]} ${PARTS.find((x) => x.id === p)?.name.toLowerCase()}`
}

export function hash(str = '') {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
