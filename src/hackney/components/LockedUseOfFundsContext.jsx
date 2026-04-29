import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react'
import {
  USE_OF_FUNDS,
  USE_OF_FUNDS_RANGES,
  HACKNEY_RAISE_TARGET,
  WAGE_RATES,
  PL_WAGE_BASE,
  WAGE_OVERHEAD_MULT,
} from '../../data/hackney.js'

// ─── Locked Use-of-Funds context (Hackney) ─────────────────────────────
// Single source of truth for the funding amount + 7-line use-of-funds
// breakdown. Consumed by:
//   • FundingSlider (on Cover) — sets fundingAmount + lock/unlock
//   • UseOfFunds slide — drives the 6 allocation sliders + WC residual
//   • Cover, MarketContext, InvestmentSummary, WaterfallReturns,
//     VenueInfo Development tab, BusinessExplorer Cashflow tab —
//     read `effective.*` so every figure cascades from one variable
//
// State model:
//   • values     — live editable state (founder edits these)
//   • snapshot   — locked snapshot or null
//   • effective  — locked snapshot if locked, else derived(values)
//                  (so consumer slides can render off ONE shape and
//                  always see live preview during founder edits)
//
// Persistence:
//   • locked snapshot   → localStorage (every user — read-only for
//                          non-founder so the Hackney deck shows the
//                          founder's locked story by default)
//   • live values       → localStorage (founder only — preserves
//                          editing progress across page refresh)
//
// Founder detection:
//   • sessionStorage.ndb_founder === '1' (set by PasswordGate at 888999)
//   • OR URL ?founder=888999 (one-time link grant; promotes to session)
// ───────────────────────────────────────────────────────────────────────

const LIVE_KEY = 'ndh_live_useoffunds_v1'
const LOCK_KEY = 'ndh_locked_useoffunds_v1'
const WAGE_LIVE_KEY = 'ndh_wage_live_v1'
const WAGE_LOCK_KEY = 'ndh_wage_locked_v1'

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

  const isFounder = readIsFounder()
  const isLocked = snapshot !== null
  const canEdit = isFounder && !isLocked
  const isWageLocked = wageSnapshot !== null
  const canEditWages = isFounder && !isWageLocked

  // Persist live values (founder only) so editing progress survives reload.
  useEffect(() => {
    if (!isFounder) return
    try { localStorage.setItem(LIVE_KEY, JSON.stringify(values)) } catch {}
  }, [values, isFounder])

  useEffect(() => {
    if (!isFounder) return
    try { localStorage.setItem(WAGE_LIVE_KEY, JSON.stringify(wageRows)) } catch {}
  }, [wageRows, isFounder])

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
