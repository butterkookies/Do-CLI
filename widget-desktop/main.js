const { app, BrowserWindow, Tray, Menu, nativeImage, screen, ipcMain, globalShortcut, shell } = require('electron')
const path = require('path')
const zlib = require('zlib')

let win, tray

// Generate a 16x16 green PNG icon in memory
function makePNG(w, h, r, g, b) {
  function crc32(buf) {
    const t = []
    for (let n = 0; n < 256; n++) {
      let c = n
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
      t[n] = c
    }
    let crc = 0xFFFFFFFF
    for (const byte of buf) crc = t[(crc ^ byte) & 0xFF] ^ (crc >>> 8)
    return (crc ^ 0xFFFFFFFF) >>> 0
  }
  function chunk(type, data) {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
    const td = Buffer.concat([Buffer.from(type), data])
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td))
    return Buffer.concat([len, td, crc])
  }
  const raw = []
  for (let y = 0; y < h; y++) {
    raw.push(0)
    for (let x = 0; x < w; x++) raw.push(r, g, b, 255)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8; ihdr[9] = 6
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(Buffer.from(raw))),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize

  win = new BrowserWindow({
    width: 380,
    height: 740,
    x: width - 398,
    y: height - 758,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: false,
    skipTaskbar: true,
    hasShadow: false,
    type: 'toolbar',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      partition: 'persist:widget',
    },
  })

  win.loadFile('widget.html')
  win.on('closed', () => { win = null })
  win.on('focus', () => win?.webContents.send('window-focus'))
  win.on('blur', () => win?.webContents.send('window-blur'))
}

function toggleWidget() {
  if (!win) { createWindow(); return }
  if (win.isVisible()) {
    win.hide()
  } else {
    win.loadFile('widget.html')  // Reload fresh on every toggle
    win.show()
    win.focus()
    win.webContents.send('focus-input')
  }
}

function createTray() {
  const icon = nativeImage.createFromBuffer(makePNG(16, 16, 0x7d, 0xc8, 0x7d))
  tray = new Tray(icon)
  tray.setToolTip('do. widget  (Ctrl+Shift+D)')

  tray.on('click', toggleWidget)

  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Show / Hide  (Ctrl+Shift+D)', click: toggleWidget },
    {
      label: 'Always on Top', type: 'checkbox', checked: false,
      click: (item) => win?.setAlwaysOnTop(item.checked),
    },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() },
  ]))
}

// IPC handlers
ipcMain.on('hide-widget', () => win?.hide())
ipcMain.on('pin-widget', (_, pinned) => win?.setAlwaysOnTop(pinned))
ipcMain.on('open-app', () => shell.openExternal('http://localhost:3000'))

app.whenReady().then(() => {
  createWindow()
  createTray()

  // Global hotkey: Ctrl+Shift+D to toggle widget
  globalShortcut.register('Ctrl+Shift+D', toggleWidget)
})

app.on('will-quit', () => globalShortcut.unregisterAll())
app.on('window-all-closed', (e) => e.preventDefault())
