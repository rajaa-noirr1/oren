import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Layers, LayoutGrid } from 'lucide-react'
import SwipeView from '../components/SwipeView'
import BrowseView from '../components/BrowseView'
import FieldPicker from '../components/FieldPicker'
import { Modal } from '../components/Overlays'
import { SwapMark } from '../components/Logo'
import { AREA, FIELD, inArea, inField } from '../data/fields'
import { PEOPLE } from '../data/people'
import { SKILL } from '../data/skills'
import { useStore, firstName } from '../lib/store'
import { COUNTS } from '../lib/counts'
import useTitle from '../lib/useTitle'

export default function Explore() {
  useTitle('Explore')
  const { me, signInDemo, toast } = useStore()
  const [params, setParams] = useSearchParams()
  const [gate, setGate] = useState(null)
  const mode = params.get('mode') === 'browse' ? 'browse' : 'swipe'
  const field = FIELD[params.get('field')] ? params.get('field') : ''
  const area = field ? FIELD[field].area : AREA[params.get('area')] ? params.get('area') : ''
  const skills = (params.get('skills') || '').split(',').filter((id) => SKILL[id])

  const update = (patch) => {
    const next = new URLSearchParams(params)
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)))
    setParams(next, { replace: true })
  }
  const useDemo = () => signInDemo().then((card) => { if (card) { setGate(null); toast('Signed in as the demo member. Fit scores are on.') } })
  const people = useMemo(() => PEOPLE.filter((p) => (field ? inField(p, field) : area ? inArea(p, area) : true)), [field, area])
  const scopeName = field ? FIELD[field].name : area ? AREA[area].name : null

  return (
    <div className="wrap page explore">
      <div className="page-head">
        <div>
          <p className="eyebrow">Explore · {PEOPLE.length} people · 50 fields</p>
          <h1>{mode === 'swipe' ? 'Swipe for a fair trade' : 'Search by skill'}</h1>
        </div>
        <div className="seg" role="group" aria-label="View">
          <button aria-pressed={mode === 'swipe'} onClick={() => update({ mode: null })}><Layers size={16} /> Swipe</button>
          <button aria-pressed={mode === 'browse'} onClick={() => update({ mode: 'browse' })}><LayoutGrid size={16} /> Browse</button>
        </div>
      </div>

      <FieldPicker area={area} field={field} counts={COUNTS} total={PEOPLE.length} allLabel="All fields"
        onArea={(a) => update({ area: a, field: null })} onField={(f) => update({ field: f, area: f ? null : area })} />

      {!me && (
        <div className="guest">
          <SwapMark size={30} />
          <p><b>You are browsing as a guest.</b> Fit scores and swaps need your card.</p>
          <div className="guest-actions">
            <button className="btn btn-sm btn-ghost" onClick={useDemo}>Use the demo member</button>
            <Link className="btn btn-sm btn-primary" to="/join">Build your card</Link>
          </div>
        </div>
      )}

      {mode === 'swipe'
        ? <SwipeView people={people} scopeName={scopeName} openGate={setGate} />
        : <BrowseView people={people} skills={skills} setSkills={(list) => update({ skills: list.join(',') })} />}

      <Modal open={!!gate} onClose={() => setGate(null)} label="Build your card first">
        {gate && (
          <div className="gate">
            <p className="eyebrow">One step first</p>
            <h2>Show {firstName(gate)} what you can teach.</h2>
            <p className="muted">A swap needs two cards. Build yours in about three minutes, or load the demo card to try matching right now.</p>
            <div className="gate-actions">
              <Link to="/join" className="btn btn-primary">Build your card</Link>
              <button className="btn btn-ghost" onClick={useDemo}>Use the demo member</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
