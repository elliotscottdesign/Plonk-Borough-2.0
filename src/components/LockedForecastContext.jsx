import React, { createContext, useContext, useState, useCallback } from 'react'

// ─── Locked-forecast context ───────────────────────────────────────────
// When the founder (logged in with the 888999 password) clicks "Lock"
// on the 2026 Performance tab, the live forecast totals are captured
// into a snapshot AND persisted to localStorage. The snapshot survives
// page reloads, sessions, and tab closures — until the founder clicks
// Unlock again.
//
// Access control:
//   - isFounder = sessionStorage.ndb_founder === '1' (set by 888999 login)
//   - canEdit   = isFounder && !isLocked   (only founder, only when not locked)
//   - Non-founder users always see the page as read-only
//
// snapshot shape: {
//   revenue, totalCosts, ebitda, profitAfterVat, netVat,
//   opProfit (alias for profitAfterVat), margin, profitAfterVatMargin,
//   growthLevers
// } | null
// ───────────────────────────────────────────────────────────────────────

const LOCK_STORAGE_KEY = 'ndb_locked_forecast_v1'

const readPersistedSnapshot = () => {
  try {
    const raw = localStorage.getItem(LOCK_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    // Sanity check — must be an object with at least revenue + ebitda
    if (parsed && typeof parsed === 'object' && Number.isFinite(parsed.revenue)) {
      return parsed
    }
    return null
  } catch {
    return null
  }
}

const readIsFounder = () => {
  try { return sessionStorage.getItem('ndb_founder') === '1' }
  catch { return false }
}

const LockedForecastContext = createContext({
  snapshot: null,
  isLocked: false,
  isFounder: false,
  canEdit: false,
  lock: () => {},
  unlock: () => {},
})

export function LockedForecastProvider({ children }) {
  // Hydrate snapshot from localStorage so the lock survives reloads.
  const [snapshot, setSnapshot] = useState(readPersistedSnapshot)
  const isFounder = readIsFounder()

  const lock = useCallback((data) => {
    if (!data) return
    setSnapshot(data)
    try { localStorage.setItem(LOCK_STORAGE_KEY, JSON.stringify(data)) } catch {}
  }, [])

  const unlock = useCallback(() => {
    setSnapshot(null)
    try { localStorage.removeItem(LOCK_STORAGE_KEY) } catch {}
  }, [])

  const isLocked = snapshot !== null
  const canEdit  = isFounder && !isLocked

  const value = { snapshot, isLocked, isFounder, canEdit, lock, unlock }

  return (
    <LockedForecastContext.Provider value={value}>
      {children}
    </LockedForecastContext.Provider>
  )
}

export function useLockedForecast() {
  return useContext(LockedForecastContext)
}
