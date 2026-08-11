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
export const tournAddWalkup = (runId, d) => call({ action: 'addWalkup', runId, name: d.name, email: d.email, phone: d.phone, partnerName: d.partnerName, partnerEmail: d.partnerEmail })   // full sign-up + emailed Stripe pay link
export const tournRename = (participantId, name) => call({ action: 'renameParticipant', participantId, name })
// Mid-tournament substitution — cascades the new name across every historic
// match AND flags the slot so the original player earns no league points.
export const tournReplace = (participantId, name) => call({ action: 'replacePlayer', participantId, name })
export const tournRemove = (participantId) => call({ action: 'removeParticipant', participantId })
export const tournRestore = (participantId) => call({ action: 'restoreParticipant', participantId })
export const tournDeleteRun = (runId) => call({ action: 'deleteRun', runId })

// Slice 2 — Swiss rounds + standings.
export const tournStartRounds = (runId) => call({ action: 'startRounds', runId })
export const tournNextRound = (runId) => call({ action: 'generateNextRound', runId })
export const tournEnterScore = (matchId, p1_score, p2_score) => call({ action: 'enterScore', matchId, p1_score, p2_score })
export const tournEnterGames = (matchId, games) => call({ action: 'enterScore', matchId, games })   // best-of-3 final / 3rd-place
export const tournClearScore = (matchId) => call({ action: 'clearScore', matchId })
export const tournDeleteLastRound = (runId) => call({ action: 'deleteLastRound', runId })

// Slice 3 — knockout bracket.
export const tournStartKnockout = (runId, thirdPlace, raceTo, finalBestOf3) => call({ action: 'startKnockout', runId, thirdPlace, raceTo, finalBestOf3 })

// Slice 4 — vouchers + league + grand final.
export const tournGetLeague = (discipline) => call({ action: 'getLeague', discipline })      // public read (secret harmless)
export const tournFinalize = (runId) => call({ action: 'finalize', runId })                  // re-run voucher emails
export const tournListVouchers = () => call({ action: 'listVouchers' })                        // all prize vouchers + redemption state
export const tournRedeemVoucher = (voucherId, by) => call({ action: 'redeemVoucher', voucherId, by })   // one-shot: locks the code
export const tournUnredeemVoucher = (voucherId) => call({ action: 'unredeemVoucher', voucherId })       // undo a mis-tap
export const tournSeedFromLeague = (runId) => call({ action: 'seedFromLeague', runId })       // grand final: add league top-8
// Flip THIS night's discipline (e.g. doubles → singles) when not enough
// teams show up. Points still accrue to the league — just the OTHER league.
// Pass null to revert to the tournament's original type.
export const tournSetDiscipline = (runId, discipline) => call({ action: 'setDiscipline', runId, discipline })
