import { useState } from 'react'
import { PLAYLIST_MAX_VIDEOS, PLAYLIST_TITLE_MAX_LENGTH } from '@shared/types'
import { useStrings } from '../i18n'
import { estimateCloneSeconds } from '../lib/format'

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
  const t = useStrings()
  // Tytuł źródłowy może mieć pełne 150 znaków — domyślna nazwa z sufiksem
  // musi zmieścić się w limicie YouTube.
  const [title, setTitle] = useState(() =>
    `${playlistTitle}${t.copySuffix}`.slice(0, PLAYLIST_TITLE_MAX_LENGTH)
  )
  const count = includedIds.length
  const overLimit = count > PLAYLIST_MAX_VIDEOS
  const canClone = loggedIn && !cloning && count > 0 && !overLimit && title.trim().length > 0

  return (
    <div className="card clone-card">
      <h3 className="card-label">{t.newPlaylist}</h3>
      <input
        className="input"
        type="text"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        maxLength={PLAYLIST_TITLE_MAX_LENGTH}
        placeholder={t.playlistNamePlaceholder}
        aria-label={t.playlistNameAria}
      />
      <p className="clone-meta">{t.cloneMeta(count, estimateCloneSeconds(count))}</p>
      {overLimit && <div className="alert alert-error">{t.overLimit(PLAYLIST_MAX_VIDEOS)}</div>}
      {loggedIn ? (
        <button
          className="btn btn-primary btn-block"
          disabled={!canClone}
          onClick={() => onClone(title.trim(), includedIds)}
        >
          {cloning ? t.cloning : t.createClone}
        </button>
      ) : (
        <button className="btn btn-primary btn-block" onClick={onLoginRequest}>
          {t.signInToClone}
        </button>
      )}
      <p className="clone-note">
        {t.cloneNotePre}
        <strong>{t.cloneNoteStrong}</strong>
        {t.cloneNotePost}
      </p>
    </div>
  )
}
