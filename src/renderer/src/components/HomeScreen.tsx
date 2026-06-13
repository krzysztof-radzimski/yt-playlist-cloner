import { useCallback, useEffect, useState } from 'react'
import type { FetchProgress, MyPlaylist } from '@shared/types'
import { useStrings } from '../i18n'

interface Props {
  fetching: boolean
  loggedIn: boolean
  progress: FetchProgress | null
  error: string | null
  onFetch: (input: string) => void
}

export default function HomeScreen({
  fetching,
  loggedIn,
  progress,
  error,
  onFetch
}: Props): React.JSX.Element {
  const t = useStrings()
  const [input, setInput] = useState('')
  const [mine, setMine] = useState<MyPlaylist[] | null>(null)
  const [mineLoading, setMineLoading] = useState(false)
  const [mineError, setMineError] = useState(false)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const canSubmit = input.trim().length > 0 && !fetching

  const loadMine = useCallback(async () => {
    setMineLoading(true)
    setMineError(false)
    try {
      setMine(await window.api.playlist.listMine())
    } catch {
      setMineError(true)
      setMine(null)
    } finally {
      setMineLoading(false)
    }
  }, [])

  // Playlisty konta wczytujemy po zalogowaniu; po wylogowaniu czyścimy listę.
  useEffect(() => {
    if (loggedIn) void loadMine()
    else {
      setMine(null)
      setMineError(false)
    }
  }, [loggedIn, loadMine])

  // Po zakończonym pobieraniu zwalniamy podświetlenie klikniętej karty.
  useEffect(() => {
    if (!fetching) setPendingId(null)
  }, [fetching])

  const pick = (id: string): void => {
    if (fetching) return
    setPendingId(id)
    onFetch(id)
  }

  return (
    <div className="home">
      <section className="hero">
        <h1>{t.heroTitle}</h1>
        <p className="hero-sub">{t.heroSubtitle}</p>
        <form
          className="fetch-form"
          onSubmit={(event) => {
            event.preventDefault()
            if (canSubmit) onFetch(input)
          }}
        >
          <input
            className="input fetch-input"
            type="text"
            placeholder={t.fetchPlaceholder}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            disabled={fetching}
            spellCheck={false}
            autoFocus
          />
          <button className="btn btn-primary" type="submit" disabled={!canSubmit}>
            {fetching ? t.fetching : t.fetchButton}
          </button>
        </form>
        {fetching && (
          <div className="fetch-status" role="status">
            <span className="spinner" aria-hidden="true" />
            {progress ? t.fetchedCount(progress.loaded, progress.total) : t.connecting}
          </div>
        )}
        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}
      </section>

      {loggedIn && (
        <section className="my-playlists" aria-busy={mineLoading}>
          <div className="my-playlists-head">
            <h2 className="section-title">{t.myPlaylistsTitle}</h2>
            <button
              className="btn btn-ghost btn-sm"
              type="button"
              onClick={() => void loadMine()}
              disabled={mineLoading || fetching}
            >
              {t.myPlaylistsRefresh}
            </button>
          </div>
          {mineLoading || (mine === null && !mineError) ? (
            <div className="fetch-status" role="status">
              <span className="spinner" aria-hidden="true" />
              {t.myPlaylistsLoading}
            </div>
          ) : mineError ? (
            <div className="alert alert-error" role="alert">
              {t.myPlaylistsError}
            </div>
          ) : mine && mine.length > 0 ? (
            <>
              <p className="my-playlists-hint">{t.myPlaylistsHint}</p>
              <ul className="playlist-grid">
                {mine.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      className="playlist-pick"
                      onClick={() => pick(p.id)}
                      disabled={fetching}
                      aria-label={t.pickPlaylistAria(p.title)}
                    >
                      <span className="playlist-pick-thumb">
                        {p.thumbnailUrl ? (
                          <img
                            src={p.thumbnailUrl}
                            alt=""
                            referrerPolicy="no-referrer"
                            draggable={false}
                          />
                        ) : (
                          <span className="playlist-pick-thumb-fallback" aria-hidden="true">
                            ▶
                          </span>
                        )}
                        {pendingId === p.id && (
                          <span className="playlist-pick-spinner spinner" aria-hidden="true" />
                        )}
                      </span>
                      <span className="playlist-pick-meta">
                        <span className="playlist-pick-title">{p.title}</span>
                        {p.videoCount > 0 && (
                          <span className="playlist-pick-count">{t.videosCount(p.videoCount)}</span>
                        )}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="my-playlists-empty">{t.myPlaylistsEmpty}</p>
          )}
        </section>
      )}

      <section className="feature-cards">
        {t.features.map((feature) => (
          <article className="card feature-card" key={feature.title}>
            <h3>{feature.title}</h3>
            <p>{feature.body}</p>
          </article>
        ))}
      </section>
    </div>
  )
}
