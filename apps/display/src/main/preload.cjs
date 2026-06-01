const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
    onStateUpdate: (callback) => ipcRenderer.on('state-update', (_, data) => callback(data)),
    offStateUpdate: (callback) => ipcRenderer.removeListener('state-update', callback),
    onConnectionStatus: (callback) => ipcRenderer.on('connection-status', (_, status) => callback(status)),
    offConnectionStatus: (callback) => ipcRenderer.removeListener('connection-status', callback),
    connect: (ip, port) => ipcRenderer.invoke('connect', { ip, port }),
    disconnect: () => ipcRenderer.invoke('disconnect')
})