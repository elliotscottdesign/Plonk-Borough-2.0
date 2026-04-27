import React, { createContext, useContext, useState, useCallback } from 'react'
import { LOCK_SYNC_URL, LOCK_SYNC_SECRET } from '../data.js'

// ─── Locked-forecast context ───────────────────────────────────────────
// When the founder (logged in with the 888999 password) clicks "Lock"
// on the 2026 Performance tab, the live forecast totals are captured
// into a snapshot, persisted to localStorage AND POSTed to the optional
// LOCK_SYNC_URL endpoint for cross-device sync.
//
// Snapshot priority on init:
//   1. window.__NDB_LOCK_SNAPSHOT  (set by data-bootstrap.js from server)
//   2. localStorage[LOCK_STORAGE_KEY]  (per-browser fallback)
//   3. null                            (no lock)
//
// Server (LOCK_SYNC_URL) is the source of truth across browsers/devices —
// see infra/lock-sync-apps-script.gs and infra/lock-sync-worker.js for
// the two server implementations.
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

const isValidSnapshot = (s) => s && typeof s === 'object' && Number.isFinite(s.revenue)

const readPersistedSnapshot = () => {
  // Priority 1: bootstrap fetched it from the server
  if (typeof window !== 'undefined' && window.__NDB_LOCK_SNAPSHOT !== undefined) {
    const fromServer = window.__NDB_LOCK_SNAPSHOT
    // Mirror server state to localStorage so future reloads on this browser
    // can hydrate instantly even before the bootstrap finishes.
    try {
      if (fromServer && isValidSnapshot(fromServer)) {
        localStorage.setItem(LOCK_STORAGE_KEY, JSON.stringify(fromServer))
        return fromServer
      } else {
        // Server says no lock — clear local copy too
        localStorage.removeItem(LOCK_STORAGE_KEY)
        return null
      }
    } catch {
      return isValidSnapshot(fromServer) ? fromServer : null
    }
  }
  // Priority 2: localStorage
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

// Best-effort POST to the sync endpoint. Returns silently on failure —
// localStorage write already happened, so the founder still has their
// state. Console.warn so debugging is possible.
async function syncToServer(snapshot) {
  if (!LOCK_SYNC_URL) return
  try {
    // Use text/plain to avoid CORS preflight on Apps Script web apps;
    // the server reads e.postData.contents and parses JSON itself.
    await fetch(LOCK_SYNC_URL, {
      method: 'POST',
      mode: 'cors',
      cache: 'no-store',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: JSON.stringify({ snapshot, secret: LOCK_SYNC_SECRET || undefined }),
    })
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[lock-sync] POST failed, kept local only:', e.message)
  }
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
    // Fire-and-forget cross-device sync. Doesn't block the UI.
    syncToServer(data)
  }, [])

  const unlock = useCallback(() => {
    setSnapshot(null)
    try { localStorage.removeItem(LOCK_STORAGE_KEY) } catch {}
    syncToServer(null)
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
