// "Help us open" portal API — talks to the `help-out` Supabase edge function.
//   signup  : public — creates the helper, auto-assigns tasks, emails them.
//   admin   : SEND_SECRET-gated — the /ops Help Out board reads sign-ups + jobs.
import { SUPABASE_URL, SEND_SECRET } from '../marketing/data/backend.js'

export const HELP_FN_URL = `${SUPABASE_URL}/functions/v1/help-out`

// The shareable link to give friends. Works on whatever domain this is served
// from (team.nodice.bar/helpout), so there's no host to keep in sync.
export const helpLink = () =>
  (typeof window !== 'undefined' ? window.location.origin : 'https://team.nodice.bar') + '/helpout'

async function call(payload) {
  const res = await fetch(HELP_FN_URL, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`)
  return data
}

// Public sign-up. shifts = [{date,start,end}]. Returns { ok, pending, token }.
export const submitHelper = ({ name, phone, email, categories, skill, shifts, note }) =>
  call({ action: 'signup', name, phone, email, categories, skill, shifts, note })

// Public — anonymised claimed shifts so the popup can grey out full slots.
export const helpAvailability = () => call({ action: 'availability' })

// A helper's private job-list link (from their token).
export const helperLink = (token) =>
  (typeof window !== 'undefined' ? window.location.origin : 'https://team.nodice.bar') + '/helpout?t=' + encodeURIComponent(token || '')

// ── Helper portal (authed by the helper's private token, no secret) ──────────
export const helperLoad = (token) => call({ action: 'myload', token })
export const helperMarkDone = (token, taskId) => call({ action: 'markdone', token, taskId })
export const helperUndone = (token, taskId) => call({ action: 'undone', token, taskId })
export const helperHandBack = (token, taskId) => call({ action: 'handback', token, taskId })

// Admin (gated /ops). Returns { tasks, helpers, stats }.
export const helpAdmin = () => call({ action: 'admin', secret: SEND_SECRET })

// Admin — put a task back in the pool. Pass helperId to remove it from just
// that person (e.g. a recurring job); omit to clear it from everyone.
export const helpRelease = (taskId, helperId) => call({ action: 'release', secret: SEND_SECRET, taskId, helperId })

// Admin — allocate a task to a helper (optionally for a specific shift date).
export const helpAssign = (helperId, taskId, shift) => call({ action: 'assign', secret: SEND_SECRET, helperId, taskId, shift })

// Admin — edit a job. patch = {difficulty?, recurring?, title?, detail?}.
export const helpTaskMeta = (taskId, patch) => call({ action: 'taskmeta', secret: SEND_SECRET, taskId, ...patch })

// Admin — cancel/delete a whole sign-up (e.g. clear a test request).
export const helpDeleteHelper = (helperId) => call({ action: 'deletehelper', secret: SEND_SECRET, helperId })

// Admin — confirm a helper's jobs and email them the final list.
export const helpConfirm = (helperId) => call({ action: 'confirm', secret: SEND_SECRET, helperId })

// Admin — sign off a helper-completed job (→ completed), or reopen it.
export const helpApprove = (helperId, taskId) => call({ action: 'approve', secret: SEND_SECRET, helperId, taskId })
export const helpReopen = (helperId, taskId) => call({ action: 'reopen', secret: SEND_SECRET, helperId, taskId })

// Admin — set the "max at once" cap. Pass date=null for the global default,
// or a 'YYYY-MM-DD' to override one busy day.
export const helpSetCap = (date, cap) => call({ action: 'setcap', secret: SEND_SECRET, date: date || null, cap })
