// No Dice — tip payout record (finance lane). Talks to the `finance` function.
//
// Why this exists: the Employment (Allocation of Tips) Act 2023 requires tips
// to be passed on in full by the end of the month AFTER they were earned, and
// requires the employer to be able to SHOW it happened. The amounts were always
// known — see src/finance/tipsData.js — but until now there was no record that
// anyone had actually been paid.
//
// Two separate facts, kept apart on purpose: the employer's record that money
// was handed over, and the staff member's own acknowledgement that they got it.
// One person's word is a claim; both is a record.
import { SUPABASE_URL, SEND_SECRET } from '../marketing/data/backend.js'

const FN_URL = `${SUPABASE_URL}/functions/v1/finance`

async function call(payload) {
  const res = await fetch(FN_URL, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`)
  return data
}

// ── Founder (/ops Finances) ────────────────────────────────────────────────
export const tipsLedger = () => call({ action: 'tipsLedger', secret: SEND_SECRET })

/** The amounts come from tipsData.js — the server records payment, it doesn't
 *  recompute what's owed. */
export const tipMarkPaid = ({ staffId, staffName, month, amount, method = 'bank', note = '' }) =>
  call({ action: 'tipMarkPaid', secret: SEND_SECRET, staffId, staffName, month, amount, method, note })

export const tipUnmarkPaid = (id) => call({ action: 'tipUnmarkPaid', secret: SEND_SECRET, id })

// ── Staff (their own tips only, via their rota token) ──────────────────────
export const tipsMine = (token) => call({ action: 'tipsMine', token })
export const tipConfirm = (token, month) => call({ action: 'tipConfirm', token, month })
