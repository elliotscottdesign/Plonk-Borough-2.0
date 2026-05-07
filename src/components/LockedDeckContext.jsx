import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react'
import {
  USE_OF_FUNDS,
  USE_OF_FUNDS_RANGES,
  BOROUGH_RAISE_TARGET,
  FUNDING_RANGE,
  LOCK_SYNC_URL,
  LOCK_SYNC_SECRET,
  WAGE_RATES,
  WAGE_OVERHEAD_MULT,
  IP_LICENSING_DEFAULT_COMMISSIONS,
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

// ─── Office-costs lock — per-line annual sliders on Business Explorer ·
// 2026 Performance · Office Costs (Xero, RotaCloud, Claude, Google
// Workspace, Web hosting, Amazon Prime, Accounting, Director comp).
// Same pattern as Fixed Costs: when the founder locks this surface the
// slider values are pinned for every viewer and feed the 2026 forecast
// totals via the locked snapshot.
const OFFICE_COSTS_LOCK_KEY = 'ndb_office_costs_locked_v1'

// ─── Commissions lock — IP & Licensing Commissions sliders. Stores
// the founder's online + office commission % rates so the figure
// cascades into the venue P&L cost stack on Business Explorer · 2026
// Performance and across the deck slides' scenario calcs.
//
// Booking fee is NOT in this lock — under the new model it goes to
// the bookings system (not Plonk, not the venue), so it never appears
// as a venue cost. Only commissions on actual sales are pinned.
const COMMISSIONS_LIVE_KEY = 'ndb_commissions_live_v1'
const COMMISSIONS_LOCK_KEY = 'ndb_commissions_locked_v1'

function defaultCommissionRates() {
  return {
    onlinePct: IP_LICENSING_DEFAULT_COMMISSIONS.onlinePct,
    officePct: IP_LICENSING_DEFAULT_COMMISSIONS.officePct,
  }
}

const isValidCommissionsRates = (v) =>
  v && typeof v === 'object' &&
  Number.isFinite(v.onlinePct) && Number.isFinite(v.officePct) &&
  v.onlinePct >= 0 && v.officePct >= 0

const isValidCommissionsLock = (s) =>
  s && typeof s === 'object' && isValidCommissionsRates(s.rates)

function readPersistedCommissionsLock() {
  if (typeof window !== 'undefined' && window.__NDB_COMMISSIONS_LOCK !== undefined) {
    const fromServer = window.__NDB_COMMISSIONS_LOCK
    try {
      if (fromServer && isValidCommissionsLock(fromServer)) {
        localStorage.setItem(namespacedKey(COMMISSIONS_LOCK_KEY), JSON.stringify(fromServer))
        return fromServer
      } else {
        localStorage.removeItem(namespacedKey(COMMISSIONS_LOCK_KEY))
        return null
      }
    } catch {
      return isValidCommissionsLock(fromServer) ? fromServer : null
    }
  }
  try {
    const raw = localStorage.getItem(namespacedKey(COMMISSIONS_LOCK_KEY))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return isValidCommissionsLock(parsed) ? parsed : null
  } catch { return null }
}

// ─── Pricing lock — Ticket Price Maker matrix on Business Explorer ·
// 2026 Performance · Tickets. Stores per-SKU { tokens, price } so the
// founder can pin the matrix and the resulting Arcades cost adjustment
// (matrixTokens × IP_LICENSING_TOKEN_VALUE) cascades into the 2026
// cost donut. Independent of the broader forecast lock and the master
// ticket-volume lock so the founder can pin just this surface.
const PRICING_LOCK_KEY = 'ndb_pricing_locked_v1'

const isValidPricingLock = (v) =>
  v && typeof v === 'object' && v.values && typeof v.values === 'object'

function readPersistedPricingLock() {
  if (typeof window !== 'undefined' && window.__NDB_PRICING_LOCK !== undefined) {
    const fromServer = window.__NDB_PRICING_LOCK
    try {
      if (fromServer && isValidPricingLock(fromServer)) {
        localStorage.setItem(namespacedKey(PRICING_LOCK_KEY), JSON.stringify(fromServer))
        return fromServer
      } else {
        localStorage.removeItem(namespacedKey(PRICING_LOCK_KEY))
        return null
      }
    } catch {
      return isValidPricingLock(fromServer) ? fromServer : null
    }
  }
  try {
    const raw = localStorage.getItem(namespacedKey(PRICING_LOCK_KEY))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return isValidPricingLock(parsed) ? parsed : null
  } catch { return null }
}

// ─── Wages lock — Sliding Wage Rate Calculator on Business Explorer ·
// 2026 Performance · Wages. Stores per-role rate + hours so the founder
// can pin the staffing mix and the loaded annual figure (gross ×
// WAGE_OVERHEAD_MULT) cascades into every wage-cost surface in the deck
// (TabPerformance cost donut, InvestmentSummary scenarios,
// WaterfallReturns scenarios).
const WAGES_LIVE_KEY = 'ndb_wages_live_v1'
const WAGES_LOCK_KEY = 'ndb_wages_locked_v1'

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
    && Array.isArray(s.rows) && s.rows.length === WAGE_RATES.length

const isValidWageLive = (rows) =>
  Array.isArray(rows) && rows.length === WAGE_RATES.length &&
  rows.every(r => Number.isFinite(r.rate) && Number.isFinite(r.hours))

function readPersistedWagesLock() {
  if (typeof window !== 'undefined' && window.__NDB_WAGES_LOCK !== undefined) {
    const fromServer = window.__NDB_WAGES_LOCK
    try {
      if (fromServer && isValidWageLock(fromServer)) {
        localStorage.setItem(namespacedKey(WAGES_LOCK_KEY), JSON.stringify(fromServer))
        return fromServer
      } else {
        localStorage.removeItem(namespacedKey(WAGES_LOCK_KEY))
        return null
      }
    } catch {
      return isValidWageLock(fromServer) ? fromServer : null
    }
  }
  try {
    const raw = localStorage.getItem(namespacedKey(WAGES_LOCK_KEY))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return isValidWageLock(parsed) ? parsed : null
  } catch { return null }
}

const isValidFixedCostsLock = (v) =>
  v && typeof v === 'object' && v.values && typeof v.values === 'object'

const isValidOfficeCostsLock = (v) =>
  v && typeof v === 'object' && v.values && typeof v.values === 'object'

function readPersistedOfficeCostsLock() {
  if (typeof window !== 'undefined' && window.__NDB_OFFICE_COSTS_LOCK !== undefined) {
    const fromServer = window.__NDB_OFFICE_COSTS_LOCK
    try {
      if (fromServer && isValidOfficeCostsLock(fromServer)) {
        localStorage.setItem(namespacedKey(OFFICE_COSTS_LOCK_KEY), JSON.stringify(fromServer))
        return fromServer
      } else {
        localStorage.removeItem(namespacedKey(OFFICE_COSTS_LOCK_KEY))
        return null
      }
    } catch {
      return isValidOfficeCostsLock(fromServer) ? fromServer : null
    }
  }
  try {
    const raw = localStorage.getItem(namespacedKey(OFFICE_COSTS_LOCK_KEY))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return isValidOfficeCostsLock(parsed) ? parsed : null
  } catch { return null }
}

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

const OfficeCostsCtx = createContext({
  locked: null,        // { values: {...}, lockedAt: ISO } | null
  isLocked: false,
  isFounder: false,
  canEdit: false,
  lock: () => {},      // (values: object) => void
  unlock: () => {},
})

const WagesCtx = createContext({
  rows: defaultWageRows(),
  effective: deriveWageSnapshot(defaultWageRows()),
  snapshot: null,
  isLocked: false,
  isFounder: false,
  canEdit: false,
  setRow: () => {},
  lock: () => {},
  unlock: () => {},
  reset: () => {},
})

const PricingCtx = createContext({
  locked: null,        // { values: { sku → { tokens, price } }, lockedAt: ISO } | null
  isLocked: false,
  isFounder: false,
  canEdit: false,
  lock: () => {},      // (values: object) => void
  unlock: () => {},
})

const CommissionsCtx = createContext({
  rates: defaultCommissionRates(),
  effective: defaultCommissionRates(),
  snapshot: null,
  isLocked: false,
  isFounder: false,
  canEdit: false,
  setRate: () => {},   // (key: 'onlinePct'|'officePct', value: number) => void
  lock: () => {},
  unlock: () => {},
  reset: () => {},
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

  // ─── Office-costs state ───────────────────────────────────────────
  const [officeCostsLock, setOfficeCostsLock] = useState(readPersistedOfficeCostsLock)

  // ─── Pricing state ────────────────────────────────────────────────
  const [pricingLock, setPricingLock] = useState(readPersistedPricingLock)

  // ─── Commissions state ────────────────────────────────────────────
  const [commissionsLock, setCommissionsLock] = useState(readPersistedCommissionsLock)
  const [commissionRates, setCommissionRatesState] = useState(() => {
    const persisted = readPersisted(COMMISSIONS_LIVE_KEY, isValidCommissionsRates)
    if (persisted) return persisted
    const lock = readPersistedCommissionsLock()
    if (lock?.rates && isValidCommissionsRates(lock.rates)) return lock.rates
    return defaultCommissionRates()
  })

  // ─── Wages state ──────────────────────────────────────────────────
  const [wagesLock, setWagesLock] = useState(readPersistedWagesLock)
  const [wageRows, setWageRowsState] = useState(() => {
    const persisted = readPersisted(WAGES_LIVE_KEY, isValidWageLive)
    if (persisted) return persisted
    const lock = readPersistedWagesLock()
    if (lock?.rows && isValidWageLive(lock.rows)) return lock.rows
    return defaultWageRows()
  })

  // Refs mirror the latest snapshot of EACH lock so the *other* lock's
  // mutator can include the right value when POSTing the merged container.
  const fundingRef      = useRef(fundingSnapshot)
  const forecastRef     = useRef(forecastSnapshot)
  const ticketVolumeRef = useRef(ticketVolumeLock)
  const fixedCostsRef   = useRef(fixedCostsLock)
  const officeCostsRef  = useRef(officeCostsLock)
  const wagesRef        = useRef(wagesLock)
  const pricingRef      = useRef(pricingLock)
  const commissionsRef  = useRef(commissionsLock)
  useEffect(() => { fundingRef.current      = fundingSnapshot   }, [fundingSnapshot])
  useEffect(() => { forecastRef.current     = forecastSnapshot  }, [forecastSnapshot])
  useEffect(() => { ticketVolumeRef.current = ticketVolumeLock  }, [ticketVolumeLock])
  useEffect(() => { fixedCostsRef.current   = fixedCostsLock    }, [fixedCostsLock])
  useEffect(() => { officeCostsRef.current  = officeCostsLock   }, [officeCostsLock])
  useEffect(() => { wagesRef.current        = wagesLock         }, [wagesLock])
  useEffect(() => { pricingRef.current      = pricingLock       }, [pricingLock])
  useEffect(() => { commissionsRef.current  = commissionsLock   }, [commissionsLock])

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
        let officeCosts = null
        let wages = null
        let pricing = null
        let commissions = null
        if (raw && typeof raw === 'object') {
          if ('funding' in raw || 'forecast' in raw || 'ticketVolume' in raw || 'fixedCosts' in raw || 'officeCosts' in raw || 'wages' in raw || 'pricing' in raw || 'commissions' in raw) {
            funding      = raw.funding      ?? null
            forecast     = raw.forecast     ?? null
            ticketVolume = raw.ticketVolume ?? null
            fixedCosts   = raw.fixedCosts   ?? null
            officeCosts  = raw.officeCosts  ?? null
            wages        = raw.wages        ?? null
            pricing      = raw.pricing      ?? null
            commissions  = raw.commissions  ?? null
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
        setOfficeCostsLock(isValidOfficeCostsLock(officeCosts) ? officeCosts : null)
        setWagesLock(isValidWageLock(wages) ? wages : null)
        setPricingLock(isValidPricingLock(pricing) ? pricing : null)
        setCommissionsLock(isValidCommissionsLock(commissions) ? commissions : null)
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
          if (isValidOfficeCostsLock(officeCosts)) {
            localStorage.setItem(namespacedKey(OFFICE_COSTS_LOCK_KEY), JSON.stringify(officeCosts))
          } else {
            localStorage.removeItem(namespacedKey(OFFICE_COSTS_LOCK_KEY))
          }
          if (isValidWageLock(wages)) {
            localStorage.setItem(namespacedKey(WAGES_LOCK_KEY), JSON.stringify(wages))
          } else {
            localStorage.removeItem(namespacedKey(WAGES_LOCK_KEY))
          }
          if (isValidPricingLock(pricing)) {
            localStorage.setItem(namespacedKey(PRICING_LOCK_KEY), JSON.stringify(pricing))
          } else {
            localStorage.removeItem(namespacedKey(PRICING_LOCK_KEY))
          }
          if (isValidCommissionsLock(commissions)) {
            localStorage.setItem(namespacedKey(COMMISSIONS_LOCK_KEY), JSON.stringify(commissions))
          } else {
            localStorage.removeItem(namespacedKey(COMMISSIONS_LOCK_KEY))
          }
        } catch {}
        // eslint-disable-next-line no-console
        console.info(
          `[lock-sync] ✓ hydrated · code=${code}` +
          ` · funding=${funding ? 'set' : 'empty'}` +
          ` · forecast=${forecast ? 'set' : 'empty'}` +
          ` · ticketVolume=${ticketVolume ? 'set' : 'empty'}` +
          ` · fixedCosts=${fixedCosts ? 'set' : 'empty'}` +
          ` · wages=${wages ? 'set' : 'empty'}` +
          ` · pricing=${pricing ? 'set' : 'empty'}`
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
    officeCosts:  'officeCosts'  in overrides ? overrides.officeCosts  : officeCostsRef.current,
    wages:        'wages'        in overrides ? overrides.wages        : wagesRef.current,
    pricing:      'pricing'      in overrides ? overrides.pricing      : pricingRef.current,
    commissions:  'commissions'  in overrides ? overrides.commissions  : commissionsRef.current,
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
  const officeCostsIsLocked   = officeCostsLock !== null
  const officeCostsCanEdit    = isFounder && !officeCostsIsLocked
  const wagesIsLocked         = wagesLock !== null
  const wagesCanEdit          = isFounder && !wagesIsLocked
  const pricingIsLocked       = pricingLock !== null
  const pricingCanEdit        = isFounder && !pricingIsLocked
  const commissionsIsLocked   = commissionsLock !== null
  const commissionsCanEdit    = isFounder && !commissionsIsLocked

  // Persist commission live rates (founder only) so editing progress
  // survives reload.
  useEffect(() => {
    if (!isFounder) return
    try { localStorage.setItem(namespacedKey(COMMISSIONS_LIVE_KEY), JSON.stringify(commissionRates)) } catch {}
  }, [commissionRates, isFounder])

  // Persist wage live values (founder only) so editing progress survives reload.
  useEffect(() => {
    if (!isFounder) return
    try { localStorage.setItem(namespacedKey(WAGES_LIVE_KEY), JSON.stringify(wageRows)) } catch {}
  }, [wageRows, isFounder])

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

  // ─── Office-costs API ─────────────────────────────────────────────
  // Founder-only lock for the per-line annual cost sliders (Xero,
  // RotaCloud, etc.). Same shape as fixed costs — pinned values feed
  // the 2026 forecast totals via the locked snapshot.
  const lockOfficeCosts = useCallback((values) => {
    if (!isFounder) return
    if (!values || typeof values !== 'object') return
    const stamped = { values: { ...values }, lockedAt: new Date().toISOString() }
    setOfficeCostsLock(stamped)
    try { localStorage.setItem(namespacedKey(OFFICE_COSTS_LOCK_KEY), JSON.stringify(stamped)) } catch {}
    syncContainerToServer(buildContainer({ officeCosts: stamped }))
  }, [isFounder])

  const unlockOfficeCosts = useCallback(() => {
    if (!isFounder) return
    setOfficeCostsLock(null)
    try { localStorage.removeItem(namespacedKey(OFFICE_COSTS_LOCK_KEY)) } catch {}
    syncContainerToServer(buildContainer({ officeCosts: null }))
  }, [isFounder])

  // ─── Pricing API ──────────────────────────────────────────────────
  // Founder-only lock for the Ticket Price Maker matrix. Persists
  // across reloads in localStorage AND syncs cross-device via
  // LOCK_SYNC_URL (when configured) by POSTing the merged container.
  const lockPricing = useCallback((values) => {
    if (!isFounder) return
    if (!values || typeof values !== 'object') return
    const stamped = { values: { ...values }, lockedAt: new Date().toISOString() }
    setPricingLock(stamped)
    try { localStorage.setItem(namespacedKey(PRICING_LOCK_KEY), JSON.stringify(stamped)) } catch {}
    syncContainerToServer(buildContainer({ pricing: stamped }))
  }, [isFounder])

  const unlockPricing = useCallback(() => {
    if (!isFounder) return
    setPricingLock(null)
    try { localStorage.removeItem(namespacedKey(PRICING_LOCK_KEY)) } catch {}
    syncContainerToServer(buildContainer({ pricing: null }))
  }, [isFounder])

  // ─── Commissions API ──────────────────────────────────────────────
  const commissionsEffective = useMemo(
    () => (commissionsIsLocked ? commissionsLock.rates : commissionRates),
    [commissionsIsLocked, commissionsLock, commissionRates],
  )

  const setCommissionRate = useCallback((key, value) => {
    if (!commissionsCanEdit) return
    if (key !== 'onlinePct' && key !== 'officePct') return
    const v = Math.max(0, Number(value) || 0)
    setCommissionRatesState(prev => ({ ...prev, [key]: v }))
  }, [commissionsCanEdit])

  const lockCommissions = useCallback(() => {
    if (!isFounder) return
    const stamped = { rates: { ...commissionRates }, lockedAt: new Date().toISOString() }
    setCommissionsLock(stamped)
    try { localStorage.setItem(namespacedKey(COMMISSIONS_LOCK_KEY), JSON.stringify(stamped)) } catch {}
    syncContainerToServer(buildContainer({ commissions: stamped }))
  }, [commissionRates, isFounder])

  const unlockCommissions = useCallback(() => {
    if (!isFounder) return
    setCommissionsLock(null)
    try { localStorage.removeItem(namespacedKey(COMMISSIONS_LOCK_KEY)) } catch {}
    syncContainerToServer(buildContainer({ commissions: null }))
  }, [isFounder])

  const resetCommissions = useCallback(() => {
    if (!isFounder) return
    if (commissionsLock) {
      setCommissionsLock(null)
      try { localStorage.removeItem(namespacedKey(COMMISSIONS_LOCK_KEY)) } catch {}
      syncContainerToServer(buildContainer({ commissions: null }))
    }
    setCommissionRatesState(defaultCommissionRates())
  }, [commissionsLock, isFounder])

  // ─── Wages API ────────────────────────────────────────────────────
  // The "effective" wage view — locked snapshot if locked, else the live
  // edits flowing from the slider card. Every wage-cost surface in the
  // deck reads `loadedAnnual` from this so the locked figure cascades
  // into the 2026 cost donut, the InvestmentSummary scenarios and the
  // WaterfallReturns scenarios.
  const wagesEffective = useMemo(
    () => (wagesIsLocked ? wagesLock : deriveWageSnapshot(wageRows)),
    [wagesIsLocked, wagesLock, wageRows],
  )

  const setWageRow = useCallback((idx, key, val) => {
    if (!wagesCanEdit) return
    setWageRowsState(prev => prev.map((r, i) => i === idx ? { ...r, [key]: val } : r))
  }, [wagesCanEdit])

  const lockWages = useCallback(() => {
    if (!isFounder) return
    const stamped = { ...deriveWageSnapshot(wageRows), lockedAt: new Date().toISOString() }
    setWagesLock(stamped)
    try { localStorage.setItem(namespacedKey(WAGES_LOCK_KEY), JSON.stringify(stamped)) } catch {}
    syncContainerToServer(buildContainer({ wages: stamped }))
  }, [wageRows, isFounder])

  const unlockWages = useCallback(() => {
    if (!isFounder) return
    setWagesLock(null)
    try { localStorage.removeItem(namespacedKey(WAGES_LOCK_KEY)) } catch {}
    syncContainerToServer(buildContainer({ wages: null }))
  }, [isFounder])

  const resetWages = useCallback(() => {
    if (!isFounder) return
    if (wagesLock) {
      setWagesLock(null)
      try { localStorage.removeItem(namespacedKey(WAGES_LOCK_KEY)) } catch {}
      syncContainerToServer(buildContainer({ wages: null }))
    }
    setWageRowsState(defaultWageRows())
  }, [wagesLock, isFounder])

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

  const officeCostsValue = {
    locked: officeCostsLock,
    isLocked: officeCostsIsLocked,
    isFounder,
    canEdit: officeCostsCanEdit,
    lock: lockOfficeCosts,
    unlock: unlockOfficeCosts,
  }

  const wagesValue = {
    rows: wagesIsLocked ? wagesLock.rows : wageRows,
    effective: wagesEffective,
    snapshot: wagesLock,
    isLocked: wagesIsLocked,
    isFounder,
    canEdit: wagesCanEdit,
    setRow: setWageRow,
    lock: lockWages,
    unlock: unlockWages,
    reset: resetWages,
  }

  const pricingValue = {
    locked: pricingLock,
    isLocked: pricingIsLocked,
    isFounder,
    canEdit: pricingCanEdit,
    lock: lockPricing,
    unlock: unlockPricing,
  }

  const commissionsValue = {
    rates: commissionRates,
    effective: commissionsEffective,
    snapshot: commissionsLock,
    isLocked: commissionsIsLocked,
    isFounder,
    canEdit: commissionsCanEdit,
    setRate: setCommissionRate,
    lock: lockCommissions,
    unlock: unlockCommissions,
    reset: resetCommissions,
  }

  return (
    <ForecastCtx.Provider value={forecastValue}>
      <FundingCtx.Provider value={fundingValue}>
        <TicketVolumeCtx.Provider value={ticketVolumeValue}>
          <FixedCostsCtx.Provider value={fixedCostsValue}>
            <OfficeCostsCtx.Provider value={officeCostsValue}>
              <WagesCtx.Provider value={wagesValue}>
                <PricingCtx.Provider value={pricingValue}>
                  <CommissionsCtx.Provider value={commissionsValue}>
                    {children}
                  </CommissionsCtx.Provider>
                </PricingCtx.Provider>
              </WagesCtx.Provider>
            </OfficeCostsCtx.Provider>
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

export function useLockedOfficeCosts() {
  return useContext(OfficeCostsCtx)
}

export function useLockedWages() {
  return useContext(WagesCtx)
}

export function useLockedPricing() {
  return useContext(PricingCtx)
}

export function useLockedCommissions() {
  return useContext(CommissionsCtx)
}

// Re-export so consumers don't need a second import
export { FUNDING_RANGE }
