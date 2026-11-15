import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { X, Undo2, Bookmark, ArrowLeftRight, Keyboard, Pencil, Clock, Languages, ArrowUpRight } from 'lucide-react'
import TradeCard from './TradeCard'
import { SkillChip, skillName } from './SkillIcon'
import { trade, tzLabel, localTime, slotLabel, KIND } from '../lib/match'
import { useStore, firstName } from '../lib/store'
import { levelName } from '../data/skills'

const THRESHOLD = 120

function DeckCard({ p, t, depth, onSwipe, flipped, onFlip }) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotate = useTransform(x, [-320, 0, 320], [-14, 0, 14])
  const swapO = useTransform(x, [24, 130], [0, 1])
  const passO = useTransform(x, [-130, -24], [1, 0])
  const saveO = useTransform(y, [-130, -30], [1, 0])
  const top = depth === 0

  const end = (_, info) => {
    const { offset, velocity } = info
    if (offset.x > THRESHOLD || velocity.x > 700) return onSwipe('swap')
    if (offset.x < -THRESHOLD || velocity.x < -700) return onSwipe('pass')
    if (offset.y < -THRESHOLD || velocity.y < -700) return onSwipe('save')
    animate(x, 0, { type: 'spring', stiffness: 500, damping: 32 })
    animate(y, 0, { type: 'spring', stiffness: 500, damping: 32 })
  }

  return (
    <motion.div
      className="deck-slot"
      style={{ zIndex: 10 - depth }}
      custom={depth}
      initial={{ scale: 0.86, opacity: 0, y: 40 }}
      animate={{ scale: 1 - depth * 0.05, y: depth * 18, opacity: depth > 2 ? 0 : 1 }}
      exit="gone"
      variants={{
        gone: (dir) => ({
          x: dir === 'swap' ? 640 : dir === 'pass' ? -640 : 0,
          y: dir === 'save' ? -720 : 30,
          rotate: dir === 'swap' ? 18 : dir === 'pass' ? -18 : 0,
          opacity: 0,
          transition: { duration: 0.38, ease: [0.4, 0, 1, 1] },
        }),
      }}
      transition={{ type: 'spring', stiffness: 320, damping: 30 }}
      aria-hidden={!top}
    >
      <motion.div
        className={`deck-drag ${top ? 'is-top' : ''}`}
        style={{ x, y, rotate }}
        drag={top && !flipped}
        dragMomentum={false}
        onDragEnd={end}
        whileDrag={{ cursor: 'grabbing' }}
      >
        <TradeCard person={p} t={t} flipped={flipped} onFlip={top ? onFlip : undefined} shine={top} />
        {top && (
          <>
            <motion.span className="stamp stamp-swap deck-stamp is-right" style={{ opacity: swapO }}>Swap</motion.span>
            <motion.span className="stamp stamp-pass deck-stamp is-left" style={{ opacity: passO }}>Pass</motion.span>
            <motion.span className="stamp stamp-save deck-stamp is-up" style={{ opacity: saveO }}>Save</motion.span>
          </>
        )}
      </motion.div>
    </motion.div>
  )
}

function YourCard({ me }) {
  if (!me) return null
  return (
    <div className="side-block">
      <div className="side-title"><p className="eyebrow">Your card</p><Link to="/me" className="btn btn-ghost btn-sm"><Pencil size={14} /> Edit</Link></div>
      <span className="tag-teach">You teach</span>
      <div className="chips">{me.teaches.map((s) => <SkillChip key={s.skill} id={s.skill} tone="teach" />)}</div>
      <span className="tag-want">You want</span>
      <div className="chips">{me.wants.map((s) => <SkillChip key={s.skill} id={s.skill} tone="want" />)}</div>
    </div>
  )
}

function WhyPanel({ p, t, me }) {
  if (!p) return null
  if (!me) {
    return (
      <div className="side-block">
        <p className="eyebrow">Why this person</p>
        <p className="muted">Build your card and OREN explains every match: what you would trade, when you are both free and which languages you share.</p>
        <Link to="/join" className="btn btn-primary btn-sm">Build your card</Link>
      </div>
    )
  }
  const name = firstName(p)
  const myTz = me.tz ?? 0
  const diff = p.tz - myTz
  return (
    <div className="side-block why">
      <p className="eyebrow">Why {name}</p>
      <p className="why-kind"><b>{KIND[t.kind].label}.</b> {KIND[t.kind].note}</p>
      {t.get.length > 0 && (
        <div className="why-list">
          <span className="tag-teach">{name} teaches you</span>
          {t.get.map((s) => (
            <div key={s.skill} className="why-item"><SkillChip id={s.skill} tone="teach" /><span className="muted">{levelName(s.level)} · {s.years} yrs</span></div>
          ))}
        </div>
      )}
      {t.give.length > 0 && (
        <div className="why-list">
          <span className="tag-want">You teach {name}</span>
          {t.give.map((s) => (
            <div key={s.skill} className="why-item"><SkillChip id={s.skill} tone="want" /><span className="muted">“{s.goal}”</span></div>
          ))}
        </div>
      )}
      <div className="why-facts">
        <p><Clock size={15} /> {localTime(p.tz)} for {name} ({tzLabel(p.tz)}{diff ? `, ${Math.abs(diff)} h ${diff > 0 ? 'ahead of' : 'behind'} you` : ', same as you'})</p>
        <p><Clock size={15} /> {t.slots.length ? `Both free: ${t.slots.slice(0, 3).map(slotLabel).join(', ')}` : 'No shared free time yet. Ask in chat.'}</p>
        <p><Languages size={15} /> {t.sharedLanguage ? `You both speak ${p.languages.find((l) => me.languages?.includes(l))}` : `Speaks ${p.languages.join(', ')}`}</p>
      </div>
      <Link to={`/u/${p.handle}`} className="btn btn-ghost btn-sm">Full profile <ArrowUpRight size={14} /></Link>
    </div>
  )
}

export default function SwipeView({ people, scopeName, openGate }) {
  const { me, decisions, decide, undo, canUndo } = useStore()
  const [perfectOnly, setPerfectOnly] = useState(false)
  const [exitDir, setExitDir] = useState('swap')
  const [flipId, setFlipId] = useState(null)

  const queue = useMemo(() => {
    const list = people
      .filter((p) => !decisions[p.id])
      .map((p) => ({ p, t: trade(me, p) }))
      .filter((x) => !perfectOnly || x.t.kind === 'perfect')
    if (me) list.sort((a, b) => b.t.score - a.t.score)
    return list
  }, [people, decisions, me, perfectOnly])

  const top = queue[0]

  const swipe = useCallback((dir) => {
    if (!top) return
    if (dir === 'swap' && !me) { openGate(top.p); return }
    setExitDir(dir)
    setFlipId(null)
    decide(top.p, dir)
  }, [top, me, decide, openGate])

  const doUndo = useCallback(() => { setExitDir('swap'); undo() }, [undo])

  useEffect(() => {
    const key = (e) => {
      if (e.target.closest('input, textarea, select, [role="dialog"]') || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'ArrowRight') { e.preventDefault(); swipe('swap') }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); swipe('pass') }
      else if (e.key === 'ArrowUp') { e.preventDefault(); swipe('save') }
      else if (e.key.toLowerCase() === 'z' || e.key === 'Backspace') { if (canUndo) doUndo() }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [swipe, doUndo, canUndo])

  const fieldName = scopeName

  return (
    <div className="swipe-layout">
      <aside className="swipe-side swipe-left">
        <YourCard me={me} />
        <div className="side-block">
          <label className="switch">
            <input type="checkbox" checked={perfectOnly} onChange={(e) => setPerfectOnly(e.target.checked)} disabled={!me} />
            <span className="track" />
            Perfect swaps only
          </label>
          <p className="muted small">{me ? 'Show only people who teach something you want and want something you teach.' : 'Needs your card.'}</p>
        </div>
        <div className="side-block keys">
          <p className="eyebrow"><Keyboard size={13} /> Keyboard</p>
          <p><kbd>←</kbd> Pass <kbd>→</kbd> Swap <kbd>↑</kbd> Save <kbd>Z</kbd> Undo</p>
        </div>
      </aside>

      <div className="deck-area">
        <div className="deck" aria-live="polite">
          <AnimatePresence custom={exitDir} initial={false}>
            {queue.slice(0, 3).map(({ p, t }, i) => (
              <DeckCard key={p.id} p={p} t={t} depth={i} onSwipe={swipe}
                flipped={flipId === p.id} onFlip={() => setFlipId(flipId === p.id ? null : p.id)} />
            ))}
          </AnimatePresence>
          {!top && (
            <div className="deck-empty">
              <p className="eyebrow">That is everyone</p>
              <h3>You have seen all {fieldName ? `${fieldName} people` : 'members'}{perfectOnly ? ' with a perfect swap' : ''}.</h3>
              <p className="muted">Try another field, switch to Browse to search by skill, or check your swaps.</p>
              <div className="chips">
                {canUndo && <button className="btn btn-ghost btn-sm" onClick={doUndo}><Undo2 size={15} /> Undo last</button>}
                <Link to="/swaps" className="btn btn-primary btn-sm">Open your swaps</Link>
              </div>
            </div>
          )}
        </div>
        <div className="deck-actions">
          <button className="act act-sm" onClick={doUndo} disabled={!canUndo} aria-label="Undo last swipe" title="Undo (Z)"><Undo2 size={20} /></button>
          <button className="act act-pass" onClick={() => swipe('pass')} disabled={!top} aria-label="Pass" title="Pass (←)"><X size={28} /></button>
          <button className="act act-save act-sm" onClick={() => swipe('save')} disabled={!top} aria-label="Save for later" title="Save (↑)"><Bookmark size={20} /></button>
          <button className="act act-swap" onClick={() => swipe('swap')} disabled={!top} aria-label="Offer a swap" title="Swap (→)"><ArrowLeftRight size={28} /></button>
        </div>
        <p className="deck-count muted mono">{queue.length} {queue.length === 1 ? 'card' : 'cards'} left{fieldName ? ` in ${fieldName}` : ''}{top && me ? ` · ${skillName(top.t.get[0]?.skill || top.p.teaches[0].skill)} is on the table` : ''}</p>
      </div>

      <aside className="swipe-side swipe-right">
        <WhyPanel p={top?.p} t={top?.t} me={me} />
      </aside>
    </div>
  )
}
