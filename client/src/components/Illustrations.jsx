import { motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import Avatar from './Avatar'
import { SkillIcon, skillName } from './SkillIcon'
import { PERSON } from '../data/people'
import { FIELD } from '../data/fields'

// Real trades from the sample data: the person teaches `theirs` and wants `mine`.
export const HERO_PAIRS = [
  { mine: 'python', theirs: 'publicspeaking', who: 'danarashid' },
  { mine: 'git', theirs: 'java', who: 'samokoye' },
  { mine: 'kurdish', theirs: 'cooking', who: 'mehmetyilmaz' },
  { mine: 'python', theirs: 'premiere', who: 'karimvisuals' },
  { mine: 'figma', theirs: 'drawing', who: 'valentinacruz' },
  { mine: 'sql', theirs: 'interviewing', who: 'ahmedsaleh' },
]

function MiniCard({ seed, name, sub, knows, wants, h, className }) {
  return (
    <div className={`hcard ${className}`} style={{ '--h': h }}>
      <div className="hcard-top">
        <Avatar seed={seed} size={52} />
        <div><b>{name}</b><span>{sub}</span></div>
      </div>
      <div className="hcard-row"><span className="tag-teach">Knows</span><span className="chip chip-teach"><SkillIcon id={knows} size={20} />{skillName(knows)}</span></div>
      <div className="hcard-row"><span className="tag-want">Wants</span><span className="chip chip-want"><SkillIcon id={wants} size={20} />{skillName(wants)}</span></div>
    </div>
  )
}

export function HeroTrade({ i }) {
  const reduce = useReducedMotion()
  const pair = HERO_PAIRS[i % HERO_PAIRS.length]
  const p = PERSON[pair.who]
  const flight = (delay) => ({ default: { duration: 1.9, ease: 'easeInOut', delay }, opacity: { duration: 1.9, times: [0, 0.12, 0.82, 1], delay } })
  return (
    <div className="hero-trade" aria-label={`Example trade: you teach ${skillName(pair.mine)}, ${p.name} teaches ${skillName(pair.theirs)}`} role="img">
      <MiniCard className="hcard-left" seed="you-at-oren" name="You" sub="Student · Erbil" knows={pair.mine} wants={pair.theirs} h={228} />
      <MiniCard className="hcard-right" seed={p.handle} name={p.name} sub={`${FIELD[p.field].short} · ${p.city}`} knows={pair.theirs} wants={pair.mine} h={FIELD[p.field].h} />
      {!reduce && (
        <>
          <motion.span key={`a${i}`} className="coin coin-teach" initial={{ left: '50%', top: '27%', scale: 0.6, opacity: 0 }}
            animate={{ left: ['50%', '94%', '86%'], top: ['27%', '22%', '79%'], scale: [0.6, 1.1, 0.8], opacity: [0, 1, 1, 0] }}
            transition={flight(0.4)}>
            <SkillIcon id={pair.mine} size={28} />
          </motion.span>
          <motion.span key={`b${i}`} className="coin coin-want" initial={{ left: '86%', top: '69%', scale: 0.6, opacity: 0 }}
            animate={{ left: ['86%', '18%', '50%'], top: ['69%', '78%', '37%'], scale: [0.6, 1.1, 0.8], opacity: [0, 1, 1, 0] }}
            transition={flight(0.55)}>
            <SkillIcon id={pair.theirs} size={28} />
          </motion.span>
        </>
      )}
      <div className="hero-ribbon"><b className="pbadge"><Sparkles size={14} strokeWidth={2.4} aria-hidden="true" />Perfect swap</b> <span className="mono">1 h ⇄ 1 h</span></div>
    </div>
  )
}

export function StepCard() {
  return (
    <div className="step-vis vis-card">
      <p className="eyebrow">Your card</p>
      <div className="hcard-row"><span className="tag-teach">Teaches</span><div className="chips"><span className="chip chip-teach"><SkillIcon id="git" size={18} />Git</span><span className="chip chip-teach"><SkillIcon id="python" size={18} />Python</span></div></div>
      <div className="hcard-row"><span className="tag-want">Wants</span><div className="chips"><span className="chip chip-want"><SkillIcon id="java" size={18} />Java</span></div></div>
      <div className="vis-input">Add a skill<span className="caret" /></div>
    </div>
  )
}

export function StepSwipe() {
  return (
    <div className="step-vis vis-swipe" aria-hidden="true">
      <span className="vis-mini m3" />
      <span className="vis-mini m2" />
      <span className="vis-mini m1">
        <Avatar seed="sofiajava" size={40} />
        <b>Sofia</b>
        <span className="chip chip-mark"><SkillIcon id="java" size={16} />Java</span>
        <span className="stamp stamp-swap">Swap</span>
      </span>
    </div>
  )
}

export function StepTicket() {
  return (
    <div className="step-vis vis-ticket">
      <div className="ticket-main">
        <p className="eyebrow">Session · confirmed</p>
        <p className="ticket-pair"><SkillIcon id="java" size={22} /> Java <span>⇄</span> <SkillIcon id="git" size={22} /> Git</p>
        <p className="mono ticket-when">Thu 19 Nov · 19:00</p>
      </div>
      <div className="ticket-stub mono"><b>2×45</b><span>min</span></div>
    </div>
  )
}

const LOOP = [
  { id: 'you', label: 'You', seed: 'you-at-oren', x: 50, y: 13 },
  { id: 'lucasmotion', label: 'Lucas', seed: 'lucasmotion', x: 86, y: 80 },
  { id: 'ivocosta', label: 'Ivo', seed: 'ivocosta', x: 14, y: 80 },
]
const LOOP_EDGES = [
  { skill: 'python', d: 'M 268 70 C 360 90 400 170 394 240', x: 82, y: 38 },
  { skill: 'blender', d: 'M 330 318 C 270 350 150 350 92 318', x: 50, y: 95 },
  { skill: 'unity', d: 'M 28 240 C 22 170 62 90 152 70', x: 18, y: 38 },
]

export function LoopDiagram() {
  return (
    <div className="loop" role="img" aria-label="A three-way swap: you teach Python to Lucas, Lucas teaches Blender to Ivo, Ivo teaches Unity to you.">
      <svg viewBox="0 0 420 360" className="loop-svg" aria-hidden="true">
        <defs>
          <marker id="loop-head" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 Z" fill="var(--teach)" />
          </marker>
        </defs>
        {LOOP_EDGES.map((e) => (
          <path key={e.skill} d={e.d} className="loop-edge" markerEnd="url(#loop-head)" />
        ))}
      </svg>
      {LOOP.map((n) => (
        <div key={n.id} className={`loop-node ${n.id === 'you' ? 'is-you' : ''}`} style={{ left: `${n.x}%`, top: `${n.y}%` }}>
          <Avatar seed={n.seed} size={64} />
          {n.id === 'you' ? <span>{n.label}</span> : <Link to={`/u/${n.id}`}>{n.label}</Link>}
        </div>
      ))}
      {LOOP_EDGES.map((e) => (
        <span key={e.skill} className="loop-skill chip chip-teach" style={{ left: `${e.x}%`, top: `${e.y}%` }}>
          <SkillIcon id={e.skill} size={18} />{skillName(e.skill)}
        </span>
      ))}
    </div>
  )
}
