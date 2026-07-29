// Leisure Watch API — talks to the `leisure` Supabase edge function.
// The page itself is gated behind the 888999 founder code (see App.jsx).
import { SUPABASE_URL, SEND_SECRET } from '../marketing/data/backend.js'

export const LEISURE_FN_URL = `${SUPABASE_URL}/functions/v1/leisure`

async function call(payload) {
  const res = await fetch(LEISURE_FN_URL, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`)
  return data
}

// Live board: open adult slots now + watcher on/off + recent alert history.
export const leisureLive = () => call({ action: 'live' })

// Flip the watcher on/off.
export const leisureSetEnabled = (enabled) => call({ action: 'setEnabled', enabled, secret: SEND_SECRET })
