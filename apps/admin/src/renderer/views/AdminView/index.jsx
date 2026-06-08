import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import './AdminView.scss'
import { setDB } from '@/store/leaderboardSlice.js'
import elsassLogo from '@/assets/elsass-logo.png'

export const AdminView = ({ isUnlocked, setIsUnlocked }) => {
    const { circuits, vehicles, settings } = useSelector(state => state.leaderboard)
    const circuitList = Object.keys(circuits ?? {})
    const vehicleList = Object.keys(vehicles ?? {})

    const [newCircuitName, setNewCircuitName] = useState('')
    const [newVehicleName, setNewVehicleName] = useState('')
    const [selectedCircuit, setSelectedCircuit] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('')
    const [entryName, setEntryName] = useState('')
    const [entryCar, setEntryCar] = useState('')
    const [entryYear, setEntryYear] = useState('')
    const [entryTime, setEntryTime] = useState('')
    const [slideDuration, setSlideDuration] = useState(settings?.slideDuration ?? 10)
    const [adminPassword, setAdminPassword] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [modalPassword, setModalPassword] = useState('')
    const [pendingAction, setPendingAction] = useState(null)
    const [serverInfo, setServerInfo] = useState({ ip: '', port: '' })
    const [expandedCircuits, setExpandedCircuits] = useState({})
    const [vehiclesExpanded, setVehiclesExpanded] = useState(true)
    const dispatch = useDispatch()

    useEffect(() => {
        Promise.all([window.api.getLocalIP(), window.api.getServerPort()])
            .then(([ip, port]) => setServerInfo({ ip, port }))
    }, [])

    useEffect(() => {
        if (!selectedCircuit) { setSelectedCategory(''); return }
        const active = circuits[selectedCircuit]?.activeCategories ?? []
        setSelectedCategory(active[0] ?? '')
    }, [selectedCircuit])

    const toggleCircuit = (name) => {
        setExpandedCircuits(prev => ({ ...prev, [name]: !prev[name] }))
    }

    const requireAuth = (action) => {
        if (isUnlocked) {
            action()
        } else {
            setPendingAction(() => action)
            setShowModal(true)
        }
    }

    // ── Circuits ────────────────────────────────────────────────────────────

    const handleAddCircuit = () => requireAuth(async () => {
        if (!newCircuitName.trim()) return
        const db = await window.api.addCircuit(newCircuitName.trim())
        if (!db.error) { dispatch(setDB(db)); setNewCircuitName('') }
    })

    const handleDeleteCircuit = (name) => requireAuth(async () => {
        const db = await window.api.deleteCircuit(name)
        if (!db.error) dispatch(setDB(db))
    })

    const handleUploadTrackImage = (circuitName) => requireAuth(async () => {
        const filePath = await window.api.openFileDialog()
        if (!filePath) return
        const fileName = filePath.split('/').pop()
        const db = await window.api.uploadTrackImage(circuitName, filePath, fileName)
        if (!db.error) dispatch(setDB(db))
    })

    // ── Catégories actives par circuit ──────────────────────────────────────

    const handleToggleCategory = (circuitName, cat) => requireAuth(async () => {
        const db = await window.api.toggleCircuitCategory(circuitName, cat)
        if (!db.error) dispatch(setDB(db))
    })

    // ── Véhicules ───────────────────────────────────────────────────────────

    const handleAddVehicle = () => requireAuth(async () => {
        if (!newVehicleName.trim()) return
        const db = await window.api.addVehicle(newVehicleName.trim())
        if (!db.error) { dispatch(setDB(db)); setNewVehicleName('') }
    })

    const handleDeleteVehicle = (name) => requireAuth(async () => {
        const db = await window.api.deleteVehicle(name)
        if (!db.error) dispatch(setDB(db))
    })

    const handleUploadVehicleImage = (vehicleName) => requireAuth(async () => {
        const filePath = await window.api.openFileDialog()
        if (!filePath) return
        const fileName = filePath.split('/').pop()
        const db = await window.api.uploadVehicleImage(vehicleName, filePath, fileName)
        if (!db.error) dispatch(setDB(db))
    })

    // ── Entrées ─────────────────────────────────────────────────────────────

    const handleAddEntry = () => requireAuth(async () => {
        if (!selectedCircuit || !selectedCategory || !entryName.trim() || !entryTime.trim()) return
        const entry = {
            name: entryName,
            car: selectedCategory !== 'f1' ? entryCar : null,
            year: selectedCategory === 'f1' ? entryYear : null,
            time: entryTime
        }
        const db = await window.api.addEntry(selectedCircuit, selectedCategory, entry)
        if (!db.error) {
            dispatch(setDB(db))
            setEntryName(''); setEntryCar(''); setEntryYear(''); setEntryTime('')
        }
    })

    const handleDeleteEntry = (circuitName, category, id) => requireAuth(async () => {
        const db = await window.api.deleteEntry(circuitName, category, id)
        if (!db.error) dispatch(setDB(db))
    })

    // ── Paramètres ──────────────────────────────────────────────────────────

    const handleSaveSettings = () => requireAuth(async () => {
        const db = await window.api.updateSettings({
            slideDuration: Number(slideDuration),
            adminPassword: adminPassword || settings.adminPassword
        })
        if (!db.error) { dispatch(setDB(db)); setAdminPassword('') }
    })

    // ── Modal ───────────────────────────────────────────────────────────────

    const handleModalSubmit = async () => {
        const ok = await window.api.checkPassword(modalPassword)
        if (ok) {
            setIsUnlocked(true)
            setShowModal(false)
            setModalPassword('')
            if (pendingAction) { pendingAction(); setPendingAction(null) }
        } else {
            setModalPassword('')
        }
    }

    // ── Helpers UI ──────────────────────────────────────────────────────────

    const activeCategories = (circuitName) =>
        circuits[circuitName]?.activeCategories ?? []

    const availableCategories = selectedCircuit
        ? activeCategories(selectedCircuit)
        : []

    // ── Render ──────────────────────────────────────────────────────────────

    return (
        <>
            <header className="admin-header">
                <img src={elsassLogo} alt="Elsass Simracing" className="admin-header__logo" />
                <div className="admin-header__server">
                    <span className="admin-header__server-dot" />
                    <span className="admin-header__server-address">{serverInfo.ip}:{serverInfo.port}</span>
                </div>
            </header>

            <main className="admin">

                {/* ── Véhicules globaux ── */}
                <section className="admin__section">
                    <div className="admin__section-header">
                        <h2 className="admin__section-title">Catégories de véhicules</h2>
                        <button
                            className="admin__btn admin__btn--secondary"
                            onClick={() => setVehiclesExpanded(prev => !prev)}
                        >
                            {vehiclesExpanded ? '▲' : '▼'}
                        </button>
                    </div>

                    {vehiclesExpanded && (
                        <>
                            <article className="admin__vehicle-add">
                                <input
                                    className="admin__input"
                                    type="text"
                                    placeholder="Nom de la catégorie"
                                    value={newVehicleName}
                                    onChange={e => setNewVehicleName(e.target.value)}
                                />
                                <button className="admin__btn admin__btn--primary" onClick={handleAddVehicle}>
                                    Ajouter
                                </button>
                            </article>
                            <ul className="admin__vehicle-list">
                                {vehicleList.map(name => (
                                    <li key={name} className="admin__vehicle-item">
                                        <span className="admin__vehicle-name">{name}</span>
                                        <div className="admin__vehicle-actions">
                                            <button
                                                className="admin__btn admin__btn--secondary"
                                                onClick={() => handleUploadVehicleImage(name)}
                                            >
                                                Upload image
                                            </button>
                                            <button
                                                className="admin__btn admin__btn--danger"
                                                onClick={() => handleDeleteVehicle(name)}
                                            >
                                                Supprimer
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                </section>

                {/* ── Circuits ── */}
                <section className="admin__section">
                    <h2 className="admin__section-title">Circuits</h2>
                    <article className="admin__circuit-add">
                        <input
                            className="admin__input"
                            type="text"
                            placeholder="Nom du circuit"
                            value={newCircuitName}
                            onChange={e => setNewCircuitName(e.target.value)}
                        />
                        <button className="admin__btn admin__btn--primary" onClick={handleAddCircuit}>
                            Ajouter
                        </button>
                    </article>

                    <ul className="admin__circuit-list">
                        {circuitList.map(name => (
                            <li key={name} className="admin__circuit-item">
                                <div className="admin__circuit-header">
                                    <span className="admin__circuit-name">{name}</span>
                                    <div className="admin__circuit-actions">
                                        <button
                                            className="admin__btn admin__btn--secondary"
                                            onClick={() => handleUploadTrackImage(name)}
                                        >
                                            Upload tracé
                                        </button>
                                        <button
                                            className="admin__btn admin__btn--secondary"
                                            onClick={() => toggleCircuit(name)}
                                        >
                                            {expandedCircuits[name] ? '▲' : '▼'}
                                        </button>
                                        <button
                                            className="admin__btn admin__btn--danger"
                                            onClick={() => handleDeleteCircuit(name)}
                                        >
                                            Supprimer
                                        </button>
                                    </div>
                                </div>

                                {expandedCircuits[name] && (
                                    <div className="admin__circuit-detail">

                                        {/* Catégories actives pour ce circuit */}
                                        <div className="admin__circuit-categories">
                                            <h3 className="admin__subsection-title">Catégories actives</h3>
                                            <div className="admin__category-toggles">
                                                {vehicleList.map(cat => (
                                                    <label key={cat} className="admin__category-toggle">
                                                        <input
                                                            type="checkbox"
                                                            checked={activeCategories(name).includes(cat)}
                                                            onChange={() => handleToggleCategory(name, cat)}
                                                        />
                                                        {cat}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Entrées par catégorie active */}
                                        <div className="admin__circuit-entries">
                                            {activeCategories(name).map(cat => (
                                                <div key={cat} className="admin__entries-category">
                                                    <h3 className="admin__entries-category-title">{cat.toUpperCase()}</h3>
                                                    <ul className="admin__entries-list">
                                                        {(circuits[name][cat] ?? []).map((entry, i) => (
                                                            <li key={entry.id} className="admin__entry-item">
                                                                <span className="admin__entry-pos">{i + 1}</span>
                                                                <span className="admin__entry-name">{entry.name}</span>
                                                                <span className="admin__entry-car">{entry.car || entry.year}</span>
                                                                <span className="admin__entry-time">{entry.time}</span>
                                                                <button
                                                                    className="admin__btn admin__btn--danger"
                                                                    onClick={() => handleDeleteEntry(name, cat, entry.id)}
                                                                >
                                                                    Supprimer
                                                                </button>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ))}
                                        </div>

                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="admin__row">

                    {/* ── Ajouter un temps ── */}
                    <article className="admin__section">
                        <h2 className="admin__section-title">Ajouter un temps</h2>
                        <div className="admin__form">
                            <select
                                className="admin__select"
                                value={selectedCircuit}
                                onChange={e => setSelectedCircuit(e.target.value)}
                            >
                                <option value="">-- Circuit --</option>
                                {circuitList.map(name => (
                                    <option key={name} value={name}>{name}</option>
                                ))}
                            </select>

                            <select
                                className="admin__select"
                                value={selectedCategory}
                                onChange={e => setSelectedCategory(e.target.value)}
                                disabled={!selectedCircuit}
                            >
                                <option value="">-- Catégorie --</option>
                                {availableCategories.map(name => (
                                    <option key={name} value={name}>{name}</option>
                                ))}
                            </select>

                            <input
                                className="admin__input"
                                type="text"
                                placeholder="Nom du pilote"
                                value={entryName}
                                onChange={e => setEntryName(e.target.value)}
                            />

                            {selectedCategory === 'f1' ? (
                                <input
                                    className="admin__input"
                                    type="text"
                                    placeholder="Année (ex: 2025)"
                                    value={entryYear}
                                    onChange={e => setEntryYear(e.target.value)}
                                />
                            ) : (
                                <input
                                    className="admin__input"
                                    type="text"
                                    placeholder="Marque (ex: Ferrari)"
                                    value={entryCar}
                                    onChange={e => setEntryCar(e.target.value)}
                                />
                            )}

                            <input
                                className="admin__input"
                                type="text"
                                placeholder="Temps (ex: 1:32.456)"
                                value={entryTime}
                                onChange={e => setEntryTime(e.target.value)}
                            />

                            <button
                                className="admin__btn admin__btn--primary"
                                onClick={handleAddEntry}
                                disabled={!selectedCircuit || !selectedCategory}
                            >
                                Ajouter le temps
                            </button>
                        </div>
                    </article>

                    {/* ── Paramètres ── */}
                    <article className="admin__section">
                        <h2 className="admin__section-title">Paramètres</h2>
                        <div className="admin__form">
                            <label className="admin__label">
                                Durée d'affichage par circuit (secondes)
                                <input
                                    className="admin__input"
                                    type="number"
                                    min="5"
                                    max="60"
                                    value={slideDuration}
                                    onChange={e => setSlideDuration(e.target.value)}
                                />
                            </label>
                            <label className="admin__label">
                                Nouveau mot de passe admin
                                <input
                                    className="admin__input"
                                    type="password"
                                    placeholder="Nouveau mot de passe"
                                    value={adminPassword}
                                    onChange={e => setAdminPassword(e.target.value)}
                                />
                            </label>
                            <button className="admin__btn admin__btn--primary" onClick={handleSaveSettings}>
                                Sauvegarder
                            </button>
                        </div>
                    </article>

                </section>

                {/* ── Modal auth ── */}
                {showModal && (
                    <section className="admin__modal">
                        <article className="admin__modal-content">
                            <label className="admin__label">Mot de passe administrateur</label>
                            <input
                                className="admin__input"
                                type="password"
                                value={modalPassword}
                                onChange={e => setModalPassword(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleModalSubmit()}
                                autoFocus
                            />
                            <div className="admin__modal-actions">
                                <button className="admin__btn admin__btn--primary" onClick={handleModalSubmit}>
                                    Valider
                                </button>
                                <button
                                    className="admin__btn admin__btn--secondary"
                                    onClick={() => { setShowModal(false); setModalPassword('') }}
                                >
                                    Annuler
                                </button>
                            </div>
                        </article>
                    </section>
                )}

            </main>
        </>
    )
}