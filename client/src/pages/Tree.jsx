import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Lock, Plus, Play, Pause, ImagePlus, Trash2, ArrowUpRight, Search, Sprout, X, Pencil } from 'lucide-react'
import SkillTree from '../components/SkillTree'
import Avatar from '../components/Avatar'
import { SkillIcon, SkillChip, skillName } from '../components/SkillIcon'
import { FieldBadge } from '../components/TradeCard'
import { Modal } from '../components/Overlays'
import { PERSON, DEMO_ME, DEMO_GROWTH } from '../data/people'
import { levelName } from '../data/skills'
import { treeNodes, STAGES, STAGE_HINT, growthRings, monthLabel, dayLabel } from '../lib/tree'
import { agePhoto } from '../lib/photo'
import { useStore, firstName, today } from '../lib/store'
import useTitle from '../lib/useTitle'

const KINDS = [
  ['known', 'Knew it', 'teach'],
  ['learned', 'Learned from others', 'want'],
  ['wish', 'Wishes', 'wish'],
  ['lessons', 'Lessons', 'root'],
]

function People({ list, empty }) {
  if (!list.length) return <p className="muted small">{empty}</p>
  return (
    <ul className="tp-people">
      {list.map(({ who, at }, i) => {
        const p = PERSON[who]
        if (!p) return null
        return (
          <li key={`${who}-${i}`}>
            <Avatar seed={p.handle} size={30} />
            <Link to={`/u/${p.handle}`}>{p.name}</Link>
            {at && <span className="mono muted">{dayLabel(at)}</span>}
          </li>
        )
      })}
    </ul>
  )
}

function Stack({ ids, label }) {
  if (!ids.length) return null
  return (
    <span className="stack" aria-label={`${label}: ${ids.map((id) => PERSON[id]?.name).join(', ')}`}>
      {ids.slice(0, 5).map((id) => <Avatar key={id} seed={id} size={30} title={PERSON[id]?.name} />)}
      {ids.length > 5 && <span className="stack-more mono">+{ids.length - 5}</span>}
    </span>
  )
}

function LeafDetail({ id, me, growth, onPick }) {
  const { setConfident } = useStore()
  const node = treeNodes(me, growth).find((n) => n.id === id)
  if (!node) return null
  const fed = (growth.lessons || []).filter((l) => l.skill === id)
  const tone = node.kind === 'known' ? 'teach' : 'want'
  return (
    <div className="tp-detail">
      <div className="tp-head">
        <span className={`tp-icon tone-${tone} ${node.kind === 'wish' ? 'is-wish' : ''}`}><SkillIcon id={id} size={34} /></span>
        <div>
          <p className={`tag-${tone}`}>{node.kind === 'known' ? 'You knew this' : node.kind === 'learned' ? 'Learned from others' : 'On your wish list'}</p>
          <h2>{skillName(id)}</h2>
          <FieldBadge field={node.field} short={false} />
        </div>
      </div>

      {node.kind === 'known' && (
        <>
          <div className="tp-block">
            <p className="eyebrow">Your level</p>
            <p className="tp-level"><span className="meter">{[1, 2, 3, 4].map((n) => <i key={n} className={n <= node.level ? 'on' : ''} />)}</span> {levelName(node.level)} · {node.years} {node.years === 1 ? 'year' : 'years'}</p>
          </div>
          <div className="tp-block">
            <p className="eyebrow">Fruit · people you taught</p>
            <People list={node.taught} empty="Nobody yet. Every person you teach grows a fruit on this lantern." />
          </div>
          <Link to="/explore?mode=browse" className="btn btn-ghost btn-sm">Find people who want it <ArrowUpRight size={15} /></Link>
        </>
      )}

      {node.kind === 'learned' && (
        <>
          <div className="tp-block">
            <ol className="tp-stages" aria-label={`Stage: ${STAGES[node.stage]}`}>
              {STAGES.slice(1).map((s, i) => <li key={s} className={i + 1 <= node.stage ? 'on' : ''}><span />{s}</li>)}
            </ol>
            <p className="tp-hint"><b>{STAGES[node.stage]}.</b> {STAGE_HINT[node.stage]}</p>
            <p className="small muted">{node.l.sessions} {node.l.sessions === 1 ? 'session' : 'sessions'} · started {dayLabel(node.l.since)}{node.l.endorsedBy && PERSON[node.l.endorsedBy] ? ` · endorsed by ${firstName(PERSON[node.l.endorsedBy])}` : ''}</p>
            {node.stage >= 3 && (
              <label className="switch">
                <input type="checkbox" checked={!!node.l.confident} onChange={(e) => setConfident(id, e.target.checked)} />
                <span className="track" /> I feel confident with {skillName(id)}
              </label>
            )}
          </div>
          <div className="tp-block">
            <p className="eyebrow">Taught by</p>
            <People list={node.l.from.map((who) => ({ who }))} empty="Nobody yet." />
          </div>
          <div className="tp-block">
            <p className="eyebrow">What you learned</p>
            <ol className="tp-notes">
              {[...node.l.notes].reverse().map((n, i) => (
                <li key={i}><time className="mono">{dayLabel(n.at)}{PERSON[n.with] ? ` · with ${firstName(PERSON[n.with])}` : ''}</time><p>{n.text}</p></li>
              ))}
            </ol>
          </div>
          {node.taught.length > 0 && (
            <div className="tp-block"><p className="eyebrow">Fruit · people you taught it to</p><People list={node.taught} empty="" /></div>
          )}
        </>
      )}

      {node.kind === 'wish' && (
        <>
          <div className="tp-block">
            <p className="eyebrow">Your goal</p>
            <p>{node.goal ? `“${node.goal}”` : 'No goal written yet.'}</p>
            <p className="tp-hint"><b>Wish.</b> {STAGE_HINT[0]}</p>
          </div>
          <Link to={`/explore?mode=browse&skills=${id}`} className="btn btn-teach btn-sm"><Search size={15} /> Find a teacher</Link>
        </>
      )}

      {fed.length > 0 && (
        <div className="tp-block">
          <p className="eyebrow">Roots · lessons that fed it</p>
          <ul className="tp-fed">
            {fed.map((l) => (
              <li key={l.id}><button type="button" onClick={() => onPick(`lesson:${l.id}`)}><i aria-hidden="true" /><span>{l.title}</span><span className="mono muted">{monthLabel(l.at)}</span></button></li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function OldPhoto({ lesson, big }) {
  return (
    <figure className={`oldphoto ${big ? 'is-big' : ''}`}>
      {lesson.photo ? <img src={lesson.photo} alt={`Photo for “${lesson.title}”`} /> : <span className="oldphoto-blank"><SkillIcon id={lesson.skill} size={big ? 44 : 30} /></span>}
      <figcaption className="mono">{dayLabel(lesson.at)}</figcaption>
    </figure>
  )
}

function LessonDetail({ lesson, onDeleted, onPick, onEdit, onTree }) {
  const { updateLesson, removeLesson, toast } = useStore()
  const [sure, setSure] = useState(false)
  return (
    <div className="tp-detail">
      <p className="eyebrow">Root · a lesson that fed your tree</p>
      <h2>{lesson.title}</h2>
      <OldPhoto lesson={lesson} big />
      <dl className="tp-lesson">
        {lesson.tried && <><dt>What I tried</dt><dd>{lesson.tried}</dd></>}
        {lesson.why && <><dt>Why it failed</dt><dd>{lesson.why}</dd></>}
        {lesson.lesson && <><dt>What I learned</dt><dd>{lesson.lesson}</dd></>}
      </dl>
      <div className="tp-block">
        <p className="eyebrow">Feeds the skill</p>
        {onTree
          ? <SkillChip id={lesson.skill} as="button" type="button" className="chip tp-jump" onClick={() => onPick(lesson.skill)} title="Show this skill on the tree" />
          : <SkillChip id={lesson.skill} />}
      </div>
      <div className="tp-block">
        <p className="eyebrow">Who can see it</p>
        <div className="seg">
          <button type="button" aria-pressed={lesson.visibility !== 'public'} onClick={() => updateLesson(lesson.id, { visibility: 'private' })}>Only me</button>
          <button type="button" aria-pressed={lesson.visibility === 'public'} onClick={() => updateLesson(lesson.id, { visibility: 'public' }).then((g) => g && toast('Shared on your profile.'))}>On my profile</button>
        </div>
      </div>
      {sure
        ? <div className="tp-confirm"><span>Delete this lesson for good?</span><button className="btn btn-sm btn-ghost" onClick={() => setSure(false)}>Keep it</button><button className="btn btn-sm btn-primary" onClick={() => removeLesson(lesson.id).then((g) => g && onDeleted())}>Delete</button></div>
        : (
          <div className="tp-confirm">
            <button className="btn btn-sm btn-ghost" onClick={onEdit}><Pencil size={15} /> Edit</button>
            <button className="btn btn-sm btn-ghost" onClick={() => setSure(true)}><Trash2 size={15} /> Delete</button>
          </div>
        )}
    </div>
  )
}

function InnerFigure() {
  const dots = [[96, 62], [118, 50], [140, 60], [108, 80], [132, 84], [120, 102], [100, 98], [146, 92]]
  const links = [[0, 1], [1, 2], [0, 3], [1, 4], [2, 4], [3, 5], [4, 5], [3, 6], [4, 7], [6, 5], [7, 5]]
  return (
    <svg viewBox="0 0 240 300" className="inner-svg" aria-hidden="true">
      <ellipse className="orbit" cx="120" cy="170" rx="112" ry="38" transform="rotate(-12 120 170)" />
      <ellipse className="orbit o2" cx="120" cy="150" rx="96" ry="30" transform="rotate(14 120 150)" />
      <circle className="sil" cx="120" cy="78" r="46" />
      <path className="sil" d="M38 296 C 38 206, 76 150, 120 150 C 164 150, 202 206, 202 296" />
      {links.map(([a, b], i) => <line key={i} className="neuron-link" x1={dots[a][0]} y1={dots[a][1]} x2={dots[b][0]} y2={dots[b][1]} />)}
      {dots.map(([x, y], i) => <circle key={i} className="neuron" cx={x} cy={y} r="3" style={{ animationDelay: `${i * 0.3}s` }} />)}
      <circle className="soul-glow" cx="120" cy="214" r="26" />
      <circle className="soul" cx="120" cy="214" r="9" />
    </svg>
  )
}

function LessonModal({ open, onClose, me, growth, lesson = null }) {
  const { addLesson, updateLesson, toast } = useStore()
  const skills = useMemo(() => {
    const mine = [...new Set([...me.teaches.map((t) => t.skill), ...Object.keys(growth.learned), ...me.wants.map((w) => w.skill)])]
    return lesson && !mine.includes(lesson.skill) ? [lesson.skill, ...mine] : mine
  }, [me, growth, lesson])
  const blank = () => ({ title: '', skill: skills[0] || 'python', tried: '', why: '', lesson: '', visibility: 'private', photo: null })
  const [f, setF] = useState(() => (lesson ? { title: lesson.title, skill: lesson.skill, tried: lesson.tried || '', why: lesson.why || '', lesson: lesson.lesson || '', visibility: lesson.visibility || 'private', photo: lesson.photo || null } : blank()))
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const set = (patch) => { setF((x) => ({ ...x, ...patch })); setErr(null) }
  const onFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    try { set({ photo: await agePhoto(file) }) } catch (er) { setErr(er.message) } finally { setBusy(false) }
  }
  const save = async (e) => {
    e.preventDefault()
    if (!f.title.trim()) return setErr('Give the lesson a short title.')
    if (!f.lesson.trim()) return setErr('Write what you learned from it. That is the part that feeds the tree.')
    setBusy(true)
    const saved = lesson ? await updateLesson(lesson.id, f) : await addLesson({ ...f, at: today() })
    setBusy(false)
    if (!saved) return
    if (lesson) toast('Lesson updated.')
    else { toast('Lesson planted. It is now one of your roots.'); setF(blank()) }
    onClose()
  }
  return (
    <Modal open={open} onClose={onClose} label={lesson ? 'Edit lesson' : 'Plant a lesson'} className="lesson-modal">
      <form className="propose" onSubmit={save} noValidate>
        <p className="eyebrow">{lesson ? 'Edit lesson' : 'Plant a lesson'}</p>
        <h2>What went wrong, and what did it teach you?</h2>
        <div className="field"><label htmlFor="ls-title">Title</label><input id="ls-title" className="input" value={f.title} onChange={(e) => set({ title: e.target.value.slice(0, 48) })} placeholder="Merged to main on a Friday" /></div>
        <div className="field">
          <label htmlFor="ls-skill">Skill it feeds</label>
          <select id="ls-skill" className="select" value={f.skill} onChange={(e) => set({ skill: e.target.value })}>
            {skills.map((s) => <option key={s} value={s}>{skillName(s)}</option>)}
          </select>
        </div>
        <div className="field"><label htmlFor="ls-tried">What I tried</label><textarea id="ls-tried" className="textarea" value={f.tried} onChange={(e) => set({ tried: e.target.value })} /></div>
        <div className="field"><label htmlFor="ls-why">Why it failed</label><textarea id="ls-why" className="textarea" value={f.why} onChange={(e) => set({ why: e.target.value })} /></div>
        <div className="field"><label htmlFor="ls-lesson">What I learned</label><textarea id="ls-lesson" className="textarea" value={f.lesson} onChange={(e) => set({ lesson: e.target.value })} /></div>
        <div className="field">
          <span className="label">Photo or screenshot (optional)</span>
          <div className="ls-photo">
            {f.photo ? <OldPhoto lesson={{ ...f, at: lesson?.at || today() }} /> : <span className="ls-empty"><ImagePlus size={22} /></span>}
            <div className="col">
              <label className="btn btn-ghost btn-sm ls-upload">{busy ? 'Ageing your photo…' : f.photo ? 'Choose another' : 'Upload a photo'}<input type="file" accept="image/*" onChange={onFile} /></label>
              {f.photo && <button type="button" className="btn btn-ghost btn-sm" onClick={() => set({ photo: null })}>Remove photo</button>}
              <small className="muted">It turns into an old photograph automatically.</small>
            </div>
          </div>
        </div>
        <div className="field">
          <span className="label">Who can see it</span>
          <div className="seg">
            <button type="button" aria-pressed={f.visibility === 'private'} onClick={() => set({ visibility: 'private' })}>Only me</button>
            <button type="button" aria-pressed={f.visibility === 'public'} onClick={() => set({ visibility: 'public' })}>On my profile</button>
          </div>
        </div>
        {err && <p className="form-err" role="alert">{err}</p>}
        <button className="btn btn-teach" disabled={busy}><Sprout size={17} /> {lesson ? 'Save changes' : 'Plant it in my roots'}</button>
      </form>
    </Modal>
  )
}

export default function Tree() {
  const { me, growth, signInDemo, toast } = useStore()
  useTitle('My skill tree')
  const [selected, setSelected] = useState(null)
  const [show, setShow] = useState({ known: true, learned: true, wish: true, lessons: true })
  const [pos, setPos] = useState(100)
  const [playing, setPlaying] = useState(false)
  const [plant, setPlant] = useState(false)
  const [edit, setEdit] = useState(null)
  const [left, setLeft] = useState(false)
  const [full, setFull] = useState(false)
  const raf = useRef(0)
  const drawer = useRef(null)
  const g = growth || DEMO_GROWTH

  useEffect(() => () => cancelAnimationFrame(raf.current), [])
  useEffect(() => {
    // On a narrow screen the details sit under the drawing: let the light reach the lantern first, then glide down to them.
    if (!selected || !matchMedia('(max-width: 1000px)').matches) return undefined
    const t = setTimeout(() => drawer.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 1500)
    return () => clearTimeout(t)
  }, [selected])
  useEffect(() => {
    if (!selected && !full) return undefined
    const key = (e) => {
      if (e.key !== 'Escape' || plant || edit) return
      if (selected) setSelected(null)
      else if (!document.fullscreenElement) setFull(false)
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [selected, full, plant, edit])
  // Full screen: the tree covers the window, and the browser's own full screen (for the whole page, so forms
  // and messages still show over the tree) hides everything else when it is allowed.
  useEffect(() => {
    const sync = () => { if (!document.fullscreenElement) setFull(false) }
    document.addEventListener('fullscreenchange', sync)
    return () => document.removeEventListener('fullscreenchange', sync)
  }, [])
  useEffect(() => {
    if (!full) return undefined
    document.documentElement.style.overflow = 'hidden'
    return () => { document.documentElement.style.overflow = '' }
  }, [full])
  const toggleFull = () => {
    if (full) {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
      setFull(false)
      return
    }
    setFull(true)
    document.documentElement.requestFullscreen?.().catch(() => { /* not allowed here: filling the window is enough */ })
  }
  const openPlant = () => setPlant(true)
  const pickOn = (key, meta) => { setSelected(key); if (meta) setLeft(meta.right) }

  const play = () => {
    if (playing) { cancelAnimationFrame(raf.current); setPlaying(false); return }
    setPlaying(true)
    const t0 = performance.now()
    const tick = (t) => {
      const v = Math.min(100, ((t - t0) / 6000) * 100)
      setPos(v)
      if (v < 100) raf.current = requestAnimationFrame(tick)
      else setPlaying(false)
    }
    raf.current = requestAnimationFrame(tick)
  }

  if (!me) {
    return (
      <div className="wrap page">
        <div className="tree-locked">
          <div>
            <p className="eyebrow"><Lock size={13} /> Private to you</p>
            <h1>Your skill tree grows with every swap.</h1>
            <p className="lede">Skills you bring glow orange. Skills others teach you glow cobalt. Lessons from things that went wrong become the roots. Nobody else can see it.</p>
            <div className="hero-cta">
              <Link to="/join" className="btn btn-primary btn-lg">Build your card</Link>
              <button className="btn btn-ghost btn-lg" onClick={() => signInDemo().then((card) => card && toast('Signed in as the demo member.'))}>Open the demo tree</button>
            </div>
          </div>
          <div className="tree-locked-art night" aria-hidden="true"><SkillTree me={DEMO_ME} growth={DEMO_GROWTH} interactive={false} animate /></div>
        </div>
      </div>
    )
  }

  const t0 = Date.parse(`${g.start}T00:00`), t1 = Date.parse(`${today()}T00:00`)
  const until = pos >= 100 ? null : new Date(t0 + ((t1 - t0) * pos) / 100).toISOString().slice(0, 10)
  const lesson = selected?.startsWith('lesson:') ? g.lessons.find((l) => `lesson:${l.id}` === selected) : null
  const nodes = treeNodes(me, g)
  const count = (k) => nodes.filter((n) => n.kind === k).length
  const sessions = Object.values(g.learned).reduce((s, l) => s + l.sessions, 0)
  const teachers = [...new Set(Object.values(g.learned).flatMap((l) => l.from))]
  const students = [...new Set(Object.values(g.taught).flat().map((t) => t.who))]
  const rings = growthRings(me, g)

  return (
    <div className="wrap page tree-page">
      <header className="tree-head">
        <div>
          <p className="eyebrow"><Lock size={13} /> Private · only you can see this</p>
          <h1>{firstName(me)}’s skill tree</h1>
          <p className="muted tree-intro">Every bough is an area of your life. Orange lanterns are skills you brought, cobalt ones are skills people taught you, and the roots hold the lessons that fed it all. Pick a lantern to follow its light back to the root it grew from.</p>
        </div>
        <div className="tree-actions">
          <button className="btn btn-ghost" onClick={openPlant}><Plus size={17} /> Plant a lesson</button>
          <Link to="/explore" className="btn btn-primary">Find a teacher <ArrowUpRight size={17} /></Link>
        </div>
      </header>

      <dl className="tree-stats">
        <div className="ts ts-teach"><dt className="num">{count('known')}</dt><dd>skills you brought</dd></div>
        <div className="ts ts-want"><dt className="num">{count('learned')}</dt><dd>learned from others</dd></div>
        <div className="ts ts-wish"><dt className="num">{count('wish')}</dt><dd>on your wish list</dd></div>
        <div className="ts ts-root"><dt className="num">{g.lessons.length}</dt><dd>lessons in the roots</dd></div>
        <div className="ts"><dt className="num">{sessions}</dt><dd>sessions since {monthLabel(g.start)}</dd></div>
        <div className="ts ts-people">
          <div><dd>Taught by</dd><Stack ids={teachers} label="Taught by" /></div>
          <div><dd>You taught</dd><Stack ids={students} label="You taught" /></div>
        </div>
      </dl>

      <section className={`grove-stage night${selected ? ' has-drawer' : ''}${left ? ' drawer-left' : ''}${full ? ' is-full' : ''}`} aria-label="Your skill tree">
        {full && (
          <button type="button" className="grove-exit" onClick={toggleFull}>
            <X size={17} /><span>Close full screen</span><kbd>Esc</kbd>
          </button>
        )}
        <div className="grove-bar">
          <div className="grove-legend" role="group" aria-label="Show on the tree">
            {KINDS.map(([k, name, tone]) => (
              <button key={k} type="button" className={`tfilter tone-${tone}`} aria-pressed={show[k]} onClick={() => setShow((s) => ({ ...s, [k]: !s[k] }))}>
                <i aria-hidden="true" />{name}
              </button>
            ))}
          </div>
          <div className="grove-time">
            <button type="button" className="grove-play" onClick={play} aria-label={playing ? 'Pause' : 'Watch your tree grow'}>{playing ? <Pause size={15} /> : <Play size={15} />}</button>
            <span className="mono">{monthLabel(g.start)}</span>
            <input type="range" min="0" max="100" step="0.5" value={pos} onChange={(e) => { cancelAnimationFrame(raf.current); setPlaying(false); setPos(+e.target.value) }} aria-label="Show your tree at a point in time" id="tree-time" />
            <span className="mono grove-when">{until ? monthLabel(until) : 'Today'}</span>
          </div>
        </div>
        <div className="grove-canvas">
          <SkillTree me={me} growth={g} selected={selected} onSelect={pickOn} show={show} until={until} label={`${firstName(me)}’s skill tree`} onPlant={openPlant} full={full} onFull={toggleFull} />
          {selected && (
            <aside className={`grove-drawer${left ? ' on-left' : ''}`} ref={drawer} aria-live="polite">
              <button className="grove-close" onClick={() => setSelected(null)} aria-label="Close details"><X size={17} /></button>
              {lesson
                ? <LessonDetail key={lesson.id} lesson={lesson} onDeleted={() => setSelected(null)} onPick={setSelected} onEdit={() => setEdit(lesson)} onTree={nodes.some((n) => n.id === lesson.skill)} />
                : <LeafDetail id={selected} me={me} growth={g} onPick={setSelected} />}
            </aside>
          )}
        </div>
      </section>

      <section className="rings-sec" aria-labelledby="rings-title">
        <div className="section-head row-head">
          <div><p className="eyebrow">Achievements</p><h2 id="rings-title">Growth rings</h2></div>
          <p className="muted" style={{ maxWidth: 420 }}>A tree adds a ring for every season it grows. Yours adds one for every milestone.</p>
        </div>
        <ul className="rings">
          {rings.map((r) => (
            <li key={r.id} className={`ring ${r.done ? 'is-done' : ''}`}>
              <svg viewBox="0 0 64 64" aria-hidden="true">
                <circle cx="32" cy="32" r="29" /><circle cx="32" cy="32" r="21" /><circle cx="32" cy="32" r="13" /><circle className="core" cx="32" cy="32" r="5" />
              </svg>
              <b>{r.name}</b>
              <span className="small muted">{r.desc}</span>
              <span className="mono ring-state">{r.done ? 'Earned' : `${r.now} / ${r.of}`}</span>
            </li>
          ))}
        </ul>
      </section>

      <section id="inner-self" className="inner-self" aria-labelledby="inner-title">
        <div className="inner-figure"><InnerFigure /></div>
        <div className="inner-copy">
          <p className="inner-eyebrow">Inner self · AI companion</p>
          <h2 id="inner-title">In progress</h2>
          <p>Your AI growth companion moves in here next semester. As you talk, reflect and learn with it, this figure will grow with you.</p>
          <span className="inner-chip"><i /> Coming in spring 2027 · name to be announced</span>
        </div>
      </section>

      <LessonModal open={plant} onClose={() => setPlant(false)} me={me} growth={g} />
      {edit && <LessonModal key={edit.id} open onClose={() => setEdit(null)} me={me} growth={g} lesson={edit} />}
    </div>
  )
}
