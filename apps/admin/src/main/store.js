import { app } from 'electron'
import fs from 'fs'
import path from 'path'

const DATA_DIR = app.isPackaged
    ? path.join(app.getPath('userData'), 'data')
    : path.join(process.cwd(), 'data')
const CIRCUITS_DIR = path.join(DATA_DIR, 'circuits')
const VEHICLES_DIR = path.join(DATA_DIR, 'vehicles')
const DB_PATH = path.join(DATA_DIR, 'leaderboard.json')

const DEFAULT_DB = {
    settings: {
        slideDuration: 10,
        adminPassword: 'elsass'
    },
    circuits: {},
    vehicles: {}
}

export function initStore() {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
    if (!fs.existsSync(CIRCUITS_DIR)) fs.mkdirSync(CIRCUITS_DIR, { recursive: true })
    if (!fs.existsSync(VEHICLES_DIR)) fs.mkdirSync(VEHICLES_DIR, { recursive: true })
    if (!fs.existsSync(DB_PATH)) {
        fs.writeFileSync(DB_PATH, JSON.stringify(DEFAULT_DB, null, 2), 'utf-8')
    }
}

export function readDB() {
    try {
        const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'))
        const vehicleKeys = Object.keys(db.vehicles ?? {})
        Object.keys(db.circuits ?? {}).forEach(circuitName => {
            const circuit = db.circuits[circuitName]
            // Ajoute activeCategories si manquant
            if (!Array.isArray(circuit.activeCategories)) {
                circuit.activeCategories = []
            }
            // Ajoute les tableaux d'entrées pour les catégories manquantes
            vehicleKeys.forEach(cat => {
                if (!Array.isArray(circuit[cat])) {
                    circuit[cat] = []
                }
            })
        })
        return db
    } catch {
        return structuredClone(DEFAULT_DB)
    }
}

export function writeDB(data) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8')
}

export function getCircuitsDir() {
    return CIRCUITS_DIR
}

export function getVehiclesDir() {
    return VEHICLES_DIR
}