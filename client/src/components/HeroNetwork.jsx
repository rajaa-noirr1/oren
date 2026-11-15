import { useEffect, useRef } from 'react'

// Hero background: a slow network of people (dots) and skills (logo coins). Orange and cobalt pulses travel
// along the links like trades happening. Pauses off-screen; draws a single still frame with reduced motion.
const COINS = ['python', 'java', 'git', 'figma', 'react', 'docker', 'blender', 'premiere', 'aftereffects', 'photoshop', 'kotlin', 'swift', 'flutter', 'firebase', 'matlab', 'linkedin']
const LINK = 150

const rgba = (hex, a) => {
  let h = (hex || '#000').replace('#', '').trim()
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const n = parseInt(h, 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
}

export default function HeroNetwork() {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    const host = canvas.parentElement
    const ctx = canvas.getContext('2d')
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    const imgs = COINS.map((id) => { const im = new Image(); im.src = `${import.meta.env.BASE_URL}icons/${id}.svg`; return im })
    const pointer = { x: -9999, y: -9999 }
    const colors = {}
    let w = 0, h = 0, raf = 0, visible = true, nodes = [], pulses = [], lastPulse = 0

    const readColors = () => {
      const cs = getComputedStyle(document.documentElement)
      colors.ink = cs.getPropertyValue('--ink').trim()
      colors.teach = cs.getPropertyValue('--teach').trim()
      colors.want = cs.getPropertyValue('--want').trim()
    }
    const seed = () => {
      const n = Math.round(Math.min(70, Math.max(28, (w * h) / 15000)))
      nodes = Array.from({ length: n }, (_, i) => {
        const coin = i < Math.min(COINS.length, Math.round(n / 3.2))
        return { x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.24, vy: (Math.random() - 0.5) * 0.24, r: coin ? 12 : 1.6 + Math.random() * 1.8, img: coin ? imgs[i] : null }
      })
    }
    // On resize, keep every dot and scale its position. Re-seeding here made the whole background jump.
    const resize = () => {
      const r = canvas.getBoundingClientRect()
      if (Math.abs(r.width - w) < 1 && Math.abs(r.height - h) < 1) return
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const sx = w ? r.width / w : 1, sy = h ? r.height / h : 1
      w = r.width; h = r.height
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      if (!nodes.length) seed()
      else nodes.forEach((n) => { n.x *= sx; n.y *= sy })
    }

    const draw = (t) => {
      ctx.clearRect(0, 0, w, h)
      for (const n of nodes) {
        if (!reduce) {
          n.x += n.vx; n.y += n.vy
          if (n.x < -30) n.x = w + 30; else if (n.x > w + 30) n.x = -30
          if (n.y < -30) n.y = h + 30; else if (n.y > h + 30) n.y = -30
        }
        const dx = n.x - pointer.x, dy = n.y - pointer.y, d = Math.hypot(dx, dy)
        if (d < 130 && d > 0.1) { const f = (1 - d / 130) * 1.4; n.x += (dx / d) * f; n.y += (dy / d) * f }
      }
      const links = []
      ctx.lineWidth = 1
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j]
          const d = Math.hypot(a.x - b.x, a.y - b.y)
          if (d < LINK) {
            ctx.strokeStyle = rgba(colors.ink, (1 - d / LINK) * 0.14)
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke()
            links.push([a, b])
          }
        }
      }
      if (!reduce && t - lastPulse > 380 && links.length) {
        lastPulse = t
        const [a, b] = links[(Math.random() * links.length) | 0]
        pulses.push({ a, b, t0: t, c: Math.random() < 0.5 ? colors.teach : colors.want })
      }
      for (let k = pulses.length - 1; k >= 0; k--) {
        const p = pulses[k]
        const u = (t - p.t0) / 1200
        if (u >= 1) { pulses.splice(k, 1); continue }
        const x = p.a.x + (p.b.x - p.a.x) * u, y = p.a.y + (p.b.y - p.a.y) * u, o = Math.sin(u * Math.PI)
        ctx.fillStyle = rgba(p.c, o * 0.22); ctx.beginPath(); ctx.arc(x, y, 9, 0, 7); ctx.fill()
        ctx.fillStyle = rgba(p.c, o); ctx.beginPath(); ctx.arc(x, y, 3, 0, 7); ctx.fill()
      }
      for (const n of nodes) {
        if (n.img) {
          ctx.fillStyle = '#ffffff'; ctx.strokeStyle = rgba(colors.ink, 0.18); ctx.lineWidth = 1
          ctx.beginPath(); ctx.arc(n.x, n.y, n.r + 4, 0, 7); ctx.fill(); ctx.stroke()
          if (n.img.complete && n.img.naturalWidth) ctx.drawImage(n.img, n.x - n.r * 0.72, n.y - n.r * 0.72, n.r * 1.44, n.r * 1.44)
        } else {
          ctx.fillStyle = rgba(colors.ink, 0.3); ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, 7); ctx.fill()
        }
      }
    }
    const loop = (t) => { draw(t); if (visible && !reduce) raf = requestAnimationFrame(loop) }
    const start = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(loop) }

    readColors(); resize()
    if (reduce) Promise.all(imgs.map((im) => im.decode().catch(() => {}))).then(() => draw(0))
    else start()

    const onMove = (e) => { const r = canvas.getBoundingClientRect(); pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top }
    const onLeave = () => { pointer.x = -9999; pointer.y = -9999 }
    host.addEventListener('pointermove', onMove)
    host.addEventListener('pointerleave', onLeave)
    const ro = new ResizeObserver(() => { resize(); if (reduce) draw(0) })
    ro.observe(canvas)
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting && !document.hidden; if (visible && !reduce) start() })
    io.observe(canvas)
    const onVis = () => { visible = !document.hidden; if (visible && !reduce) start() }
    document.addEventListener('visibilitychange', onVis)
    const mo = new MutationObserver(readColors)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    const mq = matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', readColors)

    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); mo.disconnect()
      mq.removeEventListener('change', readColors)
      document.removeEventListener('visibilitychange', onVis)
      host.removeEventListener('pointermove', onMove); host.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return <canvas ref={ref} className="hero-net" aria-hidden="true" />
}
