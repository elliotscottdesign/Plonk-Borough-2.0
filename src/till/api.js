// Client for the `till` edge function (slice 1 — read-only catalogue costs).
// Mirrors src/ops/barApi.js: one call() with the shared secret.
import { SUPABASE_URL, SEND_SECRET } from '../marketing/data/backend.js'

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
