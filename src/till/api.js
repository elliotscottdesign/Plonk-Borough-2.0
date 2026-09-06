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

export const tillFloorGet = () => call({ action: 'floorGet' })
export const tillFloorSave = (floor) => call({ action: 'floorSave', floor })
export const tillVoucherList = () => call({ action: 'voucherList' })
export const tillVoucherLookup = (code) => call({ action: 'voucherLookup', code })
export const tillVoucherRedeem = (code, by) => call({ action: 'voucherRedeem', code, by })
export const tillVoucherUnredeem = (code) => call({ action: 'voucherUnredeem', code })
