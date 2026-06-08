import { WebSocketServer } from 'ws'
import { createServer } from 'http'
import express from 'express'
import os from 'os'
import { readDB, getCircuitsDir, getVehiclesDir } from './store.js'

let wss = null
let httpServer = null

function getLocalIP() {
    const interfaces = os.networkInterfaces()
    for (const iface of Object.values(interfaces)) {
        for (const alias of iface) {
            if (alias.family === 'IPv4' && !alias.internal) {
                return alias.address
            }
        }
    }
    return '127.0.0.1'
}

function buildMessage(db, port) {
    const ip = getLocalIP()
    return JSON.stringify({
        type: 'state-update',
        data: { ...db, serverUrl: `http://${ip}:${port}` }
    })
}

export function startServer(port = 3001) {
    const expressApp = express()
    expressApp.use('/circuits', express.static(getCircuitsDir()))
    expressApp.use('/vehicles', express.static(getVehiclesDir()))

    httpServer = createServer(expressApp)
    wss = new WebSocketServer({ server: httpServer })

    wss.on('connection', (ws) => {
        const db = readDB()
        ws.send(buildMessage(db, port))
        ws.on('error', (err) => console.error('WS error:', err))
    })

    httpServer.listen(port, '0.0.0.0', () => {
        console.log(`Server listening on port ${port}`)
    })
}

export function broadcast(db) {
    if (!wss) return
    const port = httpServer.address()?.port || 3001
    const msg = buildMessage(db, port)
    wss.clients.forEach(client => {
        if (client.readyState === 1) client.send(msg)
    })
}

export function stopServer() {
    if (wss) wss.close()
    if (httpServer) httpServer.close()
}