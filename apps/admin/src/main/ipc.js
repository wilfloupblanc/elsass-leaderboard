import { ipcMain } from 'electron'
import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { readDB, writeDB, getCircuitsDir, getVehiclesDir } from './store.js'
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
        const categories = Object.keys(db.vehicles).reduce((acc, cat) => {
            acc[cat] = []
            return acc
        }, {})
        db.circuits[name] = { trackImage: null, activeCategories: [], ...categories }
        writeDB(db)
        broadcastUpdate()
        return db
    })

    ipcMain.handle('add-vehicle', (_, { name }) => {
        const db = readDB()
        if (db.vehicles[name]) return { error: 'Cette catégorie de véhicule existe déjà' }
        db.vehicles[name] = { vehicleImage: null }
        Object.keys(db.circuits).forEach(circuitName => {
            if (!db.circuits[circuitName][name]) {
                db.circuits[circuitName][name] = []
            }
        })
        writeDB(db)
        broadcastUpdate()
        return db
    })

    ipcMain.handle('delete-vehicle', (_, { name }) => {
        const db = readDB()
        if (!db.vehicles[name]) return { error: 'Catégorie introuvable.' }
        delete db.vehicles[name]
        Object.keys(db.circuits).forEach(circuitName => {
            delete db.circuits[circuitName][name]
            const active = db.circuits[circuitName].activeCategories ?? []
            db.circuits[circuitName].activeCategories = active.filter(c => c !== name)
        })
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

    ipcMain.handle('toggle-circuit-category', (_, { circuitName, cat }) => {
        const db = readDB()
        const circuit = db.circuits[circuitName]
        if (!circuit) return { error: 'Circuit introuvable.' }
        const active = circuit.activeCategories ?? []
        circuit.activeCategories = active.includes(cat)
            ? active.filter(c => c !== cat)
            : [...active, cat]
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

    ipcMain.handle('upload-vehicle-image', (_, { vehicleName, filePath, fileName }) => {
        const db = readDB()
        if (!db.vehicles[vehicleName]) return { error: 'Catégorie introuvable.' }
        const ext = path.extname(fileName)
        const safeName = vehicleName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + ext
        const destPath = path.join(getVehiclesDir(), safeName)
        fs.copyFileSync(filePath, destPath)
        db.vehicles[vehicleName].vehicleImage = safeName
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