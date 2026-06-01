/* global process */
import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { connect, disconnect, setMainWindow } from './wsClient.js'

const isDev = !app.isPackaged
let displayWindow = null

function createDisplayWindow() {
    displayWindow = new BrowserWindow({
        width: 1920,
        height: 1080,
        fullscreen: !isDev,
        title: 'Elsass Leaderboard — Affichage',
        webPreferences: {
            preload: path.join(import.meta.dirname, 'preload.cjs'),
            contextIsolation: true,
            nodeIntegration: false
        }
    })

    setMainWindow(displayWindow)

    if (isDev) {
        displayWindow.loadURL('http://localhost:5174')
        displayWindow.webContents.openDevTools()
    } else {
        displayWindow.loadFile(path.join(import.meta.dirname, '../../dist/index.html'))
    }

    displayWindow.on('closed', () => {
        disconnect()
        displayWindow = null
    })
}

ipcMain.handle('connect', (_, { ip, port }) => {
    connect(ip, port)
})

ipcMain.handle('disconnect', () => {
    disconnect()
})

app.commandLine.appendSwitch('force-device-scale-factor', '1')

app.whenReady().then(() => {
    createDisplayWindow()
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})