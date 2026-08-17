// Client for the `bar` edge function (stock, cost, margin, ordering).
// Mirrors the shape of src/kitchen/api.js — one call() with the shared secret,
// and the staff token when the person is signed in through the rota portal.
import { API_URL, SEND_SECRET } from '../marketing/data/backend.js'

const FN = API_URL.replace(/\/functions\/v1\/.*$/, '/functions/v1/bar')

const staffToken = () => {
  try { return localStorage.getItem('ndb_rota_token') || sessionStorage.getItem('ndb_rota_token') || '' }
  catch { return '' }
}

async function call(body) {
  const res = await fetch(FN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret: SEND_SECRET, token: staffToken(), ...body }),
  })
  let data = {}
  try { data = await res.json() } catch { /* non-JSON = server error below */ }
  if (!res.ok || data.ok === false) throw new Error(data.error || `Bar service error (${res.status})`)
  return data
}

export const barCatalogue     = ()                       => call({ action: 'catalogue' })
export const barSummary       = ()                       => call({ action: 'summary' })
export const barOpenStocktake = (date, area)             => call({ action: 'openStocktake', date, area })
export const barSaveCount     = (sheetId, productId, qty, note) => call({ action: 'saveCount', sheetId, productId, qty, note })
export const barSubmitSheet   = (sheetId)                => call({ action: 'submitSheet', sheetId })
export const barDraftOrders   = ()                       => call({ action: 'draftOrders' })
export const barLogWaste      = (productId, qty, reason, note) => call({ action: 'logWaste', productId, qty, reason, note })
export const barSaveProduct   = (patch)                  => call({ action: 'saveProduct', ...patch })
