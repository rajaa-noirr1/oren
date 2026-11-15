import { f1, V, pt, disc } from './geo'

// Everything around the tree: the night sky, far hills, the ground it stands on and the soil under it.
export function scenery({ rand, R, bounds: b, RX, trunkH, flareHalf, keep = [] }) {
  // a fixed area, so the scene stays the same as the tree grows
  const xa = -3400, xb = 3400

  // Ground: nearly flat, with a low mound where the tree stands. It passes through (0, 0).
  const p1 = R(0, 6), p2 = R(0, 6)
  const wave = (x) => 3 * Math.sin(x / 140 + p1) + 2 * Math.sin(x / 47 + p2)
  const gy = (x) => wave(x) - wave(0) + 9 * (1 - Math.exp(-((x / 300) ** 2)))
  const gpts = []
  for (let x = xa; x <= xb; x += 24) gpts.push(V(x, gy(x)))
  const groundLine = `M${gpts.map(pt).join('L')}`
  const soil = `${groundLine}L${xb} ${b.y1 + 2600}L${xa} ${b.y1 + 2600}Z`

  const ridge = (amp, base, k, ph) => {
    const ps = []
    for (let x = xa; x <= xb; x += 36) ps.push(V(x, -(base + amp * (0.55 * Math.sin(x / (310 * k) + ph) + 0.3 * Math.sin(x / (128 * k) + ph * 2.3) + 0.15 * Math.sin(x / (51 * k) + ph * 4.1)))))
    return `M${ps.map(pt).join('L')}L${xb} 60L${xa} 60Z`
  }
  const far = ridge(62, 96, 1.5, R(0, 6)), near = ridge(38, 44, 1, R(0, 6))

  // A far line of small firs, so the tree reads as the giant of the grove.
  let forest = ''
  for (let x = xa; x < xb; x += R(13, 30)) {
    if (Math.abs(x) < flareHalf + 54) continue
    const h = R(15, 40) * (0.7 + 0.5 * Math.abs(Math.sin(x / 400))), w = h * R(0.3, 0.42), y = gy(x) + 2
    forest += `M${f1(x - w)} ${f1(y)}L${f1(x)} ${f1(y - h)}L${f1(x + w)} ${f1(y)}Z`
  }

  let grass = ''
  for (let x = -2600; x < 2600; x += R(5, 11)) {
    const y = gy(x) + 1
    grass += `M${f1(x)} ${f1(y)}q${f1(R(-2, 2))} ${f1(-R(3, 6))} ${f1(R(-4, 4))} ${f1(-R(5, 12))}`
  }
  let tufts = ''
  for (let i = 0; i < 26; i++) {
    const x = (rand() < 0.5 ? -1 : 1) * R(flareHalf * 0.4, flareHalf + 190), y = gy(x) + 1
    for (let k = 0; k < 4; k++) tufts += `M${f1(x + k * 2 - 3)} ${f1(y)}q${f1(R(-3, 3))} ${f1(-R(6, 10))} ${f1(R(-7, 7))} ${f1(-R(11, 24))}`
  }
  const mushrooms = Array.from({ length: 7 }, (_, i) => {
    const x = (i % 2 ? 1 : -1) * R(flareHalf + 14, flareHalf + 170)
    return { x, y: gy(x) + 1, s: R(0.7, 1.35), cool: rand() < 0.6 }
  })
  const sx = flareHalf + R(96, 130)
  const sign = { x: sx, y: gy(sx) }

  // Sky: most stars are baked into three paths (by brightness); a few twinkle on their own.
  const sx0 = -2600, sx1 = 2600, sy0 = -1900, sy1 = -70
  const count = Math.round(((sx1 - sx0) * (sy1 - sy0)) / 7000)
  const stars = ['', '', '']
  for (let i = 0; i < count; i++) {
    const x = R(sx0, sx1), y = R(sy0, sy1), r = R(0.5, 1.6) * (rand() < 0.06 ? 1.7 : 1)
    stars[Math.floor(rand() * 3)] += disc(V(x, y), r)
  }
  // a band of fine stars across the sky
  for (let i = 0; i < count * 0.5; i++) {
    const t = rand(), x = sx0 + (sx1 - sx0) * t, y = sy0 + 160 + (sy1 - sy0 - 260) * (0.82 - t * 0.62) + (rand() + rand() - 1) * 90
    if (y < sy1) stars[0] += disc(V(x, y), R(0.35, 0.9))
  }
  const fireflies = Array.from({ length: 18 }, () => ({ x: R(-RX * 0.95, RX * 0.95), y: R(-trunkH - 150, -18), r: R(1.3, 2.6), warm: rand() < 0.6, dur: R(7, 14), delay: R(0, 8), dx: R(-28, 28), dy: R(-34, -8) }))
  // a few stars twinkle on their own, in the part of the sky you actually see
  const twinkles = Array.from({ length: 24 }, () => ({ x: R(b.x0 - 200, b.x1 + 200), y: R(b.y0 - 260, -140), r: R(0.9, 1.9), delay: R(0, 6) }))

  // Soil: layers, pebbles and a few buried crystals. Nothing lands on a lesson.
  const strata = [78, 158, 240, 330].map((y, s) => {
    const ps = []
    for (let x = xa; x <= xb; x += 60) ps.push(V(x, y + Math.sin(x / 210 + s * 1.7) * 9 + Math.sin(x / 77 + s) * 4))
    return `M${ps.map(pt).join('L')}`
  })
  const layers = strata.map((d) => `${d}L${xb} ${b.y1 + 2600}L${xa} ${b.y1 + 2600}Z`)
  const clear = (x, y, pad) => !keep.some((c) => Math.abs(x - c.x) < c.hw + pad && y > c.y - 60 && y < c.y + 100)
  const pebbles = []
  for (let i = 0; i < 130 && pebbles.length < 90; i++) {
    const x = R(-2000, 2000), y = R(26, 560)
    if (clear(x, y, 14)) pebbles.push({ x, y, rx: R(3, 11), ry: R(2, 7), rot: R(-30, 30), o: R(0.45, 0.95) })
  }
  const crystals = []
  for (let i = 0; i < 40 && crystals.length < 8; i++) {
    const x = R(-1300, 1300), y = R(130, 420)
    if (clear(x, y, 40) && Math.abs(x) > 60) crystals.push({ x, y, s: R(0.7, 1.4), h: rand() < 0.5 ? 262 : 186, rot: R(-18, 18) })
  }

  return { gy, groundLine, soil, far, near, forest, grass, tufts, mushrooms, sign, stars, twinkles, fireflies, strata, layers, pebbles, crystals, wide: { x0: xa, x1: xb } }
}
