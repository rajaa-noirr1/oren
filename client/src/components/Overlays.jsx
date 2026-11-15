import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X, CheckCircle2 } from 'lucide-react'
import { useStore, firstName } from '../lib/store'
import { trade } from '../lib/match'
import Avatar from './Avatar'
import { SwapMark } from './Logo'
import { SkillChip, SkillIcon } from './SkillIcon'

export function Modal({ open, onClose, label, children, className = '' }) {
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const prev = document.activeElement
    const key = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', key)
    const t = setTimeout(() => ref.current?.querySelector('a, button:not(.modal-close), input, textarea, select')?.focus(), 30)
    return () => { window.removeEventListener('keydown', key); clearTimeout(t); prev?.focus?.() }
  }, [open, onClose])
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="modal-scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div ref={ref} role="dialog" aria-modal="true" aria-label={label} className={`modal ${className}`}
            initial={{ y: 24, scale: 0.97, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ y: 12, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}>
            <button className="btn btn-ghost btn-sm btn-icon modal-close" onClick={onClose} aria-label="Close"><X size={17} /></button>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function Toast() {
  const { toastMsg } = useStore()
  return (
    <div className="toast-wrap" aria-live="polite">
      <AnimatePresence>
        {toastMsg && (
          <motion.div key={toastMsg.id} className="toast" initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}>
            <CheckCircle2 size={18} /> {toastMsg.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function MatchModal() {
  const { me, matchWith: p, closeMatch } = useStore()
  const t = p ? trade(me, p) : null
  const burst = t ? [...t.get.map((x) => x.skill), ...t.give.map((x) => x.skill)].slice(0, 6) : []
  return (
    <Modal open={!!p} onClose={closeMatch} label="New swap match" className="match-modal">
      {p && t && (
        <>
          <p className="eyebrow">Mutual match</p>
          <h2 className="match-title">It’s a swap!</h2>
          <p className="muted">You and {firstName(p)} both want to trade. Say hi and plan your first session.</p>
          <div className="match-pair">
            <motion.div className="match-person" initial={{ x: -60, rotate: -10, opacity: 0 }} animate={{ x: 0, rotate: -4, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}>
              <Avatar seed={me?.avatarSeed || me?.handle || 'me'} size={92} />
              <span>You</span>
            </motion.div>
            <div className="match-mark">
              <motion.div initial={{ rotate: -180, scale: 0.4 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.25 }}>
                <SwapMark size={56} />
              </motion.div>
              {burst.map((id, i) => {
                const a = (i / burst.length) * Math.PI * 2 - Math.PI / 2
                return (
                  <motion.span key={id + i} className="match-burst" initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
                    animate={{ x: Math.cos(a) * 92, y: Math.sin(a) * 70, opacity: [0, 1, 1, 0], scale: 1 }}
                    transition={{ duration: 1.6, delay: 0.35 + i * 0.05, ease: 'easeOut' }}>
                    <SkillIcon id={id} size={26} />
                  </motion.span>
                )
              })}
            </div>
            <motion.div className="match-person" initial={{ x: 60, rotate: 10, opacity: 0 }} animate={{ x: 0, rotate: 4, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}>
              <Avatar seed={p.handle} size={92} />
              <span>{firstName(p)}</span>
            </motion.div>
          </div>
          <div className="match-trade">
            <div>
              <span className="tag-teach">{firstName(p)} teaches you</span>
              <div className="chips">{(t.get.length ? t.get : p.teaches.slice(0, 2)).map((x) => <SkillChip key={x.skill} id={x.skill} tone="teach" />)}</div>
            </div>
            <div>
              <span className="tag-want">You teach {firstName(p)}</span>
              <div className="chips">{t.give.length ? t.give.map((x) => <SkillChip key={x.skill} id={x.skill} tone="want" />) : <span className="muted">Something new, agree on it in chat</span>}</div>
            </div>
          </div>
          <div className="match-actions">
            <Link to={`/swaps?with=${p.id}`} className="btn btn-teach" onClick={closeMatch}>Say hi and plan a session</Link>
            <button className="btn btn-ghost" onClick={closeMatch}>Keep swiping</button>
          </div>
        </>
      )}
    </Modal>
  )
}
