import { SORT_OPTIONS, type SortMode, type SortSpec } from '../lib/sort'

interface Props {
  spec: SortSpec
  onChange: (spec: SortSpec) => void
  onShuffle: () => void
}

export default function SortControls({ spec, onChange, onShuffle }: Props): React.JSX.Element {
  return (
    <div className="card sort-card">
      <h3 className="card-label">Kolejność</h3>
      <div className="sort-row">
        <select
          className="input select"
          value={spec.mode}
          aria-label="Tryb sortowania"
          onChange={(event) =>
            onChange({ mode: event.target.value as SortMode, descending: spec.descending })
          }
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.mode} value={option.mode}>
              {option.label}
            </option>
          ))}
          {spec.mode === 'custom' && <option value="custom">Własna kolejność</option>}
        </select>
        <button
          className="btn btn-ghost btn-icon"
          title={spec.descending ? 'Malejąco — kliknij, aby odwrócić' : 'Rosnąco — kliknij, aby odwrócić'}
          aria-label="Odwróć kierunek sortowania"
          onClick={() => onChange({ ...spec, descending: !spec.descending })}
        >
          {spec.descending ? '↓' : '↑'}
        </button>
      </div>
      <button className="btn btn-ghost btn-block" onClick={onShuffle}>
        Przetasuj losowo
      </button>
    </div>
  )
}
