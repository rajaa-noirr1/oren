import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Monitor, Sun, Moon, Menu, X } from 'lucide-react'
import Logo from './Logo'
import Avatar from './Avatar'
import { useStore } from '../lib/store'

const THEMES = { system: { next: 'light', Icon: Monitor, label: 'Theme: system' }, light: { next: 'dark', Icon: Sun, label: 'Theme: light' }, dark: { next: 'system', Icon: Moon, label: 'Theme: dark' } }

export default function Nav() {
  const { me, theme, setTheme, matches, incoming } = useStore()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const loc = useLocation()
  const t = THEMES[theme] || THEMES.system
  const count = matches.length + incoming.length

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  useEffect(() => setOpen(false), [loc.pathname, loc.hash])

  const links = (
    <>
      <NavLink to="/explore">Explore</NavLink>
      <Link to="/#fields">Fields</Link>
      <Link to="/#how">How it works</Link>
      {me && <NavLink to="/swaps">Swaps{count > 0 && <span className="count num">{count}</span>}</NavLink>}
      {me && <NavLink to="/tree">My tree</NavLink>}
    </>
  )

  return (
    <header className={`nav ${scrolled || open ? 'is-scrolled' : ''}`}>
      <div className="wrap nav-inner">
        <Logo />
        <nav className="nav-links" aria-label="Main">{links}</nav>
        <div className="nav-right">
          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setTheme(t.next)} aria-label={`${t.label}. Switch theme`} title={t.label}>
            <t.Icon size={17} />
          </button>
          {me ? (
            <Link to="/me" className="nav-me" aria-label="Your profile">
              <Avatar seed={me.avatarSeed || me.handle} size={36} />
              <span className="hide-sm">{me.name.split(' ')[0]}</span>
            </Link>
          ) : (
            <>
              <Link to="/signin" className="btn btn-ghost btn-sm hide-sm">Sign in</Link>
              <Link to="/join" className="btn btn-primary btn-sm">Build your card</Link>
            </>
          )}
          <button className="btn btn-ghost btn-sm btn-icon nav-menu-btn" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Menu">
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>
      {open && (
        <div className="nav-sheet">
          <div className="wrap">
            <nav aria-label="Mobile">{links}{!me && <Link to="/signin">Sign in</Link>}</nav>
          </div>
        </div>
      )}
    </header>
  )
}
