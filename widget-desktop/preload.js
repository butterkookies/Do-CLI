const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('widget', {
  hide: () => ipcRenderer.send('hide-widget'),
  pin: (v) => ipcRenderer.send('pin-widget', v),
  openApp: () => ipcRenderer.send('open-app'),
  onFocusInput: (cb) => ipcRenderer.on('focus-input', cb),
  onWindowFocus: (cb) => ipcRenderer.on('window-focus', cb),
  onWindowBlur: (cb) => ipcRenderer.on('window-blur', cb),
})
