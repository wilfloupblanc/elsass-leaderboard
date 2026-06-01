import { useState, useEffect } from 'react'
import elsassLogo from '@/assets/elsass-logo.png'
import './ConnectView.scss'

export const ConnectView = ({ setConnected }) => {
    const [ip, setIp] = useState('')
    const [port, setPort] = useState('3001')
    const [status, setStatus] = useState('idle')

    useEffect(() => {
        const handler = ({ connected }) => {
            if (connected) {
                setStatus('connected')
                setConnected(true)
            } else {
                setStatus('error')
            }
        }
        window.api.onConnectionStatus(handler)
        return () => window.api.offConnectionStatus(handler)
    }, [setConnected])

    const handleConnect = () => {
        if (!ip.trim()) return
        setStatus('connecting')
        window.api.connect(ip.trim(), parseInt(port))
    }

    return (
        <main className="connect">
            <img src={elsassLogo} alt="Elsass Simracing" className="connect__logo" />
            <div className="connect__card">
                <h1 className="connect__title">Connexion au serveur</h1>
                <div className="connect__form">
                    <input
                        className="connect__input"
                        type="text"
                        placeholder="Adresse IP (ex: 192.168.1.10)"
                        value={ip}
                        onChange={e => setIp(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleConnect()}
                    />
                    <input
                        className="connect__input"
                        type="text"
                        placeholder="Port (défaut: 3001)"
                        value={port}
                        onChange={e => setPort(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleConnect()}
                    />
                    <button
                        className={`connect__btn ${status === 'connecting' ? 'connect__btn--loading' : ''}`}
                        onClick={handleConnect}
                        disabled={status === 'connecting'}
                    >
                        {status === 'connecting' ? 'Connexion...' : 'Se connecter'}
                    </button>
                </div>
                {status === 'error' && (
                    <p className="connect__error">Impossible de se connecter au serveur.</p>
                )}
                {status === 'disconnected' && (
                    <p className="connect__error">Connexion perdue. Reconnexion en cours...</p>
                )}
            </div>
        </main>
    )
}