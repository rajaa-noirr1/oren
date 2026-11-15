import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, X, SlidersHorizontal, MapPin, Star, ArrowLeftRight, Bookmark, BookmarkCheck, Check, Clock } from 'lucide-react'
import Avatar from './Avatar'
import { SkillIcon, skillName } from './SkillIcon'
import { FieldBadge, tradeLine } from './TradeCard'
import { SKILLS, LEVELS } from '../data/skills'
import { trade, tzLabel, DAYS, DAY_NAME, PARTS, KIND } from '../lib/match'
import { useStore, firstName } from '../lib/store'

const SORTS = [
  { id: 'fit', name: 'Best fit' },
  { id: 'rating', name: 'Top rated' },
  { id: 'taught', name: 'Most sessions' },
  { id: 'new', name: 'Newest' },
]
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const joinedValue = (j) => { const [m, y] = j.split(' '); return +y * 12 + MONTHS.indexOf(m) }

function SearchBox({ q, setQ, onPick }) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const ref = useRef(null)
  const sugg = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return []
    return SKILLS.filter((k) => k.name.toLowerCase().includes(s)).sort((a, b) => a.name.toLowerCase().indexOf(s) - b.name.toLowerCase().indexOf(s)).slice(0, 6)
  }, [q])
  const pick = (id) => { onPick(id); setQ(''); setOpen(false); ref.current?.focus() }
  return (
    <div className="searchbox">
      <Search size={18} className="searchbox-ico" />
      <input ref={ref} className="input" id="browse-search" placeholder="Search a skill, a name or a city" value={q} autoComplete="off"
        role="combobox" aria-expanded={open && sugg.length > 0} aria-controls="skill-suggest" aria-label="Search"
        onChange={(e) => { setQ(e.target.value); setOpen(true); setActive(0) }}
        onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (!sugg.length) return
          if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => (a + 1) % sugg.length) }
          if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => (a - 1 + sugg.length) % sugg.length) }
          if (e.key === 'Enter') { e.preventDefault(); pick(sugg[active].id) }
          if (e.key === 'Escape') setOpen(false)
        }} />
      {q && <button className="searchbox-clear" onClick={() => setQ('')} aria-label="Clear search"><X size={16} /></button>}
      {open && sugg.length > 0 && (
        <ul className="suggest" id="skill-suggest" role="listbox">
          <li className="suggest-head eyebrow">Filter by skill they teach</li>
          {sugg.map((s, i) => (
            <li key={s.id} role="option" aria-selected={i === active}>
              <button onMouseDown={(e) => { e.preventDefault(); pick(s.id) }} className={i === active ? 'is-active' : ''}>
                <SkillIcon id={s.id} size={22} /> {s.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function PersonRow({ p, t }) {
  const { me, decide, statusOf } = useStore()
  const st = statusOf(p.id)
  const getSet = new Set(t.get.map((x) => x.skill))
  const giveSet = new Set(t.give.map((x) => x.skill))
  return (
    <article className="prow" style={{ '--h': 0 }}>
      <Link to={`/u/${p.handle}`} className="prow-main">
        <Avatar seed={p.handle} size={58} />
        <div className="prow-id">
          <h3>{p.name}</h3>
          <p className="muted">{p.headline}</p>
          <p className="prow-meta mono"><MapPin size={12} /> {p.city} · {tzLabel(p.tz)} {p.stats.rating ? <><Star size={12} /> {p.stats.rating.toFixed(1)}</> : <span>New member</span>}</p>
        </div>
        {t.score != null && <span className={`fit-pill kind-${t.kind}`} title={KIND[t.kind].label}><b className="num">{t.score}</b> fit</span>}
      </Link>
      <div className="prow-skills">
        <div><span className="tag-teach">Teaches</span>
          <div className="prow-icons">{p.teaches.map((s) => <span key={s.skill} className={`ico-chip ${getSet.has(s.skill) ? 'is-hit' : ''}`} title={skillName(s.skill)}><SkillIcon id={s.skill} size={20} /><span>{skillName(s.skill)}</span></span>)}</div>
        </div>
        <div><span className="tag-want">Wants</span>
          <div className="prow-icons">{p.wants.map((s) => <span key={s.skill} className={`ico-chip ${giveSet.has(s.skill) ? 'is-hit' : ''}`} title={s.goal}><SkillIcon id={s.skill} size={20} /><span>{skillName(s.skill)}</span></span>)}</div>
        </div>
      </div>
      <div className="prow-foot">
        <FieldBadge field={p.field} />
        <span className="prow-line muted">{tradeLine(t)}</span>
        <div className="prow-actions">
          {st === 'matched' ? <Link to={`/swaps?with=${p.id}`} className="btn btn-sm btn-primary"><Check size={15} /> Matched</Link>
            : st === 'sent' ? <button className="btn btn-sm btn-ghost" disabled><Clock size={15} /> Requested</button>
            : <button className="btn btn-sm btn-teach" onClick={() => (me ? decide(p, 'swap') : null)} disabled={!me} title={me ? `Offer ${firstName(p)} a swap` : 'Build your card first'}><ArrowLeftRight size={15} /> Swap</button>}
          <button className="btn btn-sm btn-ghost btn-icon" onClick={() => decide(p, 'save')} aria-label={`Save ${p.name}`} disabled={st === 'saved' || st === 'matched'}>
            {st === 'saved' ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
          </button>
        </div>
      </div>
    </article>
  )
}

export default function BrowseView({ people, skills, setSkills }) {
  const { me } = useStore()
  const [q, setQ] = useState('')
  const [minLevel, setMinLevel] = useState(0)
  const [wantsMine, setWantsMine] = useState(false)
  const [days, setDays] = useState([])
  const [parts, setParts] = useState([])
  const [format, setFormat] = useState('any')
  const [lang, setLang] = useState('')
  const [sort, setSort] = useState(me ? 'fit' : 'rating')
  const [showFilters, setShowFilters] = useState(false)

  const languages = useMemo(() => [...new Set(people.flatMap((p) => p.languages))].sort(), [people])
  const toggle = (list, set, v) => set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

  const results = useMemo(() => {
    const s = q.trim().toLowerCase()
    return people
      .map((p) => ({ p, t: trade(me, p) }))
      .filter(({ p, t }) => {
        if (s && !`${p.name} ${p.headline} ${p.city} ${p.country} ${p.teaches.map((x) => skillName(x.skill)).join(' ')} ${p.wants.map((x) => skillName(x.skill)).join(' ')}`.toLowerCase().includes(s)) return false
        if (skills.length && !skills.every((id) => p.teaches.some((x) => x.skill === id && x.level >= minLevel))) return false
        if (!skills.length && minLevel && !p.teaches.some((x) => x.level >= minLevel)) return false
        if (wantsMine && !t.give.length) return false
        if (days.length || parts.length) {
          const ok = p.avail.some((code) => { const [d, pt] = code.split('-'); return (!days.length || days.includes(d)) && (!parts.length || parts.includes(pt)) })
          if (!ok) return false
        }
        if (format !== 'any' && !p.format.includes(format)) return false
        if (lang && !p.languages.includes(lang)) return false
        return true
      })
      .sort((a, b) => {
        if (sort === 'fit' && me) return b.t.score - a.t.score
        if (sort === 'taught') return b.p.stats.taught - a.p.stats.taught
        if (sort === 'new') return joinedValue(b.p.joined) - joinedValue(a.p.joined)
        return (b.p.stats.rating ?? 0) - (a.p.stats.rating ?? 0) || b.p.stats.taught - a.p.stats.taught
      })
  }, [people, me, q, skills, minLevel, wantsMine, days, parts, format, lang, sort])

  const active = skills.length + (minLevel ? 1 : 0) + (wantsMine ? 1 : 0) + days.length + parts.length + (format !== 'any' ? 1 : 0) + (lang ? 1 : 0)
  const reset = () => { setSkills([]); setMinLevel(0); setWantsMine(false); setDays([]); setParts([]); setFormat('any'); setLang(''); setQ('') }

  return (
    <div className="browse">
      <div className="browse-bar">
        <SearchBox q={q} setQ={setQ} onPick={(id) => !skills.includes(id) && setSkills([...skills, id])} />
        <button className={`btn btn-ghost filters-btn ${showFilters ? 'is-on' : ''}`} onClick={() => setShowFilters((v) => !v)} aria-expanded={showFilters}>
          <SlidersHorizontal size={17} /> Filters{active ? <span className="count num">{active}</span> : null}
        </button>
        <label className="sort">
          <span className="sr-only">Sort by</span>
          <select className="select" id="browse-sort" value={sort} onChange={(e) => setSort(e.target.value)}>
            {SORTS.map((s) => <option key={s.id} value={s.id} disabled={s.id === 'fit' && !me}>{s.name}</option>)}
          </select>
        </label>
      </div>

      {skills.length > 0 && (
        <div className="active-skills">
          <span className="muted small">Teaches</span>
          {skills.map((id) => (
            <button key={id} className="chip chip-mark" onClick={() => setSkills(skills.filter((x) => x !== id))} aria-label={`Remove ${skillName(id)}`}>
              <SkillIcon id={id} size={18} /> {skillName(id)} <X size={14} />
            </button>
          ))}
        </div>
      )}

      <div className={`browse-layout ${showFilters ? 'show-filters' : ''}`}>
        <aside className="filters" aria-label="Filters">
          <div className="filter">
            <p className="filter-title">Their level</p>
            <div className="seg seg-wrap">
              {[{ n: 0, name: 'Any' }, ...LEVELS.slice(1)].map((l) => (
                <button key={l.n} aria-pressed={minLevel === l.n} onClick={() => setMinLevel(l.n)}>{l.n ? `${l.name}+` : l.name}</button>
              ))}
            </div>
          </div>
          <div className="filter">
            <label className="switch">
              <input type="checkbox" checked={wantsMine} onChange={(e) => setWantsMine(e.target.checked)} disabled={!me} />
              <span className="track" /> Wants something I teach
            </label>
            {!me && <p className="muted small">Needs your card.</p>}
          </div>
          <div className="filter">
            <p className="filter-title">Free on</p>
            <div className="chips">{DAYS.map((d) => <button key={d} className="chip no-icon" aria-pressed={days.includes(d)} onClick={() => toggle(days, setDays, d)}>{DAY_NAME[d]}</button>)}</div>
            <div className="chips">{PARTS.map((pt) => <button key={pt.id} className="chip no-icon" aria-pressed={parts.includes(pt.id)} onClick={() => toggle(parts, setParts, pt.id)}>{pt.name}</button>)}</div>
          </div>
          <div className="filter">
            <p className="filter-title">Format</p>
            <div className="seg">
              {[['any', 'Any'], ['online', 'Online'], ['in-person', 'In person']].map(([v, n]) => <button key={v} aria-pressed={format === v} onClick={() => setFormat(v)}>{n}</button>)}
            </div>
          </div>
          <div className="filter">
            <label className="filter-title" htmlFor="browse-lang">Speaks</label>
            <select className="select" id="browse-lang" value={lang} onChange={(e) => setLang(e.target.value)}>
              <option value="">Any language</option>
              {languages.map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={reset} disabled={!active && !q}>Reset filters</button>
        </aside>

        <div className="results">
          <p className="results-count muted">{results.length} {results.length === 1 ? 'person' : 'people'} · {SORTS.find((s) => s.id === sort)?.name.toLowerCase()}</p>
          {results.length ? (
            <div className="results-grid">{results.map(({ p, t }) => <PersonRow key={p.id} p={p} t={t} />)}</div>
          ) : (
            <div className="empty panel">
              <h3>Nobody matches all of that yet.</h3>
              <p className="muted">Remove a filter or two. Fewer skills and a wider time range usually help.</p>
              <button className="btn btn-primary btn-sm" onClick={reset}>Reset filters</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
