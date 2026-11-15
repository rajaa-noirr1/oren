import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { MapPin, Clock, Languages, CalendarDays, GraduationCap, Star, ArrowLeftRight, Bookmark, BookmarkCheck, Check, MessageCircle, Pencil, LogOut, ChevronRight, Sprout } from 'lucide-react'
import { monthLabel } from '../lib/tree'
import Avatar from '../components/Avatar'
import TradeCard, { FieldBadge } from '../components/TradeCard'
import { SkillIcon, SkillChip, skillName } from '../components/SkillIcon'
import { Modal } from '../components/Overlays'
import { PERSON, PEOPLE } from '../data/people'
import { FIELD } from '../data/fields'
import { levelName } from '../data/skills'
import { trade, tzLabel, localTime, KIND, PARTS, DAY_NAME } from '../lib/match'
import { useStore, firstName } from '../lib/store'
import useTitle from '../lib/useTitle'
import NotFound from './NotFound'

const WEEK = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

function LevelMeter({ level }) {
  return (
    <span className="meter" aria-label={`${levelName(level)}, level ${level} of 4`}>
      {[1, 2, 3, 4].map((n) => <i key={n} className={n <= level ? 'on' : ''} />)}
    </span>
  )
}

function WeekGrid({ avail, mine }) {
  return (
    <div className="week" role="table" aria-label="Weekly availability">
      <div role="row" className="week-row">
        <span role="columnheader" />
        {WEEK.map((d) => <span key={d} role="columnheader" className="week-day mono">{DAY_NAME[d]}</span>)}
      </div>
      {PARTS.map((pt) => (
        <div role="row" className="week-row" key={pt.id}>
          <span role="rowheader" className="week-part">{pt.name}<small className="mono">{pt.hours}</small></span>
          {WEEK.map((d) => {
            const code = `${d}-${pt.id}`
            const free = avail.includes(code)
            const both = free && mine?.includes(code)
            return <span role="cell" key={code} className={`week-cell ${free ? 'is-free' : ''} ${both ? 'is-both' : ''}`} aria-label={`${DAY_NAME[d]} ${pt.name}: ${both ? 'both free' : free ? 'free' : 'busy'}`} />
          })}
        </div>
      ))}
    </div>
  )
}

function ProposeModal({ p, open, onClose }) {
  const { me, decide, sendMessage, toast } = useStore()
  const t = trade(me, p)
  const [learn, setLearn] = useState(t.get[0]?.skill || p.teaches[0].skill)
  const [teach, setTeach] = useState(t.give[0]?.skill || me?.teaches[0]?.skill)
  const [mins, setMins] = useState(60)
  const [msg, setMsg] = useState(`Hi ${firstName(p)}! I can teach you ${skillName(t.give[0]?.skill || me?.teaches[0]?.skill)} if you can teach me ${skillName(t.get[0]?.skill || p.teaches[0].skill)}. Does an evening this week work?`)
  if (!me) return null
  const send = () => {
    const mutual = p.likesYou || p.requestedYou
    decide(p, 'swap')
    if (mutual) sendMessage(p.id, msg)
    else toast(`Swap request sent to ${firstName(p)}: ${skillName(learn)} for ${skillName(teach)}, ${mins} min each.`)
    onClose()
  }
  return (
    <Modal open={open} onClose={onClose} label={`Propose a swap to ${p.name}`}>
      <div className="propose">
        <p className="eyebrow">Propose a swap</p>
        <h2>Trade with {firstName(p)}</h2>
        <div className="field">
          <span className="label">You learn</span>
          <div className="chips">{p.teaches.map((s) => <button key={s.skill} className="chip" aria-pressed={learn === s.skill} onClick={() => setLearn(s.skill)}><SkillIcon id={s.skill} size={18} />{skillName(s.skill)}</button>)}</div>
        </div>
        <div className="field">
          <span className="label">You teach</span>
          <div className="chips">{me.teaches.map((s) => <button key={s.skill} className="chip" aria-pressed={teach === s.skill} onClick={() => setTeach(s.skill)}><SkillIcon id={s.skill} size={18} />{skillName(s.skill)}</button>)}</div>
        </div>
        <div className="field">
          <span className="label">Each half lasts</span>
          <div className="seg">{[30, 45, 60].map((m) => <button key={m} aria-pressed={mins === m} onClick={() => setMins(m)}>{m} min</button>)}</div>
        </div>
        <div className="field">
          <label htmlFor="propose-msg">Message</label>
          <textarea id="propose-msg" className="textarea" value={msg} onChange={(e) => setMsg(e.target.value)} />
        </div>
        <button className="btn btn-teach" onClick={send}><ArrowLeftRight size={17} /> Send swap request</button>
      </div>
    </Modal>
  )
}

function SwapPanel({ p }) {
  const { me, statusOf, decide, decline } = useStore()
  const [open, setOpen] = useState(false)
  const nav = useNavigate()
  const st = statusOf(p.id)
  if (!me) {
    return (
      <div className="swap-panel">
        <p className="eyebrow">Your trade with {firstName(p)}</p>
        <p className="muted">Build your card to see what you could trade and to send a swap request.</p>
        <Link to="/join" className="btn btn-primary">Build your card</Link>
      </div>
    )
  }
  const t = trade(me, p)
  return (
    <div className="swap-panel">
      <p className="eyebrow">Your trade with {firstName(p)}</p>
      <div className={`fit-big kind-${t.kind}`}>
        <b className="num">{t.score}</b>
        <div><span className="mono">fit</span><strong>{KIND[t.kind].label}</strong></div>
      </div>
      <div className="swap-side">
        <span className="tag-teach">You learn</span>
        <div className="chips">{t.get.length ? t.get.map((s) => <SkillChip key={s.skill} id={s.skill} tone="teach" />) : <span className="muted small">Nothing on your list yet</span>}</div>
      </div>
      <div className="swap-side">
        <span className="tag-want">You teach</span>
        <div className="chips">{t.give.length ? t.give.map((s) => <SkillChip key={s.skill} id={s.skill} tone="want" />) : <span className="muted small">They want nothing you teach yet</span>}</div>
      </div>
      <div className="swap-actions">
        {st === 'matched' && <button className="btn btn-primary" onClick={() => nav(`/swaps?with=${p.id}`)}><MessageCircle size={17} /> Open chat</button>}
        {st === 'sent' && <button className="btn btn-ghost" disabled><Check size={17} /> Request sent</button>}
        {st === 'incoming' && (
          <>
            <button className="btn btn-teach" onClick={() => decide(p, 'swap')}><Check size={17} /> Accept request</button>
            <button className="btn btn-ghost" onClick={() => decline(p)}>Decline</button>
          </>
        )}
        {(st === null || st === 'saved' || st === 'passed') && <button className="btn btn-teach" onClick={() => setOpen(true)}><ArrowLeftRight size={17} /> Propose a swap</button>}
        {st !== 'matched' && st !== 'incoming' && (
          <button className="btn btn-ghost" onClick={() => decide(p, 'save')} disabled={st === 'saved' || st === 'sent'}>
            {st === 'saved' ? <BookmarkCheck size={17} /> : <Bookmark size={17} />} {st === 'saved' ? 'Saved' : 'Save'}
          </button>
        )}
      </div>
      {st === 'incoming' && <p className="small muted">{firstName(p)} already asked to swap with you.</p>}
      <ProposeModal p={p} open={open} onClose={() => setOpen(false)} />
    </div>
  )
}

export default function Profile({ own = false }) {
  const { handle } = useParams()
  const { me, growth, signOut } = useStore()
  const nav = useNavigate()
  const p = own ? me : PEOPLE.find((x) => x.handle === handle)
  useTitle(p ? (own ? 'Your profile' : p.name) : 'Not found')
  const viewerT = useMemo(() => (p && !own ? trade(me, p) : null), [me, p, own])
  if (!p) return <NotFound />
  if (me && !own && p.handle === me.handle) return <Profile own />

  const f = FIELD[p.field]
  const wantSet = new Set((me?.wants || []).map((w) => w.skill))
  const teachSet = new Set((me?.teaches || []).map((w) => w.skill))
  const shownLessons = (own ? growth?.lessons || [] : p.lessons || []).filter((l) => l.visibility === 'public')

  return (
    <div className="profile">
      <section className="pf-banner" style={{ '--h': f?.h ?? 220 }}>
        <div className="pf-pattern" aria-hidden="true">
          {Array.from({ length: 4 }, () => [...p.teaches, ...p.wants]).flat().slice(0, 28).map((s, i) => <SkillIcon key={i} id={s.skill} size={40} />)}
        </div>
        <div className="wrap">
          <nav className="crumbs small" aria-label="Breadcrumb">
            <Link to="/explore">Explore</Link><ChevronRight size={14} />
            {f && <><Link to={`/explore?field=${f.id}`}>{f.name}</Link><ChevronRight size={14} /></>}
            <span>{own ? 'You' : p.name}</span>
          </nav>
        </div>
      </section>
      <div className="wrap pf-grid">
        <div className="pf-main">
          <header className="pf-head">
            <Avatar seed={p.avatarSeed || p.handle} size={132} className="pf-avatar" />
            <div className="pf-id">
              <div className="pf-badges"><FieldBadge field={p.field} short={false} /><span className="mono muted small">#{p.number}</span></div>
              <h1>{p.name}</h1>
              <p className="pf-headline">{p.headline}</p>
              <p className="pf-meta">
                <span className="mono">@{p.handle}</span>
                <span><MapPin size={14} /> {p.city}, {p.country}</span>
                <span><Clock size={14} /> {localTime(p.tz)} local · {tzLabel(p.tz)}</span>
                <span><Languages size={14} /> {p.languages.join(', ')}</span>
                <span><CalendarDays size={14} /> Joined {p.joined}</span>
                {p.github && <span><SkillIcon id="github" size={14} /> {p.github}</span>}
              </p>
            </div>
          </header>

          <dl className="pf-stats">
            <div><dt className="num">{p.stats.taught}</dt><dd>sessions taught</dd></div>
            <div><dt className="num">{p.stats.learned}</dt><dd>sessions learned</dd></div>
            <div><dt className="num">{p.stats.rating ? p.stats.rating.toFixed(1) : "—"}{p.stats.rating ? <Star size={16} /> : null}</dt><dd>average rating</dd></div>
            <div><dt>{p.stats.reply}</dt><dd>usual reply time</dd></div>
          </dl>

          <section className="pf-sec">
            <h2 className="pf-h">About</h2>
            <p className="pf-bio">{p.bio}</p>
            <p className="pf-style"><span className="eyebrow">How {own ? 'you teach' : `${firstName(p)} teaches`}</span>{p.style}</p>
          </section>

          <section className="pf-sec">
            <h2 className="pf-h"><span className="tag-teach">Can teach</span></h2>
            <div className="tiles">
              {p.teaches.map((s) => (
                <div key={s.skill} className={`tile ${!own && wantSet.has(s.skill) ? 'is-hit' : ''}`}>
                  <span className="tile-ico"><SkillIcon id={s.skill} size={34} /></span>
                  <div className="tile-body">
                    <b>{skillName(s.skill)}</b>
                    <span className="tile-level"><LevelMeter level={s.level} /> {levelName(s.level)} · {s.years} {s.years === 1 ? 'yr' : 'yrs'}</span>
                  </div>
                  {!own && wantSet.has(s.skill) && <span className="tile-flag">On your list</span>}
                </div>
              ))}
            </div>
          </section>

          <section className="pf-sec">
            <h2 className="pf-h"><span className="tag-want">Wants to learn</span></h2>
            <div className="tiles">
              {p.wants.map((s) => (
                <div key={s.skill} className={`tile tile-want ${!own && teachSet.has(s.skill) ? 'is-hit' : ''}`}>
                  <span className="tile-ico"><SkillIcon id={s.skill} size={34} /></span>
                  <div className="tile-body">
                    <b>{skillName(s.skill)}</b>
                    <span className="tile-goal">{s.goal ? `“${s.goal}”` : 'No goal written yet'}</span>
                  </div>
                  {!own && teachSet.has(s.skill) && <span className="tile-flag">You teach this</span>}
                </div>
              ))}
            </div>
          </section>

          <section className="pf-sec">
            <h2 className="pf-h">Education</h2>
            <ol className="edu">
              {p.education.map((e, i) => (
                <li key={i}>
                  <span className="edu-dot"><GraduationCap size={16} /></span>
                  <div>
                    <p className="eyebrow">{e.kind} · {e.from}–{e.to}</p>
                    <b>{e.title}</b>
                    <p className="muted">{e.place}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="pf-sec">
            <h2 className="pf-h">Usually free</h2>
            <WeekGrid avail={p.avail} mine={own ? null : me?.avail} />
            <p className="week-key small muted">
              <span><i className="key-free" /> {own ? 'You are free' : `${firstName(p)} is free`}</span>
              {!own && me && <span><i className="key-both" /> You are both free</span>}
              <span>Times are local to {own ? 'you' : firstName(p)} ({tzLabel(p.tz)}). Formats: {p.format.map((x) => (x === 'online' ? 'online' : 'in person')).join(' or ')}.</span>
            </p>
          </section>

          {p.reviews?.length > 0 && (
            <section className="pf-sec">
              <h2 className="pf-h">From swap partners</h2>
              <div className="reviews">
                {p.reviews.map((r, i) => {
                  const by = PERSON[r.by]
                  return (
                    <figure key={i} className="review">
                      <blockquote>{r.text}</blockquote>
                      <figcaption>
                        {by && <Avatar seed={by.handle} size={34} />}
                        <span>{by ? <Link to={`/u/${by.handle}`}>{by.name}</Link> : r.by}<br /><span className="muted small">learned {skillName(r.skill)}</span></span>
                      </figcaption>
                    </figure>
                  )
                })}
              </div>
            </section>
          )}
          {shownLessons.length > 0 && (
            <section className="pf-sec">
              <h2 className="pf-h">Lessons learned the hard way</h2>
              <div className="lessons-grid">
                {shownLessons.map((l) => (
                  <article key={l.id} className="lesson-card">
                    <figure className="oldphoto">
                      {l.photo ? <img src={l.photo} alt={`Photo for “${l.title}”`} /> : <span className="oldphoto-blank"><SkillIcon id={l.skill} size={30} /></span>}
                      <figcaption className="mono">{monthLabel(l.at)}</figcaption>
                    </figure>
                    <div>
                      <p className="eyebrow">{skillName(l.skill)}</p>
                      <h3>{l.title}</h3>
                      <p className="muted small">{l.lesson}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
          {!own && viewerT?.score != null && (
            <a href="#swap-panel" className="btn btn-teach pf-mobile-cta"><ArrowLeftRight size={17} /> Your trade · {viewerT.score} fit</a>
          )}
        </div>

        <aside className="pf-side" id="swap-panel">
          {own ? (
            <div className="own-side">
              <p className="eyebrow">Your card, as others see it</p>
              <TradeCard person={p} t={null} />
              <div className="own-actions">
                <Link to="/tree" className="btn btn-teach"><Sprout size={16} /> Open my skill tree</Link>
                <Link to="/join?edit=1" className="btn btn-primary"><Pencil size={16} /> Edit your card</Link>
                <button className="btn btn-ghost" onClick={() => { signOut(); nav('/') }}><LogOut size={16} /> Sign out</button>
              </div>
            </div>
          ) : (
            <SwapPanel p={p} t={viewerT} />
          )}
        </aside>
      </div>
    </div>
  )
}
