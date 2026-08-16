// Food orders API — talks to the `food-order` edge function. The kitchen display
// (founder/ops, SEND_SECRET-gated) lists live orders + advances their status;
// marking an order READY makes the function send the "food ready" SMS.
import { SUPABASE_URL, SEND_SECRET } from '../marketing/data/backend.js'

const FN_URL = `${SUPABASE_URL}/functions/v1/food-order`

async function call(payload) {
  const res = await fetch(FN_URL, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`)
  return data
}

// Kitchen display (staff on the /ops Kitchen tab)
export const listOrders = () => call({ action: 'listOrders', secret: SEND_SECRET })
export const listHistory = () => call({ action: 'listHistory', secret: SEND_SECRET })
export const setOrderStatus = (id, status, by) => call({ action: 'setStatus', secret: SEND_SECRET, id, status, by })

// Called by the customer order page after payment (built next, in the customer site)
export const createOrder = ({ name, phone, items, total_pence, payment_ref, allergen_note, voucher_code }) =>
  call({ action: 'createOrder', name, phone, items, total_pence, payment_ref, allergen_note, voucher_code })
