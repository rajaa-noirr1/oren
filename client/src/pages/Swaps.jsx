import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, CalendarPlus, Check, Send, Video, MapPin, X, ArrowLeftRight, Repeat2, Clock, Sprout } from 'lucide-react'
import Avatar from '../components/Avatar'
import { SkillIcon, SkillChip, skillName } from '../components/SkillIcon'
import { Modal } from '../components/Overlays'
import { PERSON, PEOPLE } from '../data/people'
import { trade, findLoops, slotLabel } from '../lib/match'
import { useStore, firstName } from '../lib/store'
import useTitle from '../lib/useTitle'

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
const PART_TIME = { m: '10:00', a: '14:00', e: '19:00' }
const fmtDate = (iso) => new Date(`${iso}T00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
const fmtTime = (ts) => new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
const isoDay = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const addMins = (time, mins) => { const [h, m] = time.split(':').map(Number); const t = h * 60 + m + mins; return `${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}` }

function Ticket({ s, onCancel, onLog }) {
  const p = PERSON[s.with]
  const state = s.status === 'completed' ? 'Completed' : s.status === 'confirmed' ? 'Confirmed' : `Waiting for ${p ? firstName(p) : 'partner'}`
  return (
    <article className={`ticket ${s.status}`}>
      <div className="ticket-body">
        <p className="eyebrow">{state} · {fmtDate(s.date)}</p>
        <p className="ticket-skills"><SkillIcon id={s.learn} size={22} /> {skillName(s.learn)} <span>⇄</span> <SkillIcon id={s.teach} size={22} /> {skillName(s.teach)}</p>
        <p className="ticket-meta">
          {p && <span><Avatar seed={p.handle} size={22} /> with {p.name}</span>}
          <span>{s.where === 'online' ? <Video size={14} /> : <MapPin size={14} />} {s.where === 'online' ? s.link : s.place || 'In person'}</span>
        </p>
        {s.note && <p className="ticket-note">“{s.note}”</p>}
        {s.status === 'confirmed' && onLog && (
          <div><button className="btn btn-teach btn-sm" onClick={() => onLog(s)}><Sprout size={15} /> Session done · log what you learned</button></div>
        )}
        {s.status === 'completed' && (
          <p className="ticket-logged">
            <Sprout size={15} /> <span>“{s.logged}”</span> <Link to="/tree" className="link">See it on your tree</Link>
          </p>
        )}
      </div>
      <div className="ticket-stub2">
        <b className="num">{s.time}</b>
        <span className="mono">to {addMins(s.time, s.mins * 2)}</span>
        <span className="mono">2 × {s.mins} min</span>
        {onCancel && s.status !== 'completed' && <button className="btn btn-ghost btn-sm" onClick={() => onCancel(s.id)}>Cancel</button>}
      </div>
    </article>
  )
}

function LogModal({ s, onClose }) {
  const { logSession } = useStore()
  const [text, setText] = useState('')
  const [err, setErr] = useState(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => { setText(''); setErr(null) }, [s?.id])
  const p = s ? PERSON[s.with] : null
  const save = async (e) => {
    e.preventDefault()
    if (busy) return
    if (text.trim().length < 10) { setErr('Write a sentence or two in your own words. Future you will thank you.'); return }
    setBusy(true)
    const ok = await logSession(s, text.trim())
    setBusy(false)
    if (ok) onClose()
  }
  return (
    <Modal open={!!s} onClose={onClose} label="Log what you learned">
      {s && p && (
        <form className="propose" onSubmit={save} noValidate>
          <p className="eyebrow">Session done · {fmtDate(s.date)}</p>
          <h2>What did {firstName(p)} teach you about {skillName(s.learn)}?</h2>
          <p className="muted">No ratings, just what you learned in your own words. It goes onto the {skillName(s.learn)} leaf of your skill tree, and {skillName(s.teach)} grows a fruit for teaching {firstName(p)}.</p>
          <div className="field">
            <label htmlFor="log-text">What I learned</label>
            <textarea id="log-text" className="textarea" value={text} onChange={(e) => { setText(e.target.value); setErr(null) }} placeholder={`The one thing about ${skillName(s.learn)} that finally clicked…`} />
          </div>
          {err && <p className="form-err" role="alert">{err}</p>}
          <button className="btn btn-teach" disabled={busy}><Sprout size={17} /> {busy ? 'Saving…' : 'Save to my tree'}</button>
        </form>
      )}
    </Modal>
  )
}

function PlanModal({ p, onClose }) {
  const { me, addSession, sendMessage, toast } = useStore()
  const t = p ? trade(me, p) : null
  const days = useMemo(() => Array.from({ length: 10 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i + 1); return d }), [])
  const [learn, setLearn] = useState(null)
  const [teach, setTeach] = useState(null)
  const [day, setDay] = useState(null)
  const [time, setTime] = useState('19:00')
  const [mins, setMins] = useState(45)
  const [where, setWhere] = useState('online')
  const [place, setPlace] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => {
    if (!p) return
    setLearn(t.get[0]?.skill || p.teaches[0].skill)
    setTeach(t.give[0]?.skill || me.teaches[0].skill)
    const first = days.find((d) => t.slots.some((s) => s.startsWith(DAY_KEYS[d.getDay()]))) || days[0]
    setDay(isoDay(first))
    const slot = t.slots.find((s) => s.startsWith(DAY_KEYS[first.getDay()]))
    setTime(slot ? PART_TIME[slot.split('-')[1]] : '19:00')
    setNote(''); setPlace(''); setWhere(p.format.includes('online') ? 'online' : 'in-person')
  }, [p]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!p || !t) return <Modal open={false} onClose={onClose} label="Plan a session" />
  const send = async () => {
    const link = `https://meet.jit.si/oren-${me.handle || 'you'}-${p.handle}-${Math.random().toString(36).slice(2, 6)}`
    const ok = await addSession({ with: p.id, learn, teach, date: day, time, mins, where, place, link, note })
    if (!ok) return
    sendMessage(p.id, `I sent you a session invite: ${skillName(learn)} for ${skillName(teach)}, ${fmtDate(day)} at ${time}.`, 'Got it. I will confirm it in a moment.')
    toast(`Invite sent to ${firstName(p)}.`)
    onClose()
  }
  return (
    <Modal open={!!p} onClose={onClose} label={`Plan a session with ${p.name}`} className="plan-modal">
      <div className="propose">
        <p className="eyebrow">Plan a session</p>
        <h2>You and {firstName(p)}</h2>
        <div className="grid2">
          <div className="field"><span className="label">{firstName(p)} teaches you</span>
            <div className="chips">{p.teaches.map((s) => <button key={s.skill} className="chip" aria-pressed={learn === s.skill} onClick={() => setLearn(s.skill)}><SkillIcon id={s.skill} size={18} />{skillName(s.skill)}</button>)}</div>
          </div>
          <div className="field"><span className="label">You teach {firstName(p)}</span>
            <div className="chips">{me.teaches.map((s) => <button key={s.skill} className="chip" aria-pressed={teach === s.skill} onClick={() => setTeach(s.skill)}><SkillIcon id={s.skill} size={18} />{skillName(s.skill)}</button>)}</div>
          </div>
        </div>
        <div className="field"><span className="label">Day</span>
          <div className="day-pick">
            {days.map((d) => {
              const key = isoDay(d)
              const both = t.slots.some((s) => s.startsWith(DAY_KEYS[d.getDay()]))
              return <button key={key} aria-pressed={day === key} className={both ? 'is-both' : ''} onClick={() => setDay(key)}><span className="mono">{d.toLocaleDateString('en-GB', { weekday: 'short' })}</span><b>{d.getDate()}</b>{both && <i title="You are both usually free" />}</button>
            })}
          </div>
          <small>Yellow dots mark days you are both usually free: {t.slots.length ? t.slots.slice(0, 3).map(slotLabel).join(', ') : 'none yet'}.</small>
        </div>
        <div className="grid2">
          <div className="field"><label htmlFor="plan-time">Start time (your time)</label><input id="plan-time" type="time" className="input" value={time} onChange={(e) => setTime(e.target.value)} /></div>
          <div className="field"><span className="label">Each half</span><div className="seg">{[30, 45, 60].map((m) => <button key={m} aria-pressed={mins === m} onClick={() => setMins(m)}>{m} min</button>)}</div></div>
        </div>
        <div className="field"><span className="label">Where</span>
          <div className="seg">
            <button aria-pressed={where === 'online'} onClick={() => setWhere('online')} disabled={!p.format.includes('online')}><Video size={15} /> Online</button>
            <button aria-pressed={where === 'in-person'} onClick={() => setWhere('in-person')} disabled={!p.format.includes('in-person')}><MapPin size={15} /> In person</button>
          </div>
          {where === 'in-person' && <input className="input" value={place} onChange={(e) => setPlace(e.target.value)} placeholder="A café or library you both know" aria-label="Meeting place" />}
          {where === 'online' && <small>OREN adds a video room link to the invite.</small>}
        </div>
        <div className="field"><label htmlFor="plan-note">Plan for the session</label><textarea id="plan-note" className="textarea" value={note} onChange={(e) => setNote(e.target.value)} placeholder={`First half: ${skillName(learn)} basics. Second half: ${skillName(teach)}.`} /></div>
        <button className="btn btn-teach" onClick={send}><CalendarPlus size={17} /> Send invite</button>
      </div>
    </Modal>
  )
}

function Thread({ p, onPlan, onLog }) {
  const { me, threads, sendMessage, sessions, cancelSession } = useStore()
  const [text, setText] = useState('')
  const box = useRef(null)
  const msgs = threads[p.id] || []
  const t = trade(me, p)
  const mine = sessions.filter((s) => s.with === p.id)
  useEffect(() => { box.current?.scrollTo({ top: box.current.scrollHeight, behavior: 'smooth' }) }, [msgs.length])
  const submit = (e) => { e.preventDefault(); const v = text.trim(); if (!v) return; sendMessage(p.id, v); setText('') }
  return (
    <section className="thread" aria-label={`Chat with ${p.name}`}>
      <header className="thread-head">
        <Link to={`/u/${p.handle}`} className="thread-who"><Avatar seed={p.handle} size={46} /><span><b>{p.name}</b><span className="muted small">{p.headline}</span></span></Link>
        <button className="btn btn-teach btn-sm" onClick={onPlan}><CalendarPlus size={16} /> Plan a session</button>
      </header>
      <div className="thread-trade">
        {t.get.slice(0, 2).map((s) => <SkillChip key={s.skill} id={s.skill} tone="teach" />)}
        <ArrowLeftRight size={16} />
        {t.give.slice(0, 2).map((s) => <SkillChip key={s.skill} id={s.skill} tone="want" />)}
      </div>
      {mine.length > 0 && <div className="thread-tickets">{mine.map((s) => <Ticket key={s.id} s={s} onCancel={cancelSession} onLog={onLog} />)}</div>}
      <div className="msgs" ref={box}>
        {msgs.length === 0 && <p className="muted small">Say hi to {firstName(p)}. Agree on what to cover first, then send a session invite.</p>}
        {msgs.map((m, i) => (
          <div key={i} className={`msg ${m.from === 'me' ? 'is-me' : ''}`}>
            <p>{m.text}</p>
            <time className="mono">{fmtTime(m.at)}</time>
          </div>
        ))}
      </div>
      <form className="composer" onSubmit={submit}>
        <input className="input" id="composer" value={text} onChange={(e) => setText(e.target.value)} placeholder={`Message ${firstName(p)}`} aria-label={`Message ${p.name}`} autoComplete="off" />
        <button className="btn btn-primary btn-icon" aria-label="Send"><Send size={18} /></button>
      </form>
    </section>
  )
}

function PersonList({ people, empty, children }) {
  if (!people.length) return <div className="empty panel"><p className="muted">{empty}</p><Link to="/explore" className="btn btn-primary btn-sm">Go to Explore</Link></div>
  return <div className="plist">{people.map((p) => children(p))}</div>
}

function PItem({ p, children }) {
  const { me } = useStore()
  const t = trade(me, p)
  return (
    <div className="pitem">
      <Link to={`/u/${p.handle}`} className="pitem-who"><Avatar seed={p.handle} size={50} /><span><b>{p.name}</b><span className="muted small">{p.headline}</span></span></Link>
      <div className="pitem-trade">
        {t.get.slice(0, 2).map((s) => <SkillChip key={s.skill} id={s.skill} tone="teach" />)}
        {t.give.length > 0 && <ArrowLeftRight size={15} />}
        {t.give.slice(0, 2).map((s) => <SkillChip key={s.skill} id={s.skill} tone="want" />)}
      </div>
      <div className="pitem-actions">{children}</div>
    </div>
  )
}

function Loops({ me }) {
  const { toast } = useStore()
  const loops = useMemo(() => findLoops(me, PEOPLE, 3), [me])
  const [asked, setAsked] = useState([])
  return (
    <section id="loops" className="loops-sec">
      <div className="section-head row-head" style={{ marginBottom: 20 }}>
        <div><p className="eyebrow"><Repeat2 size={13} /> Swap loops</p><h2>Three-way trades for you</h2></div>
        <p className="muted" style={{ maxWidth: 420 }}>Each person teaches once and learns once, even when no two of you match directly.</p>
      </div>
      {loops.length === 0 ? <p className="muted">No loops yet. Add more skills to your card to find some.</p> : (
        <div className="loop-cards">
          {loops.map((l, i) => {
            const key = `${l.a.id}-${l.b.id}`
            return (
              <article className="loop-card" key={key}>
                <ol className="chain">
                  <li><Avatar seed={me.avatarSeed || me.handle} size={44} /><b>You</b></li>
                  <li className="edge"><SkillChip id={l.youToA} tone="teach" /></li>
                  <li><Avatar seed={l.a.handle} size={44} /><Link to={`/u/${l.a.handle}`}>{firstName(l.a)}</Link></li>
                  <li className="edge"><SkillChip id={l.aToB} tone="teach" /></li>
                  <li><Avatar seed={l.b.handle} size={44} /><Link to={`/u/${l.b.handle}`}>{firstName(l.b)}</Link></li>
                  <li className="edge"><SkillChip id={l.bToYou} tone="teach" /></li>
                  <li className="back"><Avatar seed={me.avatarSeed || me.handle} size={44} /><b>You</b></li>
                </ol>
                <p className="small muted">You teach {firstName(l.a)} {skillName(l.youToA)}. {firstName(l.a)} teaches {firstName(l.b)} {skillName(l.aToB)}. {firstName(l.b)} teaches you {skillName(l.bToYou)}.{l.pure ? ' None of these could happen as a direct swap.' : ''}</p>
                <button className="btn btn-sm btn-primary" disabled={asked.includes(key)} onClick={() => { setAsked([...asked, key]); toast(`Loop suggested to ${firstName(l.a)} and ${firstName(l.b)}.`) }}>
                  {asked.includes(key) ? <><Check size={15} /> Suggested</> : <><Repeat2 size={15} /> Suggest this loop</>}
                </button>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default function Swaps() {
  useTitle('Your swaps')
  const { me, matches, incoming, sent, saved, sessions, decide, decline, withdraw, cancelSession, threads } = useStore()
  const [params, setParams] = useSearchParams()
  const withId = params.get('with')
  const [tab, setTab] = useState(() => (withId || matches.length ? 'matches' : incoming.length ? 'requests' : 'matches'))
  const [planFor, setPlanFor] = useState(null)
  const [logFor, setLogFor] = useState(null)
  const active = matches.find((p) => p.id === withId) || matches[0] || null
  useEffect(() => { if (withId) setTab('matches') }, [withId])

  if (!me) {
    return (
      <div className="wrap page">
        <div className="empty panel" style={{ maxWidth: 560 }}>
          <p className="eyebrow">Your swaps</p>
          <h2>Build your card to start trading.</h2>
          <p className="muted">Matches, requests and sessions live here once you have a card.</p>
          <Link to="/join" className="btn btn-primary">Build your card <ArrowRight size={17} /></Link>
        </div>
      </div>
    )
  }

  const upcoming = [...sessions].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
  const TABS = [['matches', 'Matches', matches.length], ['requests', 'Requests', incoming.length], ['sent', 'Sent', sent.length], ['saved', 'Saved', saved.length], ['sessions', 'Sessions', sessions.length]]

  return (
    <div className="wrap page swaps">
      <div className="page-head">
        <div><p className="eyebrow">Swaps</p><h1>Your trades</h1></div>
        <Link to="/explore" className="btn btn-ghost">Find more people <ArrowRight size={17} /></Link>
      </div>
      <div className="tabs" role="tablist" aria-label="Swap lists">
        {TABS.map(([id, name, n]) => (
          <button key={id} role="tab" aria-selected={tab === id} className="tab" onClick={() => setTab(id)}>{name}<span className="num">{n}</span></button>
        ))}
      </div>

      {tab === 'matches' && (matches.length ? (
        <div className="inbox">
          <ul className="inbox-list">
            {matches.map((p) => {
              const last = (threads[p.id] || []).at(-1)
              return (
                <li key={p.id}>
                  <button className={`inbox-item ${active?.id === p.id ? 'is-on' : ''}`} onClick={() => setParams({ with: p.id }, { replace: true })}>
                    <Avatar seed={p.handle} size={44} />
                    <span className="inbox-text"><b>{p.name}</b><span className="muted small">{last ? `${last.from === 'me' ? 'You: ' : ''}${last.text}` : 'New match. Say hi!'}</span></span>
                  </button>
                </li>
              )
            })}
          </ul>
          {active && <Thread key={active.id} p={active} onPlan={() => setPlanFor(active)} onLog={setLogFor} />}
        </div>
      ) : (
        <div className="empty panel"><h3>No matches yet.</h3><p className="muted">Swipe right on people in Explore. When they swipe right on you too, they show up here.</p><Link to="/explore" className="btn btn-primary btn-sm">Start swiping</Link></div>
      ))}

      {tab === 'requests' && (
        <PersonList people={incoming} empty="No requests right now. People who swipe right on you show up here.">
          {(p) => <PItem key={p.id} p={p}><button className="btn btn-teach btn-sm" onClick={() => decide(p, 'swap')}><Check size={15} /> Accept</button><button className="btn btn-ghost btn-sm" onClick={() => decline(p)}>Decline</button></PItem>}
        </PersonList>
      )}
      {tab === 'sent' && (
        <PersonList people={sent} empty="You have no open requests. Swipe right in Explore to send one.">
          {(p) => <PItem key={p.id} p={p}><span className="pill-wait"><Clock size={14} /> Waiting</span><button className="btn btn-ghost btn-sm" onClick={() => withdraw(p)}>Withdraw</button></PItem>}
        </PersonList>
      )}
      {tab === 'saved' && (
        <PersonList people={saved} empty="Nothing saved. Swipe up or press Save on a card to keep someone for later.">
          {(p) => <PItem key={p.id} p={p}><button className="btn btn-teach btn-sm" onClick={() => decide(p, 'swap')}><ArrowLeftRight size={15} /> Swap</button><button className="btn btn-ghost btn-sm btn-icon" onClick={() => withdraw(p)} aria-label={`Remove ${p.name}`}><X size={15} /></button></PItem>}
        </PersonList>
      )}
      {tab === 'sessions' && (upcoming.length ? (
        <div className="tickets">{upcoming.map((s) => <Ticket key={s.id} s={s} onCancel={cancelSession} onLog={setLogFor} />)}</div>
      ) : (
        <div className="empty panel"><h3>No sessions planned.</h3><p className="muted">Open a match and press “Plan a session” to send an invite.</p></div>
      ))}

      <Loops me={me} />
      <PlanModal p={planFor} onClose={() => setPlanFor(null)} />
      <LogModal s={logFor} onClose={() => setLogFor(null)} />
    </div>
  )
}
