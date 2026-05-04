import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react'
import {
  USE_OF_FUNDS,
  USE_OF_FUNDS_RANGES,
  HACKNEY_RAISE_TARGET,
  WAGE_RATES,
  PL_WAGE_BASE,
  WAGE_OVERHEAD_MULT,
  LOCK_SYNC_URL,
  LOCK_SYNC_SECRET,
} from '../../data/hackney.js'

// ─── Locked Use-of-Funds context (Hackney) ─────────────────────────────
// Single source of truth for the funding amount + 7-line use-of-funds
// breakdown plus all other lockable Hackney surfaces. Consumed by:
//   • FundingSlider (on Cover) — sets fundingAmount + lock/unlock
//   • UseOfFunds slide — drives the 6 allocation sliders + WC residual
//   • Cover, MarketContext, InvestmentSummary, WaterfallReturns,
//     VenueInfo Development tab, BusinessExplorer Cashflow tab —
//     read `effective.*` so every figure cascades from one variable
//
// Lockable surfaces (independent of each other; mirrors Borough's
// LockedDeckContext architecture):
//   1. FUNDING — investor's total raise + 7-line use-of-funds breakdown
//      (LIVE_KEY / LOCK_KEY · localStorage only)
//   2. WAGES — 4-role wage calculator
//      (WAGE_LIVE_KEY / WAGE_LOCK_KEY · localStorage only)
//   3. FORECAST — 2026 Performance scenario lock (revenue / costs /
//      growth levers · syncs cross-device via LOCK_SYNC_URL)
//   4. BAR PRICE — Bar Price Uplift slider (independent founder lock,
//      pins the bar-price-uplift % for every visitor · syncs cross-device)
//
// State model per surface:
//   • values     — live editable state (founder edits these)
//   • snapshot   — locked snapshot or null
//   • effective  — locked snapshot if locked, else derived(values)
//
// Persistence:
//   • localStorage on every surface, founder-only for live values
//   • forecast + barPrice ALSO sync cross-device via LOCK_SYNC_URL when
//     configured (Apps Script — see infra/lock-sync-apps-script-hackney.gs).
//     Both ride the same endpoint as a merged container { forecast,
//     barPrice } so each writer refreshes the cell without clobbering
//     the other surface. Funding + wages stay local-only — the founder
//     tunes those privately before locking.
//
// Founder detection:
//   • sessionStorage.ndb_founder === '1' (set by PasswordGate at 888999)
//   • OR URL ?founder=888999 (one-time link grant; promotes to session)
// ───────────────────────────────────────────────────────────────────────

const LIVE_KEY = 'ndh_live_useoffunds_v1'
const LOCK_KEY = 'ndh_locked_useoffunds_v1'
const WAGE_LIVE_KEY = 'ndh_wage_live_v1'
const WAGE_LOCK_KEY = 'ndh_wage_locked_v1'
const FORECAST_LIVE_KEY = 'ndh_forecast_live_v1'
const FORECAST_LOCK_KEY = 'ndh_forecast_locked_v1'
// Bar-price single-number lock — independent of the broader forecast
// lock so the founder can pin just this slider while everything else
// stays editable. Shape: { value: number, lockedAt: ISO }.
const BAR_PRICE_LOCK_KEY = 'ndh_bar_price_locked_v1'

// Default 2026 Performance forecast state — growth levers per income
// line, plus matrices for ticket pricing, fixed-cost line edits and
// office-cost line edits. Borough's tab uses 5 levers; Hackney drops
// the golf lever (golf moving to operator) so 4 levers remain.
//
// growthDrivers: per-strategy contribution to overall annual uplift
// (sums to roughly 15% in the Base case). Each value is the percentage
// points that driver contributes to the headline growth target.
// barPriceUplift: separate price-driven contribution sized via the
// Bar Price Uplift Calculator on the 2026 Performance tab. Locked
// from there — the Growth Drivers slide reads this read-only.
function defaultForecast() {
  return {
    growth:  { bar: 15, office: 15, tournament: 15, pool: 15 },
    growthDrivers: {
      seo:        3,    // SEO Rebuild from Day 1
      organic:    2,    // Organic & Local Listings
      corporate:  4,    // Corporate Events Pipeline
      dj:         3,    // DJ & Events Programme
      repricing:  1,    // Pool & Gaming Repricing (volume side; price is barPriceUplift)
      garden:     2,    // Garden & Capacity Uplift
    },
    barPriceUplift: 0,   // % uplift on bar prices (sized via 2026 Performance calculator)
    pricing:    {},   // SKU → { price?: number, tokens?: number } overrides
    fixedCosts: {},   // line key → £ override
    officeCosts: {},  // line key → £ override
  }
}

const isValidForecast = (v) =>
  v && typeof v === 'object' && v.growth && typeof v.growth === 'object' &&
  Number.isFinite(v.growth.bar)

// Funding amount slider range. Single source of truth — FundingSlider
// reads this directly. Consumers should treat values outside the range
// as legitimate (e.g. legacy snapshots) and clamp visually only.
export const FUNDING_RANGE = { min: 50000, max: 100000, step: 5000 }

// Build the default live values from the static USE_OF_FUNDS list.
function buildDefaults() {
  const byKey = Object.fromEntries(USE_OF_FUNDS.map(u => [u.key, u]))
  return {
    investment: HACKNEY_RAISE_TARGET,
    stock:     byKey.stock.amount,
    rentMonths: 0,
    rent:      byKey.rent.amount,
    garden:    byKey.garden.amount,
    interior:  byKey.interior.amount,
    marketing: byKey.marketing.amount,
    legals:    byKey.legals.amount,
  }
}

// Map rentMonths slider position to £ deposit amount per the lease snaps.
function rentAmountForMonths(months) {
  const snap = USE_OF_FUNDS_RANGES.rent.snaps.find(s => s.months === months)
  return snap ? snap.amount : USE_OF_FUNDS_RANGES.rent.snaps[0].amount
}

// Compute the derived snapshot shape from a values map. `total`,
// `allocated`, `workingCapital`, `overAllocated` are all derived.
function deriveSnapshot(v) {
  const total = v.investment
  const allocated = v.stock + v.rent + v.garden + v.interior + v.marketing + v.legals
  return {
    ...v,
    workingCapital: Math.max(0, total - allocated),
    overAllocated:  Math.max(0, allocated - total),
    total,
    allocated,
  }
}

const isValidLocked = (s) =>
  s && typeof s === 'object' && Number.isFinite(s.total) && s.total > 0

const isValidLive = (v) =>
  v && typeof v === 'object' && Number.isFinite(v.investment) && v.investment > 0

// ─── Wage calculator state — separate lock cycle from funding ─────────
// 4-role rota basis from data/hackney.js. Founder edits rate + hours
// per role; loadedAnnual = grossAnnual × WAGE_OVERHEAD_MULT (covers
// 21.4% NIC + pension + holiday). When the founder locks the wage
// calculator, loadedAnnual flows into buildForecast as the wages line
// instead of the static PL_WAGE_BASE.
function defaultWageRows() {
  return WAGE_RATES.map(r => ({ role: r.role, rate: r.rate, hours: r.hours, color: r.color }))
}
function deriveWageSnapshot(rows) {
  const grossAnnual  = rows.reduce((s, r) => s + r.rate * r.hours, 0)
  const loadedAnnual = grossAnnual * WAGE_OVERHEAD_MULT
  return { rows, grossAnnual, loadedAnnual }
}

const isValidWageLock = (s) =>
  s && typeof s === 'object' && Number.isFinite(s.loadedAnnual) && s.loadedAnnual > 0

const isValidWageLive = (rows) =>
  Array.isArray(rows) && rows.length === WAGE_RATES.length &&
  rows.every(r => Number.isFinite(r.rate) && Number.isFinite(r.hours))

const readPersisted = (key, validator) => {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return validator(parsed) ? parsed : null
  } catch { return null }
}

// ─── Bar-price lock validators + server-first readers ────────────────
const isValidBarPriceLock = (v) =>
  v && typeof v === 'object' && Number.isFinite(v.value)

// Forecast snapshot — Hackney shape carries growth.bar at top level.
// Used to read the bootstrap-supplied global at provider init.
const isValidForecastForServer = (s) =>
  s && typeof s === 'object' && s.growth && Number.isFinite(s.growth.bar)

// Read forecast snapshot, preferring the bootstrap-fetched server value
// (window.__NDB_HACKNEY_LOCK_SNAPSHOT) over localStorage. Mirrors the
// Borough LockedDeckContext priority chain so a freshly-loaded page
// reflects whatever the server holds, even if the local cache disagreed.
function readPersistedForecastSnapshotHackney() {
  if (typeof window !== 'undefined' && window.__NDB_HACKNEY_LOCK_SNAPSHOT !== undefined) {
    const fromServer = window.__NDB_HACKNEY_LOCK_SNAPSHOT
    try {
      if (fromServer && isValidForecastForServer(fromServer)) {
        localStorage.setItem(FORECAST_LOCK_KEY, JSON.stringify(fromServer))
        return fromServer
      } else {
        localStorage.removeItem(FORECAST_LOCK_KEY)
        return null
      }
    } catch {
      return isValidForecastForServer(fromServer) ? fromServer : null
    }
  }
  return readPersisted(FORECAST_LOCK_KEY, isValidForecast)
}

function readPersistedBarPriceLock() {
  if (typeof window !== 'undefined' && window.__NDB_HACKNEY_BAR_PRICE_LOCK !== undefined) {
    const fromServer = window.__NDB_HACKNEY_BAR_PRICE_LOCK
    try {
      if (fromServer && isValidBarPriceLock(fromServer)) {
        localStorage.setItem(BAR_PRICE_LOCK_KEY, JSON.stringify(fromServer))
        return fromServer
      } else {
        localStorage.removeItem(BAR_PRICE_LOCK_KEY)
        return null
      }
    } catch {
      return isValidBarPriceLock(fromServer) ? fromServer : null
    }
  }
  return readPersisted(BAR_PRICE_LOCK_KEY, isValidBarPriceLock)
}

// Cross-device lock sync — POSTs the merged container { forecast,
// barPrice } to LOCK_SYNC_URL whenever either lock changes. The server
// stores a single JSON cell, so callers must pass the full container
// (the *intended* post-change state of both surfaces) — we can't merge
// server-side. Mirrors Borough's syncContainerToServer().
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
    console.warn('[hackney lock-sync] container POST failed, kept local only:', e.message)
  }
}

// Read founder status from sessionStorage. Also accepts a one-time URL
// query (?founder=888999) which promotes the session — useful for
// shareable founder links without going through the password gate.
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

const LockedUseOfFundsContext = createContext({
  values: buildDefaults(),
  snapshot: null,
  effective: deriveSnapshot(buildDefaults()),
  isLocked: false,
  isFounder: false,
  canEdit: false,
  setValue: () => {},
  lock: () => {},
  unlock: () => {},
  reset: () => {},
})

export function LockedUseOfFundsProvider({ children }) {
  const [snapshot, setSnapshot] = useState(() => readPersisted(LOCK_KEY, isValidLocked))
  // Live values seed precedence: persisted live (founder only) → locked snapshot
  // (so unlocking lands the sliders on the locked figures) → defaults.
  const [values, setValues] = useState(() => {
    const persistedLive = readPersisted(LIVE_KEY, isValidLive)
    if (persistedLive) return { ...buildDefaults(), ...persistedLive }
    const lock = readPersisted(LOCK_KEY, isValidLocked)
    if (lock) {
      const d = buildDefaults()
      return {
        investment: lock.investment ?? lock.total ?? d.investment,
        stock:      lock.stock      ?? d.stock,
        rentMonths: lock.rentMonths ?? d.rentMonths,
        rent:       lock.rent       ?? d.rent,
        garden:     lock.garden     ?? d.garden,
        interior:   lock.interior   ?? d.interior,
        marketing:  lock.marketing  ?? d.marketing,
        legals:     lock.legals     ?? d.legals,
      }
    }
    return buildDefaults()
  })

  // ─── Wage calculator state ───────────────────────────────────────
  const [wageSnapshot, setWageSnapshot] = useState(() => readPersisted(WAGE_LOCK_KEY, isValidWageLock))
  const [wageRows, setWageRowsState] = useState(() => {
    const persisted = readPersisted(WAGE_LIVE_KEY, isValidWageLive)
    if (persisted) return persisted
    const lock = readPersisted(WAGE_LOCK_KEY, isValidWageLock)
    if (lock?.rows && isValidWageLive(lock.rows)) return lock.rows
    return defaultWageRows()
  })

  // ─── Forecast (2026 Performance) state ───────────────────────────
  // Init prefers the bootstrap-fetched server snapshot (so a fresh page
  // load reflects the founder's latest cross-device lock) over local-
  // Storage. Live values still seed from localStorage for editing.
  const [forecastSnapshot, setForecastSnapshot] = useState(readPersistedForecastSnapshotHackney)
  const [forecastValues, setForecastValuesState] = useState(() => {
    const persisted = readPersisted(FORECAST_LIVE_KEY, isValidForecast)
    if (persisted) return { ...defaultForecast(), ...persisted, growth: { ...defaultForecast().growth, ...(persisted.growth || {}) } }
    const lock = readPersistedForecastSnapshotHackney()
    if (lock) return { ...defaultForecast(), ...lock, growth: { ...defaultForecast().growth, ...(lock.growth || {}) } }
    return defaultForecast()
  })

  // ─── Bar-price single-number lock ────────────────────────────────
  // Independent founder-only lock for the Bar Price Uplift slider on
  // 2026 Performance. When set, every visitor sees the locked % and
  // the slider is disabled. Persists in localStorage AND syncs cross-
  // device via LOCK_SYNC_URL alongside the forecast lock as a merged
  // container (see syncContainerToServer).
  const [barPriceLock, setBarPriceLock] = useState(readPersistedBarPriceLock)

  // Refs mirror the latest snapshot of EACH cross-device-synced lock so
  // the *other* lock's mutator can include the right value when POSTing
  // the merged container. Mirrors Borough's forecastRef / ticketVolumeRef.
  const forecastRef = useRef(forecastSnapshot)
  const barPriceRef = useRef(barPriceLock)
  useEffect(() => { forecastRef.current = forecastSnapshot }, [forecastSnapshot])
  useEffect(() => { barPriceRef.current = barPriceLock }, [barPriceLock])

  const isFounder = readIsFounder()
  const isLocked = snapshot !== null
  const canEdit = isFounder && !isLocked
  const isWageLocked = wageSnapshot !== null
  const canEditWages = isFounder && !isWageLocked
  const isForecastLocked = forecastSnapshot !== null
  const canEditForecast = isFounder && !isForecastLocked
  const isBarPriceLocked = barPriceLock !== null
  const canEditBarPrice  = isFounder && !isBarPriceLocked

  // Persist live values (founder only) so editing progress survives reload.
  useEffect(() => {
    if (!isFounder) return
    try { localStorage.setItem(LIVE_KEY, JSON.stringify(values)) } catch {}
  }, [values, isFounder])

  useEffect(() => {
    if (!isFounder) return
    try { localStorage.setItem(WAGE_LIVE_KEY, JSON.stringify(wageRows)) } catch {}
  }, [wageRows, isFounder])

  useEffect(() => {
    if (!isFounder) return
    try { localStorage.setItem(FORECAST_LIVE_KEY, JSON.stringify(forecastValues)) } catch {}
  }, [forecastValues, isFounder])

  // The "effective" surface — locked snapshot if locked, else live derived.
  // Every consumer slide reads from this so values cascade live.
  const effective = useMemo(
    () => (isLocked ? snapshot : deriveSnapshot(values)),
    [isLocked, snapshot, values],
  )

  // Editable setter. No-op when locked OR when not founder.
  // rentMonths automatically updates the matching rent £ amount.
  const setValue = useCallback((key, val) => {
    if (!canEdit) return
    setValues(prev => {
      const next = { ...prev, [key]: val }
      if (key === 'rentMonths') next.rent = rentAmountForMonths(val)
      return next
    })
  }, [canEdit])

  const lock = useCallback(() => {
    if (!isFounder) return
    const stamped = { ...deriveSnapshot(values), lockedAt: new Date().toISOString() }
    setSnapshot(stamped)
    try { localStorage.setItem(LOCK_KEY, JSON.stringify(stamped)) } catch {}
  }, [values, isFounder])

  const unlock = useCallback(() => {
    if (!isFounder) return
    setSnapshot(null)
    try { localStorage.removeItem(LOCK_KEY) } catch {}
  }, [isFounder])

  const reset = useCallback(() => {
    if (!isFounder) return
    if (snapshot) {
      setSnapshot(null)
      try { localStorage.removeItem(LOCK_KEY) } catch {}
    }
    setValues(buildDefaults())
  }, [snapshot, isFounder])

  // ─── Wage calculator — derived view + setters ─────────────────────
  const wageEffective = useMemo(
    () => (isWageLocked ? wageSnapshot : deriveWageSnapshot(wageRows)),
    [isWageLocked, wageSnapshot, wageRows],
  )

  const setWageRow = useCallback((idx, key, val) => {
    if (!canEditWages) return
    setWageRowsState(prev => prev.map((r, i) => i === idx ? { ...r, [key]: val } : r))
  }, [canEditWages])

  const lockWages = useCallback(() => {
    if (!isFounder) return
    const stamped = { ...deriveWageSnapshot(wageRows), lockedAt: new Date().toISOString() }
    setWageSnapshot(stamped)
    try { localStorage.setItem(WAGE_LOCK_KEY, JSON.stringify(stamped)) } catch {}
  }, [wageRows, isFounder])

  const unlockWages = useCallback(() => {
    if (!isFounder) return
    setWageSnapshot(null)
    try { localStorage.removeItem(WAGE_LOCK_KEY) } catch {}
  }, [isFounder])

  const resetWages = useCallback(() => {
    if (!isFounder) return
    if (wageSnapshot) {
      setWageSnapshot(null)
      try { localStorage.removeItem(WAGE_LOCK_KEY) } catch {}
    }
    setWageRowsState(defaultWageRows())
  }, [wageSnapshot, isFounder])

  // ─── Forecast — derived view + setters ────────────────────────────
  // The bar-price single-number lock overlays whatever forecast layer
  // is active so a founder-pinned bar-price uplift % is visible to all
  // visitors regardless of whether the broader forecast is locked.
  const forecastEffective = useMemo(() => {
    const base = isForecastLocked ? forecastSnapshot : forecastValues
    if (isBarPriceLocked && barPriceLock && Number.isFinite(barPriceLock.value)) {
      return { ...base, barPriceUplift: barPriceLock.value }
    }
    return base
  }, [isForecastLocked, forecastSnapshot, forecastValues, isBarPriceLocked, barPriceLock])

  // Generic top-level setter — caller passes a key + new value, OR
  // a key + (subKey, val) for nested updates (growth/pricing/fixed/office).
  const setForecastValue = useCallback((key, val) => {
    if (!canEditForecast) return
    setForecastValuesState(prev => ({ ...prev, [key]: val }))
  }, [canEditForecast])

  // Convenience: set a single growth lever (e.g. setGrowth('bar', 18))
  const setGrowth = useCallback((leverKey, pct) => {
    if (!canEditForecast) return
    setForecastValuesState(prev => ({ ...prev, growth: { ...prev.growth, [leverKey]: pct } }))
  }, [canEditForecast])

  // Convenience: set ALL growth levers at once (used by scenario presets)
  const setGrowthAll = useCallback((pct) => {
    if (!canEditForecast) return
    setForecastValuesState(prev => ({
      ...prev,
      growth: Object.fromEntries(Object.keys(prev.growth).map(k => [k, pct])),
    }))
  }, [canEditForecast])

  // Per-driver contribution to overall annual uplift. Each driver is a %
  // points slice; sum across drivers + bar price uplift = the Custom
  // scenario's total growth %.
  const setGrowthDriver = useCallback((driverKey, pct) => {
    if (!canEditForecast) return
    setForecastValuesState(prev => {
      const next = {
        ...prev,
        growthDrivers: { ...(prev.growthDrivers || {}), [driverKey]: pct },
      }
      return next
    })
  }, [canEditForecast])

  // Bar price uplift % — sourced from the Bar Price Uplift Calculator on
  // the 2026 Performance tab. No-op when the broader forecast is locked
  // OR when the independent bar-price lock is active (founder must
  // unlock to edit).
  const setBarPriceUplift = useCallback((pct) => {
    if (!canEditForecast) return
    if (isBarPriceLocked) return
    setForecastValuesState(prev => ({ ...prev, barPriceUplift: pct }))
  }, [canEditForecast, isBarPriceLocked])

  const lockForecast = useCallback(() => {
    if (!isFounder) return
    const stamped = { ...forecastValues, lockedAt: new Date().toISOString() }
    setForecastSnapshot(stamped)
    try { localStorage.setItem(FORECAST_LOCK_KEY, JSON.stringify(stamped)) } catch {}
    // POST the merged container — keep the current bar-price lock intact
    // server-side.
    syncContainerToServer({ forecast: stamped, barPrice: barPriceRef.current })
  }, [forecastValues, isFounder])

  const unlockForecast = useCallback(() => {
    if (!isFounder) return
    setForecastSnapshot(null)
    try { localStorage.removeItem(FORECAST_LOCK_KEY) } catch {}
    syncContainerToServer({ forecast: null, barPrice: barPriceRef.current })
  }, [isFounder])

  // ─── Bar-price lock API ──────────────────────────────────────────
  // Founder-only lock for the Bar Price Uplift slider. Persists across
  // reloads in localStorage AND syncs cross-device via LOCK_SYNC_URL
  // (when configured) by POSTing the merged container.
  const lockBarPrice = useCallback((value) => {
    if (!isFounder) return
    if (!Number.isFinite(value)) return
    const stamped = { value, lockedAt: new Date().toISOString() }
    setBarPriceLock(stamped)
    try { localStorage.setItem(BAR_PRICE_LOCK_KEY, JSON.stringify(stamped)) } catch {}
    syncContainerToServer({ forecast: forecastRef.current, barPrice: stamped })
  }, [isFounder])

  const unlockBarPrice = useCallback(() => {
    if (!isFounder) return
    setBarPriceLock(null)
    try { localStorage.removeItem(BAR_PRICE_LOCK_KEY) } catch {}
    syncContainerToServer({ forecast: forecastRef.current, barPrice: null })
  }, [isFounder])

  const resetForecast = useCallback(() => {
    if (!isFounder) return
    if (forecastSnapshot) {
      setForecastSnapshot(null)
      try { localStorage.removeItem(FORECAST_LOCK_KEY) } catch {}
    }
    setForecastValuesState(defaultForecast())
  }, [forecastSnapshot, isFounder])

  const ctx = {
    values,
    snapshot,
    effective,
    isLocked,
    isFounder,
    canEdit,
    setValue,
    lock,
    unlock,
    reset,
    // Wage calculator surface
    wageRows,
    wageSnapshot,
    wageEffective,
    isWageLocked,
    canEditWages,
    setWageRow,
    lockWages,
    unlockWages,
    resetWages,
    // Forecast (2026 Performance) surface
    forecastValues,
    forecastSnapshot,
    forecastEffective,
    isForecastLocked,
    canEditForecast,
    setForecastValue,
    setGrowth,
    setGrowthAll,
    setGrowthDriver,
    setBarPriceUplift,
    lockForecast,
    unlockForecast,
    resetForecast,
    // Bar-price independent lock (overlays forecastEffective.barPriceUplift)
    barPriceLock,
    isBarPriceLocked,
    canEditBarPrice,
    lockBarPrice,
    unlockBarPrice,
  }

  return (
    <LockedUseOfFundsContext.Provider value={ctx}>
      {children}
    </LockedUseOfFundsContext.Provider>
  )
}

export function useLockedUseOfFunds() {
  return useContext(LockedUseOfFundsContext)
}
