// No Dice Rota portal API — talks to the `rota` Supabase edge function.
//   admin  : SEND_SECRET-gated — the /ops "Rota" screen manages staff.
//   staff  : email + password login → a personal token for the staff portal.
import { SUPABASE_URL, SEND_SECRET } from '../marketing/data/backend.js'

export const ROTA_FN_URL = `${SUPABASE_URL}/functions/v1/rota`

async function call(payload) {
  const res = await fetch(ROTA_FN_URL, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`)
  return data
}

// Roles a staff member can hold (kept in sync with the edge function + data.js).
export const STAFF_ROLES = ['Bar Staff', 'Supervisor', 'Asst. Manager', 'Manager']

// ── Founder admin (gated /ops) ───────────────────────────────────────────────
export const rotaAdmin = () => call({ action: 'admin', secret: SEND_SECRET })
export const rotaAddStaff = (staff) => call({ action: 'addStaff', secret: SEND_SECRET, ...staff })
export const rotaSaveStaff = (id, patch) => call({ action: 'saveStaff', secret: SEND_SECRET, id, ...patch })
export const rotaRemoveStaff = (id) => call({ action: 'removeStaff', secret: SEND_SECRET, id })

// Rota calendar: full founder view (staff + upcoming shifts + claims) + release/assign.
export const rotaLoad = () => call({ action: 'load', secret: SEND_SECRET })
export const rotaReleaseMonth = (month, headcount) => call({ action: 'releaseMonth', secret: SEND_SECRET, month, headcount })
export const rotaOpenDay = (date, headcount) => call({ action: 'openDay', secret: SEND_SECRET, date, headcount })
export const rotaCloseShift = (shiftId) => call({ action: 'closeShift', secret: SEND_SECRET, shiftId })
export const rotaSetHeadcount = (shiftId, headcount) => call({ action: 'setHeadcount', secret: SEND_SECRET, shiftId, headcount })
export const rotaAssign = (shiftId, staffId) => call({ action: 'assignShift', secret: SEND_SECRET, shiftId, staffId })
export const rotaUnassign = (shiftId, staffId) => call({ action: 'unassignShift', secret: SEND_SECRET, shiftId, staffId })

// ── Staff portal (token-authed — login issues the token) ─────────────────────
export const rotaLogin = (email, password) => call({ action: 'login', email, password })
export const rotaMe = (token) => call({ action: 'me', token })
export const rotaMyState = (token) => call({ action: 'myState', token })
export const rotaSaveProfile = (token, patch) => call({ action: 'saveProfile', token, ...patch })
export const rotaSaveAvailability = (token, month, data) => call({ action: 'saveAvailability', token, month, data })
export const rotaClaimShift = (token, shiftId) => call({ action: 'claimShift', token, shiftId })
export const rotaReleaseShift = (token, shiftId) => call({ action: 'releaseShift', token, shiftId })
