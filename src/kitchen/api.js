// No Dice — Kitchen food-safety API. Rides the existing `rota` edge function
// (reuses its staff-token auth + SEND_SECRET admin gate + Resend mailer).
import { SUPABASE_URL, SEND_SECRET } from '../marketing/data/backend.js'

const FN_URL = `${SUPABASE_URL}/functions/v1/rota`

async function call(payload) {
  const res = await fetch(FN_URL, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`)
  return data
}

// ── Staff (token-authed — kitchen crew on shift) ─────────────────────────────
export const kitchenGetDay = (token, date) => call({ action: 'kitchenGetDay', token, date })
export const kitchenSaveRun = (token, { date, cadence, entries, submit, shiftId }) =>
  call({ action: 'kitchenSaveRun', token, date, cadence, entries, submit, shiftId })

// ── Manager (founder, SEND_SECRET-gated — /ops Kitchen) ──────────────────────
export const kitchenRuns = (days) => call({ action: 'kitchenRuns', secret: SEND_SECRET, days })
export const kitchenReview = (runId, note) => call({ action: 'kitchenReview', secret: SEND_SECRET, runId, note })
export const kitchenGetMatrix = () => call({ action: 'kitchenGetMatrix', secret: SEND_SECRET })
export const kitchenSaveMatrix = (dish, allergens, notes) => call({ action: 'kitchenSaveMatrix', secret: SEND_SECRET, dish, allergens, notes })
// notify:true actually emails management (the pg_cron sweep uses that); the /ops
// button calls it read-only so a mid-shift click can't fire a false alert.
export const kitchenCheckMissed = (date, notify = false) => call({ action: 'kitchenCheckMissed', secret: SEND_SECRET, date, notify })
