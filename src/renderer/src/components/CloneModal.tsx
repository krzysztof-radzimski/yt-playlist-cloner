import { useEffect, useRef } from 'react'
import type { CloneProgress } from '@shared/types'
import { useStrings } from '../i18n'

interface Props {
  progress: CloneProgress
  onCancel: () => void
  onClose: () => void
  onOpenResult: (playlistId: string) => void
}

export default function CloneModal({
  progress,
  onCancel,
  onClose,
  onOpenResult
}: Props): React.JSX.Element {
  const t = useStrings()
  const { stage, added, total, playlistId, message } = progress
  const percent = total > 0 ? Math.round((added / total) * 100) : 0
  const active = stage === 'creating' || stage === 'adding'
  const containerRef = useRef<HTMLDivElement>(null)

  // Fokus wchodzi do modala — bez tego Enter trafiałby w przycisk
  // „Utwórz klona” pod spodem i próbował odpalić drugi klon.
  useEffect(() => {
    containerRef.current?.focus()
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return
      if (active) onCancel()
      else onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [active, onCancel, onClose])

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={t.creatingTitle}
      onClick={() => {
        if (!active) onClose()
      }}
    >
      <div
        className="modal"
        ref={containerRef}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        {stage === 'creating' && (
          <>
            <h2>{t.creatingTitle}</h2>
            <div className="progress">
              <div className="progress-fill progress-indeterminate" />
            </div>
          </>
        )}

        {stage === 'adding' && (
          <>
            <h2>{t.addingTitle}</h2>
            <div className="progress">
              <div className="progress-fill" style={{ width: `${percent}%` }} />
            </div>
            <p className="modal-meta">{t.addedOf(added, total, percent)}</p>
            <p className="modal-hint">{t.pacingHint}</p>
          </>
        )}

        {stage === 'done' && (
          <>
            <div className="modal-icon modal-icon-ok" aria-hidden="true">
              ✓
            </div>
            <h2>{t.doneTitle}</h2>
            <p className="modal-meta">{t.doneMessage(added)}</p>
          </>
        )}

        {stage === 'cancelled' && (
          <>
            <h2>{t.cancelledTitle}</h2>
            <p className="modal-meta">{t.cancelledMessage(added, total)}</p>
          </>
        )}

        {stage === 'error' && (
          <>
            <div className="modal-icon modal-icon-error" aria-hidden="true">
              !
            </div>
            <h2>{t.errorTitle}</h2>
            <p className="modal-meta">{message ?? t.unknownError}</p>
            {added > 0 && <p className="modal-hint">{t.partialHint(added, total)}</p>}
          </>
        )}

        <div className="modal-actions">
          {active && (
            <button className="btn btn-ghost" onClick={onCancel}>
              {t.cancel}
            </button>
          )}
          {!active && playlistId && (
            <button className="btn btn-primary" onClick={() => onOpenResult(playlistId)}>
              {t.openInYouTube}
            </button>
          )}
          {!active && (
            <button className="btn btn-ghost" autoFocus onClick={onClose}>
              {t.close}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
