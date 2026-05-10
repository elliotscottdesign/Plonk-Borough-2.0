// ───────────────────────────────────────────────────────────────────
// Editable rota — live, persisted state for BAR_WEEKLY_ROTA.
// ───────────────────────────────────────────────────────────────────
// Works as a thin wrapper around the read-only constant in data.js:
// on first paint we hydrate from localStorage if anything is saved,
// otherwise we fall back to the canonical BAR_WEEKLY_ROTA.
//
// The CRUD API is intentionally small + immutable so React re-renders
// see new rota object identities:
//   - addShift(day, shift)
//   - updateShift(day, idx, partial)
//   - removeShift(day, idx)
//   - moveShift(fromDay, fromIdx, toDay)         ← drag-and-drop
//   - resetRota()                                ← back to data.js
//   - setRota(nextRota)                          ← bulk replace
//
// The provider also re-derives BAR_ROTA_TOTALS-equivalent figures via
// deriveBarRotaTotals(rota) so consumers don't need to re-import the
// helper. `totals` is memoised against rota identity.
//
// Persistence: localStorage key `ndb_rota_v1`. The state is per-browser
// — there is no cross-device sync yet. If we want investors to see the
// founder's edits we'll wire this through LOCK_SYNC_URL in a follow-up,
// same pattern as the forecast lock.
// ───────────────────────────────────────────────────────────────────

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { BAR_WEEKLY_ROTA, ROTA_DAYS, deriveBarRotaTotals } from '../data.js'

const STORAGE_KEY = 'ndb_rota_v1'

const RotaCtx = createContext(null)

// Deep-clone the default rota so consumer mutations can never reach back
// into the imported constant.
function cloneRota(rota) {
  const out = {}
  for (const d of ROTA_DAYS) out[d] = (rota[d] || []).map(s => ({ ...s }))
  return out
}

// Sanity check on persisted state — must be an object, must have at
// least one of the day keys, and each shift must have start < end.
function isValidRota(r) {
  if (!r || typeof r !== 'object') return false
  if (!ROTA_DAYS.some(d => Array.isArray(r[d]))) return false
  for (const d of ROTA_DAYS) {
    const arr = r[d]
    if (arr === undefined) continue
    if (!Array.isArray(arr)) return false
    for (const s of arr) {
      if (typeof s !== 'object' || s == null) return false
      if (typeof s.start !== 'number' || typeof s.end !== 'number') return false
      if (s.end <= s.start) return false
    }
  }
  return true
}

function readPersistedRota() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!isValidRota(parsed)) return null
    // Backfill any missing day with the default — keeps shape stable.
    const out = cloneRota(BAR_WEEKLY_ROTA)
    for (const d of ROTA_DAYS) if (Array.isArray(parsed[d])) out[d] = parsed[d].map(s => ({ ...s }))
    return out
  } catch {
    return null
  }
}

function writePersistedRota(rota) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rota))
  } catch {
    // localStorage full / blocked — just lose persistence, don't crash.
  }
}

export function RotaProvider({ children }) {
  // Lazy init so we read localStorage exactly once on mount.
  const [rota, setRotaState] = useState(() => readPersistedRota() || cloneRota(BAR_WEEKLY_ROTA))

  // Persist any change.
  useEffect(() => {
    writePersistedRota(rota)
  }, [rota])

  const setRota = useCallback((next) => {
    setRotaState(cloneRota(next))
  }, [])

  const addShift = useCallback((day, shift) => {
    setRotaState(prev => {
      const next = cloneRota(prev)
      next[day] = [...(next[day] || []), { ...shift }]
      return next
    })
  }, [])

  const updateShift = useCallback((day, idx, partial) => {
    setRotaState(prev => {
      const next = cloneRota(prev)
      const arr = next[day] || []
      if (!arr[idx]) return prev
      arr[idx] = { ...arr[idx], ...partial }
      next[day] = arr
      return next
    })
  }, [])

  const removeShift = useCallback((day, idx) => {
    setRotaState(prev => {
      const next = cloneRota(prev)
      const arr = (next[day] || []).slice()
      arr.splice(idx, 1)
      next[day] = arr
      return next
    })
  }, [])

  const moveShift = useCallback((fromDay, fromIdx, toDay) => {
    if (fromDay === toDay) return
    setRotaState(prev => {
      const next = cloneRota(prev)
      const fromArr = (next[fromDay] || []).slice()
      const shift = fromArr[fromIdx]
      if (!shift) return prev
      fromArr.splice(fromIdx, 1)
      next[fromDay] = fromArr
      next[toDay] = [...(next[toDay] || []), { ...shift }]
      return next
    })
  }, [])

  const resetRota = useCallback(() => {
    setRotaState(cloneRota(BAR_WEEKLY_ROTA))
  }, [])

  // Re-derive totals whenever the rota changes.
  const totals = useMemo(() => deriveBarRotaTotals(rota), [rota])

  const value = useMemo(() => ({
    rota,
    totals,
    setRota,
    addShift,
    updateShift,
    removeShift,
    moveShift,
    resetRota,
  }), [rota, totals, setRota, addShift, updateShift, removeShift, moveShift, resetRota])

  return <RotaCtx.Provider value={value}>{children}</RotaCtx.Provider>
}

export function useEditableRota() {
  const ctx = useContext(RotaCtx)
  if (!ctx) {
    // Fallback to read-only defaults if used outside the provider —
    // means a misplaced consumer just behaves like the old static UI.
    return {
      rota: cloneRota(BAR_WEEKLY_ROTA),
      totals: deriveBarRotaTotals(BAR_WEEKLY_ROTA),
      setRota: () => {},
      addShift: () => {},
      updateShift: () => {},
      removeShift: () => {},
      moveShift: () => {},
      resetRota: () => {},
    }
  }
  return ctx
}
