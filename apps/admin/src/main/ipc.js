import { ipcMain } from 'electron'
import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { readDB, writeDB, getCircuitsDir } from './store.js'
import { broadcast } from './server.js'

function timeToMs(time) {
    const match = time.match(/^(\d+):(\d{2})\.(\d{3})$/)
    if (!match) return Infinity
    const [, m, s, ms] = match
    return parseInt(m) * 60000 + parseInt(s) * 1000 + parseInt(ms)
}

export function registerIpcHandlers() {
    ipcMain.handle('get-db', () => readDB())

    ipcMain.handle('update-settings', (_, settings) => {
        const db = readDB()
        db.settings = { ...db.settings, ...settings }
        writeDB(db)
        broadcastUpdate()
        return db
    })

    ipcMain.handle('check-password', (_, password) => {
        const db = readDB()
        return db.settings.adminPassword === password
    })

    ipcMain.handle('add-circuit', (_, { name }) => {
        const db = readDB()
        if (db.circuits[name]) return { error: 'Ce circuit existe déjà.' }
        db.circuits[name] = { trackImage: null, hypercar: [], f1: [], gt3: [] }
        writeDB(db)
        broadcastUpdate()
        return db
    })

    ipcMain.handle('delete-circuit', (_, { name }) => {
        const db = readDB()
        if (!db.circuits[name]) return { error: 'Circuit introuvable.' }
        const img = db.circuits[name].trackImage
        if (img) {
            const imgPath = path.join(getCircuitsDir(), img)
            if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath)
        }
        delete db.circuits[name]
        writeDB(db)
        broadcastUpdate()
        return db
    })

    ipcMain.handle('upload-track-image', (_, { circuitName, filePath, fileName }) => {
        const db = readDB()
        if (!db.circuits[circuitName]) return { error: 'Circuit introuvable.' }
        const ext = path.extname(fileName)
        const safeName = circuitName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + ext
        const destPath = path.join(getCircuitsDir(), safeName)
        fs.copyFileSync(filePath, destPath)
        db.circuits[circuitName].trackImage = safeName
        writeDB(db)
        broadcastUpdate()
        return db
    })

    ipcMain.handle('add-entry', (_, { circuitName, category, entry }) => {
        const db = readDB()
        const cat = db.circuits[circuitName]?.[category]
        if (!cat) return { error: 'Circuit ou catégorie introuvable.' }
        const newEntry = {
            id: uuidv4(),
            name: entry.name.trim(),
            car: entry.car?.trim() || null,
            year: entry.year?.trim() || null,
            time: entry.time.trim(),
            timeMs: timeToMs(entry.time.trim())
        }
        cat.push(newEntry)
        cat.sort((a, b) => a.timeMs - b.timeMs)
        db.circuits[circuitName][category] = cat.slice(0, 10)
        writeDB(db)
        broadcastUpdate()
        return db
    })

    ipcMain.handle('delete-entry', (_, { circuitName, category, id }) => {
        const db = readDB()
        const cat = db.circuits[circuitName]?.[category]
        if (!cat) return { error: 'Circuit ou catégorie introuvable.' }
        db.circuits[circuitName][category] = cat.filter(e => e.id !== id)
        writeDB(db)
        broadcastUpdate()
        return db
    })
}

function broadcastUpdate() {
    const db = readDB()
    broadcast(db)
}