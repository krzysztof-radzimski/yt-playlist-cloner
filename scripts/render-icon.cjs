/**
 * Renderuje resources/icon.svg do PNG samym Electronem (bez dodatkowych
 * zależności): offscreen BrowserWindow + capturePage.
 *
 *   npm run icon   →  build/icon.png (1024², dla electron-buildera)
 *                     resources/icon.png (512², ikona okna/docka w dev)
 */
const { app, BrowserWindow, nativeImage } = require('electron')
const { mkdirSync, readFileSync, writeFileSync } = require('node:fs')
const { join } = require('node:path')

const SIZE = 1024
const root = join(__dirname, '..')

async function main() {
  const svg = readFileSync(join(root, 'resources', 'icon.svg'), 'utf8')
  const page = [
    '<!doctype html><html><head><style>',
    'html,body{margin:0;background:transparent;overflow:hidden}',
    `</style></head><body><img width="${SIZE}" height="${SIZE}" src="data:image/svg+xml;base64,`,
    Buffer.from(svg).toString('base64'),
    '"></body></html>'
  ].join('')

  const win = new BrowserWindow({
    show: false,
    width: SIZE,
    height: SIZE,
    transparent: true,
    frame: false,
    webPreferences: { offscreen: true }
  })
  await win.loadURL('data:text/html;base64,' + Buffer.from(page).toString('base64'))
  // Chwila na dekodowanie SVG i pierwszy paint klatki offscreen.
  await new Promise((resolve) => setTimeout(resolve, 500))

  let image = await win.webContents.capturePage({ x: 0, y: 0, width: SIZE, height: SIZE })
  if (image.getSize().width !== SIZE) {
    image = image.resize({ width: SIZE, height: SIZE })
  }

  mkdirSync(join(root, 'build'), { recursive: true })
  writeFileSync(join(root, 'build', 'icon.png'), image.toPNG())

  const small = nativeImage.createFromBuffer(image.toPNG()).resize({ width: 512, height: 512 })
  writeFileSync(join(root, 'resources', 'icon.png'), small.toPNG())

  console.log('OK: build/icon.png (1024) i resources/icon.png (512) zapisane')
  app.quit()
}

app.whenReady().then(() =>
  main().catch((err) => {
    console.error(err)
    app.exit(1)
  })
)
