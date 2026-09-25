const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('viorpDesktop', {
  platform: 'electron',
  onDeepLink: (handler) => {
    ipcRenderer.on('viorp:deep-link', (_event, url) => handler(url))
  }
})
