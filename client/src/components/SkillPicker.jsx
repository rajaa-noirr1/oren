import { useMemo, useState } from 'react'
import { Search, Check } from 'lucide-react'
import { SkillIcon } from './SkillIcon'
import { SKILLS } from '../data/skills'
import { AREAS, FIELD, fieldsOf } from '../data/fields'

// Icon grid for picking skills from all 50 fields. `taken` = skills already on the other list (shown, disabled).
export default function SkillPicker({ selected, onToggle, taken = [], tone = 'teach', idPrefix }) {
  const [q, setQ] = useState('')
  const [area, setArea] = useState('')
  const [field, setField] = useState('')
  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    return SKILLS.filter((k) => {
      if (s) return k.name.toLowerCase().includes(s) || FIELD[k.field].name.toLowerCase().includes(s)
      if (field) return k.field === field
      if (area) return FIELD[k.field].area === area
      return true
    })
  }, [q, area, field])

  return (
    <div className={`picker picker-${tone}`}>
      <div className="picker-search">
        <Search size={17} />
        <input className="input" id={`${idPrefix}-search`} placeholder={`Search ${SKILLS.length} skills, e.g. Python, guitar or public speaking`} value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search skills" />
      </div>
      {!q && (
        <>
          <div className="picker-groups" role="group" aria-label="Areas">
            <button type="button" className="chip no-icon" aria-pressed={!area} onClick={() => { setArea(''); setField('') }}>All</button>
            {AREAS.map((a) => (
              <button type="button" key={a.id} className="chip" style={{ '--h': a.h }} aria-pressed={area === a.id} onClick={() => { setArea(a.id); setField('') }}>
                <a.Icon size={15} strokeWidth={2.3} className="area-ico" /> {a.short}
              </button>
            ))}
          </div>
          {area && (
            <div className="picker-groups" role="group" aria-label="Fields">
              {fieldsOf(area).map((f) => (
                <button type="button" key={f.id} className="fsub" style={{ '--h': f.h }} aria-pressed={field === f.id} onClick={() => setField(field === f.id ? '' : f.id)}>
                  <f.Icon size={14} strokeWidth={2.3} /> {f.name}
                </button>
              ))}
            </div>
          )}
        </>
      )}
      <div className="picker-grid">
        {list.map((s) => {
          const on = selected.includes(s.id)
          const off = taken.includes(s.id)
          return (
            <button type="button" key={s.id} className={`pick ${on ? 'is-on' : ''}`} aria-pressed={on} disabled={off} onClick={() => onToggle(s.id)}
              title={off ? `Already on your ${tone === 'teach' ? 'learn' : 'teach'} list` : `${s.name} · ${FIELD[s.field].name}`}>
              <SkillIcon id={s.id} size={30} />
              <span>{s.name}</span>
              {on && <i className="pick-check"><Check size={12} strokeWidth={3} /></i>}
            </button>
          )
        })}
        {!list.length && <p className="muted">No skill called “{q}” yet. Try a shorter word.</p>}
      </div>
    </div>
  )
}
