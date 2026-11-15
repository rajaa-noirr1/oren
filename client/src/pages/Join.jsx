import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Plus, Trash2, Shuffle, X, Wand2 } from 'lucide-react'
import Avatar from '../components/Avatar'
import TradeCard from '../components/TradeCard'
import SkillPicker from '../components/SkillPicker'
import { SkillIcon, skillName } from '../components/SkillIcon'
import FieldPicker from '../components/FieldPicker'
import { FIELD } from '../data/fields'
import { LEVELS } from '../data/skills'
import { PEOPLE } from '../data/people'
import { trade, tzLabel, PARTS, DAY_NAME } from '../lib/match'
import { useStore, today } from '../lib/store'
import useTitle from '../lib/useTitle'

const STEPS = ['Account', 'About you', 'Education', 'You teach', 'You learn', 'Free time']
const LANGS = ['English', 'Arabic', 'Kurdish', 'Turkish', 'Persian', 'French', 'Spanish', 'German', 'Hindi', 'Urdu', 'Russian', 'Portuguese', 'Chinese', 'Japanese', 'Korean', 'Italian']
const TZS = [-10, -8, -7, -6, -5, -4, -3, -1, 0, 1, 2, 3, 3.5, 4, 4.5, 5, 5.5, 6, 7, 8, 9, 9.5, 10, 12]
const WEEK = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
const KINDS = ['Degree', 'Diploma', 'Bootcamp', 'Certificate', 'Self-taught']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const detectTz = () => { const o = -new Date().getTimezoneOffset() / 60; return TZS.includes(o) ? o : Math.round(o) }
const randomSeed = () => `seed-${Math.random().toString(36).slice(2, 8)}`

const blank = () => ({
  id: 'me', name: '', email: '', password: '', provider: null, handle: '', headline: '', field: '', city: '', country: '',
  tz: detectTz(), languages: ['English'], bio: '', style: '', avatarSeed: randomSeed(),
  education: [{ kind: 'Degree', title: '', place: '', from: '', to: '' }], teaches: [], wants: [], avail: [], format: ['online'],
})

function problem(step, d, editing) {
  if (step === 0) {
    if (!d.name.trim()) return 'Add your name.'
    if (!editing) {
      if (!/^\S+@\S+\.\S+$/.test(d.email)) return 'Add an email address like name@example.com.'
      if (d.password.length < 8) return 'Use a password with at least 8 characters.'
    }
  }
  if (step === 1) {
    if (!/^[a-z0-9._]{3,20}$/.test(d.handle)) return 'Pick a username: 3 to 20 lowercase letters, numbers, dots or underscores.'
    if (PEOPLE.some((p) => p.handle === d.handle)) return `@${d.handle} is taken. Try another username.`
    if (!d.headline.trim()) return 'Add a one-line headline, for example “Backend developer, Java and SQL”.'
    if (!d.field) return 'Pick the field that fits you best.'
  }
  if (step === 3 && !d.teaches.length) return 'Pick at least one skill you can teach.'
  if (step === 4 && !d.wants.length) return 'Pick at least one skill you want to learn.'
  if (step === 5 && !d.avail.length) return 'Mark at least one time you are usually free.'
  return null
}

export default function Join() {
  const { me, register, saveCard, signInDemo, toast } = useStore()
  const [params] = useSearchParams()
  const editing = params.get('edit') === '1' && !!me
  useTitle(editing ? 'Edit your card' : 'Build your card')
  const nav = useNavigate()
  const [d, setD] = useState(() => (editing ? { ...blank(), ...me, password: '' } : blank()))
  const [step, setStep] = useState(editing ? 1 : 0)
  const [err, setErr] = useState(null)
  const [done, setDone] = useState(false)
  const [langInput, setLangInput] = useState('')
  const [pickArea, setPickArea] = useState(() => FIELD[d.field]?.area || 'software')
  const [busy, setBusy] = useState(false)
  const set = (patch) => { setD((x) => ({ ...x, ...patch })); setErr(null) }

  const preview = useMemo(() => ({
    ...d, name: d.name || 'Your name', handle: d.handle || 'you', headline: d.headline || 'Your headline goes here',
    field: d.field || 'fullstack', city: d.city || 'Your city', number: me?.number || '0001',
    stats: me?.stats || { taught: 0, learned: 0, rating: null, reply: 'New member' },
    education: d.education.filter((e) => e.title.trim()), bio: d.bio || 'Your bio appears on the back of your card.',
    style: d.style || 'Say how you like to teach.',
  }), [d, me])

  // The last step saves the card in the database: a new account, or changes to yours.
  const next = async (e) => {
    e?.preventDefault()
    if (busy) return
    const p = problem(step, d, editing)
    if (p) { setErr(p); return }
    if (step < STEPS.length - 1) { setStep(step + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); return }
    const { password, email, provider: _provider, ...card } = d
    card.education = d.education.filter((e2) => e2.title.trim())
    // a skill added to an existing card is dated, so it grows on the tree from today instead of rearranging it
    if (editing) card.teaches = card.teaches.map((t) => (t.added || me?.teaches.some((x) => x.skill === t.skill) ? t : { ...t, added: today() }))
    setBusy(true)
    try {
      if (editing) { await saveCard(card); toast('Your card is updated.'); nav('/me') }
      else { await register(email.trim(), password, card); setDone(true); window.scrollTo({ top: 0 }) }
    } catch (er) {
      setErr(er.message)
      if (/email/i.test(er.message)) setStep(0)
      else if (/username/i.test(er.message)) setStep(1)
    } finally { setBusy(false) }
  }

  // For presentations: sign in as the demo member, who already has a full history in the database.
  const useDemo = async () => { setBusy(true); const card = await signInDemo(); setBusy(false); if (card) { setDone(true); window.scrollTo({ top: 0 }) } }

  const toggleTeach = (id) => set({ teaches: d.teaches.some((s) => s.skill === id) ? d.teaches.filter((s) => s.skill !== id) : [...d.teaches, { skill: id, level: 2, years: 1 }] })
  const toggleWant = (id) => set({ wants: d.wants.some((s) => s.skill === id) ? d.wants.filter((s) => s.skill !== id) : [...d.wants, { skill: id, goal: '' }] })
  const editRow = (key, id, patch) => set({ [key]: d[key].map((s) => (s.skill === id ? { ...s, ...patch } : s)) })
  const toggleSlot = (code) => set({ avail: d.avail.includes(code) ? d.avail.filter((c) => c !== code) : [...d.avail, code] })
  const toggleLang = (l) => set({ languages: d.languages.includes(l) ? d.languages.filter((x) => x !== l) : [...d.languages, l] })
  const editEdu = (i, patch) => set({ education: d.education.map((e, k) => (k === i ? { ...e, ...patch } : e)) })

  if (done && me) {
    const perfect = PEOPLE.filter((p) => trade(me, p).kind === 'perfect').length
    return (
      <div className="wrap page join-done">
        <motion.div className="done-card" initial={{ rotateY: 200, scale: 0.7, opacity: 0 }} animate={{ rotateY: 0, scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 120, damping: 16 }}>
          <TradeCard person={me} t={null} />
        </motion.div>
        <div className="done-copy">
          <p className="eyebrow">Card created</p>
          <h1>Welcome to the floor, {me.name.split(' ')[0]}.</h1>
          <p className="lede">{perfect ? `${perfect} ${perfect === 1 ? 'person is' : 'people are'} already a perfect swap for you.` : 'No perfect swaps yet. Add a few more skills and they will show up.'}</p>
          <div className="hero-cta">
            <Link to="/explore" className="btn btn-primary btn-lg">Start swiping <ArrowRight size={18} /></Link>
            <Link to="/tree" className="btn btn-ghost btn-lg">See your skill tree</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="wrap page join">
      <div className="join-grid">
        <div className="join-form">
          <div className="join-top">
            <p className="eyebrow">{editing ? 'Edit your card' : 'Build your card'} · step {step + 1} of {STEPS.length}</p>
            {!editing && <button type="button" className="link-btn" onClick={useDemo} disabled={busy}><Wand2 size={15} /> Use the demo member</button>}
          </div>
          <ol className="stepper">
            {STEPS.map((s, i) => (
              <li key={s} className={i < step ? 'is-done' : i === step ? 'is-now' : ''}>
                <button type="button" onClick={() => i < step && setStep(i)} disabled={i >= step} aria-current={i === step ? 'step' : undefined}>
                  <span className="step-dot">{i < step ? <Check size={13} strokeWidth={3} /> : i + 1}</span>
                  <span className="step-name">{s}</span>
                </button>
              </li>
            ))}
          </ol>

          <form onSubmit={next} noValidate>
            <AnimatePresence mode="wait">
              <motion.div key={step} className="step-body" initial={{ x: 24, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -24, opacity: 0 }} transition={{ duration: 0.22 }}>
                {step === 0 && (
                  <>
                    <h2>Create your account</h2>
                    <p className="muted">You sign in with your email and a password. OREN stores only a secure hash of your password, never the password itself.</p>
                    <div className="field"><label htmlFor="j-name">Full name</label><input id="j-name" className="input" value={d.name} onChange={(e) => set({ name: e.target.value })} placeholder="Ari Navarro" autoComplete="name" /></div>
                    {!editing && (
                      <div className="grid2">
                        <div className="field"><label htmlFor="j-email">Email</label><input id="j-email" type="email" className="input" value={d.email} onChange={(e) => set({ email: e.target.value })} placeholder="you@example.com" autoComplete="email" /></div>
                        <div className="field"><label htmlFor="j-pass">Password</label><input id="j-pass" type="password" className="input" value={d.password} onChange={(e) => set({ password: e.target.value })} placeholder="At least 8 characters" autoComplete="new-password" /></div>
                      </div>
                    )}
                  </>
                )}

                {step === 1 && (
                  <>
                    <h2>About you</h2>
                    <div className="field">
                      <span className="label">Your avatar</span>
                      <div className="avatar-pick">
                        {[0, 1, 2, 3, 4, 5].map((n) => {
                          const seed = n === 0 ? d.avatarSeed : `${d.avatarSeed}-${n}`
                          return <button type="button" key={seed} aria-pressed={n === 0} onClick={() => set({ avatarSeed: seed })} aria-label={`Avatar option ${n + 1}`}><Avatar seed={seed} size={56} /></button>
                        })}
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => set({ avatarSeed: randomSeed() })}><Shuffle size={15} /> Shuffle</button>
                      </div>
                      <small>Photo uploads come with the backend. Pick the face you like for now.</small>
                    </div>
                    <div className="grid2">
                      <div className="field">
                        <label htmlFor="j-handle">Username</label>
                        <div className="input-pre"><span>@</span><input id="j-handle" className="input" value={d.handle} onChange={(e) => set({ handle: e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, '') })} placeholder="arinavarro" maxLength={20} /></div>
                      </div>
                      <div className="field"><label htmlFor="j-headline">Headline</label><input id="j-headline" className="input" value={d.headline} onChange={(e) => set({ headline: e.target.value })} placeholder="Junior developer, Python and Git" maxLength={60} /></div>
                    </div>
                    <div className="field">
                      <span className="label">Your main field</span>
                      <FieldPicker idPrefix="j-area" area={pickArea} field={d.field} onArea={setPickArea} onField={(f) => set({ field: f })} />
                      <small>{d.field ? `Selected: ${FIELD[d.field].name}. Your skills can come from any of the 50 fields.` : 'Pick an area, then the field that fits you best. Your skills can come from any field.'}</small>
                    </div>
                    <div className="grid3">
                      <div className="field"><label htmlFor="j-city">City</label><input id="j-city" className="input" value={d.city} onChange={(e) => set({ city: e.target.value })} placeholder="Erbil" /></div>
                      <div className="field"><label htmlFor="j-country">Country</label><input id="j-country" className="input" value={d.country} onChange={(e) => set({ country: e.target.value })} placeholder="Iraq" /></div>
                      <div className="field">
                        <label htmlFor="j-tz">Time zone</label>
                        <select id="j-tz" className="select" value={d.tz} onChange={(e) => set({ tz: +e.target.value })}>
                          {TZS.map((z) => <option key={z} value={z}>{tzLabel(z)}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="field">
                      <span className="label">Languages you can teach in</span>
                      <div className="chips">
                        {[...new Set([...LANGS, ...d.languages])].map((l) => <button type="button" key={l} className="chip no-icon" aria-pressed={d.languages.includes(l)} onClick={() => toggleLang(l)}>{l}</button>)}
                        <span className="lang-add">
                          <input className="input" id="j-lang" value={langInput} onChange={(e) => setLangInput(e.target.value)} placeholder="Other…" aria-label="Add another language"
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); const v = langInput.trim(); if (v && !d.languages.includes(v)) set({ languages: [...d.languages, v] }); setLangInput('') } }} />
                        </span>
                      </div>
                    </div>
                    <div className="field">
                      <label htmlFor="j-bio">Bio</label>
                      <textarea id="j-bio" className="textarea" value={d.bio} onChange={(e) => set({ bio: e.target.value.slice(0, 280) })} placeholder="What do you build? What do you want to get better at?" />
                      <small className="num">{d.bio.length} / 280</small>
                    </div>
                    <div className="field"><label htmlFor="j-style">How you like to teach</label><input id="j-style" className="input" value={d.style} onChange={(e) => set({ style: e.target.value })} placeholder="Live coding with small exercises" maxLength={90} /></div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <h2>Education</h2>
                    <p className="muted">Degrees, bootcamps, certificates or self-taught. It helps people trust your skills. You can skip this step.</p>
                    <div className="edu-edit">
                      {d.education.map((e, i) => (
                        <div className="edu-row" key={i}>
                          <div className="field"><label htmlFor={`j-kind-${i}`}>Type</label>
                            <select id={`j-kind-${i}`} className="select" value={e.kind} onChange={(ev) => editEdu(i, { kind: ev.target.value })}>{KINDS.map((k) => <option key={k}>{k}</option>)}</select>
                          </div>
                          <div className="field"><label htmlFor={`j-title-${i}`}>Program or subject</label><input id={`j-title-${i}`} className="input" value={e.title} onChange={(ev) => editEdu(i, { title: ev.target.value })} placeholder="BSc Computer Science" /></div>
                          <div className="field"><label htmlFor={`j-place-${i}`}>School or source</label><input id={`j-place-${i}`} className="input" value={e.place} onChange={(ev) => editEdu(i, { place: ev.target.value })} placeholder="University, bootcamp or online" /></div>
                          <div className="field"><label htmlFor={`j-from-${i}`}>From</label><input id={`j-from-${i}`} className="input" inputMode="numeric" value={e.from} onChange={(ev) => editEdu(i, { from: ev.target.value.replace(/\D/g, '').slice(0, 4) })} placeholder="2023" /></div>
                          <div className="field"><label htmlFor={`j-to-${i}`}>To</label><input id={`j-to-${i}`} className="input" value={e.to} onChange={(ev) => editEdu(i, { to: ev.target.value.slice(0, 4) })} placeholder="now" /></div>
                          <button type="button" className="btn btn-ghost btn-sm btn-icon edu-del" onClick={() => set({ education: d.education.filter((_, k) => k !== i) })} aria-label="Remove this entry"><Trash2 size={16} /></button>
                        </div>
                      ))}
                    </div>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => set({ education: [...d.education, { kind: 'Certificate', title: '', place: '', from: '', to: '' }] })}><Plus size={16} /> Add education</button>
                  </>
                )}

                {step === 3 && (
                  <>
                    <h2>What can you teach?</h2>
                    <p className="muted">Pick the tools and languages you know well enough to explain. These become the orange skills on your card.</p>
                    {d.teaches.length > 0 && (
                      <div className="sel-list">
                        {d.teaches.map((s) => (
                          <div className="sel-row" key={s.skill}>
                            <span className="sel-name"><SkillIcon id={s.skill} size={26} /> {skillName(s.skill)}</span>
                            <div className="seg seg-sm" role="group" aria-label={`${skillName(s.skill)} level`}>
                              {LEVELS.map((l) => <button type="button" key={l.n} aria-pressed={s.level === l.n} onClick={() => editRow('teaches', s.skill, { level: l.n })} title={l.hint}>{l.name}</button>)}
                            </div>
                            <label className="years"><input className="input" type="number" min="0" max="40" value={s.years} onChange={(e) => editRow('teaches', s.skill, { years: Math.max(0, Math.min(40, +e.target.value || 0)) })} aria-label={`Years of ${skillName(s.skill)}`} /> yrs</label>
                            <button type="button" className="btn btn-ghost btn-sm btn-icon" onClick={() => toggleTeach(s.skill)} aria-label={`Remove ${skillName(s.skill)}`}><X size={16} /></button>
                          </div>
                        ))}
                      </div>
                    )}
                    <SkillPicker idPrefix="teach" tone="teach" selected={d.teaches.map((s) => s.skill)} taken={d.wants.map((s) => s.skill)} onToggle={toggleTeach} />
                  </>
                )}

                {step === 4 && (
                  <>
                    <h2>What do you want to learn?</h2>
                    <p className="muted">Pick what you want someone to teach you. A short goal helps your partner plan the session.</p>
                    {d.wants.length > 0 && (
                      <div className="sel-list">
                        {d.wants.map((s) => (
                          <div className="sel-row sel-want" key={s.skill}>
                            <span className="sel-name"><SkillIcon id={s.skill} size={26} /> {skillName(s.skill)}</span>
                            <input className="input" value={s.goal} onChange={(e) => editRow('wants', s.skill, { goal: e.target.value.slice(0, 60) })} placeholder="Your goal, e.g. build my portfolio" aria-label={`Goal for ${skillName(s.skill)}`} />
                            <button type="button" className="btn btn-ghost btn-sm btn-icon" onClick={() => toggleWant(s.skill)} aria-label={`Remove ${skillName(s.skill)}`}><X size={16} /></button>
                          </div>
                        ))}
                      </div>
                    )}
                    <SkillPicker idPrefix="want" tone="want" selected={d.wants.map((s) => s.skill)} taken={d.teaches.map((s) => s.skill)} onToggle={toggleWant} />
                  </>
                )}

                {step === 5 && (
                  <>
                    <h2>When are you usually free?</h2>
                    <p className="muted">Tap the times that usually work, in your time zone ({tzLabel(d.tz)}). Explore uses this to find overlap.</p>
                    <div className="chips">
                      <button type="button" className="chip no-icon" onClick={() => set({ avail: [...new Set([...d.avail, 'mon-e', 'tue-e', 'wed-e', 'thu-e', 'fri-e'])] })}>+ Weekday evenings</button>
                      <button type="button" className="chip no-icon" onClick={() => set({ avail: [...new Set([...d.avail, 'sat-m', 'sat-a', 'sun-m', 'sun-a'])] })}>+ Weekends</button>
                      <button type="button" className="chip no-icon" onClick={() => set({ avail: [] })}>Clear</button>
                    </div>
                    <div className="week week-edit" role="grid" aria-label="Pick your free times">
                      <div className="week-row"><span />{WEEK.map((w) => <span key={w} className="week-day mono">{DAY_NAME[w]}</span>)}</div>
                      {PARTS.map((pt) => (
                        <div className="week-row" key={pt.id}>
                          <span className="week-part">{pt.name}<small className="mono">{pt.hours}</small></span>
                          {WEEK.map((w) => {
                            const code = `${w}-${pt.id}`
                            const on = d.avail.includes(code)
                            return <button type="button" key={code} className={`week-cell ${on ? 'is-free' : ''}`} aria-pressed={on} onClick={() => toggleSlot(code)} aria-label={`${DAY_NAME[w]} ${pt.name}`} />
                          })}
                        </div>
                      ))}
                    </div>
                    <div className="field">
                      <span className="label">Session format</span>
                      <div className="chips">
                        {[['online', 'Online'], ['in-person', 'In person']].map(([v, n]) => (
                          <button type="button" key={v} className="chip no-icon" aria-pressed={d.format.includes(v)}
                            onClick={() => set({ format: d.format.includes(v) ? (d.format.length > 1 ? d.format.filter((x) => x !== v) : d.format) : [...d.format, v] })}>{n}</button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>

            {err && <p className="form-err" role="alert">{err}</p>}
            <div className="join-nav">
              {step > 0 && <button type="button" className="btn btn-ghost" onClick={() => { setStep(step - 1); setErr(null) }}><ArrowLeft size={17} /> Back</button>}
              <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : step === STEPS.length - 1 ? (editing ? 'Save changes' : 'Finish my card') : 'Continue'} <ArrowRight size={17} /></button>
              {step === 2 && <button type="button" className="link-btn" onClick={() => { set({ education: d.education.filter((e) => e.title.trim()) }); setStep(3) }}>Skip for now</button>}
            </div>
          </form>
        </div>

        <aside className="join-preview" aria-label="Live preview of your card">
          <p className="eyebrow">Live preview</p>
          <TradeCard person={preview} t={null} />
          <p className="muted small">This is the card people see when they swipe. It updates as you type.</p>
        </aside>
      </div>
    </div>
  )
}
