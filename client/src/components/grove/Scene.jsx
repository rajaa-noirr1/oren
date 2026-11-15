import { memo } from 'react'
import { AREA } from '../../data/fields'

const n1 = (v) => v.toFixed(1)
const GLOW = [['known', '255,122,61', 0.62], ['learned', '124,140,255', 0.66], ['wish', '154,169,255', 0.22], ['gold', '255,213,77', 0.7]]

// Gradients shared by the whole drawing. They are set in tree units, so they stay put while the camera moves.
export const Defs = memo(function Defs({ T, uid }) {
  const b = T.bounds, id = (k) => `${uid}-${k}`
  return (
    <defs>
      <linearGradient id={id('sky')} gradientUnits="userSpaceOnUse" x1="0" y1={b.y0 - 520} x2="0" y2="40">
        <stop offset="0" stopColor="#04061A" /><stop offset="0.42" stopColor="#0A0F33" /><stop offset="0.7" stopColor="#1A1550" />
        <stop offset="0.85" stopColor="#3B2162" /><stop offset="0.94" stopColor="#7A3766" /><stop offset="1" stopColor="#C8685A" />
      </linearGradient>
      <linearGradient id={id('soil')} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={b.y1 + 160}>
        <stop offset="0" stopColor="#2B1B1F" /><stop offset="0.16" stopColor="#1C1118" /><stop offset="0.6" stopColor="#100A10" /><stop offset="1" stopColor="#07050A" />
      </linearGradient>
      <linearGradient id={id('bark')} gradientUnits="userSpaceOnUse" x1={-T.RX * 0.9} y1={T.eq - T.RY} x2={T.RX * 0.5} y2="0">
        <stop offset="0" stopColor="#5E4A68" /><stop offset="0.5" stopColor="#3B2A36" /><stop offset="1" stopColor="#1D1418" />
      </linearGradient>
      <linearGradient id={id('root')} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="280">
        <stop offset="0" stopColor="#B48358" /><stop offset="1" stopColor="#6A4630" />
      </linearGradient>
      <linearGradient id={id('sepia')} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#d9c39b" /><stop offset="1" stopColor="#a88660" /></linearGradient>
      {GLOW.map(([k, c, a]) => (
        <radialGradient key={k} id={id(`glow-${k}`)}>
          <stop offset="0" stopColor={`rgba(${c},${a})`} /><stop offset="0.42" stopColor={`rgba(${c},${a * 0.3})`} /><stop offset="1" stopColor={`rgba(${c},0)`} />
        </radialGradient>
      ))}
      <radialGradient id={id('gloss')} cx="0.34" cy="0.26" r="0.7"><stop offset="0" stopColor="rgba(255,255,255,0.75)" /><stop offset="0.55" stopColor="rgba(255,255,255,0)" /></radialGradient>
      <radialGradient id={id('moon')} cx="0.38" cy="0.34" r="0.78"><stop offset="0" stopColor="#FFF9E6" /><stop offset="0.62" stopColor="#F4E5BC" /><stop offset="1" stopColor="#D5BB86" /></radialGradient>
      <radialGradient id={id('moonhalo')}><stop offset="0.36" stopColor="rgba(255,236,190,0.36)" /><stop offset="0.6" stopColor="rgba(255,226,180,0.1)" /><stop offset="1" stopColor="rgba(255,226,180,0)" /></radialGradient>
      <radialGradient id={id('aur-a')}><stop offset="0" stopColor="rgba(72,226,196,0.34)" /><stop offset="1" stopColor="rgba(72,226,196,0)" /></radialGradient>
      <radialGradient id={id('aur-b')}><stop offset="0" stopColor="rgba(150,120,255,0.3)" /><stop offset="1" stopColor="rgba(150,120,255,0)" /></radialGradient>
      <radialGradient id={id('milky')}><stop offset="0" stopColor="rgba(170,180,255,0.14)" /><stop offset="1" stopColor="rgba(170,180,255,0)" /></radialGradient>
      <radialGradient id={id('mist')}><stop offset="0" stopColor="rgba(196,204,255,0.17)" /><stop offset="1" stopColor="rgba(196,204,255,0)" /></radialGradient>
      <radialGradient id={id('pool')}><stop offset="0" stopColor="rgba(255,190,120,0.3)" /><stop offset="1" stopColor="rgba(255,190,120,0)" /></radialGradient>
      <radialGradient id={id('ember')}><stop offset="0" stopColor="rgba(255,176,96,0.34)" /><stop offset="1" stopColor="rgba(255,176,96,0)" /></radialGradient>
      <radialGradient id={id('gem-262')}><stop offset="0" stopColor="rgba(168,130,255,0.38)" /><stop offset="1" stopColor="rgba(168,130,255,0)" /></radialGradient>
      <radialGradient id={id('gem-186')}><stop offset="0" stopColor="rgba(90,220,235,0.34)" /><stop offset="1" stopColor="rgba(90,220,235,0)" /></radialGradient>
      {T.areas.map((a) => (
        <radialGradient key={a} id={id(`vol-${a}`)}>
          <stop offset="0" stopColor={`hsl(${AREA[a].h} 84% 62% / 0.4)`} /><stop offset="0.5" stopColor={`hsl(${AREA[a].h} 84% 62% / 0.13)`} /><stop offset="1" stopColor={`hsl(${AREA[a].h} 82% 62% / 0)`} />
        </radialGradient>
      ))}
    </defs>
  )
})

// The night behind the tree: stars, a slow aurora, the moon caught in the branches, far hills and a line of firs.
export const Backdrop = memo(function Backdrop({ T, uid }) {
  const b = T.bounds, W = T.wide, m = T.moon, w = b.x1 - b.x0
  const url = (k) => `url(#${uid}-${k})`
  return (
    <g className="g-back">
      <rect x={W.x0 - 2000} y={b.y0 - 3200} width={W.x1 - W.x0 + 4000} height={3240 - b.y0} fill={url('sky')} />
      <ellipse cx="0" cy={b.y0 - 40} rx={w * 0.95} ry="240" transform={`rotate(-17 0 ${b.y0 - 40})`} fill={url('milky')} />
      <g className="g-stars">
        <path d={T.stars[0]} opacity="0.42" /><path d={T.stars[1]} opacity="0.66" /><path d={T.stars[2]} opacity="0.94" />
      </g>
      <g className="g-aurora">
        <ellipse cx={-w * 0.24} cy={b.y0 + 20} rx="640" ry="120" transform={`rotate(-7 ${-w * 0.24} ${b.y0 + 20})`} fill={url('aur-a')} />
        <ellipse cx={w * 0.27} cy={b.y0 - 50} rx="540" ry="104" transform={`rotate(6 ${w * 0.27} ${b.y0 - 50})`} fill={url('aur-b')} />
        <ellipse cx="40" cy={b.y0 - 170} rx="780" ry="130" fill={url('aur-a')} opacity="0.6" />
      </g>
      <g className="g-moon" transform={`translate(${n1(m.x)} ${n1(m.y)})`}>
        <circle r={m.r * 2.7} fill={url('moonhalo')} />
        <circle className="moon-ring" r={m.r * 1.2} />
        <circle r={m.r} fill={url('moon')} />
        <g className="craters" transform={`scale(${(m.r / 100).toFixed(3)})`}>
          <circle cx="-34" cy="-30" r="17" /><circle cx="26" cy="-52" r="9" /><circle cx="38" cy="18" r="21" /><circle cx="-18" cy="40" r="12" /><circle cx="-58" cy="14" r="7" /><circle cx="6" cy="-6" r="6" />
        </g>
      </g>
      <path d={T.far} fill="#261B52" />
      <ellipse cx="0" cy="-46" rx={w * 0.85} ry="74" fill={url('mist')} />
      <path d={T.near} fill="#191232" />
      <path d={T.forest} fill="#0F0B22" />
    </g>
  )
})

// The ground and the soil under it: layers, pebbles and a few buried crystals.
export const Earth = memo(function Earth({ T, uid }) {
  const url = (k) => `url(#${uid}-${k})`
  return (
    <g className="g-earth">
      <ellipse cx="0" cy="-2" rx={T.RX * 0.8} ry="34" fill={url('pool')} />
      <path d={T.soil} fill={url('soil')} />
      <g className="layers">{T.layers.map((d, i) => <path key={i} d={d} />)}</g>
      <g className="strata">{T.strata.map((d, i) => <path key={i} d={d} />)}</g>
      <g className="pebbles">
        {T.pebbles.map((p, i) => <ellipse key={i} cx={n1(p.x)} cy={n1(p.y)} rx={n1(p.rx)} ry={n1(p.ry)} opacity={p.o.toFixed(2)} transform={`rotate(${p.rot.toFixed(0)} ${n1(p.x)} ${n1(p.y)})`} />)}
      </g>
      <g className="gems">
        {T.crystals.map((c, i) => (
          <g key={i} transform={`translate(${n1(c.x)} ${n1(c.y)}) rotate(${c.rot.toFixed(0)}) scale(${c.s.toFixed(2)})`} style={{ '--h': c.h }}>
            <circle r="27" fill={url(`gem-${c.h}`)} />
            <path className="gem" d="M0 -15L6 -3L0 9L-6 -3Z" />
            <path className="gem dim" d="M-9 -6L-5 0L-9 7L-13 0Z" />
            <path className="gem dim" d="M9 -9L13 -2L9 6L5 -2Z" />
          </g>
        ))}
      </g>
      <path className="groundline" d={T.groundLine} />
    </g>
  )
})

// What grows in front of the trunk: glowing mushrooms, a small sign with the planting date, and grass.
export const Meadow = memo(function Meadow({ T, planted }) {
  return (
    <g className="g-meadow">
      {T.mushrooms.map((m, i) => (
        <g key={i} className={`shroom ${m.cool ? 'cool' : 'warm'}`} transform={`translate(${n1(m.x)} ${n1(m.y)}) scale(${m.s.toFixed(2)})`}>
          <path className="sh-stem" d="M-1.8 0L-1.3 -9L1.3 -9L1.8 0Z" />
          <path className="sh-cap" d="M-9 -8Q-8 -18 0 -18.5Q8 -18 9 -8Q0 -10.5 -9 -8Z" />
        </g>
      ))}
      {planted && (
        <g className="sign" transform={`translate(${n1(T.sign.x)} ${n1(T.sign.y)})`}>
          <rect className="post" x="-1.8" y="-34" width="3.6" height="37" />
          <g transform="rotate(-3)">
            <rect className="board" x="-52" y="-51" width="104" height="22" rx="3" />
            <text y="-36">Planted {planted}</text>
          </g>
        </g>
      )}
      <path className="grass" d={T.grass} />
      <path className="tufts" d={T.tufts} />
    </g>
  )
})

// Everything in the scene that moves on its own: twinkling stars, shooting stars, mushroom glow and spores.
// It lives on the top layer with the lanterns, so the big still drawing underneath is never repainted for it.
export const Sparkle = memo(function Sparkle({ T }) {
  const b = T.bounds, w = b.x1 - b.x0
  return (
    <g className="g-sparkle" aria-hidden="true">
      {T.twinkles.map((s, i) => <circle key={i} className="tw" cx={n1(s.x)} cy={n1(s.y)} r={s.r.toFixed(2)} style={{ animationDelay: `${n1(s.delay)}s` }} />)}
      <line className="shoot s1" x1={-w * 0.32} y1={b.y0 - 70} x2={-w * 0.32 + 86} y2={b.y0 - 34} />
      <line className="shoot s2" x1={w * 0.2} y1={b.y0 - 210} x2={w * 0.2 + 70} y2={b.y0 - 180} />
      {T.mushrooms.map((m, i) => (
        <ellipse key={i} className={`sh-glow ${m.cool ? 'cool' : 'warm'}`} cx={n1(m.x)} cy={n1(m.y - 12 * m.s)} rx={n1(18 * m.s)} ry={n1(14 * m.s)} />
      ))}
      <g className="g-myc">{T.spores.map((s, i) => <circle key={i} cx={n1(s.x)} cy={n1(s.y)} r="2" style={{ animationDelay: `${n1(s.delay)}s` }} />)}</g>
    </g>
  )
})
