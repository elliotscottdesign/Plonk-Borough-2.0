// Menu catalog API — talks to the `menu` edge function. getMenu is public (the
// order page + kitchen read it); saveMenu is founder-gated (the /ops Menu editor).
import { SUPABASE_URL, SEND_SECRET } from '../marketing/data/backend.js'

const FN_URL = `${SUPABASE_URL}/functions/v1/menu`

async function call(payload) {
  const res = await fetch(FN_URL, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`)
  return data
}

export const getMenu = () => call({ action: 'getMenu' })
export const saveMenu = (sections, bundles) => call({ action: 'saveMenu', secret: SEND_SECRET, sections, bundles })
