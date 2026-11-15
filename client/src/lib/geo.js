import { hash } from './match'

// Small 2D helpers shared by the skill tree's geometry.
export const rad = (d) => (d * Math.PI) / 180
export const f1 = (n) => Math.round(n * 10) / 10
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
export const lerp = (a, b, t) => a + (b - a) * t
export const V = (x, y) => ({ x, y })
export const add = (a, b, k = 1) => V(a.x + b.x * k, a.y + b.y * k)
export const sub = (a, b) => V(a.x - b.x, a.y - b.y)
export const mag = (v) => Math.hypot(v.x, v.y)
export const unit = (v) => { const l = mag(v) || 1; return V(v.x / l, v.y / l) }
export const dot = (a, b) => a.x * b.x + a.y * b.y
export const mix = (a, b, t) => V(lerp(a.x, b.x, t), lerp(a.y, b.y, t))
// The right-hand side of a direction of travel (the screen's y axis points down).
export const side = (d) => V(-d.y, d.x)
export const ease = (t) => { const c = clamp(t, 0, 1); return c * c * (3 - 2 * c) }
export const pt = (p) => `${f1(p.x)} ${f1(p.y)}`
export const centre = (ps) => V(ps.reduce((s, p) => s + p.x, 0) / ps.length, ps.reduce((s, p) => s + p.y, 0) / ps.length)

// Seeded random numbers, so a person's tree looks the same on every visit.
export function rng(seed) {
  let a = hash(String(seed)) || 1
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// A branch's centre line: a cubic curve that leaves `a` heading `da` and arrives at `b` heading `db`,
// with a slight wobble that fades out at both ends so joints stay clean.
export function curve(a, da, b, db, o = {}) {
  const { k0 = 0.38, k1 = 0.38, wob = 0, ph = 0 } = o
  const L = mag(sub(b, a)) || 1
  const c1 = add(a, da, L * k0), c2 = add(b, db, -L * k1)
  const bez = (t) => {
    const u = 1 - t
    return V(u * u * u * a.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * b.x, u * u * u * a.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * b.y)
  }
  const bezTan = (t) => {
    const u = 1 - t
    return V(3 * u * u * (c1.x - a.x) + 6 * u * t * (c2.x - c1.x) + 3 * t * t * (b.x - c2.x), 3 * u * u * (c1.y - a.y) + 6 * u * t * (c2.y - c1.y) + 3 * t * t * (b.y - c2.y))
  }
  const pos = wob ? (t) => add(bez(t), side(unit(bezTan(t))), Math.sin(Math.PI * t) ** 2 * Math.sin(t * 6.5 + ph) * wob) : bez
  const tan = (t) => unit(sub(pos(Math.min(1, t + 0.006)), pos(Math.max(0, t - 0.006))))
  return { a, b, L, pos, tan }
}

// A tapered shape that follows a curve. Every ribbon winds the same way, so overlapping ones fill as one piece.
export function ribbon(c, width, steps = 14) {
  const l = [], r = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps, p = c.pos(t), n = side(c.tan(t)), h = width(t) / 2
    l.push(pt(add(p, n, -h)))
    r.push(pt(add(p, n, h)))
  }
  return `M${l.join('L')}L${r.reverse().join('L')}Z`
}

// A filled circle as path data (wound the same way as ribbons).
export const disc = (p, r) => `M${f1(p.x - r)} ${f1(p.y)}a${f1(r)} ${f1(r)} 0 1 1 ${f1(2 * r)} 0a${f1(r)} ${f1(r)} 0 1 1 ${f1(-2 * r)} 0Z`

// A pointed leaf growing from `p` in the direction `ang`.
export function leafShape(p, ang, l, w) {
  const dx = Math.cos(ang), dy = Math.sin(ang)
  const tip = V(p.x + dx * l, p.y + dy * l), m = V(p.x + dx * l * 0.42, p.y + dy * l * 0.42)
  return `M${pt(p)}Q${f1(m.x - dy * w)} ${f1(m.y + dx * w)} ${pt(tip)}Q${f1(m.x + dy * w)} ${f1(m.y - dx * w)} ${pt(p)}Z`
}

// A smooth line through a list of points.
export function spline(ps) {
  if (ps.length < 3) return `M${ps.map(pt).join('L')}`
  let d = `M${pt(ps[0])}L${pt(mix(ps[0], ps[1], 0.5))}`
  for (let i = 1; i < ps.length - 1; i++) d += `Q${pt(ps[i])} ${pt(mix(ps[i], ps[i + 1], 0.5))}`
  return `${d}L${pt(ps[ps.length - 1])}`
}

// How far along a line (0 to 1) each of its points sits.
export function fractions(ps) {
  const acc = [0]
  for (let i = 1; i < ps.length; i++) acc.push(acc[i - 1] + mag(sub(ps[i], ps[i - 1])))
  const total = acc[acc.length - 1] || 1
  return acc.map((v) => v / total)
}

// Area two boxes share.
export const overlap = (a, b) => Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)) * Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0))

// Push boxes apart until none overlap. Each item has x, y, hw, hh and an optional vertical offset `off`.
// `biasX` above 1 prefers moving things sideways; with `sideways`, whatever still overlaps at the end moves sideways only.
export function spreadOut(items, { rounds = 240, gapX = 10, gapY = 6, pull = 0.008, biasX = 1, sideways = false, after } = {}) {
  const pass = (sideways) => {
    for (let a = 0; a < items.length; a++) {
      for (let b = a + 1; b < items.length; b++) {
        const p = items[a], q = items[b]
        const dx = q.x - p.x, dy = q.y + (q.off || 0) - p.y - (p.off || 0)
        const ox = p.hw + q.hw + gapX - Math.abs(dx), oy = p.hh + q.hh + gapY - Math.abs(dy)
        if (ox <= 0 || oy <= 0) continue
        if (sideways || ox < oy * biasX) { const s = (dx < 0 ? -1 : 1) * ox * 0.25; p.x -= s; q.x += s } else { const s = (dy < 0 ? -1 : 1) * oy * 0.25; p.y -= s; q.y += s }
      }
    }
  }
  for (let it = 0; it < rounds; it++) {
    pass(false)
    for (const p of items) {
      p.x += (p.x0 - p.x) * pull
      p.y += (p.y0 - p.y) * pull
      after?.(p)
    }
  }
  for (let it = 0; sideways && it < 260; it++) {
    pass(true)
    for (const p of items) after?.(p)
  }
}
