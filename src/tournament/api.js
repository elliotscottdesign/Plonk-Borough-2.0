// No Dice pool-tournament API — talks to the `tournament` Supabase edge function.
// All actions are founder-gated by SEND_SECRET (the /ops "Tournament" screen).
import { SUPABASE_URL, SEND_SECRET } from '../marketing/data/backend.js'

const FN_URL = `${SUPABASE_URL}/functions/v1/tournament`

async function call(payload) {
  const res = await fetch(FN_URL, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, secret: SEND_SECRET }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`)
  return data
}

// Slice 1 — entrants.
export const tournList = () => call({ action: 'list' })                                   // pool nights + paid counts + run status
export const tournOpen = (tournamentId) => call({ action: 'open', tournamentId })          // create/sync a run → roster
export const tournAddManual = (runId, name) => call({ action: 'addManual', runId, name })   // add a walk-in
export const tournRename = (participantId, name) => call({ action: 'renameParticipant', participantId, name })
export const tournRemove = (participantId) => call({ action: 'removeParticipant', participantId })
export const tournRestore = (participantId) => call({ action: 'restoreParticipant', participantId })
export const tournDeleteRun = (runId) => call({ action: 'deleteRun', runId })
