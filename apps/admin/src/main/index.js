/* global process */
import { app, BrowserWindow, ipcMain, dialog, protocol, net } from 'electron'
import path from 'path'
import os from 'os'
import { initStore } from './store.js'
import { registerIpcHandlers } from './ipc.js'
import { startServer } from './server.js'

const isDev = !app.isPackaged
let adminWindow = null

function createAdminWindow() {
    adminWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 1024,
        minHeight: 600,
        title: 'Elsass Leaderboard — Admin',
        webPreferences: {
            preload: path.join(import.meta.dirname, 'preload.cjs'),
            contextIsolation: true,
            nodeIntegration: false
        }
    })

    if (isDev) {
        adminWindow.loadURL('http://localhost:5173')
        adminWindow.webContents.openDevTools()
    } else {
        adminWindow.loadFile(path.join(import.meta.dirname, '../../dist/index.html'))
    }

    adminWindow.on('closed', () => {
        adminWindow = null
    })
}

ipcMain.handle('open-file-dialog', async () => {
    const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp'] }]
    })
    if (result.canceled) return null
    return result.filePaths[0]
})

ipcMain.handle('get-circuits-dir', async () => {
    const { getCircuitsDir } = await import('./store.js')
    return getCircuitsDir()
})

ipcMain.handle('get-local-ip', () => {
    const interfaces = os.networkInterfaces()
    for (const iface of Object.values(interfaces)) {
        for (const alias of iface) {
            if (alias.family === 'IPv4' && !alias.internal) {
                return alias.address
            }
        }
    }
    return '127.0.0.1'
})

ipcMain.handle('get-server-port', () => 3001)

app.whenReady().then(() => {
    initStore()
    registerIpcHandlers()
    startServer()
    protocol.handle('app', (request) => {
        const filePath = request.url.replace('app://', '')
        return net.fetch(`file://${path.normalize(filePath)}`)
    })
    createAdminWindow()
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})