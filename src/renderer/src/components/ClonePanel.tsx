import { useState } from 'react'
import { PLAYLIST_MAX_VIDEOS, PLAYLIST_TITLE_MAX_LENGTH } from '@shared/types'
import { estimateCloneSeconds, formatEta, plural } from '../lib/format'

interface Props {
  playlistTitle: string
  includedIds: string[]
  loggedIn: boolean
  cloning: boolean
  onClone: (title: string, videoIds: string[]) => void
  onLoginRequest: () => void
}

export default function ClonePanel({
  playlistTitle,
  includedIds,
  loggedIn,
  cloning,
  onClone,
  onLoginRequest
}: Props): React.JSX.Element {
  // Tytuł źródłowy może mieć pełne 150 znaków — domyślna nazwa z sufiksem
  // musi zmieścić się w limicie YouTube.
  const [title, setTitle] = useState(() =>
    `${playlistTitle} (kopia)`.slice(0, PLAYLIST_TITLE_MAX_LENGTH)
  )
  const count = includedIds.length
  const overLimit = count > PLAYLIST_MAX_VIDEOS
  const canClone =
    loggedIn && !cloning && count > 0 && !overLimit && title.trim().length > 0

  return (
    <div className="card clone-card">
      <h3 className="card-label">Nowa playlista</h3>
      <input
        className="input"
        type="text"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        maxLength={PLAYLIST_TITLE_MAX_LENGTH}
        placeholder="Nazwa nowej playlisty"
        aria-label="Nazwa nowej playlisty"
      />
      <p className="clone-meta">
        {plural(count, ['film', 'filmy', 'filmów'])} · {formatEta(estimateCloneSeconds(count))}
      </p>
      {overLimit && (
        <div className="alert alert-error">
          YouTube ogranicza playlisty do {PLAYLIST_MAX_VIDEOS} filmów — odznacz część z nich.
        </div>
      )}
      {loggedIn ? (
        <button
          className="btn btn-primary btn-block"
          disabled={!canClone}
          onClick={() => onClone(title.trim(), includedIds)}
        >
          {cloning ? 'Klonowanie…' : 'Utwórz klona'}
        </button>
      ) : (
        <button className="btn btn-primary btn-block" onClick={onLoginRequest}>
          Zaloguj się, aby sklonować
        </button>
      )}
      <p className="clone-note">
        Klon powstanie jako playlista <strong>prywatna</strong> na Twoim koncie — widoczność
        zmienisz później w YouTube.
      </p>
    </div>
  )
}
