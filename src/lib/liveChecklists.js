// Live checklist overrides (bar lane). Fetches founder edits from the `checklists`
// edge function and merges them OVER the built-in code defaults. If the fetch fails
// or a checklist has no override, the built-in default is used — so the live
// checklists can never break or go blank because of this layer.
import { useEffect, useState } from 'react'
import { SUPABASE_URL, SEND_SECRET } from '../marketing/data/backend.js'
import { CHECKLISTS } from '../rota/checklists.js'
import { KITCHEN_TEMPLATES } from '../kitchen/templates.js'

const FN_URL = `${SUPABASE_URL}/functions/v1/checklists`

// Fetch once per page load, shared across every component that asks.
let _cache = null
let _inflight = null
export function fetchChecklistOverrides() {
  if (_cache) return Promise.resolve(_cache)
  if (!_inflight) {
    _inflight = fetch(FN_URL, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'list' }),
    })
      .then(r => r.json())
      .then(d => { _cache = { kitchen: d.kitchen || {}, shift: d.shift || {}, meta: d.meta || {} }; return _cache })
      .catch(() => { _cache = { kitchen: {}, shift: {}, meta: {} }; return _cache })
  }
  return _inflight
}

// React hook — returns the overrides object (null until loaded). Components use it
// with effectiveShift/effectiveKitchen below; while null they get the defaults.
export function useChecklistOverrides() {
  const [ov, setOv] = useState(_cache)
  useEffect(() => {
    let live = true
    fetchChecklistOverrides().then(o => { if (live) setOv(o) })
    return () => { live = false }
  }, [])
  return ov
}

// Merge: an override replaces a whole checklist's definition by key; anything not
// overridden stays as the code default.
export const effectiveShift = (ov) => ({ ...CHECKLISTS, ...((ov && ov.shift) || {}) })
export const effectiveKitchen = (ov) => ({ ...KITCHEN_TEMPLATES, ...((ov && ov.kitchen) || {}) })

// ── Founder writes (SEND_SECRET-gated) ───────────────────────────────────────
async function call(payload) {
  const res = await fetch(FN_URL, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`)
  _cache = null; _inflight = null   // force a refetch so edits show immediately
  return data
}
export const saveChecklistDef = (system, checklist_key, def, by) =>
  call({ action: 'save', secret: SEND_SECRET, system, checklist_key, def, by })
export const resetChecklistDef = (system, checklist_key) =>
  call({ action: 'reset', secret: SEND_SECRET, system, checklist_key })
