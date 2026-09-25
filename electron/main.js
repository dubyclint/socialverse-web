// Electron desktop shell for Viorp.
// Loads the static Capacitor/SPA bundle produced by `npm run build:mobile`
// (or a running dev server when VIORP_DEV_SERVER is set).

const { app, BrowserWindow, shell } = require('electron')
const path = require('node:path')

const DEV_SERVER = process.env.VIORP_DEV_SERVER
const STATIC_INDEX = path.join(__dirname, '..', '.output', 'public', 'index.html')

let mainWindow = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#121827',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  if (DEV_SERVER) mainWindow.loadURL(DEV_SERVER)
  else mainWindow.loadFile(STATIC_INDEX)

  // External links open in the user's browser, never inside the shell.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// viorp:// deep links from the desktop shell.
app.setAsDefaultProtocolClient('viorp')
app.on('open-url', (event, url) => {
  event.preventDefault()
  if (mainWindow) mainWindow.webContents.send('viorp:deep-link', url)
})
