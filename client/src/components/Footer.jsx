import { Link } from 'react-router-dom'
import Logo from './Logo'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer-inner">
        <div className="footer-brand">
          <Logo size={24} />
          <p className="footer-tag">Learn together. Grow together.</p>
          <p className="muted">A skill-for-skill exchange across 50 fields. One hour taught, one hour learned.</p>
        </div>
        <nav className="footer-cols" aria-label="Footer">
          <div>
            <p className="eyebrow">Explore</p>
            <Link to="/explore">Swipe people</Link>
            <Link to="/explore?mode=browse">Search by skill</Link>
            <Link to="/#fields">Browse fields</Link>
          </div>
          <div>
            <p className="eyebrow">Account</p>
            <Link to="/join">Build your card</Link>
            <Link to="/signin">Sign in</Link>
            <Link to="/swaps">Your swaps</Link>
          </div>
          <div>
            <p className="eyebrow">Project</p>
            <Link to="/#how">How a swap works</Link>
            <Link to="/#loops">Swap loops</Link>
            <span className="muted">Database course · Fall 2026</span>
          </div>
        </nav>
      </div>
      <div className="wrap footer-word" aria-hidden="true">OREN</div>
      <div className="wrap footer-base">
        <span>© 2026 OREN</span>
        <span className="mono">trade.skill(you, them) → both.grow()</span>
      </div>
    </footer>
  )
}
