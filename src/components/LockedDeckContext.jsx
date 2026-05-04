import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react'
import {
  USE_OF_FUNDS,
  USE_OF_FUNDS_RANGES,
  BOROUGH_RAISE_TARGET,
  FUNDING_RANGE,
  LOCK_SYNC_URL,
  LOCK_SYNC_SECRET,
} from '../data.js'
import { getAccessCode, namespacedKey } from '../lib/access-code.js'

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
// All three lockable surfaces ALSO sync cross-device via LOCK_SYNC_URL when
// configured (Apps Script / Cloudflare Worker — see infra/). Each rides the
// same endpoint as a merged container { funding, forecast, ticketVolume } so
// each writer refreshes the cell without clobbering the others.
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

function readPersistedFundingLock() {
  // Priority 1: bootstrap fetched it from the server alongside the
  // forecast + ticket-volume locks and stuffed it onto window.__NDB_FUNDING_LOCK.
  if (typeof window !== 'undefined' && window.__NDB_FUNDING_LOCK !== undefined) {
    const fromServer = window.__NDB_FUNDING_LOCK
    try {
      if (fromServer && isValidFundingLocked(fromServer)) {
        localStorage.setItem(namespacedKey(FUNDING_LOCK_KEY), JSON.stringify(fromServer))
        return fromServer
      } else {
        localStorage.removeItem(namespacedKey(FUNDING_LOCK_KEY))
        return null
      }
    } catch {
      return isValidFundingLocked(fromServer) ? fromServer : null
    }
  }
  return readPersisted(FUNDING_LOCK_KEY, isValidFundingLocked)
}

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
        localStorage.setItem(namespacedKey(TICKET_VOLUME_LOCK_KEY), JSON.stringify(fromServer))
        return fromServer
      } else {
        localStorage.removeItem(namespacedKey(TICKET_VOLUME_LOCK_KEY))
        return null
      }
    } catch {
      return isValidTicketVolumeLock(fromServer) ? fromServer : null
    }
  }
  try {
    const raw = localStorage.getItem(namespacedKey(TICKET_VOLUME_LOCK_KEY))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return isValidTicketVolumeLock(parsed) ? parsed : null
  } catch { return null }
}

// ─── Fixed-costs lock — per-line monthly sliders on Business Explorer ·
// 2026 Performance (rates, electricity, water, insurance, internet, PRS,
// maintenance, equipment & misc). When the founder locks this surface the
// slider values are pinned for every viewer and feed straight into the
// 2026 forecast totals via the locked snapshot.
const FIXED_COSTS_LOCK_KEY = 'ndb_fixed_costs_locked_v1'

const isValidFixedCostsLock = (v) =>
  v && typeof v === 'object' && v.values && typeof v.values === 'object'

function readPersistedFixedCostsLock() {
  if (typeof window !== 'undefined' && window.__NDB_FIXED_COSTS_LOCK !== undefined) {
    const fromServer = window.__NDB_FIXED_COSTS_LOCK
    try {
      if (fromServer && isValidFixedCostsLock(fromServer)) {
        localStorage.setItem(namespacedKey(FIXED_COSTS_LOCK_KEY), JSON.stringify(fromServer))
        return fromServer
      } else {
        localStorage.removeItem(namespacedKey(FIXED_COSTS_LOCK_KEY))
        return null
      }
    } catch {
      return isValidFixedCostsLock(fromServer) ? fromServer : null
    }
  }
  try {
    const raw = localStorage.getItem(namespacedKey(FIXED_COSTS_LOCK_KEY))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return isValidFixedCostsLock(parsed) ? parsed : null
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
        localStorage.setItem(namespacedKey(FORECAST_LOCK_KEY), JSON.stringify(fromServer))
        return fromServer
      } else {
        localStorage.removeItem(namespacedKey(FORECAST_LOCK_KEY))
        return null
      }
    } catch {
      return isValidForecastSnapshot(fromServer) ? fromServer : null
    }
  }
  try {
    const raw = localStorage.getItem(namespacedKey(FORECAST_LOCK_KEY))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return isValidForecastSnapshot(parsed) ? parsed : null
  } catch { return null }
}

// Cross-device lock sync — POSTs the merged container { funding,
// forecast, ticketVolume } to LOCK_SYNC_URL whenever any lock changes.
// The server stores ONE ROW PER ACCESS CODE so callers must include the
// active code in the body — without it the server falls back to its
// legacy single-tenant cell.
async function syncContainerToServer(container) {
  if (!LOCK_SYNC_URL) {
    // eslint-disable-next-line no-console
    console.warn('[lock-sync] no LOCK_SYNC_URL configured — POST skipped')
    return
  }
  const code = getAccessCode()
  if (!code) {
    // eslint-disable-next-line no-console
    console.warn('[lock-sync] no access code in sessionStorage — POST skipped (sign in first)')
    return
  }
  // eslint-disable-next-line no-console
  console.info('[lock-sync] → POST', { code, container })
  try {
    const res = await fetch(LOCK_SYNC_URL, {
      method: 'POST',
      mode: 'cors',
      cache: 'no-store',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: JSON.stringify({ code, snapshot: container, secret: LOCK_SYNC_SECRET || undefined }),
    })
    const text = await res.text()
    // eslint-disable-next-line no-console
    console.info(`[lock-sync] ← ${res.status} ${res.statusText} ·`, text.slice(0, 200))
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[lock-sync] container POST failed, kept local only:', e.message)
  }
}

// ─── Shared helpers ──────────────────────────────────────────────────
// All read/write paths go through namespacedKey() so two access codes
// sharing one browser don't collide on the same localStorage slot.
const readPersisted = (key, validator) => {
  try {
    const raw = localStorage.getItem(namespacedKey(key))
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

const FixedCostsCtx = createContext({
  locked: null,        // { values: {...}, lockedAt: ISO } | null
  isLocked: false,
  isFounder: false,
  canEdit: false,
  lock: () => {},      // (values: object) => void
  unlock: () => {},
})

export function LockedDeckProvider({ children }) {
  // ─── Funding state ────────────────────────────────────────────────
  const [fundingSnapshot, setFundingSnapshot] = useState(readPersistedFundingLock)
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

  // ─── Fixed-costs state ────────────────────────────────────────────
  const [fixedCostsLock, setFixedCostsLock] = useState(readPersistedFixedCostsLock)

  // Refs mirror the latest snapshot of EACH lock so the *other* lock's
  // mutator can include the right value when POSTing the merged container.
  const fundingRef      = useRef(fundingSnapshot)
  const forecastRef     = useRef(forecastSnapshot)
  const ticketVolumeRef = useRef(ticketVolumeLock)
  const fixedCostsRef   = useRef(fixedCostsLock)
  useEffect(() => { fundingRef.current      = fundingSnapshot   }, [fundingSnapshot])
  useEffect(() => { forecastRef.current     = forecastSnapshot  }, [forecastSnapshot])
  useEffect(() => { ticketVolumeRef.current = ticketVolumeLock  }, [ticketVolumeLock])
  useEffect(() => { fixedCostsRef.current   = fixedCostsLock    }, [fixedCostsLock])

  // ─── Per-tenant re-hydration on mount ─────────────────────────────
  // Bootstrap runs BEFORE PasswordGate clears, so on a fresh tab it
  // doesn't know the access code yet — its lock fetch hits the server's
  // legacy cell, not the user's per-tenant row. This effect runs once
  // the provider mounts (i.e. after sign-in), grabs the active access
  // code from sessionStorage, and fetches the right row. Subsequent
  // locks/unlocks POST back to the same row via syncContainerToServer.
  useEffect(() => {
    if (!LOCK_SYNC_URL) return
    const code = getAccessCode()
    if (!code) return
    let cancelled = false
    ;(async () => {
      try {
        const ctrl = new AbortController()
        const timeout = setTimeout(() => ctrl.abort(), 8000)
        const res = await fetch(`${LOCK_SYNC_URL}?code=${encodeURIComponent(code)}`, {
          cache: 'no-store', signal: ctrl.signal,
        })
        clearTimeout(timeout)
        if (!res.ok || cancelled) return
        const data = await res.json()
        const raw = data && data.snapshot ? data.snapshot : null
        let funding = null
        let forecast = null
        let ticketVolume = null
        let fixedCosts = null
        if (raw && typeof raw === 'object') {
          if ('funding' in raw || 'forecast' in raw || 'ticketVolume' in raw || 'fixedCosts' in raw) {
            funding      = raw.funding      ?? null
            forecast     = raw.forecast     ?? null
            ticketVolume = raw.ticketVolume ?? null
            fixedCosts   = raw.fixedCosts   ?? null
          } else if (Number.isFinite(raw.revenue)) {
            forecast = raw  // legacy flat-forecast
          }
        }
        if (cancelled) return
        // Apply server state — canonical for this code.
        setFundingSnapshot(isValidFundingLocked(funding) ? funding : null)
        setForecastSnapshot(isValidForecastSnapshot(forecast) ? forecast : null)
        setTicketVolumeLock(isValidTicketVolumeLock(ticketVolume) ? ticketVolume : null)
        setFixedCostsLock(isValidFixedCostsLock(fixedCosts) ? fixedCosts : null)
        // Mirror to localStorage (namespaced) so subsequent reloads on
        // this device skip the network round-trip for first paint.
        try {
          if (isValidFundingLocked(funding)) {
            localStorage.setItem(namespacedKey(FUNDING_LOCK_KEY), JSON.stringify(funding))
          } else {
            localStorage.removeItem(namespacedKey(FUNDING_LOCK_KEY))
          }
          if (isValidForecastSnapshot(forecast)) {
            localStorage.setItem(namespacedKey(FORECAST_LOCK_KEY), JSON.stringify(forecast))
          } else {
            localStorage.removeItem(namespacedKey(FORECAST_LOCK_KEY))
          }
          if (isValidTicketVolumeLock(ticketVolume)) {
            localStorage.setItem(namespacedKey(TICKET_VOLUME_LOCK_KEY), JSON.stringify(ticketVolume))
          } else {
            localStorage.removeItem(namespacedKey(TICKET_VOLUME_LOCK_KEY))
          }
          if (isValidFixedCostsLock(fixedCosts)) {
            localStorage.setItem(namespacedKey(FIXED_COSTS_LOCK_KEY), JSON.stringify(fixedCosts))
          } else {
            localStorage.removeItem(namespacedKey(FIXED_COSTS_LOCK_KEY))
          }
        } catch {}
        // eslint-disable-next-line no-console
        console.info(
          `[lock-sync] ✓ hydrated · code=${code}` +
          ` · funding=${funding ? 'set' : 'empty'}` +
          ` · forecast=${forecast ? 'set' : 'empty'}` +
          ` · ticketVolume=${ticketVolume ? 'set' : 'empty'}` +
          ` · fixedCosts=${fixedCosts ? 'set' : 'empty'}`
        )
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[lock-sync] hydrate failed, using local state:', e.message)
      }
    })()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Build the full 4-surface container for cross-device sync. Always
  // includes the latest of all four so no writer clobbers the others on
  // the server.
  const buildContainer = (overrides = {}) => ({
    funding:      'funding'      in overrides ? overrides.funding      : fundingRef.current,
    forecast:     'forecast'     in overrides ? overrides.forecast     : forecastRef.current,
    ticketVolume: 'ticketVolume' in overrides ? overrides.ticketVolume : ticketVolumeRef.current,
    fixedCosts:   'fixedCosts'   in overrides ? overrides.fixedCosts   : fixedCostsRef.current,
  })

  // ─── Shared founder flag ──────────────────────────────────────────
  const isFounder = readIsFounder()

  const fundingIsLocked       = fundingSnapshot !== null
  const fundingCanEdit        = isFounder && !fundingIsLocked
  const forecastIsLocked      = forecastSnapshot !== null
  const forecastCanEdit       = isFounder && !forecastIsLocked
  const ticketVolumeIsLocked  = ticketVolumeLock !== null
  const ticketVolumeCanEdit   = isFounder && !ticketVolumeIsLocked
  const fixedCostsIsLocked    = fixedCostsLock !== null
  const fixedCostsCanEdit     = isFounder && !fixedCostsIsLocked

  // Persist funding live values (founder only).
  useEffect(() => {
    if (!isFounder) return
    try { localStorage.setItem(namespacedKey(FUNDING_LIVE_KEY), JSON.stringify(fundingValues)) } catch {}
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
    try { localStorage.setItem(namespacedKey(FUNDING_LOCK_KEY), JSON.stringify(stamped)) } catch {}
    syncContainerToServer(buildContainer({ funding: stamped }))
  }, [fundingValues, isFounder])

  const unlockFunding = useCallback(() => {
    if (!isFounder) return
    setFundingSnapshot(null)
    try { localStorage.removeItem(namespacedKey(FUNDING_LOCK_KEY)) } catch {}
    syncContainerToServer(buildContainer({ funding: null }))
  }, [isFounder])

  const resetFunding = useCallback(() => {
    if (!isFounder) return
    if (fundingSnapshot) {
      setFundingSnapshot(null)
      try { localStorage.removeItem(namespacedKey(FUNDING_LOCK_KEY)) } catch {}
      syncContainerToServer(buildContainer({ funding: null }))
    }
    setFundingValues(buildFundingDefaults())
  }, [fundingSnapshot, isFounder])

  // ─── Forecast API ─────────────────────────────────────────────────
  const lockForecast = useCallback((data) => {
    if (!data) return
    setForecastSnapshot(data)
    try { localStorage.setItem(namespacedKey(FORECAST_LOCK_KEY), JSON.stringify(data)) } catch {}
    syncContainerToServer(buildContainer({ forecast: data }))
  }, [])

  const unlockForecast = useCallback(() => {
    setForecastSnapshot(null)
    try { localStorage.removeItem(namespacedKey(FORECAST_LOCK_KEY)) } catch {}
    syncContainerToServer(buildContainer({ forecast: null }))
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
    try { localStorage.setItem(namespacedKey(TICKET_VOLUME_LOCK_KEY), JSON.stringify(stamped)) } catch {}
    syncContainerToServer(buildContainer({ ticketVolume: stamped }))
  }, [isFounder])

  const unlockTicketVolume = useCallback(() => {
    if (!isFounder) return
    setTicketVolumeLock(null)
    try { localStorage.removeItem(namespacedKey(TICKET_VOLUME_LOCK_KEY)) } catch {}
    syncContainerToServer(buildContainer({ ticketVolume: null }))
  }, [isFounder])

  // ─── Fixed-costs API ──────────────────────────────────────────────
  // Founder-only lock for the per-line monthly cost sliders. Persists
  // across reloads in localStorage AND syncs cross-device via
  // LOCK_SYNC_URL (when configured) by POSTing the merged container.
  const lockFixedCosts = useCallback((values) => {
    if (!isFounder) return
    if (!values || typeof values !== 'object') return
    const stamped = { values: { ...values }, lockedAt: new Date().toISOString() }
    setFixedCostsLock(stamped)
    try { localStorage.setItem(namespacedKey(FIXED_COSTS_LOCK_KEY), JSON.stringify(stamped)) } catch {}
    syncContainerToServer(buildContainer({ fixedCosts: stamped }))
  }, [isFounder])

  const unlockFixedCosts = useCallback(() => {
    if (!isFounder) return
    setFixedCostsLock(null)
    try { localStorage.removeItem(namespacedKey(FIXED_COSTS_LOCK_KEY)) } catch {}
    syncContainerToServer(buildContainer({ fixedCosts: null }))
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

  const fixedCostsValue = {
    locked: fixedCostsLock,
    isLocked: fixedCostsIsLocked,
    isFounder,
    canEdit: fixedCostsCanEdit,
    lock: lockFixedCosts,
    unlock: unlockFixedCosts,
  }

  return (
    <ForecastCtx.Provider value={forecastValue}>
      <FundingCtx.Provider value={fundingValue}>
        <TicketVolumeCtx.Provider value={ticketVolumeValue}>
          <FixedCostsCtx.Provider value={fixedCostsValue}>
            {children}
          </FixedCostsCtx.Provider>
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

export function useLockedFixedCosts() {
  return useContext(FixedCostsCtx)
}

// Re-export so consumers don't need a second import
export { FUNDING_RANGE }
