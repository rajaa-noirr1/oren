import { hash } from '../lib/match'

// Generated, deterministic avatars, so sample members never need real photos.
const PALETTES = [
  ['#FF5A1F', '#FFD9C7', '#24130B'],
  ['#2F4BFF', '#D3DAFF', '#0E1336'],
  ['#FFC83D', '#FFF0C4', '#2B200A'],
  ['#12B5A2', '#C8F2EB', '#062A25'],
  ['#E8487F', '#FFD3E2', '#2E0B1A'],
  ['#7B5CFF', '#E0D8FF', '#190F40'],
  ['#0D0F14', '#E9ECF2', '#0D0F14'],
  ['#57B947', '#DDF5D6', '#0E2A09'],
]

export default function Avatar({ seed = 'oren', size = 64, className = '', title }) {
  const h = hash(seed)
  const pick = (n, shift) => (h >>> shift) % n
  const [bg, face, ink] = PALETTES[pick(PALETTES.length, 0)]
  const rot = pick(17, 3) - 8
  const tx = pick(7, 7) - 3
  const mouth = pick(4, 11)
  const hair = pick(5, 14)
  const eyes = pick(3, 18)
  const glasses = pick(4, 21) === 0
  const shirt = pick(2, 24) === 0 ? ink : face
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} className={`avatar ${className}`} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <rect width="80" height="80" fill={bg} />
      <rect x="12" y="66" width="56" height="30" rx="15" fill={shirt} opacity={shirt === face ? 0.9 : 1} />
      <g transform={`translate(${40 + tx} 40) rotate(${rot})`}>
        {hair === 1 && <rect x="-25" y="-30" width="50" height="46" rx="18" fill={ink} />}
        <rect x="-21" y="-24" width="42" height="48" rx="19" fill={face} />
        {hair === 2 && <path d="M-21 -6 C-21 -30 21 -30 21 -6 L21 -11 C8 -16 -6 -8 -21 -4 Z" fill={ink} />}
        {hair === 3 && <circle cx="0" cy="-29" r="8" fill={ink} />}
        {hair === 4 && <rect x="-21" y="-25" width="42" height="11" rx="5.5" fill={ink} />}
        {eyes === 0 && (<><circle cx="-8" cy="-2" r="3" fill={ink} /><circle cx="8" cy="-2" r="3" fill={ink} /></>)}
        {eyes === 1 && (<><rect x="-10" y="-6" width="4" height="8" rx="2" fill={ink} /><rect x="6" y="-6" width="4" height="8" rx="2" fill={ink} /></>)}
        {eyes === 2 && (<><path d="M-12 -1 Q-8 -6 -4 -1" stroke={ink} strokeWidth="2.6" fill="none" strokeLinecap="round" /><path d="M4 -1 Q8 -6 12 -1" stroke={ink} strokeWidth="2.6" fill="none" strokeLinecap="round" /></>)}
        {glasses && (<g fill="none" stroke={ink} strokeWidth="2"><circle cx="-8" cy="-2" r="7" /><circle cx="8" cy="-2" r="7" /><path d="M-1 -2 H1" /></g>)}
        {mouth === 0 && <path d="M-7 10 Q0 16 7 10" stroke={ink} strokeWidth="2.6" fill="none" strokeLinecap="round" />}
        {mouth === 1 && <circle cx="0" cy="12" r="3.5" fill={ink} />}
        {mouth === 2 && <path d="M-6 12 H6" stroke={ink} strokeWidth="2.6" strokeLinecap="round" />}
        {mouth === 3 && <path d="M-8 9 H8 Q8 17 0 17 Q-8 17 -8 9 Z" fill={ink} />}
      </g>
    </svg>
  )
}
