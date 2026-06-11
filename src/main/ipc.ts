import { BrowserWindow, ipcMain, shell } from 'electron'
import { IPC } from '../shared/ipc'
import {
  PLAYLIST_MAX_VIDEOS,
  PLAYLIST_TITLE_MAX_LENGTH,
  type AuthState,
  type CloneRequest
} from '../shared/types'
import { logout, openLoginWindow } from './auth'
import { cancelClone, runClone } from './cloner'
import { saveExport } from './export'
import { fetchPlaylist, getAccountInfo, isLoggedIn } from './youtube'

const YOUTUBE_URL = /^https:\/\/(www\.|music\.)?(youtube\.com|youtu\.be)\//

async function authState(): Promise<AuthState> {
  if (!(await isLoggedIn())) return { loggedIn: false }
  const { name, photoUrl } = await getAccountInfo()
  return { loggedIn: true, accountName: name, accountPhotoUrl: photoUrl }
}

function validateCloneRequest(request: unknown): asserts request is CloneRequest {
  const r = request as CloneRequest | null
  if (!r || typeof r.title !== 'string' || r.title.trim().length === 0) {
    throw new Error('Podaj nazwę nowej playlisty.')
  }
  if (r.title.trim().length > PLAYLIST_TITLE_MAX_LENGTH) {
    throw new Error(`Nazwa playlisty może mieć najwyżej ${PLAYLIST_TITLE_MAX_LENGTH} znaków.`)
  }
  if (!Array.isArray(r.videoIds) || r.videoIds.length === 0) {
    throw new Error('Lista filmów do sklonowania jest pusta.')
  }
  if (r.videoIds.length > PLAYLIST_MAX_VIDEOS) {
    throw new Error(`YouTube ogranicza playlisty do ${PLAYLIST_MAX_VIDEOS} filmów.`)
  }
  if (!r.videoIds.every((id) => typeof id === 'string' && /^[A-Za-z0-9_-]{6,20}$/.test(id))) {
    throw new Error('Lista zawiera nieprawidłowy identyfikator filmu.')
  }
}

export function registerIpcHandlers(): void {
  ipcMain.handle(IPC.AuthGetState, () => authState())

  ipcMain.handle(IPC.AuthLogin, async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) await openLoginWindow(win)
    return authState()
  })

  ipcMain.handle(IPC.AuthLogout, async () => {
    await logout()
    return authState()
  })

  ipcMain.handle(IPC.PlaylistFetch, (event, input: unknown) => {
    if (typeof input !== 'string') throw new Error('Nieprawidłowe dane wejściowe.')
    return fetchPlaylist(input, (loaded, total) => {
      if (!event.sender.isDestroyed()) {
        event.sender.send(IPC.PlaylistFetchProgress, { loaded, total })
      }
    })
  })

  ipcMain.handle(IPC.CloneStart, async (event, request: unknown) => {
    validateCloneRequest(request)
    if (!(await isLoggedIn())) {
      throw new Error('Zaloguj się, aby utworzyć playlistę na swoim koncie.')
    }
    return runClone(request, event.sender)
  })

  ipcMain.on(IPC.CloneCancel, () => cancelClone())

  ipcMain.handle(IPC.ExportSave, (event, request: unknown) =>
    saveExport(request, BrowserWindow.fromWebContents(event.sender))
  )

  ipcMain.on(IPC.OpenExternal, (_event, url: unknown) => {
    if (typeof url === 'string' && YOUTUBE_URL.test(url)) void shell.openExternal(url)
  })
}
