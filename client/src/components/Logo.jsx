import { Link } from 'react-router-dom'

// The O in OREN is a swap cycle: orange (teach) over the top, cobalt (learn) underneath.
export function SwapMark({ size = 28, className = '' }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden="true">
      <path d="M5.17 14.09 A11 11 0 0 1 26.34 12.24" fill="none" stroke="var(--teach)" strokeWidth="3.6" strokeLinecap="round" />
      <path d="M29.16 11.21 L27.43 15.24 L23.52 13.27 Z" fill="var(--teach)" />
      <path d="M26.83 17.91 A11 11 0 0 1 5.66 19.76" fill="none" stroke="var(--want)" strokeWidth="3.6" strokeLinecap="round" />
      <path d="M8.48 18.73 L4.57 16.76 L2.84 20.79 Z" fill="var(--want)" />
    </svg>
  )
}

export default function Logo({ to = '/', size = 22 }) {
  return (
    <Link to={to} className="logo" aria-label="OREN home" style={{ fontSize: size }}>
      <SwapMark size={size * 1.25} />
      <span aria-hidden="true">REN</span>
    </Link>
  )
}
