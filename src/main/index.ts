import { join } from 'node:path'
import { BrowserWindow, app, session, shell } from 'electron'
import appIcon from '../../resources/icon.png?asset'
import { registerIpcHandlers } from './ipc'
import { YT_PARTITION } from './youtube'

const YOUTUBE_URL = /^https:\/\/(www\.|music\.)?(youtube\.com|youtu\.be)\//

function createMainWindow(): void {
  const win = new BrowserWindow({
    width: 1240,
    height: 820,
    minWidth: 940,
    minHeight: 640,
    show: false,
    backgroundColor: '#0f0f0f',
    title: 'YT Playlist Cloner',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    trafficLightPosition: { x: 16, y: 18 },
    // macOS bierze ikonę z bundle'a (.icns); okno potrzebuje jej na Win/Linux.
    ...(process.platform !== 'darwin' ? { icon: appIcon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  win.once('ready-to-show', () => win.show())

  // Renderer nie nawiguje donikąd — linki YouTube otwieramy w systemowej przeglądarce.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (YOUTUBE_URL.test(url)) void shell.openExternal(url)
    return { action: 'deny' }
  })
  win.webContents.on('will-navigate', (event, url) => {
    if (url !== win.webContents.getURL()) event.preventDefault()
  })

  // Tylko w dev — w spakowanej aplikacji env nie może podmienić renderera.
  const devServerUrl = !app.isPackaged && process.env['ELECTRON_RENDERER_URL']
  if (devServerUrl) {
    void win.loadURL(devServerUrl)
  } else {
    void win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const [win] = BrowserWindow.getAllWindows()
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
    }
  })

  void app.whenReady().then(() => {
    // W dev na macOS dock pokazywałby domyślną ikonę Electrona;
    // w spakowanej aplikacji ikona pochodzi z bundle'a (.icns).
    if (process.platform === 'darwin' && !app.isPackaged) {
      app.dock?.setIcon(appIcon)
    }
    // Strony w oknie logowania nie potrzebują żadnych uprawnień (kamera,
    // powiadomienia itd.) — domyślnie Electron by je przyznawał.
    session
      .fromPartition(YT_PARTITION)
      .setPermissionRequestHandler((_webContents, _permission, callback) => callback(false))
    registerIpcHandlers()
    createMainWindow()
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
    })
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
}
