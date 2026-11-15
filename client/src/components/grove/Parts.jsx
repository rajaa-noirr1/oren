import { Eye, Lock } from 'lucide-react'
import { SvgSkillIcon, skillName } from '../SkillIcon'
import { AREA } from '../../data/fields'
import { levelName } from '../../data/skills'
import { PERSON } from '../../data/people'
import { STAGES, monthLabel } from '../../lib/tree'

const CHECK = 'M-3.8 0.3 L-1.1 3 L3.9 -2.6'
const STAR = 'M0 -5.4 L1.6 -1.7 L5.4 -1.6 L2.4 0.9 L3.4 4.7 L0 2.6 L-3.4 4.7 L-2.4 0.9 L-5.4 -1.6 L-1.6 -1.7 Z'
const n1 = (v) => v.toFixed(1)
const keys = (fn) => (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(e) } }
export const DRAW = 1.15 // seconds the light takes to travel from the root tip to the lantern
const cut = (s, n) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s)
// up to two short lines of a longer text
const lines = (text, max = 30) => {
  const out = ['']
  for (const w of String(text || '').split(/\s+/).filter(Boolean)) {
    if ((out[out.length - 1] + ' ' + w).trim().length <= max) out[out.length - 1] = (out[out.length - 1] + ' ' + w).trim()
    else if (out.length < 2) out.push(w)
    else { out[1] = cut(`${out[1]} ${w}`, max); break }
  }
  return out.filter(Boolean)
}

// A skill: a lantern hanging from the tip of its twig.
export function Lantern({ n, uid, hot, picked, fed, off, interactive, onPick, setHot }) {
  const name = skillName(n.id)
  const sub = n.kind === 'known' ? levelName(n.level) : n.kind === 'learned' ? STAGES[n.stage] : 'Wish'
  const master = n.kind === 'learned' && n.stage === 4
  const teacher = n.kind === 'learned' && PERSON[n.l.from[0]] ? PERSON[n.l.from[0]].name.split(' ')[0] : null
  // shown once you zoom in
  const more = n.kind === 'known' ? `${n.years} ${n.years === 1 ? 'year' : 'years'}${n.taught.length ? `, taught ${n.taught.length}` : ''}`
    : n.kind === 'learned' ? `${n.l.sessions} ${n.l.sessions === 1 ? 'session' : 'sessions'}${teacher ? ` with ${teacher}` : ''}`
      : n.goal ? cut(n.goal, 32) : 'Not started yet'
  const C = 2 * Math.PI * (n.r + 8)
  const live = interactive && !off
  const pick = (e) => onPick(n.id, e)
  return (
    <g className={`lantern kind-${n.kind} ${master ? 'is-master' : ''} ${hot ? 'is-hot' : ''} ${picked ? 'is-sel' : ''} ${fed ? 'is-fed' : ''} ${off ? 'is-off' : ''}`}
      role={interactive ? 'button' : undefined} tabIndex={live ? 0 : -1}
      aria-label={interactive ? `${name}: ${n.kind === 'known' ? 'you knew this' : n.kind === 'learned' ? 'learned from others' : 'on your wish list'}, ${sub}` : undefined}
      onClick={live ? pick : undefined} onKeyDown={live ? keys(pick) : undefined}
      onMouseEnter={live ? () => setHot(n.id) : undefined} onMouseLeave={live ? () => setHot(null) : undefined}
      onFocus={live ? () => setHot(n.id) : undefined} onBlur={live ? () => setHot(null) : undefined}>
      <g className="swing" style={{ transformOrigin: `${n1(n.tip.x)}px ${n1(n.tip.y)}px`, animationDuration: `${5 + (n.order % 4) * 0.8}s`, animationDelay: `${(-n.order * 1.3).toFixed(1)}s` }}>
        <path className="l-stem" d={`M${n1(n.tip.x)} ${n1(n.tip.y)}L${n1(n.x)} ${n1(n.y - n.r - 6)}`} />
        <g transform={`translate(${n1(n.x)} ${n1(n.y)})`}>
          <g className="orb" style={{ '--i': n.order }}>
            <circle className="l-glow" r={n.r + 36} fill={`url(#${uid}-glow-${master ? 'gold' : n.kind})`} />
            {master && <circle className="l-aura" r={n.r + 15} />}
            <rect className="l-cap" x="-6" y={-n.r - 9} width="12" height="10" rx="2.5" />
            {n.kind === 'learned' && <circle className="l-track" r={n.r + 8} />}
            {n.kind === 'learned' && n.stage > 0 && <circle className="l-prog" r={n.r + 8} strokeDasharray={`${n1((C * n.stage) / 4)} ${n1(C)}`} transform="rotate(-90)" />}
            <circle className="l-ring" r={n.r + 3} />
            <circle className="l-disc" r={n.r} />
            <g className="l-icon"><SvgSkillIcon id={n.id} size={Math.round(n.r * 1.1)} /></g>
            <circle className="l-gloss" r={n.r} fill={`url(#${uid}-gloss)`} />
            {n.taught.length > 0 && (
              <g className="fruit" transform={`translate(${n1(n.r * 0.78)} ${n1(-n.r * 0.78)})`}><circle r="11" /><text dy="0.36em">{n.taught.length}</text></g>
            )}
            {n.kind === 'learned' && n.stage >= 3 && (
              <g className={`seal ${master ? 'is-star' : ''}`} transform={`translate(${n1(-n.r * 0.78)} ${n1(-n.r * 0.78)})`}><circle r="10.5" /><path d={master ? STAR : CHECK} /></g>
            )}
          </g>
        </g>
      </g>
      <g transform={`translate(${n1(n.x)} ${n1(n.y + n.r + 12)})`}>
        <g className="keep">
          <g className="l-label"><rect x={-n.lw / 2} y="0" width={n.lw} height="26" rx="13" /><text y="17.6">{name}</text></g>
          <text className="l-sub" y="41">{sub}</text>
          <text className="l-more" y="56">{more}</text>
        </g>
      </g>
    </g>
  )
}

// A lesson: an old photograph held by a rootlet.
export function Memory({ c, uid, hot, picked, linked, off, interactive, onPick, setHot }) {
  const key = `lesson:${c.id}`
  const title = c.title.length > 18 ? `${c.title.slice(0, 17)}…` : c.title
  const open = c.visibility === 'public'
  const taught = lines(c.lesson)
  const live = interactive && !off
  const pick = (e) => onPick(key, e)
  return (
    <g className={`memory ${hot ? 'is-hot' : ''} ${picked ? 'is-sel' : ''} ${linked ? 'is-linked' : ''} ${off ? 'is-off' : ''}`} transform={`translate(${n1(c.x)} ${n1(c.y)})`}
      role={interactive ? 'button' : undefined} tabIndex={live ? 0 : -1}
      aria-label={interactive ? `Lesson: ${c.title}. ${open ? 'Shown on your profile' : 'Only you can see it'}` : undefined}
      onClick={live ? pick : undefined} onKeyDown={live ? keys(pick) : undefined}
      onMouseEnter={live ? () => setHot(key) : undefined} onMouseLeave={live ? () => setHot(null) : undefined}
      onFocus={live ? () => setHot(key) : undefined} onBlur={live ? () => setHot(null) : undefined}>
      <circle className="m-glow" r="72" fill={`url(#${uid}-ember)`} />
      <g className="m-card">
        <g transform={`rotate(${n1(c.tilt)})`}>
          <rect className="pol" x="-31" y="-37" width="62" height="74" rx="3" />
          {c.photo
            ? <image href={c.photo} x="-25" y="-31" width="50" height="44" preserveAspectRatio="xMidYMid slice" />
            : <rect x="-25" y="-31" width="50" height="44" fill={`url(#${uid}-sepia)`} />}
          {!c.photo && <g className="pol-icon" transform="translate(0 -9)"><SvgSkillIcon id={c.skill} size={24} /></g>}
          <text className="pol-date" y="28.5">{monthLabel(c.at)}</text>
          <path className="pol-grip" d="M-10 -36q10 -11 20 0" />
        </g>
        <g className={`m-badge ${open ? 'is-open' : ''}`} transform="translate(29 -35)">
          <circle r="9.5" />
          {open ? <Eye x="-5.5" y="-5.5" width="11" height="11" /> : <Lock x="-5" y="-5.5" width="10" height="10.5" />}
        </g>
      </g>
      <g transform="translate(0 47)">
        <g className="keep">
          <g className="l-label m-label"><rect x={-c.lw / 2} y="0" width={c.lw} height="26" rx="13" /><text y="17.6">{title}</text></g>
          {c.feeds && <text className="m-sub" y="41">fed {skillName(c.feeds)}</text>}
          {taught.length > 0 && <text className="m-more" y={c.feeds ? 57 : 42}>{taught.map((t, i) => <tspan key={i} x="0" dy={i ? 13 : 0}>{t}</tspan>)}</text>}
        </g>
      </g>
    </g>
  )
}

// An empty frame in the roots: the place for the next lesson.
export function PlantSlot({ p, onPlant }) {
  return (
    <g className="plant" transform={`translate(${n1(p.x)} ${n1(p.y)})`} role="button" tabIndex={0} aria-label="Plant a lesson" onClick={onPlant} onKeyDown={keys(onPlant)}>
      <rect className="pl-frame" x="-27" y="-30" width="54" height="60" rx="4" />
      <path className="pl-plus" d="M0 -10V10M-10 0H10" />
      <g transform="translate(0 37)"><g className="keep"><text className="pl-text" y="13">Plant a lesson</text></g></g>
    </g>
  )
}

// The name of an area, sitting on its bough.
export function Tag({ t, hot, off }) {
  const A = AREA[t.area]
  return (
    <g transform={`translate(${n1(t.x)} ${n1(t.y)})`}>
      <g className={`keep gtag ${hot ? 'is-hot' : ''} ${off ? 'is-off' : ''} ${t.quiet ? 'is-quiet' : ''}`} style={{ '--h': t.h }}>
        <rect x={-t.w / 2} y="-13" width={t.w} height="26" rx="13" />
        <A.Icon x={-t.w / 2 + 10} y={-7} width={14} height={14} className="gtag-ico" />
        <text x={-t.w / 2 + 30} y="4.6">{A.short}</text>
      </g>
    </g>
  )
}

// Light travelling along one strand of the tree: from the root tip, through the trunk and every fork, to the lantern.
// `soft` is the quiet preview shown while hovering.
export function Route({ d, tone, soft = false, marks = [], from, to }) {
  return (
    <g className={`route tone-${tone} ${soft ? 'is-soft' : ''}`}>
      {!soft && <path className="r-halo wide" d={d} pathLength="1" />}
      <path className="r-halo" d={d} pathLength="1" />
      <path className="r-body" d={d} pathLength="1" />
      <path className="r-core" d={d} pathLength="1" />
      {!soft && <path className="r-flow" d={d} pathLength="1" />}
      {!soft && from && <g className="r-seed" transform={`translate(${n1(from.x)} ${n1(from.y)})`}><circle className="ping" r="7" /><circle r="4.5" /></g>}
      {!soft && marks.map((m, i) => (
        <g key={i} className="r-mark" transform={`translate(${n1(m.x)} ${n1(m.y)})`} style={{ '--t': `${(m.f * DRAW).toFixed(2)}s` }}><circle className="ping" r="6" /><circle className="dot" r="4.2" /></g>
      ))}
      {!soft && [0, 1, 2].map((i) => (
        <circle key={i} className="r-spark" r="3.4">
          <animateMotion dur="2.7s" begin={`${(-i * 0.9).toFixed(1)}s`} repeatCount="indefinite" path={d} />
        </circle>
      ))}
      {!soft && to && <g className="r-burst" transform={`translate(${n1(to.x)} ${n1(to.y)})`}><circle r={to.r + 9} /><circle className="late" r={to.r + 9} /></g>}
    </g>
  )
}
