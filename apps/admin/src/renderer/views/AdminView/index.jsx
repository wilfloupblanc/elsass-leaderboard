import { useState, useEffect } from 'react'
import {useDispatch, useSelector} from 'react-redux'
import './AdminView.scss'
import {setDB} from "@/store/leaderboardSlice.js"
import elsassLogo from '@/assets/elsass-logo.png'

export const AdminView = ({ isUnlocked, setIsUnlocked }) => {
    const { circuits, settings } = useSelector(state => state.leaderboard)
    const [newCircuitName, setNewCircuitName] = useState('')
    const [selectedCircuit, setSelectedCircuit] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('hypercar')
    const [entryName, setEntryName] = useState('')
    const [entryCar, setEntryCar] = useState('')
    const [entryYear, setEntryYear] = useState('')
    const [entryTime, setEntryTime] = useState('')
    const [slideDuration, setSlideDuration] = useState(settings.slideDuration)
    const [adminPassword, setAdminPassword] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [modalPassword, setModalPassword] = useState('')
    const [pendingAction, setPendingAction] = useState(null)
    const [serverInfo, setServerInfo] = useState({ ip: '', port: '' })
    const dispatch = useDispatch()

    useEffect(() => {
        Promise.all([window.api.getLocalIP(), window.api.getServerPort()])
            .then(([ip, port]) => setServerInfo({ ip, port }))
    }, [])

    const circuitList = Object.keys(circuits)

    const requireAuth = (action) => {
        if (isUnlocked) {
            action()
        } else {
            setPendingAction(() => action)
            setShowModal(true)
        }
    }

    const handleAddCircuit = () => requireAuth(async () => {
        if (!newCircuitName.trim()) return
        const db = await window.api.addCircuit(newCircuitName.trim())
        if (!db.error) { dispatch(setDB(db)); setNewCircuitName('') }
    })

    const handleDeleteCircuit = (name) => requireAuth(async () => {
        const db = await window.api.deleteCircuit(name)
        if (!db.error) dispatch(setDB(db))
    })

    const handleAddEntry = () => requireAuth(async () => {
        if (!selectedCircuit || !entryName.trim() || !entryTime.trim()) return
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

    const handleSaveSettings = () => requireAuth(async () => {
        const db = await window.api.updateSettings({
            slideDuration: Number(slideDuration),
            adminPassword: adminPassword || settings.adminPassword
        })
        if (!db.error) { dispatch(setDB(db)); setAdminPassword('') }
    })

    const handleUploadImage = (circuitName) => requireAuth(async () => {
        const filePath = await window.api.openFileDialog()
        if (!filePath) return
        const fileName = filePath.split('/').pop()
        const db = await window.api.uploadTrackImage(circuitName, filePath, fileName)
        if (!db.error) dispatch(setDB(db))
    })

    const handleModalSubmit = async () => {
        const ok = await window.api.checkPassword(modalPassword)
        if (ok) {
            setIsUnlocked(true)
            setShowModal(false)
            setModalPassword('')
            if (pendingAction) {
                pendingAction()
                setPendingAction(null)
            }
        } else {
            setModalPassword('')
        }
    }

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
                                <span className="admin__circuit-name">{name}</span>
                                <div className="admin__circuit-actions">
                                    <button className="admin__btn admin__btn--secondary" onClick={() => handleUploadImage(name)}>
                                        Upload image tracé
                                    </button>
                                    <button
                                        className="admin__btn admin__btn--danger"
                                        onClick={() => handleDeleteCircuit(name)}
                                    >
                                        Supprimer
                                    </button>
                                </div>
                                <div className="admin__circuit-entries">
                                    {['hypercar', 'f1', 'gt3'].map(cat => (
                                        <div key={cat} className="admin__entries-category">
                                            <h3 className="admin__entries-category-title">{cat.toUpperCase()}</h3>
                                            <ul className="admin__entries-list">
                                                {circuits[name][cat].map((entry, i) => (
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
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="admin__row">
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
                            >
                                <option value="hypercar">Hypercar</option>
                                <option value="f1">Formula 1</option>
                                <option value="gt3">GT3</option>
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
                            <button className="admin__btn admin__btn--primary" onClick={handleAddEntry}>
                                Ajouter le temps
                            </button>
                        </div>
                    </article>

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

                {showModal &&
                    <section className="admin__modal">
                        <article className="admin__modal-content">
                            <label className="admin__label">Mot de passe administrateur</label>
                            <input
                                className="admin__input"
                                type="password"
                                value={modalPassword}
                                onChange={e => setModalPassword(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleModalSubmit()}
                            />
                            <div className="admin__modal-actions">
                                <button className="admin__btn admin__btn--primary" onClick={handleModalSubmit}>
                                    Valider
                                </button>
                                <button className="admin__btn admin__btn--secondary" onClick={() => { setShowModal(false); setModalPassword('') }}>
                                    Annuler
                                </button>
                            </div>
                        </article>
                    </section>
                }
            </main>
        </>
    )
}