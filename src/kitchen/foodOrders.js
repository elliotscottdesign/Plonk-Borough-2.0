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

// Pause / auto-pause / waitlist
export const getStatus = () => call({ action: 'getStatus' })                       // public
export const setSettings = (patch) => call({ action: 'setSettings', secret: SEND_SECRET, ...patch })
export const joinWaitlist = ({ phone, name }) => call({ action: 'joinWaitlist', phone, name })  // public (customer page)
export const setOrderStatus = (id, status, by) => call({ action: 'setStatus', secret: SEND_SECRET, id, status, by })
export const resendReady = (id) => call({ action: 'resendReady', secret: SEND_SECRET, id })
export const markPaidAtBar = (id) => call({ action: 'markPaidAtBar', secret: SEND_SECRET, id })
export const textCustomer = (id, message) => call({ action: 'textCustomer', secret: SEND_SECRET, id, message })

// Live menu stock (limiting ingredients) — set/replenish anytime; the customer menu reads it.
export const getStock = () => call({ action: 'getStock' })                          // public
export const setStock = (levels) => call({ action: 'setStock', secret: SEND_SECRET, levels })
export const adjustStock = (ingredient, delta) => call({ action: 'adjustStock', secret: SEND_SECRET, ingredient, delta })
export const setStockOverride = (ingredient, override) => call({ action: 'setStockOverride', secret: SEND_SECRET, ingredient, override })

// Order codes (party tabs / staff food) — kitchen manages; customer orders on them.
export const listCodes = () => call({ action: 'listCodes', secret: SEND_SECRET })
export const createCode = ({ code, label, kind }) => call({ action: 'createCode', secret: SEND_SECRET, code, label, kind })
export const setCodeActive = (code, active) => call({ action: 'setCodeActive', secret: SEND_SECRET, code, active })

// Called by the customer order page after payment (built next, in the customer site)
export const createOrder = ({ name, phone, items, total_pence, payment_ref, allergen_note, voucher_code }) =>
  call({ action: 'createOrder', name, phone, items, total_pence, payment_ref, allergen_note, voucher_code })
