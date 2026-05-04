import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react'
import {
  USE_OF_FUNDS,
  USE_OF_FUNDS_RANGES,
  BOROUGH_RAISE_TARGET,
  FUNDING_RANGE,
  LOCK_SYNC_URL,
  LOCK_SYNC_SECRET,
} from '../data.js'

// ─── LockedDeckContext (Borough) ──────────────────────────────────────
// Single context bundling both deck-level lockable surfaces:
//   1. FUNDING — investor's total raise + 5-line use-of-funds breakdown
//      (set on Cover via FundingSlider, broken down on Use of Funds)
//   2. FORECAST — 2026 Performance scenario lock (revenue / costs /
//      profit-after-VAT / growth levers)
//
// Backwards-compatible hooks:
//   useLockedFunding()  → funding subset (effective, isLocked, snapshot,
//                          lock, unlock, reset, setValue, isFounder, canEdit)
//   useLockedForecast() → forecast subset (snapshot, isLocked, isFounder,
//                          canEdit, lock, unlock)
//
// One LockedDeckProvider replaces both LockedFundingProvider and
// LockedForecastProvider in App.jsx.
//
// Persistence:
//   funding       → localStorage `ndb_funding_locked_v1` (live values cached
//                   in `ndb_funding_live_v1` for founder editing continuity)
//   forecast      → localStorage `ndb_locked_forecast_v1`
//   ticketVolume  → localStorage `ndb_ticket_volume_locked_v1`
//
// Forecast + ticketVolume *also* sync cross-device via LOCK_SYNC_URL when
// configured (Apps Script / Cloudflare Worker — see infra/). Both ride the
// same endpoint as a merged container { forecast, ticketVolume } so each
// writer refreshes the cell without clobbering the other surface. Funding
// is intentionally local-only (founder/investor model the raise privately).
//
// Founder access:
//   sessionStorage.ndb_founder === '1' (set by PasswordGate at 888999)
//   OR URL ?founder=888999 (one-time link grant; promotes session)
// ───────────────────────────────────────────────────────────────────────

// ─── Funding state — keys + helpers ──────────────────────────────────
const FUNDING_LIVE_KEY = 'ndb_funding_live_v1'
const FUNDING_LOCK_KEY = 'ndb_funding_locked_v1'

function buildFundingDefaults() {
  const byKey = Object.fromEntries(USE_OF_FUNDS.map(u => [u.key, u]))
  return {
    investment: BOROUGH_RAISE_TARGET,
    rentMonths: 3,
    rent:       byKey.rent.amount,
    hardware:   byKey.hardware.amount,
    ip:         byKey.ip.amount,
    stock:      byKey.stock.amount,
  }
}

function rentAmountForMonths(months) {
  const snap = USE_OF_FUNDS_RANGES.rent.snaps.find(s => s.months === months)
  return snap ? snap.amount : USE_OF_FUNDS_RANGES.rent.snaps[0].amount
}

function deriveFundingSnapshot(v) {
  const ipFixed   = USE_OF_FUNDS_RANGES.ip.fixed
  const total     = v.investment
  const allocated = v.rent + v.hardware + ipFixed + v.stock
  return {
    ...v,
    ip: ipFixed,
    workingCapital: Math.max(0, total - allocated),
    overAllocated:  Math.max(0, allocated - total),
    total,
    allocated,
  }
}

const isValidFundingLocked = (s) =>
  s && typeof s === 'object' && Number.isFinite(s.total) && s.total > 0

const isValidFundingLive = (v) =>
  v && typeof v === 'object' && Number.isFinite(v.investment) && v.investment > 0

// ─── Forecast state — keys + helpers ─────────────────────────────────
const FORECAST_LOCK_KEY = 'ndb_locked_forecast_v1'

// ─── Ticket-volume lock — single-number lock for the Master Ticket
// Volume slider on Business Explorer · 2026 Performance · Ticket Price.
// Independent of the broader forecast lock so the founder can pin just
// this slider while everything else stays editable.
const TICKET_VOLUME_LOCK_KEY = 'ndb_ticket_volume_locked_v1'

const isValidTicketVolumeLock = (v) =>
  v && typeof v === 'object' && Number.isFinite(v.value)

function readPersistedTicketVolumeLock() {
  // Priority 1: bootstrap fetched it from the server alongside the
  // forecast lock and stuffed it onto window.__NDB_TICKET_VOLUME_LOCK.
  if (typeof window !== 'undefined' && window.__NDB_TICKET_VOLUME_LOCK !== undefined) {
    const fromServer = window.__NDB_TICKET_VOLUME_LOCK
    try {
      if (fromServer && isValidTicketVolumeLock(fromServer)) {
        localStorage.setItem(TICKET_VOLUME_LOCK_KEY, JSON.stringify(fromServer))
        return fromServer
      } else {
        localStorage.removeItem(TICKET_VOLUME_LOCK_KEY)
        return null
      }
    } catch {
      return isValidTicketVolumeLock(fromServer) ? fromServer : null
    }
  }
  try {
    const raw = localStorage.getItem(TICKET_VOLUME_LOCK_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return isValidTicketVolumeLock(parsed) ? parsed : null
  } catch { return null }
}

const isValidForecastSnapshot = (s) =>
  s && typeof s === 'object' && Number.isFinite(s.revenue)

function readPersistedForecastSnapshot() {
  // Priority 1: bootstrap fetched it from the server
  if (typeof window !== 'undefined' && window.__NDB_LOCK_SNAPSHOT !== undefined) {
    const fromServer = window.__NDB_LOCK_SNAPSHOT
    try {
      if (fromServer && isValidForecastSnapshot(fromServer)) {
        localStorage.setItem(FORECAST_LOCK_KEY, JSON.stringify(fromServer))
        return fromServer
      } else {
        localStorage.removeItem(FORECAST_LOCK_KEY)
        return null
      }
    } catch {
      return isValidForecastSnapshot(fromServer) ? fromServer : null
    }
  }
  try {
    const raw = localStorage.getItem(FORECAST_LOCK_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return isValidForecastSnapshot(parsed) ? parsed : null
  } catch { return null }
}

// Cross-device lock sync — POSTs the merged container { forecast,
// ticketVolume } to LOCK_SYNC_URL whenever either lock changes. The
// server stores a single JSON cell, so callers must pass the full
// container (the *intended* post-change state of both surfaces) — we
// can't merge server-side.
async function syncContainerToServer(container) {
  if (!LOCK_SYNC_URL) return
  try {
    await fetch(LOCK_SYNC_URL, {
      method: 'POST',
      mode: 'cors',
      cache: 'no-store',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: JSON.stringify({ snapshot: container, secret: LOCK_SYNC_SECRET || undefined }),
    })
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[lock-sync] container POST failed, kept local only:', e.message)
  }
}

// ─── Shared helpers ──────────────────────────────────────────────────
const readPersisted = (key, validator) => {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return validator(parsed) ? parsed : null
  } catch { return null }
}

const readIsFounder = () => {
  try {
    const url = new URLSearchParams(window.location.search)
    if (url.get('founder') === '888999') {
      sessionStorage.setItem('ndb_founder', '1')
      return true
    }
    return sessionStorage.getItem('ndb_founder') === '1'
  } catch { return false }
}

// ─── Two contexts internally; one Provider mounts both ──────────────
const FundingCtx = createContext({
  values: buildFundingDefaults(),
  snapshot: null,
  effective: deriveFundingSnapshot(buildFundingDefaults()),
  isLocked: false,
  isFounder: false,
  canEdit: false,
  setValue: () => {},
  lock: () => {},
  unlock: () => {},
  reset: () => {},
})

const ForecastCtx = createContext({
  snapshot: null,
  isLocked: false,
  isFounder: false,
  canEdit: false,
  lock: () => {},
  unlock: () => {},
})

const TicketVolumeCtx = createContext({
  locked: null,        // { value: number, lockedAt: ISO } | null
  isLocked: false,
  isFounder: false,
  canEdit: false,
  lock: () => {},      // (value: number) => void
  unlock: () => {},
})

export function LockedDeckProvider({ children }) {
  // ─── Funding state ────────────────────────────────────────────────
  const [fundingSnapshot, setFundingSnapshot] = useState(() =>
    readPersisted(FUNDING_LOCK_KEY, isValidFundingLocked))
  const [fundingValues, setFundingValues] = useState(() => {
    const persistedLive = readPersisted(FUNDING_LIVE_KEY, isValidFundingLive)
    if (persistedLive) return { ...buildFundingDefaults(), ...persistedLive }
    const lock = readPersisted(FUNDING_LOCK_KEY, isValidFundingLocked)
    if (lock) {
      const d = buildFundingDefaults()
      return {
        investment: lock.investment ?? lock.total ?? d.investment,
        rentMonths: lock.rentMonths ?? d.rentMonths,
        rent:       lock.rent       ?? d.rent,
        hardware:   lock.hardware   ?? d.hardware,
        ip:         lock.ip         ?? d.ip,
        stock:      lock.stock      ?? d.stock,
      }
    }
    return buildFundingDefaults()
  })

  // ─── Forecast state ───────────────────────────────────────────────
  const [forecastSnapshot, setForecastSnapshot] = useState(readPersistedForecastSnapshot)

  // ─── Ticket-volume state ──────────────────────────────────────────
  const [ticketVolumeLock, setTicketVolumeLock] = useState(readPersistedTicketVolumeLock)

  // Refs mirror the latest snapshot of EACH lock so the *other* lock's
  // mutator can include the right value when POSTing the merged container.
  const forecastRef     = useRef(forecastSnapshot)
  const ticketVolumeRef = useRef(ticketVolumeLock)
  useEffect(() => { forecastRef.current = forecastSnapshot }, [forecastSnapshot])
  useEffect(() => { ticketVolumeRef.current = ticketVolumeLock }, [ticketVolumeLock])

  // ─── Shared founder flag ──────────────────────────────────────────
  const isFounder = readIsFounder()

  const fundingIsLocked       = fundingSnapshot !== null
  const fundingCanEdit        = isFounder && !fundingIsLocked
  const forecastIsLocked      = forecastSnapshot !== null
  const forecastCanEdit       = isFounder && !forecastIsLocked
  const ticketVolumeIsLocked  = ticketVolumeLock !== null
  const ticketVolumeCanEdit   = isFounder && !ticketVolumeIsLocked

  // Persist funding live values (founder only).
  useEffect(() => {
    if (!isFounder) return
    try { localStorage.setItem(FUNDING_LIVE_KEY, JSON.stringify(fundingValues)) } catch {}
  }, [fundingValues, isFounder])

  // ─── Funding API ──────────────────────────────────────────────────
  const fundingEffective = useMemo(
    () => (fundingIsLocked ? fundingSnapshot : deriveFundingSnapshot(fundingValues)),
    [fundingIsLocked, fundingSnapshot, fundingValues],
  )

  const setFundingValue = useCallback((key, val) => {
    if (!fundingCanEdit) return
    setFundingValues(prev => {
      const next = { ...prev, [key]: val }
      if (key === 'rentMonths') next.rent = rentAmountForMonths(val)
      return next
    })
  }, [fundingCanEdit])

  const lockFunding = useCallback(() => {
    if (!isFounder) return
    const stamped = { ...deriveFundingSnapshot(fundingValues), lockedAt: new Date().toISOString() }
    setFundingSnapshot(stamped)
    try { localStorage.setItem(FUNDING_LOCK_KEY, JSON.stringify(stamped)) } catch {}
  }, [fundingValues, isFounder])

  const unlockFunding = useCallback(() => {
    if (!isFounder) return
    setFundingSnapshot(null)
    try { localStorage.removeItem(FUNDING_LOCK_KEY) } catch {}
  }, [isFounder])

  const resetFunding = useCallback(() => {
    if (!isFounder) return
    if (fundingSnapshot) {
      setFundingSnapshot(null)
      try { localStorage.removeItem(FUNDING_LOCK_KEY) } catch {}
    }
    setFundingValues(buildFundingDefaults())
  }, [fundingSnapshot, isFounder])

  // ─── Forecast API ─────────────────────────────────────────────────
  const lockForecast = useCallback((data) => {
    if (!data) return
    setForecastSnapshot(data)
    try { localStorage.setItem(FORECAST_LOCK_KEY, JSON.stringify(data)) } catch {}
    // POST the merged container — keep the current ticket-volume lock
    // intact server-side.
    syncContainerToServer({ forecast: data, ticketVolume: ticketVolumeRef.current })
  }, [])

  const unlockForecast = useCallback(() => {
    setForecastSnapshot(null)
    try { localStorage.removeItem(FORECAST_LOCK_KEY) } catch {}
    syncContainerToServer({ forecast: null, ticketVolume: ticketVolumeRef.current })
  }, [])

  // ─── Ticket-volume API ────────────────────────────────────────────
  // Founder-only lock for the Master Ticket Volume slider. Persists
  // across reloads in localStorage AND syncs cross-device via
  // LOCK_SYNC_URL (when configured) by POSTing the merged container.
  const lockTicketVolume = useCallback((value) => {
    if (!isFounder) return
    if (!Number.isFinite(value)) return
    const stamped = { value, lockedAt: new Date().toISOString() }
    setTicketVolumeLock(stamped)
    try { localStorage.setItem(TICKET_VOLUME_LOCK_KEY, JSON.stringify(stamped)) } catch {}
    syncContainerToServer({ forecast: forecastRef.current, ticketVolume: stamped })
  }, [isFounder])

  const unlockTicketVolume = useCallback(() => {
    if (!isFounder) return
    setTicketVolumeLock(null)
    try { localStorage.removeItem(TICKET_VOLUME_LOCK_KEY) } catch {}
    syncContainerToServer({ forecast: forecastRef.current, ticketVolume: null })
  }, [isFounder])

  // ─── Context values ───────────────────────────────────────────────
  const fundingValue = {
    values: fundingValues,
    snapshot: fundingSnapshot,
    effective: fundingEffective,
    isLocked: fundingIsLocked,
    isFounder,
    canEdit: fundingCanEdit,
    setValue: setFundingValue,
    lock: lockFunding,
    unlock: unlockFunding,
    reset: resetFunding,
  }

  const forecastValue = {
    snapshot: forecastSnapshot,
    isLocked: forecastIsLocked,
    isFounder,
    canEdit: forecastCanEdit,
    lock: lockForecast,
    unlock: unlockForecast,
  }

  const ticketVolumeValue = {
    locked: ticketVolumeLock,
    isLocked: ticketVolumeIsLocked,
    isFounder,
    canEdit: ticketVolumeCanEdit,
    lock: lockTicketVolume,
    unlock: unlockTicketVolume,
  }

  return (
    <ForecastCtx.Provider value={forecastValue}>
      <FundingCtx.Provider value={fundingValue}>
        <TicketVolumeCtx.Provider value={ticketVolumeValue}>
          {children}
        </TicketVolumeCtx.Provider>
      </FundingCtx.Provider>
    </ForecastCtx.Provider>
  )
}

// ─── Backwards-compatible hooks ──────────────────────────────────────
export function useLockedFunding() {
  return useContext(FundingCtx)
}

export function useLockedForecast() {
  return useContext(ForecastCtx)
}

export function useLockedTicketVolume() {
  return useContext(TicketVolumeCtx)
}

// Re-export so consumers don't need a second import
export { FUNDING_RANGE }
