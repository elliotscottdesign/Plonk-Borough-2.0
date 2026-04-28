import React, { createContext, useContext, useState, useCallback } from 'react'

// ─── Locked Use-of-Funds context (Hackney) ─────────────────────────────
// Mirrors Borough's LockedForecastContext pattern but locks the
// minimum-viable-raise sliders on the Hackney Use of Funds slide.
//
// When the founder (logged in with the 888999 password) clicks "Lock"
// on the Use of Funds tool, the slider values are captured into a
// snapshot, persisted to localStorage so the next 888999 login restores
// it instantly. The same snapshot flows into Investment Summary,
// Waterfall Returns, and the Cashflow Forecast sub-tab.
//
// Borough/Hackney locks are independent — different storage key.
//
// snapshot shape: {
//   stock, rentMonths, rent, garden, interior, marketing, legals,
//   total, lockedAt
// } | null
// ───────────────────────────────────────────────────────────────────────

const LOCK_STORAGE_KEY = 'ndh_locked_useoffunds_v1'

const isValidSnapshot = (s) =>
  s && typeof s === 'object' && Number.isFinite(s.total) && s.total > 0

const readPersistedSnapshot = () => {
  try {
    const raw = localStorage.getItem(LOCK_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return isValidSnapshot(parsed) ? parsed : null
  } catch {
    return null
  }
}

const readIsFounder = () => {
  try { return sessionStorage.getItem('ndb_founder') === '1' }
  catch { return false }
}

const LockedUseOfFundsContext = createContext({
  snapshot: null,
  isLocked: false,
  isFounder: false,
  canEdit: false,
  lock: () => {},
  unlock: () => {},
})

export function LockedUseOfFundsProvider({ children }) {
  const [snapshot, setSnapshot] = useState(readPersistedSnapshot)
  const isFounder = readIsFounder()

  const lock = useCallback((data) => {
    if (!data || !isValidSnapshot(data)) return
    const stamped = { ...data, lockedAt: new Date().toISOString() }
    setSnapshot(stamped)
    try { localStorage.setItem(LOCK_STORAGE_KEY, JSON.stringify(stamped)) } catch {}
  }, [])

  const unlock = useCallback(() => {
    setSnapshot(null)
    try { localStorage.removeItem(LOCK_STORAGE_KEY) } catch {}
  }, [])

  const isLocked = snapshot !== null
  // Non-founder users always see the locked snapshot (or the default fallback)
  // and cannot edit. Founder can edit only when not locked — Lock first to
  // commit, then Reset to make further changes.
  const canEdit  = isFounder && !isLocked

  const value = { snapshot, isLocked, isFounder, canEdit, lock, unlock }

  return (
    <LockedUseOfFundsContext.Provider value={value}>
      {children}
    </LockedUseOfFundsContext.Provider>
  )
}

export function useLockedUseOfFunds() {
  return useContext(LockedUseOfFundsContext)
}
