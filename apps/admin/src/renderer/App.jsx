import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { setDB } from './store/leaderboardSlice.js'
import { AdminView } from './views/AdminView/index.jsx'

function App() {
    const dispatch = useDispatch()
    const [isUnlocked, setIsUnlocked] = useState(false)

    useEffect(() => {
        window.api.getDB().then(db => dispatch(setDB(db)))
    }, [dispatch])

    return <AdminView isUnlocked={isUnlocked} setIsUnlocked={setIsUnlocked} />
}

export default App