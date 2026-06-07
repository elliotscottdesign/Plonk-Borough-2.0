import { useState, useEffect } from 'react'
import { WINDSOR_FEED_URL, WINDSOR_CONNECTED } from './data/windsor.js'

// Fetches the Windsor.ai feed once (if a URL is configured). Returns a flat
// metrics object keyed by the `key`s in MARKETING_SECTIONS. Until a URL is set,
// returns { connected:false } and the UI renders the scaffold + connect steps.
export function useWindsorFeed() {
  const [state, setState] = useState({ connected: WINDSOR_CONNECTED, loading: WINDSOR_CONNECTED, data: null, error: null })
  useEffect(() => {
    if (!WINDSOR_FEED_URL) return
    let alive = true
    setState(s => ({ ...s, loading: true }))
    fetch(WINDSOR_FEED_URL)
      .then(r => r.json())
      .then(d => alive && setState({ connected: true, loading: false, data: d, error: null }))
      .catch(e => alive && setState({ connected: true, loading: false, data: null, error: String(e) }))
    return () => { alive = false }
  }, [])
  return state
}
