// No Dice — receipts API (finance lane). Talks to the `finance` edge function.
//
// Photo upload is two hops on purpose: ask the function for a one-shot signed
// URL, then PUT the file straight to storage. The image never travels through
// the function, and the browser never holds a key that could read the bucket.
import { SUPABASE_URL, SEND_SECRET } from '../marketing/data/backend.js'

const FN_URL = `${SUPABASE_URL}/functions/v1/finance`

async function call(payload) {
  const res = await fetch(FN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret: SEND_SECRET, ...payload }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`)
  return data
}

export const receiptsList    = (days = 90) => call({ action: 'receiptsList', days })
export const receiptsSummary = (days = 90) => call({ action: 'receiptSummary', days })
export const receiptsStaff   = ()          => call({ action: 'receiptStaff' })
export const receiptAdd      = (r)         => call({ action: 'receiptAdd', ...r })
export const receiptUpdate   = (id, patch) => call({ action: 'receiptUpdate', id, ...patch })
export const receiptVoid     = (id)        => call({ action: 'receiptVoid', id })

/** Upload a photo and return the storage path to save against the receipt. */
export async function uploadReceiptImage(file) {
  const { path, token } = await call({ action: 'receiptUploadUrl', filename: file.name || 'receipt.jpg' })
  const url = `${SUPABASE_URL}/storage/v1/object/upload/sign/receipts/${path}?token=${token}`
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    body: file,
  })
  if (!res.ok) throw new Error(`Photo upload failed (${res.status})`)
  return path
}

// How each category is treated, kept next to the code that writes it so the
// screen and the books can't drift apart. Codes are the Xero chart of accounts.
export const CATEGORIES = [
  { key: 'business',      label: 'Business',        code: null,  hint: 'Normal supplier spend — stock, repairs, kit.' },
  { key: 'staff_welfare', label: 'Staff welfare',   code: '481', hint: 'Food or drink bought for the team. Allowable, VAT reclaimable once registered.' },
  { key: 'personal',      label: 'Personal',        code: '835', hint: "Your own coffee or lunch. Not a company cost — goes to your director's loan." },
  { key: 'competitor',    label: 'Competitor check', code: '476', hint: 'Their product, bought to compare. Needs their item and price to count.' },
]

export const categoryOf = (key) => CATEGORIES.find(c => c.key === key) || CATEGORIES[0]
