import { useState } from 'react'
import type { ExportFormat, PlaylistData, VideoItem } from '@shared/types'
import { cleanIpcError } from '../lib/format'
import { exportFileName, serializePlaylist } from '../lib/export'

interface Props {
  playlist: PlaylistData
  order: VideoItem[]
  excluded: ReadonlySet<string>
}

type Status =
  | { kind: 'idle' }
  | { kind: 'saved'; path: string }
  | { kind: 'cancelled' }
  | { kind: 'error'; message: string }

const FORMATS: Array<{ value: ExportFormat; label: string }> = [
  { value: 'csv', label: 'CSV' },
  { value: 'json', label: 'JSON' },
  { value: 'xml', label: 'XML' }
]

export default function ExportPanel({ playlist, order, excluded }: Props): React.JSX.Element {
  const [format, setFormat] = useState<ExportFormat>('csv')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  const handleExport = async (): Promise<void> => {
    setBusy(true)
    setStatus({ kind: 'idle' })
    try {
      const content = serializePlaylist(format, playlist, order, excluded)
      const result = await window.api.export.save({
        defaultName: exportFileName(playlist.title, format),
        content,
        format
      })
      setStatus(
        result.saved && result.path
          ? { kind: 'saved', path: result.path }
          : { kind: 'cancelled' }
      )
    } catch (err) {
      setStatus({ kind: 'error', message: cleanIpcError(err) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card export-card">
      <h3 className="card-label">Eksport do pliku</h3>
      <div className="export-row">
        <select
          className="input select"
          value={format}
          aria-label="Format eksportu"
          disabled={busy}
          onChange={(event) => setFormat(event.target.value as ExportFormat)}
        >
          {FORMATS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button className="btn btn-ghost" onClick={handleExport} disabled={busy}>
          {busy ? 'Zapisywanie…' : 'Pobierz'}
        </button>
      </div>
      <p className="export-note">
        Zapisuje dane playlisty (z opisem i datą aktualizacji) oraz listę filmów w bieżącej
        kolejności. Opis i data pojedynczych filmów nie są dostępne w danych playlisty.
      </p>
      {status.kind === 'saved' && (
        <p className="export-status export-status-ok" title={status.path}>
          Zapisano: {status.path}
        </p>
      )}
      {status.kind === 'cancelled' && <p className="export-status">Anulowano.</p>}
      {status.kind === 'error' && (
        <p className="export-status export-status-error">{status.message}</p>
      )}
    </div>
  )
}
