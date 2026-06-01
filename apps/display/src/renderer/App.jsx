import { useState, useEffect } from 'react'
import { ConnectView } from './views/ConnectView/index.jsx'
import { DisplayView } from './views/DisplayView/index.jsx'

export const App = () => {
  const [state, setState] = useState(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const onState = (data) => setState(data)
    const onStatus = ({ connected: c }) => {
      if (!c) setConnected(false)
    }

    window.api.onStateUpdate(onState)
    window.api.onConnectionStatus(onStatus)

    return () => {
      window.api.offStateUpdate(onState)
      window.api.offConnectionStatus(onStatus)
    }
  }, [])

  return connected
      ? <DisplayView state={state} />
      : <ConnectView setConnected={setConnected} setState={setState} />
}

export default App