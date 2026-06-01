import { WebSocket } from 'ws'

let ws = null
let mainWindow = null
let reconnectTimer = null

export function setMainWindow(win) {
    mainWindow = win
}

export function connect(ip, port) {
    disconnect()
    const url = `ws://${ip}:${port}`

    ws = new WebSocket(url)

    ws.on('open', () => {
        sendToRenderer('connection-status', { connected: true })
        clearTimeout(reconnectTimer)
    })

    ws.on('message', (data) => {
        try {
            const msg = JSON.parse(data)
            if (msg.type === 'state-update') {
                sendToRenderer('state-update', msg.data)
            }
        } catch (e) {
            console.error('WS parse error:', e)
        }
    })

    ws.on('close', () => {
        sendToRenderer('connection-status', { connected: false })
        reconnectTimer = setTimeout(() => connect(ip, port), 3000)
    })

    ws.on('error', (err) => {
        console.error('WS error:', err)
        sendToRenderer('connection-status', { connected: false, error: err.message })
    })
}

export function disconnect() {
    clearTimeout(reconnectTimer)
    if (ws) {
        ws.removeAllListeners()
        ws.close()
        ws = null
    }
}

function sendToRenderer(channel, data) {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(channel, data)
    }
}