import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, GraduationCap, Clock, Star, ArrowUpRight, RotateCcw, Sparkles } from 'lucide-react'
import Avatar from './Avatar'
import { SkillIcon, skillName } from './SkillIcon'
import { FIELD } from '../data/fields'
import { levelName } from '../data/skills'
import { KIND, tzLabel, localTime, slotLabel } from '../lib/match'

export function FieldBadge({ field, short = true }) {
  const f = FIELD[field]
  if (!f) return null
  return (
    <span className="field-badge" style={{ '--h': f.h }}>
      <f.Icon size={13} strokeWidth={2.4} />
      {short ? f.short : f.name}
    </span>
  )
}

function SkillList({ items, hits, tone, max = 4 }) {
  const shown = [...items].sort((a, b) => (hits.has(b.skill) ? 1 : 0) - (hits.has(a.skill) ? 1 : 0)).slice(0, max)
  const more = items.length - shown.length
  if (!items.length) return <div className="tcard-skills"><span className="chip no-icon muted">{tone === 'teach' ? 'Add skills you can teach' : 'Add skills you want'}</span></div>
  return (
    <div className="tcard-skills">
      {shown.map((s) => (
        <span key={s.skill} className={`chip ${hits.has(s.skill) ? 'chip-mark' : ''}`} title={s.level ? `${skillName(s.skill)}: ${levelName(s.level)}` : s.goal}>
          <SkillIcon id={s.skill} size={18} />
          {skillName(s.skill)}
        </span>
      ))}
      {more > 0 && <span className="chip no-icon muted">+{more}</span>}
    </div>
  )
}

export function tradeLine(t) {
  if (!t || t.score == null) return 'Build your card to see your fit'
  if (t.kind === 'perfect') return `${skillName(t.get[0].skill)} ⇄ ${skillName(t.give[0].skill)}`
  if (t.kind === 'get') return `Teaches you ${skillName(t.get[0].skill)}`
  if (t.kind === 'give') return `Wants your ${skillName(t.give[0].skill)}`
  return KIND.none.label
}

export default function TradeCard({ person: p, t, flipped = false, onFlip, className = '', shine = true }) {
  const ref = useRef(null)
  const f = FIELD[p.field]
  const getSet = new Set((t?.get || []).map((x) => x.skill))
  const giveSet = new Set((t?.give || []).map((x) => x.skill))

  const move = (e) => {
    if (!shine || !ref.current || e.pointerType === 'touch') return
    const r = ref.current.getBoundingClientRect()
    ref.current.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`)
    ref.current.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`)
  }

  return (
    <div className={`tcard-flip ${flipped ? 'is-flipped' : ''} ${className}`}>
      <div className="tcard-inner">
        <article ref={ref} className="tcard face" style={{ '--h': f?.h ?? 220 }} onPointerMove={move} aria-hidden={flipped}>
          <div className="tcard-head">
            <div className="tcard-top">
              <span className="mono tcard-no">#{p.number}</span>
              <FieldBadge field={p.field} />
            </div>
            <Avatar seed={p.avatarSeed || p.handle} size={96} className="tcard-avatar" />
            {t?.score != null && (
              <div className={`tcard-fit kind-${t.kind}`} title="Swap fit">
                <b className="num">{t.score}</b><span>fit</span>
              </div>
            )}
          </div>
          <div className="tcard-body">
            <div>
              <h3 className="tcard-name">{p.name}</h3>
              <p className="tcard-sub">{p.headline}</p>
              <p className="tcard-loc"><MapPin size={13} /> {p.city} · {tzLabel(p.tz)} · {localTime(p.tz)} there</p>
            </div>
            <div className="tcard-row">
              <span className="tag-teach">Teaches</span>
              <SkillList items={p.teaches} hits={getSet} tone="teach" />
            </div>
            <div className="tcard-row">
              <span className="tag-want">Wants to learn</span>
              <SkillList items={p.wants} hits={giveSet} tone="want" max={3} />
            </div>
          </div>
          <div className={`tcard-foot kind-${t?.kind || 'guest'}`}>
            {t?.score != null && t.kind === 'perfect'
              ? <span className="tcard-kind pbadge"><Sparkles size={13} strokeWidth={2.4} aria-hidden="true" />{KIND.perfect.label}</span>
              : <span className="tcard-kind">{t?.score != null ? KIND[t.kind].label : p.id === 'me' ? 'Your card' : 'Guest view'}</span>}
            <span className="tcard-line">{p.id === 'me' && t?.score == null ? `Teaches ${p.teaches.length} · learns ${p.wants.length}` : tradeLine(t)}</span>
          </div>
          {onFlip && <button className="tcard-flipbtn" onClick={onFlip} aria-label={`More about ${p.name}`}>More</button>}
          <span className="tcard-shine" aria-hidden="true" />
        </article>

        <article className="tcard face back" style={{ '--h': f?.h ?? 220 }} aria-hidden={!flipped}>
          <div className="back-scroll">
            <div className="back-head">
              <Avatar seed={p.avatarSeed || p.handle} size={44} />
              <div>
                <h3 className="tcard-name" style={{ fontSize: 17 }}>{p.name}</h3>
                <p className="muted" style={{ fontSize: 13 }}>@{p.handle}</p>
              </div>
            </div>
            <p className="back-bio">{p.bio}</p>
            <div className="back-block">
              <p className="eyebrow">How they teach</p>
              <p>{p.style}</p>
            </div>
            <div className="back-block">
              <p className="eyebrow">Education</p>
              {p.education.map((e, i) => (
                <p key={i} className="back-edu"><GraduationCap size={15} /> <span><b>{e.title}</b><br /><span className="muted">{e.place} · {e.from}–{e.to}</span></span></p>
              ))}
            </div>
            <div className="back-block">
              <p className="eyebrow">Usually free</p>
              <div className="chips">{p.avail.map((s) => <span key={s} className={`chip no-icon ${t?.slots?.includes(s) ? 'chip-mark' : ''}`}>{slotLabel(s)}</span>)}</div>
            </div>
            <div className="back-stats">
              <span><b className="num">{p.stats.taught}</b> taught</span>
              <span><b className="num">{p.stats.learned}</b> learned</span>
              <span><Star size={13} /> <b className="num">{p.stats.rating ? p.stats.rating.toFixed(1) : "—"}</b></span>
              <span><Clock size={13} /> {p.stats.reply}</span>
            </div>
          </div>
          <div className="back-actions">
            {onFlip && <button className="btn btn-ghost btn-sm" onClick={onFlip}><RotateCcw size={15} /> Front</button>}
            {p.id !== 'me' && <Link to={`/u/${p.handle}`} className="btn btn-primary btn-sm">Full profile <ArrowUpRight size={15} /></Link>}
          </div>
        </article>
      </div>
    </div>
  )
}
