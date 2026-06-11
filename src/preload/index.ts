import { contextBridge, ipcRenderer } from 'electron'
import type { RendererApi } from '../shared/api'
import type { Language } from '../shared/i18n'
import { IPC } from '../shared/ipc'
import type { CloneRequest, ExportSaveRequest } from '../shared/types'

const languageArg = process.argv.find((arg) => arg.startsWith('--app-language='))?.split('=')[1]
const language: Language = languageArg === 'pl' ? 'pl' : 'en'

function subscribe<T>(channel: string, callback: (payload: T) => void): () => void {
  const listener = (_event: Electron.IpcRendererEvent, payload: T): void => callback(payload)
  ipcRenderer.on(channel, listener)
  return () => ipcRenderer.removeListener(channel, listener)
}

const api: RendererApi = {
  platform: process.platform,
  language,
  auth: {
    getState: () => ipcRenderer.invoke(IPC.AuthGetState),
    login: () => ipcRenderer.invoke(IPC.AuthLogin),
    logout: () => ipcRenderer.invoke(IPC.AuthLogout)
  },
  playlist: {
    fetch: (input: string) => ipcRenderer.invoke(IPC.PlaylistFetch, input),
    onFetchProgress: (callback) => subscribe(IPC.PlaylistFetchProgress, callback)
  },
  clone: {
    start: (request: CloneRequest) => ipcRenderer.invoke(IPC.CloneStart, request),
    cancel: () => ipcRenderer.send(IPC.CloneCancel),
    onProgress: (callback) => subscribe(IPC.CloneProgress, callback)
  },
  export: {
    save: (request: ExportSaveRequest) => ipcRenderer.invoke(IPC.ExportSave, request)
  },
  openExternal: (url: string) => ipcRenderer.send(IPC.OpenExternal, url)
}

contextBridge.exposeInMainWorld('api', api)
