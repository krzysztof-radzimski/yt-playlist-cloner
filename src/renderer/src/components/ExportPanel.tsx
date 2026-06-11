import { useState } from 'react'
import type { ExportFormat, PlaylistData, VideoItem } from '@shared/types'
import { useStrings } from '../i18n'
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

const FORMATS: ExportFormat[] = ['csv', 'json', 'xml']

export default function ExportPanel({ playlist, order, excluded }: Props): React.JSX.Element {
  const t = useStrings()
  const [format, setFormat] = useState<ExportFormat>('csv')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  const handleExport = async (): Promise<void> => {
    setBusy(true)
    setStatus({ kind: 'idle' })
    try {
      const content = serializePlaylist(format, playlist, order, excluded, t.lang)
      const result = await window.api.export.save({
        defaultName: exportFileName(playlist.title, format, t.lang),
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
      <h3 className="card-label">{t.exportTitle}</h3>
      <div className="export-row">
        <select
          className="input select"
          value={format}
          aria-label={t.exportFormatAria}
          disabled={busy}
          onChange={(event) => setFormat(event.target.value as ExportFormat)}
        >
          {FORMATS.map((value) => (
            <option key={value} value={value}>
              {value.toUpperCase()}
            </option>
          ))}
        </select>
        <button className="btn btn-ghost" onClick={handleExport} disabled={busy}>
          {busy ? t.exportSaving : t.exportDownload}
        </button>
      </div>
      <p className="export-note">{t.exportNote}</p>
      {status.kind === 'saved' && (
        <p className="export-status export-status-ok" title={status.path}>
          {t.exportSaved(status.path)}
        </p>
      )}
      {status.kind === 'cancelled' && <p className="export-status">{t.exportCancelled}</p>}
      {status.kind === 'error' && (
        <p className="export-status export-status-error">{status.message}</p>
      )}
    </div>
  )
}
