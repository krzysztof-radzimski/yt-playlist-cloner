import type { AuthState } from '@shared/types'

interface Props {
  auth: AuthState
  busy: boolean
  onLogin: () => void
  onLogout: () => void
}

export default function TopBar({ auth, busy, onLogin, onLogout }: Props): React.JSX.Element {
  return (
    <header className="topbar">
      <div className="brand">
        <svg className="brand-icon" viewBox="0 0 24 24" aria-hidden="true">
          <rect x="1" y="4" width="22" height="16" rx="5" fill="currentColor" />
          <path d="M10 9.2l5.6 2.8-5.6 2.8z" fill="#fff" />
        </svg>
        <span className="brand-name">YT Playlist Cloner</span>
      </div>
      <div className="topbar-auth">
        {auth.loggedIn ? (
          <>
            <div className="account-chip" title={auth.accountName}>
              {auth.accountPhotoUrl ? (
                <img
                  className="account-avatar"
                  src={auth.accountPhotoUrl}
                  alt=""
                  referrerPolicy="no-referrer"
                  draggable={false}
                />
              ) : (
                <span className="account-avatar account-avatar-fallback" aria-hidden="true">
                  {(auth.accountName ?? '•').slice(0, 1).toUpperCase()}
                </span>
              )}
              <span className="account-name">{auth.accountName ?? 'Zalogowano'}</span>
            </div>
            <button className="btn btn-ghost" onClick={onLogout} disabled={busy}>
              Wyloguj
            </button>
          </>
        ) : (
          <button className="btn btn-primary" onClick={onLogin} disabled={busy}>
            {busy ? 'Logowanie…' : 'Zaloguj się przez YouTube'}
          </button>
        )}
      </div>
    </header>
  )
}
