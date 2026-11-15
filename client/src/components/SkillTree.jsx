import { memo, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Plus, Minus, Maximize2, Minimize2, Hand } from 'lucide-react'
import { treeNodes, monthLabel } from '../lib/tree'
import { growTree } from '../lib/grove'
import useCamera from '../lib/useCamera'
import { Defs, Backdrop, Earth, Meadow, Sparkle } from './grove/Scene'
import { Lantern, Memory, PlantSlot, Tag, Route } from './grove/Parts'

const NONE = []
const n1 = (v) => v.toFixed(1)

// The tree itself: bark, grain and leaves. It only redraws when the tree or what is shown on it changes.
const Body = memo(function Body({ T, uid, off, litKey }) {
  const lit = litKey ? new Set(litKey.split(',').map(Number)) : null
  const gone = (s) => s.depth > 0 && s.ids.length > 0 && s.ids.every((id) => off.has(id))
  const cls = (s) => `seg${gone(s) ? ' is-off' : ''}${lit ? (lit.has(s.i) ? ' on-route' : ' off-route') : ''}`
  const st = (s) => ({ transformOrigin: `${n1(s.ox)}px ${n1(s.oy)}px`, '--d': s.depth, '--h': s.h ?? 228 })
  const areaGone = (a) => T.leaves.every((p) => p.area !== a || off.has(p.id))
  return (
    <>
      <g className="g-vols">
        {T.glows.map((g) => <circle key={g.area} className={areaGone(g.area) ? 'is-off' : undefined} cx={n1(g.x)} cy={n1(g.y)} r={n1(g.r)} fill={`url(#${uid}-vol-${g.area})`} />)}
      </g>
      <g className="fol-back">
        {T.segs.map((s) => (s.fol.dark || s.fol.mid) && (
          <g key={s.i} className={`${cls(s)} fol${s.h == null ? ' plain' : ''}`} style={st(s)}><path className="dark" d={s.fol.dark} /><path className="mid" d={s.fol.mid} /></g>
        ))}
      </g>
      <g className="bark-rim" transform="translate(-2.2 -2)">{T.segs.map((s) => <path key={s.i} className={cls(s)} style={st(s)} d={s.d} />)}</g>
      <g className="bark" fill={`url(#${uid}-bark)`}>{T.segs.map((s) => <path key={s.i} className={cls(s)} style={st(s)} d={s.d} />)}</g>
      <g className="grain">{T.leaves.map((p) => <path key={p.id} className={off.has(p.id) ? 'is-off' : undefined} d={p.up} />)}</g>
      <g className="fol-front">
        {T.segs.map((s) => s.fol.lit && <path key={s.i} className={`${cls(s)} fol lit${s.h == null ? ' plain' : ''}`} style={st(s)} d={s.fol.lit} />)}
        {T.segs.map((s) => s.fol.bloom && <path key={`b${s.i}`} className={`${cls(s)} fol bloom${s.h == null ? ' plain' : ''}`} style={st(s)} d={s.fol.bloom} />)}
      </g>
    </>
  )
})

const Roots = memo(function Roots({ T, uid, off }) {
  return (
    <g className="g-roots">
      <path className="root-glow" d={T.roots.d} />
      <path className="root-rim" d={T.roots.d} transform="translate(0 -1.6)" />
      <path d={T.roots.d} fill={`url(#${uid}-root)`} />
      <path className="root-hairs" d={T.roots.hairs} />
      <g className="grain under">{T.leaves.map((p) => <path key={p.id} className={off.has(p.id) ? 'is-off' : undefined} d={p.down} />)}</g>
    </g>
  )
})

export default function SkillTree({ me, growth, interactive = true, animate = false, selected = null, onSelect, show, until = null, label, onPlant, full = false, onFull }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const nodes = useMemo(() => treeNodes(me, growth), [me, growth])
  const lessons = growth?.lessons || NONE
  const T = useMemo(() => growTree(nodes, lessons, me?.handle || 'oren'), [nodes, lessons, me?.handle])
  const [hot, setHot] = useState(null)
  const [nudged, setNudged] = useState(false)
  const [calm, setCalm] = useState(false)
  const liveRef = useRef(null), boxRef = useRef(null), timer = useRef(0)
  const nudge = () => { setNudged(true); clearTimeout(timer.current); timer.current = setTimeout(() => setNudged(false), 1900) }
  const cam = useCamera(boxRef, { bounds: T.bounds, live: interactive, immersive: full, onNudge: nudge })

  useEffect(() => {
    setCalm(matchMedia('(prefers-reduced-motion: reduce)').matches)
    return () => clearTimeout(timer.current)
  }, [])
  // Pause every animation while the tree is scrolled out of sight.
  useEffect(() => {
    const box = boxRef.current
    if (!box || typeof IntersectionObserver === 'undefined') return undefined
    const io = new IntersectionObserver(([e]) => {
      box.toggleAttribute('data-still', !e.isIntersecting)
      const live = liveRef.current
      if (!live?.pauseAnimations) return
      if (e.isIntersecting) live.unpauseAnimations()
      else live.pauseAnimations()
    })
    io.observe(box)
    return () => io.disconnect()
  }, [])

  // What is hidden by the filters or by the time slider.
  const vis = { known: true, learned: true, wish: true, lessons: true, ...show }
  const offKey = T.leaves.filter((n) => !vis[n.kind] || (until && n.since > until)).map((n) => n.id).join('|')
  const off = useMemo(() => new Set(offKey ? offKey.split('|') : NONE), [offKey])
  const cardOff = (c) => !vis.lessons || !!(until && c.at > until)

  const isCard = (k) => !!k && k.startsWith('lesson:')
  const cardOf = (k) => T.cards.find((c) => `lesson:${c.id}` === k)
  const selLeaf = selected && !isCard(selected) ? T.leaves.find((p) => p.id === selected && !off.has(p.id)) : null
  const selCard = isCard(selected) ? T.cards.find((c) => `lesson:${c.id}` === selected && !cardOff(c)) : null
  const hotLeaf = hot && hot !== selected && !isCard(hot) ? T.leaves.find((p) => p.id === hot) : null
  const hotCard = hot && hot !== selected && isCard(hot) ? cardOf(hot) : null
  const fedLeaf = selCard?.feeds && !off.has(selCard.feeds) ? T.leaves.find((p) => p.id === selCard.feeds) : null
  const feeders = selLeaf ? T.cards.filter((c) => c.feeds === selLeaf.id && !cardOff(c)) : NONE
  const litKey = (selLeaf ? selLeaf.chain : fedLeaf ? fedLeaf.chain : NONE).join(',')
  const focusArea = (selLeaf || fedLeaf || hotLeaf)?.area
  const tone = (p) => (p.kind === 'learned' && p.stage === 4 ? 'gold' : p.kind === 'known' ? 'known' : 'learned')

  const pick = (key, e) => {
    if (cam.moved.current) return
    const box = boxRef.current.getBoundingClientRect(), r = e?.currentTarget?.getBoundingClientRect?.()
    onSelect?.(selected === key ? null : key, r ? { right: r.left + r.width / 2 > box.left + box.width / 2 } : undefined)
  }
  const b = T.bounds
  const vb = `${n1(b.x0)} ${n1(b.y0)} ${n1(b.x1 - b.x0)} ${n1(b.y1 - b.y0)}`
  const pickCls = selLeaf ? ` has-pick pick-${tone(selLeaf)}` : selCard ? ' has-pick pick-lesson' : ''
  const open = T.cards.filter((c) => c.visibility === 'public').length
  const count = T.cards.length
    ? `${T.cards.length} ${T.cards.length === 1 ? 'lesson' : 'lessons'}, ${open ? `${open} shown on your profile` : 'all private'}`
    : 'Nothing here yet. Plant your first lesson.'

  return (
    <div ref={boxRef} className={`grove ${interactive ? 'is-live' : 'is-static'}${interactive || animate ? ' is-growing' : ''}${pickCls}`} onKeyDown={cam.onKeyDown}>
      <svg className="scene" viewBox={vb} aria-hidden="true">
        <Defs T={T} uid={uid} />
        <Backdrop T={T} uid={uid} />
        <Body T={T} uid={uid} off={off} litKey={litKey} />
        <Earth T={T} uid={uid} />
        <Roots T={T} uid={uid} off={off} />
        <g className="g-myc"><path d={T.myc} /></g>
        <g className="g-stems">
          {T.cards.map((c) => <path key={c.id} className={`m-stem${cardOff(c) ? ' is-off' : ''}`} d={c.stem} />)}
          {interactive && onPlant && <path className="m-stem is-plant" d={T.plant.stem} />}
        </g>
        <Meadow T={T} planted={growth?.start ? monthLabel(growth.start) : null} />
        <g transform={`translate(${n1(b.x0 + 34)} ${n1(b.y1 - 64)})`}>
          <g className="keep zone">
            <text className="zone-title" y="0">Roots</text>
            <text y="20">Lessons and memories that fed the tree</text>
            <text className="zone-count" y="38">{count}</text>
          </g>
        </g>
        <g className="g-tags">
          {T.tags.map((t) => <Tag key={t.area} t={t} hot={focusArea === t.area} off={T.leaves.every((p) => p.area !== t.area || off.has(p.id))} />)}
        </g>
      </svg>

      <svg ref={liveRef} className="live" viewBox={vb} role="group" aria-label={label || 'Skill tree'}
        onClick={(e) => { if (interactive && !cam.moved.current && !e.target.closest('.lantern, .memory, .plant')) onSelect?.(null) }}>
        <Sparkle T={T} />

        {!calm && (
          <g className="g-pulses" aria-hidden="true">
            {T.leaves.filter((p, i) => !off.has(p.id) && (T.N <= 14 || i % 2 === 0)).map((p) => (
              <circle key={p.id} r="2.6" className={`pulse kind-${p.kind}`}>
                <animateMotion dur={`${(6 + (p.order % 5) * 0.7).toFixed(1)}s`} begin={`${(-p.order * 1.37).toFixed(2)}s`} repeatCount="indefinite" path={p.route} />
              </circle>
            ))}
          </g>
        )}
        <g className="g-fireflies" aria-hidden="true">
          {T.fireflies.map((f, i) => (
            <circle key={i} className={`ff ${f.warm ? 'warm' : 'cool'}`} cx={n1(f.x)} cy={n1(f.y)} r={f.r.toFixed(2)}
              style={{ '--dx': `${f.dx.toFixed(0)}px`, '--dy': `${f.dy.toFixed(0)}px`, animationDuration: `${n1(f.dur)}s`, animationDelay: `${(-f.delay).toFixed(1)}s` }} />
          ))}
        </g>

        <g className="g-routes" aria-hidden="true">
          {feeders.map((c) => <Route key={`f-${c.id}`} d={c.short} tone="lesson" from={{ x: c.x, y: c.y - 37 }} />)}
          {hotLeaf && !off.has(hotLeaf.id) && <Route key={`h-${hotLeaf.id}`} d={hotLeaf.route} tone={tone(hotLeaf)} soft />}
          {hotCard && !cardOff(hotCard) && <Route key={`h-${hotCard.id}`} d={hotCard.short} tone="lesson" soft />}
          {selLeaf && <Route key={`s-${selLeaf.id}`} d={selLeaf.route} tone={tone(selLeaf)} marks={selLeaf.marks} from={selLeaf.origin} to={selLeaf} />}
          {selCard && <Route key={`s-${selCard.id}`} d={fedLeaf || !selCard.feeds ? selCard.route : selCard.short} tone="lesson" from={{ x: selCard.x, y: selCard.y - 37 }} to={fedLeaf} />}
        </g>

        <g className="g-lanterns">
          {T.leaves.map((p) => (
            <Lantern key={p.id} n={p} uid={uid} hot={hot === p.id} picked={selected === p.id} fed={fedLeaf?.id === p.id} off={off.has(p.id)} interactive={interactive} onPick={pick} setHot={setHot} />
          ))}
        </g>
        <g className="g-memories">
          {T.cards.map((c) => (
            <Memory key={c.id} c={c} uid={uid} hot={hot === `lesson:${c.id}`} picked={selected === `lesson:${c.id}`} linked={feeders.includes(c)} off={cardOff(c)} interactive={interactive} onPick={pick} setHot={setHot} />
          ))}
          {interactive && onPlant && <PlantSlot p={T.plant} onPlant={() => { if (!cam.moved.current) onPlant() }} />}
        </g>
      </svg>

      {interactive && (
        <>
          <div className="grove-tools" role="group" aria-label="Zoom">
            <button type="button" onClick={cam.zoomIn} aria-label="Zoom in" title="Zoom in"><Plus size={17} /></button>
            <button type="button" onClick={cam.zoomOut} aria-label="Zoom out" title="Zoom out"><Minus size={17} /></button>
            {onFull && <button type="button" onClick={onFull} aria-label={full ? 'Leave full screen' : 'Full screen'} title={full ? 'Leave full screen' : 'Full screen'}>{full ? <Minimize2 size={15} /> : <Maximize2 size={15} />}</button>}
          </div>
          <div className="grove-jump" role="group" aria-label="Jump to a part of the tree">
            <button type="button" onClick={() => cam.show()}>Whole tree</button>
            <button type="button" onClick={() => cam.show(T.crownBox)}>Crown</button>
            <button type="button" onClick={() => cam.show(T.rootBox)}>Roots</button>
          </div>
          <p className={`grove-hint${nudged ? ' is-flash' : ''}`}>
            <Hand size={14} /> {full || cam.zoomed ? 'Hold and drag to move, scroll to zoom' : 'Hold Ctrl and scroll to zoom, then hold and drag to move'}
          </p>
        </>
      )}
    </div>
  )
}
