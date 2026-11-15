import { SKILL } from '../data/skills'
import { AREAS, AREA } from '../data/fields'
import { nodeRadius } from './tree'
import { rad, clamp, lerp, V, add, sub, mag, unit, dot, side, ease, centre, rng, curve, ribbon, disc, leafShape, spline, fractions, overlap, spreadOut } from './geo'
import { scenery } from './scenery'

// The tree is one organism. Every skill is a strand that starts at a root tip, runs up through the trunk,
// follows a bough and a twig, and ends in a hanging lantern. The origin (0, 0) is where the trunk meets the ground.
const KIND_ORDER = { known: 0, learned: 1, wish: 2 }
const ROOT_FAN = [-80, -57, -31, 0, 31, 57, 80]
const ROOT_LEN = [430, 372, 296, 212, 296, 372, 430]
const SLOT = [0.62, 0.93, 0.34, 0.78]

// Where to cut a row of leaves into boughs. Cuts fall on area borders when there are any,
// so every area of life grows on a bough of its own.
function cuts(group, ways, leftSide) {
  const n = group.length
  let allowed = []
  for (let k = 1; k < n; k++) if (group[k].area !== group[k - 1].area) allowed.push(k)
  if (!allowed.length) allowed = Array.from({ length: n - 1 }, (_, k) => k + 1)
  const cost = (ks) => {
    let prev = 0, c = (leftSide ? -1 : 1) * ks[0] * 1e-3
    for (const k of [...ks, n]) { c += (k - prev - n / (ks.length + 1)) ** 2; prev = k }
    return c
  }
  let best = null
  if (ways === 3 && allowed.length > 1) {
    for (let i = 0; i < allowed.length; i++) {
      for (let j = i + 1; j < allowed.length; j++) {
        const ks = [allowed[i], allowed[j]], c = cost(ks)
        if (!best || c < best.c) best = { c, ks }
      }
    }
    // a lopsided three-way fork looks worse than a clean two-way one
    if (Math.max(best.ks[0], best.ks[1] - best.ks[0], n - best.ks[1]) > n * 0.56) best = null
  }
  if (!best) for (const k of allowed) { const c = cost([k]); if (!best || c < best.c) best = { c, ks: [k] } }
  return best.ks
}

export function growTree(nodes, lessons = [], seed = 'oren') {
  // Every part of the tree draws its randomness from its own stream, named after what it is (a lantern, a branch
  // and the skills on it, a lesson, the sky). Growing one part therefore never reshuffles the others.
  let rand, R
  const stream = (key) => { rand = rng(`${seed}:${key}`); R = (a, b) => a + rand() * (b - a) }
  stream('crown')
  const N = nodes.length

  // ── Crown: where every lantern hangs. Areas sit side by side in the order you first grew them: the first one in
  // the middle, each new one on the outside, alternating sides. Inside an area, skills keep the order you added them. ──
  const at = new Map(nodes.map((n, k) => [n.id, k]))
  const born = (n) => n.born || n.since
  const byTime = (x, y) => (born(x) < born(y) ? -1 : born(x) > born(y) ? 1 : KIND_ORDER[x.kind] - KIND_ORDER[y.kind] || at.get(x.id) - at.get(y.id))
  const groups = AREAS.map((a) => ({ area: a, list: nodes.filter((n) => n.area === a.id).sort(byTime) }))
    .filter((g) => g.list.length)
    .sort((x, y) => byTime(x.list[0], y.list[0]))
  groups.forEach((g, i) => { g.rank = i })
  const seq = []
  groups.forEach((g, i) => (i % 2 ? seq.unshift(g) : seq.push(g)))

  const RX = clamp(230 + 38 * N, 300, 720) + Math.max(0, N - 22) * 16, RY = RX * 0.46
  const trunkH = clamp(120 + 5 * N, 140, 200), trunkW = clamp(34 + 3.6 * N, 38, 104)
  const eq = -trunkH - 26
  const spread = N < 2 ? 0 : rad(Math.min(98, 26 + 9.5 * N))
  const rings = N <= 4 ? [1] : N <= 15 ? [1, 0.6] : [1, 0.74, 0.47]
  const pattern = rings.length === 1 ? [0] : rings.length === 2 ? [0, 1] : [0, 1, 0, 2, 1]

  const leaves = []
  let u = 0
  seq.forEach((g, gi) => {
    if (gi) u += 0.55
    // inner or outer ring depends only on the lantern's place in its own area
    g.list.forEach((n, k) => { leaves.push({ ...n, r: nodeRadius(n), u, ring: pattern[(g.rank + k) % pattern.length] }); u += 1 })
  })
  const span = Math.max(1e-6, u - 1)
  leaves.forEach((p, j) => {
    stream(`leaf:${p.id}`)
    const th = N < 2 ? 0 : (p.u / span - 0.5) * 2 * spread
    const rho = rings[p.ring]
    p.order = j
    p.x = p.x0 = RX * rho * Math.sin(th) + R(-6, 6)
    p.y = p.y0 = eq - RY * rho * Math.cos(th) + R(-6, 6)
    p.lw = Math.round((SKILL[p.id]?.name || p.id).length * 7.6 + 28)
    p.hw = Math.max(p.r + 14, p.lw / 2 + 7)
    p.hh = p.r + 50
    p.off = 12
    p.hang = R(12, 24)
    p.sway = R(-3, 3)
  })
  // Lanterns and their name labels push each other apart until nothing overlaps.
  spreadOut(leaves, {
    after: (p) => {
      if (p.y + p.off + p.hh > -trunkH - 20 && Math.abs(p.x) < p.hw + trunkW * 0.7) p.x += (p.x < 0 ? -1 : 1) * 4
      p.y = Math.min(p.y, -(p.r + 96))
    },
  })
  leaves.forEach((p) => { p.tip = V(p.x + p.sway, p.y - p.r - p.hang); p.cap = V(p.x, p.y - p.r - 2) })

  // ── Skeleton: trunk, boughs, branches and twigs, each one growing out of the one before it. ──
  const segs = []
  const flare = trunkW * 1.1
  const branchKey = (depth, group) => `${depth}:${group.map((l) => l.id).join(',') || 'none'}`
  function sprout(parent, P, dP, wIn, group, depth) {
    stream(`branch:${branchKey(depth, group)}`)
    const n = group.length
    const s = { i: segs.length, parent, depth, leaves: group, twig: n < 2, kids: [] }
    s.area = n && group.every((l) => l.area === group[0].area) ? group[0].area : null
    segs.push(s)
    parent?.kids.push(s)
    const bell = depth ? () => 0 : (t) => flare * (1 - t) ** 5
    if (n < 2) {
      const tip = n ? group[0].tip : V(R(-14, 14), -150)
      const out = Math.abs(tip.x - P.x) > 16 ? Math.sign(tip.x - P.x) : tip.x < 0 ? -1 : 1
      s.c = curve(P, dP, tip, unit(V(out * 0.84, 0.54)), { k0: 0.44, k1: 0.3, wob: R(2, 4.5), ph: R(0, 6) })
      s.width = (t) => 3 + (wIn - 3) * (1 - t) ** 1.25 + bell(t)
      if (n) group[0].seg = s
      return
    }
    const tips = group.map((l) => l.tip), cen = centre(tips)
    let Q, dQ, w1
    if (!depth) {
      Q = V(R(-9, 9), -trunkH)
      dQ = unit(V(Q.x * 0.012, -1))
      w1 = wIn * 0.82
      s.c = curve(P, dP, Q, dQ, { wob: 4, ph: R(0, 6) })
    } else {
      const to = unit(sub(cen, P)), far = mag(sub(cen, P))
      const near = Math.min(...tips.map((q) => dot(sub(q, P), to)))
      Q = add(add(P, to, clamp(Math.min(far * 0.44, near - 120), 26, 260)), side(to), R(-7, 7))
      dQ = unit(add(to, dP, 0.3))
      w1 = wIn * 0.86
      s.c = curve(P, dP, Q, dQ, { wob: R(1.5, 3.5), ph: R(0, 6) })
    }
    s.width = (t) => lerp(wIn, w1, t) + bell(t)
    const ks = cuts(group, !depth && n >= 5 ? 3 : 2, cen.x < 0)
    const parts = [...ks, n].map((k, i) => group.slice(i ? ks[i - 1] : 0, k))
    const nQ = side(dQ)
    parts.forEach((part, pi) => {
      const wc = Math.max(5.5, Math.min(w1, w1 * Math.sqrt(part.length / n) * 1.12))
      const lean = (pi / (parts.length - 1)) * 2 - 1
      const start = add(Q, nQ, lean * Math.max(0, (w1 - wc) / 2))
      const want = unit(sub(centre(part.map((l) => l.tip)), start))
      sprout(s, start, unit(add(dQ, want, 0.9)), wc, part, depth + 1)
    })
  }
  sprout(null, V(0, 8), V(0, -1), trunkW, leaves, 0)

  // A leaf's strand above the ground. Inside a shared branch the strands run side by side, like wood grain.
  const strandUp = (leaf) => {
    const chain = []
    for (let s = leaf.seg; s; s = s.parent) chain.unshift(s)
    const pts = [], forks = []
    chain.forEach((s, ci) => {
      const n = s.leaves.length, f = n < 2 ? 0 : (2 * s.leaves.indexOf(leaf)) / (n - 1) - 1
      const steps = Math.max(6, Math.round(s.c.L / 13))
      const entry = ci ? dot(sub(pts[pts.length - 1], s.c.pos(0)), side(s.c.tan(0))) : null
      for (let k = ci ? 1 : 0; k <= steps; k++) {
        const t = k / steps, nat = f * s.width(t) * 0.35
        pts.push(add(s.c.pos(t), side(s.c.tan(t)), entry == null ? nat : lerp(entry, nat, ease(t / 0.55))))
      }
      if (ci < chain.length - 1) forks.push(pts.length - 1)
    })
    return { pts, forks, chain: chain.map((s) => s.i) }
  }

  // ── Twiglets and leaves: every leaf sits on a twiglet, every twiglet grows out of a branch. ──
  const blockers = leaves.map((p) => ({ x: p.x, y: p.y + 6, r: p.r + 24 }))
  const blocked = (q, pad = 0) => blockers.some((b) => Math.hypot(q.x - b.x, q.y - b.y) < b.r + pad)
  const leafOn = (s, p, ang, size, force) => {
    const k = rand(), turn = R(-0.25, 0.25), thin = R(0.5, 0.68)
    if (!force && blocked(p, -6)) return
    s.fol[k < 0.34 ? 'dark' : k < 0.74 ? 'mid' : 'lit'] += leafShape(p, ang + turn, size, size * thin)
  }
  const sprig = (s, c, width, from) => {
    const count = Math.max(2, Math.round((c.L * (1 - from)) / 14))
    for (let q = 0; q < count; q++) {
      const t = from + ((1 - from) * (q + 0.5)) / count, d = c.tan(t), sg = q % 2 ? 1 : -1
      leafOn(s, add(c.pos(t), side(d), sg * width(t) * 0.4), Math.atan2(d.y, d.x) + sg * rad(R(34, 66)), R(14, 25))
    }
    const d = c.tan(1), a = Math.atan2(d.y, d.x)
    for (const k of [-0.55, 0, 0.55]) leafOn(s, c.b, a + k, R(15, 23), true)
  }
  const twiglet = (s, c, width, t, sg, scale, deep) => {
    const p = c.pos(t), d = c.tan(t)
    const a = Math.atan2(d.y, d.x) + sg * rad(R(32, 60))
    const dir = unit(V(Math.cos(a), Math.sin(a) - 0.22))
    const end = add(p, dir, R(40, 90) * scale)
    const keep = rand(), bud = R(4, 9), budR = R(1.5, 2.7), fork = rand(), forkAt = R(0.4, 0.62)
    if (blocked(end, 8) || end.y > -44) return
    const tc = curve(p, dir, end, unit(V(dir.x, dir.y - 0.3)), { k0: 0.4, k1: 0.32 })
    const w0 = clamp(width(t) * 0.5, 1.8, 5.4), tw = (q) => 1 + (w0 - 1) * (1 - q)
    s.d += ribbon(tc, tw, 6)
    sprig(s, tc, tw, 0.28)
    if (keep < 0.7) s.fol.bloom += disc(add(end, dir, bud), budR)
    if (!deep && tc.L > 54 && fork < 0.7) twiglet(s, tc, tw, forkAt, -sg, 0.62, true)
  }
  segs.forEach((s) => {
    s.fol = { dark: '', mid: '', lit: '', bloom: '' }
    s.d = ribbon(s.c, s.width, s.depth ? Math.max(8, Math.round(s.c.L / 16)) : 28) + (s.depth ? disc(s.c.a, s.width(0) / 2) : '')
    if (!s.depth && !s.twig) return // the trunk stays clean
    const from = s.depth ? 0.2 : 0.5
    const count = Math.floor((s.c.L * (1 - from)) / (s.twig ? 31 : 38))
    const key = branchKey(s.depth, s.leaves)
    for (let j = 0; j < count; j++) {
      stream(`twig:${key}:${j}`)
      twiglet(s, s.c, s.width, lerp(from, s.twig ? 0.86 : 0.96, (j + R(0.25, 0.75)) / count), j % 2 ? 1 : -1, s.twig ? 0.82 : 1)
    }
    stream(`twig:${key}:tip`)
    if (s.twig) sprig(s, s.c, s.width, 0.58)
  })

  // ── Roots: seven main roots fan out under the trunk. Each carries the strands of the skills above it. ──
  stream('roots')
  const flareHalf = segs[0].width(0) / 2
  const rs = clamp(0.5 + N * 0.052, 0.58, 1.12)
  let rootD = '', hairs = ''
  const hair = (p, d) => {
    const a = Math.atan2(d.y, d.x)
    return [-0.5, 0.05, 0.55].map((k) => { const l = R(9, 22); return `M${p.x.toFixed(1)} ${p.y.toFixed(1)}l${(Math.cos(a + k) * l).toFixed(1)} ${(Math.sin(a + k) * l).toFixed(1)}` }).join('')
  }
  const roots = ROOT_FAN.map((deg, i) => {
    const a = rad(deg + R(-4, 4)), L = ROOT_LEN[i] * rs * R(0.93, 1.07)
    const S = V((((i + 0.5) / ROOT_FAN.length) * 2 - 1) * flareHalf * 0.86, 3)
    const tip = V(Math.sin(a) * L, 30 + Math.cos(a) * L * 0.62)
    const c = curve(S, unit(V(Math.sin(a * 0.7), Math.cos(a * 0.7))), tip, unit(V(Math.sin(a), 0.22 + 0.3 * Math.cos(a))), { k0: 0.34, k1: 0.4, wob: R(5, 9), ph: R(0, 6) })
    const w0 = clamp(flareHalf * (i === 3 ? 0.42 : 0.36), 9, 34)
    const width = (t) => 1.6 + (w0 - 1.6) * (1 - t) ** 1.2
    rootD += ribbon(c, width, 22)
    for (let j = 0; j < (i === 3 ? 2 : 3); j++) {
      const t = 0.34 + j * 0.24 + R(-0.05, 0.05), p = c.pos(t), d = c.tan(t)
      const ang = Math.atan2(d.y, d.x) + (j % 2 ? -1 : 1) * (tip.x < 0 ? -1 : 1) * rad(R(28, 52))
      const dir = V(Math.cos(ang), Math.sin(ang)), end = add(p, dir, R(44, 104) * rs)
      if (end.y < 34) continue
      const rc = curve(p, dir, end, unit(V(dir.x, dir.y + 0.35)), { k0: 0.4, k1: 0.3, wob: 3, ph: R(0, 6) })
      const rw = Math.min(6, width(t) * 0.55)
      rootD += ribbon(rc, (q) => 1 + (rw - 1) * (1 - q), 8)
      hairs += hair(end, rc.tan(1))
    }
    hairs += hair(tip, c.tan(1))
    return { i, c, width, strands: [], load: 0 }
  })
  // from a point deep in a root up to the trunk; strands inside one root run side by side
  const rootLine = (r, m, cnt, t0 = 1) => {
    const out = []
    for (let k = 18; k >= 0; k--) {
      const t = (k / 18) * t0
      out.push(add(r.c.pos(t), side(r.c.tan(t)), cnt < 2 ? 0 : (0.5 - m / (cnt - 1)) * r.width(t) * 0.5))
    }
    return out
  }
  // a lantern's strand runs down the root on its own side: left branches feed left roots
  leaves.forEach((p) => { p.root = clamp(Math.round(((p.x / (RX * 1.05) + 1) / 2) * (roots.length - 1)), 0, roots.length - 1); roots[p.root].strands.push(p) })
  leaves.forEach((p) => {
    const r = roots[p.root]
    const under = rootLine(r, r.strands.indexOf(p), r.strands.length)
    const { pts, forks, chain } = strandUp(p)
    const all = [...under, ...pts, p.cap], fr = fractions(all)
    p.over = pts
    p.chain = chain
    p.route = spline(all)
    p.up = spline(pts)
    p.down = spline(under)
    p.origin = under[0]
    p.marks = [under.length, ...forks.map((i) => under.length + i)].map((i) => ({ x: all[i].x, y: all[i].y, f: fr[i] }))
  })

  // ── Lessons: each one hangs from the root that feeds the skill it belongs to. ──
  const cap = (r) => (r.i === 3 ? 1 : 2) + Math.floor(lessons.length / 13)
  const rootFor = (want) => {
    const open = roots.filter((r) => r.load < cap(r)), pool = open.length ? open : roots
    const cost = (r) => (want == null ? Math.abs(r.i - 3) * 0.01 : Math.abs(r.i - want)) + r.load * 0.3
    return pool.reduce((a, b) => (cost(b) < cost(a) ? b : a))
  }
  const deep = lessons.length > 5 ? 262 : 214
  const cards = lessons.map((l) => {
    stream(`lesson:${l.id}`)
    const leaf = leaves.find((p) => p.id === l.skill)
    const r = rootFor(leaf ? leaf.root : null)
    const a = r.c.pos(SLOT[r.load] ?? R(0.3, 0.92))
    r.load++
    const lw = Math.round(Math.min(18, l.title.length) * 6.9 + 26), y = clamp(a.y + 64, 96, deep)
    return { ...l, root: r.i, x: a.x, y, x0: a.x, y0: y, hw: Math.max(44, lw / 2 + 6), hh: 68, off: 24, lw, tilt: R(-5, 5), feeds: leaf ? leaf.id : null }
  })
  // an empty frame that invites the next lesson
  const pr = rootFor(null), pa = pr.c.pos(SLOT[pr.load] ?? 0.6)
  const plant = { root: pr.i, x: pa.x, y: clamp(pa.y + 60, 96, deep), hw: 52, hh: 50, off: 12 }
  plant.x0 = plant.x; plant.y0 = plant.y
  spreadOut([...cards, plant], { rounds: 200, gapX: 12, gapY: 8, pull: 0.01, biasX: lessons.length > 5 ? 1.15 : 3, sideways: true, after: (c) => { c.y = clamp(c.y, 92, deep + 8) } })
  const hangFrom = (c, dy) => {
    const r = roots[c.root], want = V(c.x, c.y - 62)
    let bt = 0.5, bd = Infinity
    for (let k = 6; k <= 40; k++) { const q = r.c.pos(k / 40), d = Math.hypot(q.x - want.x, q.y - want.y); if (d < bd) { bd = d; bt = k / 40 } }
    c.t = bt
    const a = r.c.pos(bt), top = V(c.x, c.y + dy), to = unit(sub(top, a))
    const sc = curve(a, unit(add(to, V(0, 1), 0.6)), top, top.y > a.y ? V(0, 1) : to, { k0: 0.45, k1: 0.45 })
    c.stem = ribbon(sc, (q) => 5.5 - 3 * q, 8)
    return sc
  }
  cards.forEach((c) => {
    const sc = hangFrom(c, -37)
    const pts = []
    for (let k = 8; k >= 0; k--) pts.push(sc.pos(k / 8))
    pts.push(...rootLine(roots[c.root], 0, 1, c.t))
    const leaf = leaves.find((p) => p.id === c.feeds)
    c.short = spline(pts)
    c.route = spline([...pts, ...(leaf ? [...leaf.over, leaf.cap] : [V(0, -14), V(0, -70)])])
    c.chain = leaf ? leaf.chain : []
  })
  hangFrom(plant, -30)
  stream('mycelium')
  const row = [...cards, plant].sort((p, q) => p.x - q.x)
  let myc = ''
  const spores = []
  for (let i = 0; i < row.length - 1; i++) {
    const p = row[i], q = row[i + 1], my = Math.max(p.y, q.y) + R(96, 124)
    myc += `M${p.x.toFixed(1)} ${(p.y + 30).toFixed(1)}Q${((p.x + q.x) / 2).toFixed(1)} ${my.toFixed(1)} ${q.x.toFixed(1)} ${(q.y + 30).toFixed(1)}`
    for (const t of [0.34, 0.66]) spores.push({ x: lerp(p.x, q.x, t), y: lerp(lerp(p.y + 30, my, t), lerp(my, q.y + 30, t), t), delay: R(0, 5) })
  }

  // ── Area names: one tag on each area's bough, placed where it touches nothing else. ──
  const taken = leaves.map((p) => ({ x0: p.x - p.hw, x1: p.x + p.hw, y0: p.y - p.r - p.hang - 6, y1: p.y + p.r + 60 }))
  taken.push({ x0: -trunkW * 0.6, x1: trunkW * 0.6, y0: -trunkH - 10, y1: 0 })
  const tags = seq.map(({ area }) => {
    const s = segs.find((x) => x.area === area.id)
    const w = Math.round(area.short.length * 7.1 + 42)
    const spots = []
    for (let k = 0; k <= 14; k++) {
      const t = 0.06 + k * 0.064, n = side(s.c.tan(t))
      for (const sg of [-1, 1]) {
        for (const far of [0, 18, 38]) {
          const c = add(s.c.pos(t), n, sg * (s.width(t) / 2 + 8 + far + Math.abs(n.x) * (w / 2) + Math.abs(n.y) * 13))
          spots.push({ c, pen: (n.y * sg > 0 ? 30 : 0) + Math.abs(t - 0.4) * 20 + far * 0.8 })
        }
      }
    }
    const mine = leaves.filter((p) => p.area === area.id)
    const top = Math.min(...mine.map((p) => p.tip.y)), mid = mine.reduce((sum, p) => sum + p.x, 0) / mine.length
    for (const dy of [24, 62, 100]) for (const dx of [0, -70, 70, -140, 140, -210, 210]) spots.push({ c: V(mid + dx, top - dy), pen: 160 + Math.abs(dx) + dy })
    const pick = (list) => {
      let best = null
      for (const { c, pen } of list) {
        const box = { x0: c.x - w / 2 - 5, x1: c.x + w / 2 + 5, y0: c.y - 17, y1: c.y + 17 }
        // touching a lantern or its name costs more than any other spot
        const score = taken.reduce((sum, b) => sum + overlap(box, b), 0) * 1000 + pen
        if (!best || score < best.score) best = { score, c, box }
      }
      return best
    }
    let best = pick(spots)
    if (best.score >= 1000) {
      // a crowded crown: look anywhere near the bough for a free spot
      const m = s.c.pos(0.5), grid = []
      for (let dx = -320; dx <= 320; dx += 32) for (let dy = -240; dy <= 240; dy += 24) grid.push({ c: V(m.x + dx, m.y + dy), pen: 120 + Math.hypot(dx, dy) * 0.6 })
      const alt = pick(grid)
      if (alt.score < best.score) best = alt
    }
    // with no free spot at all, the name only shows while you point at one of the area's lanterns
    const quiet = best.score >= 1000
    if (!quiet) taken.push(best.box)
    return { area: area.id, h: area.h, x: best.c.x, y: best.c.y, w, seg: s.i, quiet }
  })

  // ── Frame: what the camera shows when you first look at the tree. ──
  const xs = [430 * rs + 30], ys0 = [-430], ys1 = [250]
  leaves.forEach((p) => { xs.push(Math.abs(p.x) + p.hw); ys0.push(p.tip.y - 44); })
  cards.forEach((c) => { xs.push(Math.abs(c.x) + c.hw); ys1.push(c.y + 122) })
  xs.push(Math.abs(plant.x) + plant.hw); ys1.push(plant.y + 70)
  tags.forEach((t) => { xs.push(Math.abs(t.x) + t.w / 2 + 6); ys0.push(t.y - 24) })
  const half = Math.max(...xs) + 84
  const bounds = { x0: -half, x1: half, y0: Math.min(...ys0) - 30, y1: Math.max(...ys1) + 20 }
  const rootHalf = Math.max(470 * rs, ...cards.map((c) => Math.abs(c.x) + c.hw), Math.abs(plant.x) + plant.hw) + 70

  const glows = seq.map(({ area, list }) => {
    const mine = leaves.filter((p) => p.area === area.id), c = centre(mine)
    return { area: area.id, h: area.h, x: c.x, y: c.y - 20, r: 150 + 54 * Math.sqrt(list.length) }
  })

  const out = {
    N, RX, RY, eq, trunkH, trunkW, flareHalf, bounds,
    crownBox: { x0: -half, x1: half, y0: bounds.y0, y1: 64 },
    rootBox: { x0: -rootHalf, x1: rootHalf, y0: -110, y1: bounds.y1 },
    segs: segs.map((s) => ({ i: s.i, depth: s.depth, area: s.area, h: s.area ? AREA[s.area].h : null, ids: s.leaves.map((l) => l.id), d: s.d, fol: s.fol, ox: s.c.a.x, oy: s.c.a.y, pi: s.parent ? s.parent.i : -1, ex: s.c.b.x, ey: s.c.b.y, w1: s.width(1) })),
    leaves: leaves.map(({ seg, over, u: _u, x0: _x0, y0: _y0, hh: _hh, off: _off, sway: _sw, ring: _ri, ...p }) => p),
    areas: seq.map((g) => g.area.id),
    tags, glows,
    roots: { d: rootD, hairs },
    cards: cards.map(({ x0: _x0, y0: _y0, hh: _hh, off: _off, ...c }) => c),
    plant: { x: plant.x, y: plant.y, stem: plant.stem },
    myc, spores,
    moon: { x: -RX * 0.06, y: eq - RY * 0.36, r: clamp(RY * 0.48, 84, 150) },
  }
  stream('sky')
  return { ...out, ...scenery({ rand, R, bounds, RX, trunkH, flareHalf, keep: [...cards, plant] }) }
}
