// Client for the `till` edge function (slice 1 — read-only catalogue costs).
// Mirrors src/ops/barApi.js: one call() with the shared secret.
import { SUPABASE_URL, SUPABASE_ANON_KEY, SEND_SECRET } from '../marketing/data/backend.js'

const FN = `${SUPABASE_URL}/functions/v1/till`

async function call(body) {
  const res = await fetch(FN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret: SEND_SECRET, ...body }),
  })
  let data = {}
  try { data = await res.json() } catch { /* non-JSON = server error below */ }
  if (!res.ok || data.ok === false) throw new Error(data.error || `Till service error (${res.status})`)
  return data
}

export const tillCatalogueCosts = () => call({ action: 'catalogue' })
// Today's confirmed bookings, straight from bar_reservations (same read the
// /ops Reservations tab does — anon PostgREST, read-only). "Today" is the
// venue's 8am-anchored operating day, so the door list doesn't flip at midnight.
export async function tillReservationsToday() {
  const parts = {}
  for (const p of new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hour12: false }).formatToParts(new Date())) parts[p.type] = p.value
  let day = `${parts.year}-${parts.month}-${parts.day}`
  if ((parseInt(parts.hour, 10) || 0) % 24 < 8) { const d = new Date(day + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() - 1); day = d.toISOString().slice(0, 10) }
  const res = await fetch(`${SUPABASE_URL}/rest/v1/bar_reservations?select=id,kind,start_time,party_size,name,notes&status=eq.confirmed&reservation_date=eq.${day}&order=start_time`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
  })
  if (!res.ok) throw new Error('Reservations unavailable')
  return { day, list: await res.json() }
}

// Real orders — sessions, shared floor state, payments, Z-reads.
export const tillDayState = () => call({ action: 'dayState' })
export const tillHQ = () => call({ action: 'hq' })
export const tillOpenDay = (by, float_pence) => call({ action: 'openDay', by, float_pence })
export const tillCloseDay = (by, counted_pence) => call({ action: 'closeDay', by, counted_pence })
export const tillSaveOrder = (order) => call({ action: 'saveOrder', order })
export const tillPayOrder = (orderId, payments, total_pence, by) => call({ action: 'payOrder', orderId, payments, total_pence, by })
export const tillVoidOrder = (orderId, reason, by) => call({ action: 'voidOrder', orderId, reason, by })

export const tillFloorGet = () => call({ action: 'floorGet' })
export const tillFloorSave = (floor) => call({ action: 'floorSave', floor })
export const tillVoucherList = () => call({ action: 'voucherList' })
export const tillVoucherLookup = (code) => call({ action: 'voucherLookup', code })
export const tillVoucherRedeem = (code, by) => call({ action: 'voucherRedeem', code, by })
export const tillVoucherUnredeem = (code) => call({ action: 'voucherUnredeem', code })

// 👤 Staff sign-in — names from the rota's staff table; events into till_events
export const tillStaffList = () => call({ action: 'staffList' })
export const tillStaffEvent = (kind, name, extra = {}) => call({ action: 'staffEvent', kind, name, ...extra })

// 💳 Square Terminal — card payments (sandbox first, production by secret swap)
export const tillSqStatus = () => call({ action: 'sqStatus' })
export const tillSqPairCode = () => call({ action: 'sqPairCode' })
export const tillSqCharge = (amount_pence, orderId, device_id) => call({ action: 'sqCharge', amount_pence, orderId, device_id })
export const tillSqCheck = (checkout_id) => call({ action: 'sqCheck', checkout_id })
export const tillSqCancel = (checkout_id) => call({ action: 'sqCancel', checkout_id })
