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

// ── Staff portal (Slice 2 — login issues a personal token) ───────────────────
export const rotaLogin = (email, password) => call({ action: 'login', email, password })
export const rotaMe = (token) => call({ action: 'me', token })
