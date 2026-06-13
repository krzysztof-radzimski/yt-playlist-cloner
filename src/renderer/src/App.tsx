import { useCallback, useEffect, useState } from 'react'
import type { AuthState, CloneProgress, FetchProgress, PlaylistData } from '@shared/types'
import CloneModal from './components/CloneModal'
import HomeScreen from './components/HomeScreen'
import PlaylistView from './components/PlaylistView'
import TopBar from './components/TopBar'
import { useStrings } from './i18n'
import { cleanIpcError } from './lib/format'

export default function App(): React.JSX.Element {
  const t = useStrings()
  const [auth, setAuth] = useState<AuthState>({ loggedIn: false })
  const [authBusy, setAuthBusy] = useState(false)
  const [appError, setAppError] = useState<string | null>(null)
  const [playlist, setPlaylist] = useState<PlaylistData | null>(null)
  const [fetching, setFetching] = useState(false)
  const [fetchProgress, setFetchProgress] = useState<FetchProgress | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [cloneProgress, setCloneProgress] = useState<CloneProgress | null>(null)

  const cloneActive = cloneProgress?.stage === 'creating' || cloneProgress?.stage === 'adding'

  useEffect(() => {
    document.body.classList.add(`platform-${window.api.platform}`)
    void window.api.auth.getState().then(setAuth)
    const offFetch = window.api.playlist.onFetchProgress(setFetchProgress)
    const offClone = window.api.clone.onProgress(setCloneProgress)
    return () => {
      offFetch()
      offClone()
    }
  }, [])

  const handleLogin = useCallback(async () => {
    setAuthBusy(true)
    setAppError(null)
    try {
      setAuth(await window.api.auth.login())
    } catch (err) {
      setAppError(t.loginFailed(cleanIpcError(err)))
    } finally {
      setAuthBusy(false)
    }
  }, [t])

  const handleLogout = useCallback(async () => {
    setAuthBusy(true)
    setAppError(null)
    try {
      setAuth(await window.api.auth.logout())
    } catch (err) {
      setAppError(t.logoutFailed(cleanIpcError(err)))
    } finally {
      setAuthBusy(false)
    }
  }, [t])

  const handleFetch = useCallback(async (input: string) => {
    setFetching(true)
    setFetchError(null)
    setFetchProgress(null)
    try {
      setPlaylist(await window.api.playlist.fetch(input))
    } catch (err) {
      setFetchError(cleanIpcError(err))
    } finally {
      setFetching(false)
    }
  }, [])

  const handleCloneStart = useCallback(
    (title: string, videoIds: string[]) => {
      if (cloneActive) return
      setCloneProgress({ stage: 'creating', added: 0, total: videoIds.length })
      void window.api.clone.start({ title, videoIds }).catch((err) => {
        setCloneProgress({
          stage: 'error',
          added: 0,
          total: videoIds.length,
          message: cleanIpcError(err)
        })
      })
    },
    [cloneActive]
  )

  return (
    <div className="app">
      <TopBar auth={auth} busy={authBusy} onLogin={handleLogin} onLogout={handleLogout} />
      {appError && (
        <div className="app-error" role="alert">
          <span>{appError}</span>
          <button
            className="app-error-close"
            onClick={() => setAppError(null)}
            aria-label={t.dismissMessage}
          >
            ✕
          </button>
        </div>
      )}
      <main className="app-main">
        {playlist ? (
          <PlaylistView
            key={playlist.id}
            playlist={playlist}
            loggedIn={auth.loggedIn}
            cloning={cloneActive}
            onClone={handleCloneStart}
            onLoginRequest={handleLogin}
            onBack={() => setPlaylist(null)}
          />
        ) : (
          <HomeScreen
            fetching={fetching}
            loggedIn={auth.loggedIn}
            progress={fetchProgress}
            error={fetchError}
            onFetch={handleFetch}
          />
        )}
      </main>
      {cloneProgress && (
        <CloneModal
          progress={cloneProgress}
          onCancel={() => window.api.clone.cancel()}
          onClose={() => setCloneProgress(null)}
          onOpenResult={(id) =>
            window.api.openExternal(`https://www.youtube.com/playlist?list=${id}`)
          }
        />
      )}
    </div>
  )
}
