import { BrowserWindow, session, shell } from 'electron'
import { getLanguage, mainStrings } from './locale'
import { YT_PARTITION, invalidateClient, isLoggedIn } from './youtube'

/**
 * Logowanie odbywa się w oknie aplikacji na partycji persist:youtube —
 * dokładnie wzorcem ytmdesktop: wejście przez first-party ServiceLogin
 * z service=youtube (a nie OAuth, który Google blokuje w webview).
 * Sesja zostaje w aplikacji, więc nie dotyczy nas rotacja ciasteczek
 * eksportowanych z zewnętrznej przeglądarki.
 */

function loginUrl(): string {
  const hl = getLanguage()
  const next = `https://www.youtube.com/signin?action_handle_signin=true&app=desktop&hl=${hl}&next=%2F`
  return (
    'https://accounts.google.com/ServiceLogin?service=youtube&uilel=3&passive=true&continue=' +
    encodeURIComponent(next)
  )
}

/**
 * Okno logowania nie może być furtką do swobodnego przeglądania internetu
 * pod zalogowaną sesją Google — nawigacja jest ograniczona do domen
 * niezbędnych w procesie logowania, a wszystko inne idzie do przeglądarki.
 */
const ALLOWED_LOGIN_DOMAINS = ['google.com', 'youtube.com', 'gstatic.com', 'googleusercontent.com']

function isAllowedLoginUrl(url: string): boolean {
  try {
    const { protocol, hostname } = new URL(url)
    if (protocol !== 'https:') return false
    return ALLOWED_LOGIN_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    )
  } catch {
    return false
  }
}

let loginWindow: BrowserWindow | null = null

/** Otwiera okno logowania i rozstrzyga po jego zamknięciu (sukces = są ciasteczka konta). */
export async function openLoginWindow(parent: BrowserWindow): Promise<boolean> {
  if (loginWindow) {
    loginWindow.focus()
    return isLoggedIn()
  }

  return new Promise<boolean>((resolve) => {
    const win = new BrowserWindow({
      width: 480,
      height: 720,
      parent,
      autoHideMenuBar: true,
      title: mainStrings().main.loginWindowTitle,
      webPreferences: {
        partition: YT_PARTITION,
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true
      }
    })
    loginWindow = win

    win.webContents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith('https://')) void shell.openExternal(url)
      return { action: 'deny' }
    })

    win.webContents.on('will-navigate', (event, url) => {
      if (!isAllowedLoginUrl(url)) {
        event.preventDefault()
        if (url.startsWith('https://')) void shell.openExternal(url)
      }
    })

    win.webContents.on('did-navigate', (_event, url) => {
      // Po udanym logowaniu Google przekierowuje na youtube.com — zamykamy okno.
      if (/^https:\/\/(www\.)?youtube\.com\//.test(url)) {
        void isLoggedIn().then((ok) => {
          if (ok && !win.isDestroyed()) win.close()
        })
      }
    })

    win.on('closed', () => {
      loginWindow = null
      invalidateClient()
      void isLoggedIn().then(resolve)
    })

    void win.loadURL(loginUrl())
  })
}

export async function logout(): Promise<void> {
  await session.fromPartition(YT_PARTITION).clearStorageData()
  invalidateClient()
}
