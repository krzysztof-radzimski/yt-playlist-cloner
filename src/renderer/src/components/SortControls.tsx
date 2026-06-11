import { SORT_MODES, type SortMode, type SortSpec } from '../lib/sort'
import { useStrings } from '../i18n'

interface Props {
  spec: SortSpec
  onChange: (spec: SortSpec) => void
  onShuffle: () => void
}

export default function SortControls({ spec, onChange, onShuffle }: Props): React.JSX.Element {
  const t = useStrings()
  const label: Record<Exclude<SortMode, 'custom'>, string> = {
    original: t.sortOriginal,
    title: t.sortTitle,
    duration: t.sortDuration,
    channel: t.sortChannel
  }

  return (
    <div className="card sort-card">
      <h3 className="card-label">{t.orderLabel}</h3>
      <div className="sort-row">
        <select
          className="input select"
          value={spec.mode}
          aria-label={t.sortModeAria}
          onChange={(event) =>
            onChange({ mode: event.target.value as SortMode, descending: spec.descending })
          }
        >
          {SORT_MODES.map((mode) => (
            <option key={mode} value={mode}>
              {label[mode]}
            </option>
          ))}
          {spec.mode === 'custom' && <option value="custom">{t.sortCustom}</option>}
        </select>
        <button
          className="btn btn-ghost btn-icon"
          title={spec.descending ? t.descTooltip : t.ascTooltip}
          aria-label={t.reverseAria}
          onClick={() => onChange({ ...spec, descending: !spec.descending })}
        >
          {spec.descending ? '↓' : '↑'}
        </button>
      </div>
      <button className="btn btn-ghost btn-block" onClick={onShuffle}>
        {t.shuffle}
      </button>
    </div>
  )
}
