import { SKILL, levelName } from '../data/skills'
import { FIELD } from '../data/fields'
import { GLYPHS } from '../data/glyphs'
import manifest from '../data/icon-manifest.json'

const letters = (s) => {
  if (s.mono) return s.mono
  const words = s.name.split(/\s+/).filter(Boolean)
  return words.length > 1 ? (words[0][0] + words[1][0]).toUpperCase() : s.name.slice(0, 2)
}

export const skillHue = (id) => FIELD[SKILL[id]?.field]?.h ?? 220

// Three kinds of skill icon: a brand logo (devicon), a Lucide symbol on a tile in the field's colour, or letters.
export function SkillIcon({ id, size = 24, className = '' }) {
  const s = SKILL[id]
  if (!s) return null
  if (s.icon && manifest[id]) {
    return (
      <img src={`${import.meta.env.BASE_URL}icons/${id}.svg`} width={size} height={size} alt="" draggable="false" loading="lazy"
        className={`skill-icon ${manifest[id].mono ? 'is-mono' : ''} ${className}`} />
    )
  }
  const G = s.glyph && GLYPHS[s.glyph]
  if (G) {
    return (
      <span className={`skill-glyph ${className}`} aria-hidden="true" style={{ '--h': skillHue(id), width: size, height: size }}>
        <G size={Math.round(size * 0.6)} strokeWidth={2.2} />
      </span>
    )
  }
  const t = letters(s)
  return (
    <span className={`skill-mono ${className}`} aria-hidden="true"
      style={{ '--h': skillHue(id), width: size, height: size, fontSize: Math.round(size * (t.length > 2 ? 0.32 : 0.4)) }}>
      {t}
    </span>
  )
}

// The same icon inside an SVG drawing (used by the skill tree).
export function SvgSkillIcon({ id, size = 24 }) {
  const s = SKILL[id]
  if (!s) return null
  const half = size / 2
  if (s.icon && manifest[id]) {
    return <image href={`${import.meta.env.BASE_URL}icons/${id}.svg`} x={-half} y={-half} width={size} height={size} className={manifest[id].mono ? 'is-mono' : ''} />
  }
  const G = s.glyph && GLYPHS[s.glyph]
  if (G) return <G x={-half} y={-half} width={size} height={size} strokeWidth={2.2} className="tglyph" style={{ '--h': skillHue(id) }} />
  const t = letters(s)
  return <text className="tmono" textAnchor="middle" dominantBaseline="central" style={{ '--h': skillHue(id), fontSize: size * (t.length > 2 ? 0.42 : 0.55) }}>{t}</text>
}

// Icon + name pill. tone: 'teach' | 'want' | 'mark' | undefined
export function SkillChip({ id, tone, level, as: Tag = 'span', ...rest }) {
  const s = SKILL[id]
  if (!s) return null
  return (
    <Tag className={`chip ${tone ? 'chip-' + tone : ''}`} {...rest}>
      <SkillIcon id={id} size={20} />
      <span>{s.name}</span>
      {level ? <span className="muted" style={{ fontWeight: 500 }}>· {levelName(level)}</span> : null}
    </Tag>
  )
}

export const skillName = (id) => SKILL[id]?.name ?? id
