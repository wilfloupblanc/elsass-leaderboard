import { useEffect, useState } from 'react'
import { CategoryColumn } from '../../components/CategoryColumn/index.jsx'
import elsassLogo from '@/assets/elsass-logo.png'
import './DisplayView.scss'

export const DisplayView = ({ state }) => {
    const circuits = state?.circuits || {}
    const settings = state?.settings || { slideDuration: 10 }
    const [currentIndex, setCurrentIndex] = useState(0)
    const circuitList = Object.keys(circuits)
    const currentCircuit = circuitList[currentIndex]
    const currentData = circuits[currentCircuit]
    const activeCategories = currentData?.activeCategories ?? []
    const vehicles = state?.vehicles || {}

    useEffect(() => {
        if (circuitList.length <= 1) return
        const interval = setInterval(() => {
            setCurrentIndex(i => (i + 1) % circuitList.length)
        }, settings.slideDuration * 1000)
        return () => clearInterval(interval)
    }, [circuitList.length, settings.slideDuration])

    if (!currentCircuit) {
        return (
            <main className="leaderboard leaderboard--empty">
                <p>Aucun circuit configuré.</p>
            </main>
        )
    }

    return (
        <main className="leaderboard">
            <section className="leaderboard__header">
                <article className="leaderboard__title">
                    <h1>Meilleurs</h1>
                    <h1>Temps</h1>
                </article>
                <article className="leaderboard__logo">
                    <img src={elsassLogo} alt="Elsass Simracing" className="leaderboard__logo-img" />
                </article>
                <article className="leaderboard__circuit">
                    {currentData?.trackImage && (
                        <img
                            className="leaderboard__track-img"
                            src={`${state?.serverUrl}/circuits/${currentData.trackImage}`}
                            alt={currentCircuit}
                        />
                    )}
                    <h2 className="leaderboard__circuit-name">{currentCircuit}</h2>
                </article>
            </section>

            <section className="leaderboard__categories">
                {activeCategories.length > 0 ? (
                    activeCategories.map(cat => (
                        <CategoryColumn
                            key={cat}
                            category={cat}
                            entries={currentData?.[cat] || []}
                            vehicleImage={vehicles[cat]?.vehicleImage}
                            serverUrl={state?.serverUrl}
                        />
                    ))
                ) : (
                    <p className="leaderboard__no-categories">Aucune catégorie active pour ce circuit.</p>
                )}
            </section>

            <section className="leaderboard__footer">
                {circuitList.map((name, i) => (
                    <span
                        key={name}
                        className={`leaderboard__dot ${i === currentIndex ? 'leaderboard__dot--active' : ''}`}
                    />
                ))}
            </section>
        </main>
    )
}