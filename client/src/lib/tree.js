import { SKILL } from '../data/skills'
import { FIELD, areaOfSkill } from '../data/fields'

// Growth of a skill someone taught you. Partners endorse you; mastery needs time and your own confidence.
export const STAGES = ['Wish', 'Sprout', 'Growing', 'Endorsed', 'Mastered']
export const STAGE_HINT = [
  'Not started yet. Find someone who teaches it and swap.',
  'Your first session is done. Two more and it starts growing.',
  'You are practising. Your partner endorses you when you have it.',
  'Your partner confirmed you know it. Five sessions and your own confidence make it mastered.',
  'You could teach this to someone now.',
]

export function learnStage(l) {
  if (!l || !l.sessions) return 0
  if (l.endorsedBy && l.sessions >= 5 && l.confident) return 4
  if (l.endorsedBy) return 3
  if (l.sessions >= 3) return 2
  return 1
}

const KIND_ORDER = { known: 0, learned: 1, wish: 2 }

// Every leaf on the tree: skills you brought (known), skills others taught you (learned), and wishes.
export function treeNodes(me, growth) {
  if (!me) return []
  const g = growth || { learned: {}, taught: {}, wished: {} }
  const start = g.start || '2026-01-01'
  const out = []
  const seen = new Set()
  for (const [skill, l] of Object.entries(g.learned || {})) {
    if (!SKILL[skill] || seen.has(skill)) continue
    seen.add(skill)
    // born: the day the skill first appeared on the tree (a wish that was later learned keeps its place)
    const since = l.since || start, wish = g.wished?.[skill]
    out.push({ id: skill, kind: 'learned', stage: learnStage(l), l, since, born: wish && wish < since ? wish : since, taught: g.taught?.[skill] || [] })
  }
  for (const t of me.teaches) {
    if (!SKILL[t.skill] || seen.has(t.skill)) continue
    seen.add(t.skill)
    // a skill added to the card later carries the day it was added
    out.push({ id: t.skill, kind: 'known', level: t.level, years: t.years, since: t.added || start, born: t.added || start, taught: g.taught?.[t.skill] || [] })
  }
  for (const w of me.wants) {
    if (!SKILL[w.skill] || seen.has(w.skill)) continue
    seen.add(w.skill)
    out.push({ id: w.skill, kind: 'wish', goal: w.goal, since: g.wished?.[w.skill] || start, born: g.wished?.[w.skill] || start, taught: [] })
  }
  return out.map((n) => ({ ...n, field: SKILL[n.id].field, area: FIELD[SKILL[n.id].field].area }))
}

export const nodeRadius = (n) => (n.kind === 'known' ? 23 + n.level * 2.5 : n.kind === 'learned' ? 23 + n.stage * 2.5 : 21)

// Growth rings: achievements that mark how the tree has grown.
export function growthRings(me, growth) {
  const g = growth || { learned: {}, taught: {}, lessons: [] }
  const learned = Object.values(g.learned || {})
  const sessions = learned.reduce((s, l) => s + (l.sessions || 0), 0)
  const taughtPeople = new Set(Object.values(g.taught || {}).flat().map((t) => t.who)).size
  const mine = [...(me?.teaches || []).map((t) => t.skill), ...Object.keys(g.learned || {})]
  const areas = new Set(mine.map((s) => areaOfSkill(s)?.id).filter(Boolean)).size
  const languages = new Set(mine.filter((s) => SKILL[s]?.field === 'languages')).size
  const mastered = learned.filter((l) => learnStage(l) === 4).length
  const shared = (g.lessons || []).some((l) => l.visibility === 'public') ? 1 : 0
  const endorsed = learned.some((l) => l.endorsedBy) ? 1 : 0
  const ring = (id, name, desc, now, of) => ({ id, name, desc, now: Math.min(now, of), of, done: now >= of })
  return [
    ring('first', 'First swap', 'Log your first session', sessions, 1),
    ring('ten', 'Ten sessions', 'Log ten sessions in total', sessions, 10),
    ring('endorsed', 'Endorsed', 'Get a partner to endorse a skill', endorsed, 1),
    ring('cross', 'Cross-pollinator', 'Grow skills in four areas', areas, 4),
    ring('roots', 'Honest roots', 'Share a lesson on your profile', shared, 1),
    ring('teacher', 'Teacher', 'Teach ten different people', taughtPeople, 10),
    ring('master', 'Mastery', 'Master three skills others taught you', mastered, 3),
    ring('polyglot', 'Polyglot', 'Know or learn three languages', languages, 3),
  ]
}

const norm = (iso) => (iso.length === 7 ? `${iso}-01` : iso)
export const monthLabel = (iso) => new Date(`${norm(iso)}T00:00`).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
export const dayLabel = (iso) => new Date(`${norm(iso)}T00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
