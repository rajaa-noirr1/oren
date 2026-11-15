import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, Plus } from 'lucide-react'
import { HeroTrade, HERO_PAIRS, StepCard, StepSwipe, StepTicket, LoopDiagram } from '../components/Illustrations'
import HeroNetwork from '../components/HeroNetwork'
import TreeTeaser from '../components/TreeTeaser'
import TradeCard from '../components/TradeCard'
import { SkillIcon, skillName } from '../components/SkillIcon'
import { AREAS, FIELDS, fieldsOf } from '../data/fields'
import { PEOPLE, PERSON, DEMO_ME } from '../data/people'
import { SKILLS } from '../data/skills'
import { trade } from '../lib/match'
import { COUNTS } from '../lib/counts'
import { useStore, firstName } from '../lib/store'
import useTitle from '../lib/useTitle'

// The old and new pill cross-fade in the same grid cell, so the line never collapses or reflows.
// Plain CSS animations and one timer: nothing can get stuck half-way, even in a background tab.
function Swap({ k, className, children }) {
  const [items, setItems] = useState([{ k, children, state: 'still' }])
  const last = useRef(k)
  useEffect(() => {
    if (last.current === k) return undefined
    last.current = k
    setItems((prev) => [{ ...prev[prev.length - 1], state: 'out' }, { k, children, state: 'in' }])
    const t = setTimeout(() => setItems((prev) => prev.filter((x) => x.state !== 'out')), 420)
    return () => clearTimeout(t)
  }, [k]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <span className="hw-slot">
      {items.map((x) => <span key={x.k} className={`${className} is-${x.state}`} aria-hidden={x.state === 'out' || undefined}>{x.children}</span>)}
    </span>
  )
}

function SkillWord({ id, tone }) {
  return <Swap k={id} className={`hw hw-${tone}`}><SkillIcon id={id} size={24} />{skillName(id)}</Swap>
}

// The hero keeps its own timer, so the rotating example re-renders only the hero, never the rest of the page.
function Hero() {
  const { me } = useStore()
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)
  useEffect(() => {
    if (paused) return undefined
    const t = setInterval(() => setI((n) => (n + 1) % HERO_PAIRS.length), 3800)
    return () => clearInterval(t)
  }, [paused])
  const pair = HERO_PAIRS[i]
  return (
    <section className="hero">
      <HeroNetwork />
      <div className="wrap hero-grid">
        <div className="hero-copy">
          <p className="eyebrow hero-eyebrow"><span className="live-dot" /> Skill-for-skill exchange · 50 fields · free</p>
          <h1>Trade what you <Scribble tone="teach">know</Scribble> for what you want to <Scribble tone="want">learn</Scribble>.</h1>
          <div className="hero-example" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
            <p className="hx-line">You know <SkillWord id={pair.mine} tone="teach" /></p>
            <p className="hx-line"><Swap k={pair.who} className="hx-name">{firstName(PERSON[pair.who])}</Swap> knows <SkillWord id={pair.theirs} tone="want" /></p>
            <p className="hx-line hx-note">You teach each other for an hour.</p>
          </div>
          <p className="lede">OREN matches people who can teach each other: code, design, video, languages, leadership and much more. No money, no courses. Just two people trading skills.</p>
          <div className="hero-cta">
            <Link to={me ? '/explore' : '/join'} className="btn btn-primary btn-lg">{me ? 'Start swiping' : 'Build your card'} <ArrowRight size={18} /></Link>
            <Link to="/explore?mode=browse" className="btn btn-ghost btn-lg">Search by skill</Link>
          </div>
          <dl className="hero-facts">
            <div><dt className="num">{FIELDS.length}</dt><dd>fields</dd></div>
            <div><dt className="num">{SKILLS.length}</dt><dd>skills to trade</dd></div>
            <div><dt>1 h ⇄ 1 h</dt><dd>every trade is equal</dd></div>
          </dl>
        </div>
        <HeroTrade i={i} />
      </div>
    </section>
  )
}

function Scribble({ tone, children }) {
  return (
    <span className={`scribble scribble-${tone}`}>
      {children}
      <svg viewBox="0 0 120 16" preserveAspectRatio="none" aria-hidden="true"><path d="M3 11 C 28 4, 52 15, 78 8 S 110 6, 117 9" /></svg>
    </span>
  )
}

const FAQ = [
  ['Does it cost anything?', 'No. You pay with your time: an hour of teaching buys an hour of learning. There is nothing to buy and no premium plan.'],
  ['I am a beginner. Do I have anything to trade?', 'Almost always. Your first language, a hobby, Excel formulas, a first Python script or simply practice conversation are all worth something to someone. You can also join a three-way swap loop.'],
  ['It is not only for programmers?', 'No. There are 50 fields across 10 areas: code and design, but also video, photography, languages, public speaking, leadership, business, science, music, fitness and cooking.'],
  ['Online or in person?', 'Both. Every profile says which formats the person accepts, and Explore can filter by it. Most sessions happen on a video call with screen sharing.'],
  ['How do you keep trades fair?', 'Both people teach for the same amount of time in every session. Afterwards you write down what you learned, and it grows on your private skill tree.'],
]

export default function Home() {
  useTitle(null)
  const { me } = useStore()

  const board = useMemo(() => {
    const counts = new Map()
    for (const a of PEOPLE) for (const b of PEOPLE) {
      if (a.id >= b.id) continue
      const t = trade(a, b)
      if (t.kind !== 'perfect') continue
      const key = [t.get[0].skill, t.give[0].skill].sort().join('|')
      counts.set(key, (counts.get(key) || 0) + 1)
    }
    return [...counts].sort((x, y) => y[1] - x[1]).slice(0, 16).map(([k, n]) => ({ a: k.split('|')[0], b: k.split('|')[1], n }))
  }, [])

  return (
    <div className="home">
      <Hero />

      <section className="board" aria-label="Most common trades between members">
        <div className="board-label mono">Trade board</div>
        <div className="board-track">
          <div className="board-run">
            {[...board, ...board].map((b, k) => (
              <span className="tick" key={k} aria-hidden={k >= board.length}>
                <SkillIcon id={b.a} size={20} /> {skillName(b.a)} <b>⇄</b> <SkillIcon id={b.b} size={20} /> {skillName(b.b)}
                <span className="tick-n mono">{b.n} {b.n === 1 ? 'pair' : 'pairs'}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      <section id="fields" className="section">
        <div className="wrap">
          <div className="section-head row-head">
            <div>
              <p className="eyebrow">{FIELDS.length} fields · {AREAS.length} areas</p>
              <h2>Code is just the start.</h2>
            </div>
            <p className="muted" style={{ maxWidth: 440 }}>Trade Python for public speaking, Excel for photography, or Kurdish for Turkish cooking. Every skill you have is worth something to someone.</p>
          </div>
          <div className="areas">
            {AREAS.map((a) => (
              <section key={a.id} className="area-card" style={{ '--h': a.h }} aria-label={a.name}>
                <Link to={`/explore?area=${a.id}`} className="area-head">
                  <span className="area-badge"><a.Icon size={20} strokeWidth={2.2} /></span>
                  <span className="area-title"><b>{a.name}</b><span className="mono">{COUNTS.area[a.id]} people</span></span>
                  <ArrowUpRight size={16} className="area-go" />
                </Link>
                <ul>
                  {fieldsOf(a.id).map((f) => (
                    <li key={f.id}>
                      <Link to={`/explore?field=${f.id}`} style={{ '--h': f.h }}>
                        <f.Icon size={15} strokeWidth={2.2} /><span>{f.name}</span><span className="mono">{COUNTS.field[f.id]}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="section section-alt">
        <div className="wrap">
          <div className="section-head">
            <p className="eyebrow">How a swap works</p>
            <h2>Three steps from stranger to study partner.</h2>
          </div>
          <ol className="steps">
            <li className="step">
              <StepCard />
              <div className="step-text"><span className="step-n mono">01</span><h3>Build your card</h3><p className="muted">List what you can teach, what you want to learn, your education and when you are free. Your profile becomes a trading card.</p></div>
            </li>
            <li className="step">
              <StepSwipe />
              <div className="step-text"><span className="step-n mono">02</span><h3>Swipe for a fair trade</h3><p className="muted">Explore shows people whose skills fit yours. Swipe right to offer a swap. When you both swipe right, it is a match.</p></div>
            </li>
            <li className="step">
              <StepTicket />
              <div className="step-text"><span className="step-n mono">03</span><h3>Teach each other</h3><p className="muted">Plan a session in chat. You each teach for the same time, then write down what you learned. It grows on your skill tree.</p></div>
            </li>
          </ol>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head row-head">
            <div>
              <p className="eyebrow">On the floor now</p>
              <h2>Real cards, real trades.</h2>
            </div>
            <p className="muted" style={{ maxWidth: 380 }}>Highlighted skills are the overlap with {me ? 'your card' : 'a sample student card'}. Hover a card, then press More to see the back.</p>
          </div>
          <SampleCards people={['sofiajava', 'danarashid', 'karimvisuals'].map((id) => PERSON[id])} />
        </div>
      </section>

      <TreeTeaser />

      <section id="loops" className="section section-alt">
        <div className="wrap loops">
          <div className="loops-copy">
            <p className="eyebrow">Swap loops</p>
            <h2>No direct match? Close the loop.</h2>
            <p className="lede">Lucas wants your Python but teaches nothing on your list. Ivo teaches Unity, but wants Blender. Lucas knows Blender.</p>
            <p className="lede">OREN spots the circle and suggests a three-way swap. Everyone teaches once and learns once.</p>
            <Link to={me ? '/swaps#loops' : '/join'} className="btn btn-primary">{me ? 'See your loops' : 'Build your card to find loops'} <ArrowRight size={17} /></Link>
          </div>
          <LoopDiagram />
        </div>
      </section>

      <section className="section">
        <div className="wrap faq-grid">
          <div>
            <p className="eyebrow">Questions</p>
            <h2>Before you trade.</h2>
          </div>
          <div className="faq">
            {FAQ.map(([q, a]) => (
              <details key={q}>
                <summary>{q}<Plus size={18} /></summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-band">
        <div className="wrap cta-inner">
          <h2>Everyone knows something worth teaching.</h2>
          <div className="cta-side">
            <p>Your card takes about three minutes. Then the trading starts.</p>
            <Link to={me ? '/explore' : '/join'} className="btn btn-teach btn-lg">{me ? 'Go to Explore' : 'Build your card'} <ArrowRight size={18} /></Link>
          </div>
        </div>
      </section>
    </div>
  )
}

function SampleCards({ people }) {
  const { me } = useStore()
  const [flip, setFlip] = useState(null)
  const viewer = me || DEMO_ME
  return (
    <div className="sample-cards">
      {people.map((p, k) => (
        <TradeCard key={p.id} person={p} t={trade(viewer, p)} flipped={flip === p.id} onFlip={() => setFlip(flip === p.id ? null : p.id)} className={`sample-${k}`} />
      ))}
    </div>
  )
}
