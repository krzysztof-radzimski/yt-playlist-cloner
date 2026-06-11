import { useEffect, useRef } from 'react'
import type { CloneProgress } from '@shared/types'
import { plural } from '../lib/format'

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
      aria-label="Postęp klonowania"
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
            <h2>Tworzenie playlisty…</h2>
            <div className="progress">
              <div className="progress-fill progress-indeterminate" />
            </div>
          </>
        )}

        {stage === 'adding' && (
          <>
            <h2>Dodawanie filmów…</h2>
            <div className="progress">
              <div className="progress-fill" style={{ width: `${percent}%` }} />
            </div>
            <p className="modal-meta">
              Dodano {added} z {total} ({percent}%)
            </p>
            <p className="modal-hint">
              Tempo jest celowo ograniczone, żeby YouTube nie odrzucał żądań.
            </p>
          </>
        )}

        {stage === 'done' && (
          <>
            <div className="modal-icon modal-icon-ok" aria-hidden="true">
              ✓
            </div>
            <h2>Gotowe!</h2>
            <p className="modal-meta">
              Sklonowano {plural(added, ['film', 'filmy', 'filmów'])}. Playlista jest prywatna —
              widoczność zmienisz w YouTube.
            </p>
          </>
        )}

        {stage === 'cancelled' && (
          <>
            <h2>Przerwano</h2>
            <p className="modal-meta">
              Na koncie została częściowa playlista ({added} z {total} filmów) — możesz ją
              dokończyć ręcznie albo usunąć w YouTube.
            </p>
          </>
        )}

        {stage === 'error' && (
          <>
            <div className="modal-icon modal-icon-error" aria-hidden="true">
              !
            </div>
            <h2>Nie udało się</h2>
            <p className="modal-meta">{message ?? 'Wystąpił nieznany błąd.'}</p>
            {added > 0 && (
              <p className="modal-hint">
                Zanim wystąpił błąd, dodano {added} z {total} filmów — częściowa playlista została
                na Twoim koncie.
              </p>
            )}
          </>
        )}

        <div className="modal-actions">
          {active && (
            <button className="btn btn-ghost" onClick={onCancel}>
              Anuluj
            </button>
          )}
          {!active && playlistId && (
            <button className="btn btn-primary" onClick={() => onOpenResult(playlistId)}>
              Otwórz w YouTube
            </button>
          )}
          {!active && (
            <button className="btn btn-ghost" autoFocus onClick={onClose}>
              Zamknij
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
