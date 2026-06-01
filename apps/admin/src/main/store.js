import { app } from 'electron'
import fs from 'fs'
import path from 'path'

const DATA_DIR = app.isPackaged
    ? path.join(process.resourcesPath, 'data')
    : path.join(process.cwd(), 'data')

const CIRCUITS_DIR = path.join(DATA_DIR, 'circuits')
const DB_PATH = path.join(DATA_DIR, 'leaderboard.json')

const DEFAULT_DB = {
    settings: {
        slideDuration: 10,
        adminPassword: 'elsass'
    },
    circuits: {}
}

export function initStore() {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
    if (!fs.existsSync(CIRCUITS_DIR)) fs.mkdirSync(CIRCUITS_DIR, { recursive: true })
    if (!fs.existsSync(DB_PATH)) {
        fs.writeFileSync(DB_PATH, JSON.stringify(DEFAULT_DB, null, 2), 'utf-8')
    }
}

export function readDB() {
    try {
        return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'))
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