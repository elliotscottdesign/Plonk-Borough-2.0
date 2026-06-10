// "Help us open" portal API — talks to the `help-out` Supabase edge function.
//   signup  : public — creates the helper, auto-assigns tasks, emails them.
//   admin   : SEND_SECRET-gated — the /ops Help Out board reads sign-ups + jobs.
import { SUPABASE_URL, SEND_SECRET } from '../marketing/data/backend.js'

export const HELP_FN_URL = `${SUPABASE_URL}/functions/v1/help-out`

// The shareable link to give friends. Works on whatever domain this is served
// from (team.nodice.bar/help-out), so there's no host to keep in sync.
export const helpLink = () =>
  (typeof window !== 'undefined' ? window.location.origin : 'https://team.nodice.bar') + '/help-out'

async function call(payload) {
  const res = await fetch(HELP_FN_URL, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`)
  return data
}

// Public sign-up. Returns { ok, assigned:[task…], emailed:bool }.
export const submitHelper = ({ name, phone, email, categories, days, time_blocks, note }) =>
  call({ action: 'signup', name, phone, email, categories, days, time_blocks, note })

// Admin (gated /ops). Returns { tasks, helpers, stats }.
export const helpAdmin = () => call({ action: 'admin', secret: SEND_SECRET })

// Admin — put a task back in the pool.
export const helpRelease = (taskId) => call({ action: 'release', secret: SEND_SECRET, taskId })
