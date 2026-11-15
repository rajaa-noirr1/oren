import { useEffect, useMemo, useRef, useState } from 'react'
import { clamp } from './geo'

const LABEL = 14.5 // height of a lantern's name, in tree units
const MARGIN = 0.45 // extra drawing kept around the view while moving, as a share of the view's size

// The camera over the skill tree. Scroll zooms toward the pointer, holding and dragging moves the view,
// two fingers pinch. The drawing is a stack of SVG layers inside `boxRef`; the camera writes the same viewBox
// straight to each of them, so moving around never re-renders React.
// While the view moves, the layers (drawn with a margin around the view) just slide and scale, which costs the
// browser almost nothing. They are redrawn sharp when the movement stops or runs past the margin.
export default function useCamera(boxRef, { bounds, live = true, immersive = false, onNudge } = {}) {
  const cam = useRef(null), goal = useRef(null), home = useRef(null)
  const size = useRef({ w: 0, h: 0 })
  const raf = useRef(0), last = useRef(0), atHome = useRef(true)
  const drawn = useRef(null), idle = useRef(0)
  const moved = useRef(false)
  const o = useRef({})
  o.current = { bounds, immersive, onNudge, live }
  const [zoomed, setZoomed] = useState(false)

  const C = useMemo(() => {
    const calm = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
    // state the page styles against lives on the wrapper as data attributes, where React never overwrites it
    const flag = (name, on) => boxRef.current?.toggleAttribute('data-' + name, !!on)
    const B = () => o.current.bounds
    const span = () => ({ w: B().x1 - B().x0, h: B().y1 - B().y0 })
    const contain = () => Math.min(size.current.w / span().w, size.current.h / span().h)
    const most = () => Math.max(contain() * 5, 2.8)
    const frame = (box) => ({ x: (box.x0 + box.x1) / 2, y: (box.y0 + box.y1) / 2, s: Math.min(size.current.w / (box.x1 - box.x0), size.current.h / (box.y1 - box.y0)) })
    const homeView = () => {
      const c = frame(B()), tall = size.current.h / span().h
      // on a narrow screen fill the height and let people drag sideways, rather than shrinking everything
      if (o.current.live && c.s < 0.6 && tall > c.s) c.s = Math.min(tall, 0.62)
      return c
    }
    const fix = (c) => {
      const { w, h } = size.current, b = B()
      const s = clamp(c.s, contain(), most()), vw = w / s, vh = h / s
      return {
        s,
        x: vw >= span().w ? (b.x0 + b.x1) / 2 : clamp(c.x, b.x0 + vw / 2, b.x1 - vw / 2),
        y: vh >= span().h ? (b.y0 + b.y1) / 2 : clamp(c.y, b.y0 + vh / 2, b.y1 - vh / 2),
      }
    }
    const layers = () => boxRef.current?.querySelectorAll(':scope > svg') || []
    // Draw the layers for the current view (plus a margin when the tree can be moved).
    const commit = () => {
      clearTimeout(idle.current)
      const box = boxRef.current, c = cam.current
      if (!box || !c) return
      const { w, h } = size.current
      const mx = o.current.live ? Math.round(w * MARGIN) : 0, my = o.current.live ? Math.round(h * MARGIN) : 0
      const vw = (w + 2 * mx) / c.s, vh = (h + 2 * my) / c.s
      const vb = `${(c.x - vw / 2).toFixed(2)} ${(c.y - vh / 2).toFixed(2)} ${vw.toFixed(2)} ${vh.toFixed(2)}`
      for (const svg of layers()) {
        svg.setAttribute('viewBox', vb)
        Object.assign(svg.style, { left: `${-mx}px`, top: `${-my}px`, width: `${w + 2 * mx}px`, height: `${h + 2 * my}px`, transform: '' })
      }
      drawn.current = { x: c.x, y: c.y, s: c.s, mx, my }
      // names keep a readable size on screen whatever the zoom
      const px = LABEL * c.s
      box.style.setProperty('--ls', (px < 11.5 ? 11.5 / px : px > 19 ? 19 / px : 1).toFixed(3))
      flag('far', c.s < 0.6)
      flag('near', c.s > 1.2)
    }
    // Show the current view: slide and scale what is already drawn when it still covers the view, otherwise redraw.
    const paint = () => {
      const c = cam.current, d = drawn.current
      if (!c) return
      if (!d || !o.current.live) { commit(); return }
      const { w, h } = size.current
      const k = c.s / d.s, tx = (d.x - c.x) * c.s, ty = (d.y - c.y) * c.s
      const covers = k > 0.8 && k < 1.25 && Math.abs(tx) + w / 2 <= (w / 2 + d.mx) * k - 2 && Math.abs(ty) + h / 2 <= (h / 2 + d.my) * k - 2
      if (!covers) { commit(); return }
      const t = `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) scale(${k.toFixed(4)})`
      for (const svg of layers()) svg.style.transform = t
      clearTimeout(idle.current)
      idle.current = setTimeout(commit, 160)
    }
    const settle = () => {
      const g = goal.current, hm = home.current
      atHome.current = !hm || (g.s <= hm.s * 1.02 && Math.abs(g.x - hm.x) * g.s < 3 && Math.abs(g.y - hm.y) * g.s < 3)
      setZoomed(!atHome.current)
      flag('zoomed', !atHome.current)
    }
    const tick = (now) => {
      const c = cam.current, g = goal.current
      const k = 1 - Math.exp(-Math.min(120, now - last.current) / 70)
      last.current = now
      c.s *= (g.s / c.s) ** k
      if (g.pin) {
        const { w, h } = size.current
        Object.assign(c, fix({ s: c.s, x: g.pin.wx - (g.pin.px - w / 2) / c.s, y: g.pin.wy - (g.pin.py - h / 2) / c.s }))
      } else {
        c.x += (g.x - c.x) * k
        c.y += (g.y - c.y) * k
      }
      const done = Math.abs(g.s / c.s - 1) < 0.002 && (g.pin || (Math.abs(g.x - c.x) * c.s < 0.5 && Math.abs(g.y - c.y) * c.s < 0.5))
      if (done) cam.current = { x: g.x, y: g.y, s: g.s }
      paint()
      raf.current = done ? 0 : requestAnimationFrame(tick)
    }
    const stop = () => { cancelAnimationFrame(raf.current); raf.current = 0 }
    const go = (next, { instant = false, pin } = {}) => {
      if (!size.current.w) return
      goal.current = { ...fix(next), pin }
      if (instant || calm || !cam.current) { stop(); cam.current = { x: goal.current.x, y: goal.current.y, s: goal.current.s }; paint() } else if (!raf.current) { last.current = performance.now() - 16; raf.current = requestAnimationFrame(tick) }
      settle()
    }
    const zoomAt = (k, px, py, instant) => {
      const { w, h } = size.current, g = goal.current
      if (!g) return
      const ax = px ?? w / 2, ay = py ?? h / 2
      const s = clamp(g.s * k, contain(), most())
      const wx = g.x + (ax - w / 2) / g.s, wy = g.y + (ay - h / 2) / g.s
      go({ s, x: wx - (ax - w / 2) / s, y: wy - (ay - h / 2) / s }, { pin: { wx, wy, px: ax, py: ay }, instant })
    }
    const resize = (w, h) => {
      if (!w || !h) return
      size.current = { w, h }
      home.current = homeView()
      drawn.current = null
      go(atHome.current || !goal.current ? home.current : goal.current, { instant: true })
    }
    const show = (box) => go(frame(box || B()))
    const reset = () => { if (home.current) go(home.current) }
    return { fix, paint, commit, go, stop, zoomAt, resize, show, reset, most, contain, flag }
  }, [boxRef])

  // Follow the size of the stage.
  useEffect(() => {
    const box = boxRef.current
    if (!box) return undefined
    const ro = new ResizeObserver(() => C.resize(box.clientWidth, box.clientHeight))
    ro.observe(box)
    C.resize(box.clientWidth, box.clientHeight)
    return () => { ro.disconnect(); C.stop(); clearTimeout(idle.current) }
  }, [C, boxRef])

  // The tree itself changed size (a lesson was planted, a skill was added).
  useEffect(() => {
    const box = boxRef.current
    if (box) C.resize(box.clientWidth, box.clientHeight)
  }, [C, boxRef, bounds.x0, bounds.x1, bounds.y0, bounds.y1])

  useEffect(() => {
    if (!live) return undefined
    const el = boxRef.current
    const ptrs = new Map()
    let drag = null, pinch = null
    const local = (x, y) => { const r = el.getBoundingClientRect(); return { px: x - r.left, py: y - r.top } }
    const down = (e) => {
      // the zoom and jump buttons float over the drawing; they are not part of a drag
      if (e.button > 0 || !cam.current || e.target.closest?.('button')) return
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY })
      moved.current = false
      C.stop()
      if (cam.current) goal.current = { x: cam.current.x, y: cam.current.y, s: cam.current.s }
      if (ptrs.size === 1) drag = { id: e.pointerId, x: e.clientX, y: e.clientY, cx: cam.current.x, cy: cam.current.y, trail: [] }
      else if (ptrs.size === 2) {
        const [a, b] = [...ptrs.values()], m = local((a.x + b.x) / 2, (a.y + b.y) / 2), c = cam.current
        pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, s: c.s, wx: c.x + (m.px - size.current.w / 2) / c.s, wy: c.y + (m.py - size.current.h / 2) / c.s }
        drag = null
        moved.current = true
        for (const id of ptrs.keys()) try { el.setPointerCapture(id) } catch { /* already gone */ }
      }
    }
    const move = (e) => {
      if (!ptrs.has(e.pointerId)) return
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (pinch && ptrs.size >= 2) {
        const [a, b] = [...ptrs.values()], m = local((a.x + b.x) / 2, (a.y + b.y) / 2)
        const s = clamp(pinch.s * (Math.hypot(a.x - b.x, a.y - b.y) / pinch.d), C.contain(), C.most())
        C.go({ s, x: pinch.wx - (m.px - size.current.w / 2) / s, y: pinch.wy - (m.py - size.current.h / 2) / s }, { instant: true })
        return
      }
      if (!drag || drag.id !== e.pointerId) return
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y
      if (!moved.current) {
        if (Math.hypot(dx, dy) < 5) return
        moved.current = true
        try { el.setPointerCapture(e.pointerId) } catch { /* pointer already released */ }
        C.flag('dragging', true)
      }
      const s = cam.current.s
      C.go({ s, x: drag.cx - dx / s, y: drag.cy - dy / s }, { instant: true })
      drag.trail.push({ t: e.timeStamp, x: e.clientX, y: e.clientY })
      if (drag.trail.length > 6) drag.trail.shift()
    }
    const up = (e) => {
      ptrs.delete(e.pointerId)
      if (ptrs.size < 2) pinch = null
      if (drag && drag.id === e.pointerId) {
        // let the view glide a little after a quick flick
        const tr = drag.trail, a = tr[0], b = tr[tr.length - 1]
        if (moved.current && a && b && b.t - a.t > 8 && e.timeStamp - b.t < 60) {
          const s = cam.current.s, vx = (b.x - a.x) / (b.t - a.t), vy = (b.y - a.y) / (b.t - a.t)
          if (Math.hypot(vx, vy) > 0.25) C.go({ s, x: cam.current.x - (vx * 170) / s, y: cam.current.y - (vy * 170) / s })
        }
        drag = null
        C.flag('dragging', false)
      }
      // stays true until the click that follows a drag has been ignored
      setTimeout(() => { moved.current = false }, 0)
    }
    const wheel = (e) => {
      const opt = o.current, held = e.ctrlKey || e.metaKey
      const engaged = opt.immersive || held || !atHome.current
      if (!engaged) { opt.onNudge?.(); return }
      if (e.deltaY > 0 && !held && !opt.immersive && goal.current.s <= home.current.s * 1.02) return
      e.preventDefault()
      const dy = e.deltaMode === 1 ? e.deltaY * 32 : e.deltaY
      const p = local(e.clientX, e.clientY)
      // a trackpad pinch arrives as many small steps, a mouse wheel as a few big ones
      C.zoomAt(Math.exp(-dy * (held && Math.abs(dy) < 40 ? 0.011 : 0.0026)), p.px, p.py)
    }
    const dbl = (e) => {
      if (e.target.closest?.('.lantern, .memory, .plant, button')) return
      const p = local(e.clientX, e.clientY)
      C.zoomAt(1.8, p.px, p.py)
    }
    const noDrag = (e) => e.preventDefault()
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
    el.addEventListener('wheel', wheel, { passive: false })
    el.addEventListener('dblclick', dbl)
    el.addEventListener('dragstart', noDrag)
    return () => {
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
      el.removeEventListener('wheel', wheel)
      el.removeEventListener('dblclick', dbl)
      el.removeEventListener('dragstart', noDrag)
    }
  }, [C, live, boxRef])

  const onKeyDown = (e) => {
    if (!live || e.target.closest?.('input, textarea, select')) return
    const c = goal.current
    if (!c) return
    const step = 90 / c.s
    const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }
    if (moves[e.key]) { if (atHome.current) return; e.preventDefault(); C.go({ s: c.s, x: c.x + moves[e.key][0], y: c.y + moves[e.key][1] }) } else if (e.key === '+' || e.key === '=') { e.preventDefault(); C.zoomAt(1.4) } else if (e.key === '-' || e.key === '_') { e.preventDefault(); C.zoomAt(1 / 1.4) } else if (e.key === '0') { e.preventDefault(); C.reset() }
  }

  return { zoomed, moved, onKeyDown, zoomIn: () => C.zoomAt(1.5), zoomOut: () => C.zoomAt(1 / 1.5), reset: C.reset, show: C.show }
}
