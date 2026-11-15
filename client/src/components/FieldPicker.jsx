import { AREAS, AREA, fieldsOf } from '../data/fields'

// Two-level picker: 10 areas, then the 5 fields inside the chosen area.
// `allLabel` adds "All" buttons (Explore); leave it out when one field must be chosen (sign-up).
export default function FieldPicker({ area, field, onArea, onField, counts, allLabel, total, idPrefix = 'fp' }) {
  return (
    <div className="fpick">
      <div className="fpick-areas" role="group" aria-label="Areas">
        {allLabel && (
          <button type="button" className="fchip" aria-pressed={!area} onClick={() => onArea('')}>
            {allLabel}{total != null && <span>{total}</span>}
          </button>
        )}
        {AREAS.map((a) => (
          <button type="button" key={a.id} id={`${idPrefix}-${a.id}`} className="fchip" style={{ '--h': a.h }} aria-pressed={area === a.id} onClick={() => onArea(a.id)}>
            <a.Icon size={15} strokeWidth={2.3} /> {a.short}{counts && <span>{counts.area[a.id]}</span>}
          </button>
        ))}
      </div>
      {area && (
        <div className="fpick-fields" role="group" aria-label={`Fields in ${AREA[area].name}`}>
          {allLabel && (
            <button type="button" className="fsub" aria-pressed={!field} onClick={() => onField('')}>
              All of {AREA[area].short}
            </button>
          )}
          {fieldsOf(area).map((f) => (
            <button type="button" key={f.id} className="fsub" style={{ '--h': f.h }} aria-pressed={field === f.id} onClick={() => onField(f.id)}>
              <f.Icon size={14} strokeWidth={2.3} /> {f.name}{counts && <span>{counts.field[f.id]}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
