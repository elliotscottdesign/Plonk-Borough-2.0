import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react'
import {
  USE_OF_FUNDS,
  USE_OF_FUNDS_RANGES,
  BOROUGH_RAISE_TARGET,
  FUNDING_RANGE,
} from '../data.js'

// ─── Locked Funding context (Borough) ──────────────────────────────────
// Single source of truth for the funding amount + 5-line use-of-funds
// breakdown. Mirrors Hackney's LockedUseOfFundsContext but adapted for
// Borough's deal structure:
//   • Rent      — 1/2/3-month snap slider (lease cadence)
//   • Hardware  — continuous slider, £0–£24k inc VAT (liquidator cap)
//   • IP        — fixed £12k contractual licence (no slider)
//   • Stock     — continuous slider, £3k–£8k around £4.9k default
//   • Working   — derived residual (funding − allocated), never editable
//
// Consumers:
//   • FundingSlider (Cover)          — sets effective.investment + lock
//   • UseOfFunds slide               — drives 3 sliders + WC residual
//   • Cover stat cards               — read effective.* for live cascade
//   • InvestmentSummary Explore tool — locked total caps the sub-slider
//   • WaterfallReturns               — per-investor returns
//   • BusinessExplorer Cashflow tab  — investor capital recovered metric
//
// State model mirrors Hackney exactly:
//   • values     — live editable state (founder edits these)
//   • snapshot   — locked snapshot or null
//   • effective  — locked snapshot if locked, else derived(values)
//
// Founder access: PasswordGate at 888999 sets sessionStorage.ndb_founder.
// Alt: ?founder=888999 query promotes the session (shareable links).
//
// NB: Borough already has LockedForecastContext for the 2026 Performance
// lock — this is a separate context for the funding/use-of-funds lock,
// kept independent so the existing forecast wiring is undisturbed.
// ───────────────────────────────────────────────────────────────────────

const LIVE_KEY = 'ndb_funding_live_v1'
const LOCK_KEY = 'ndb_funding_locked_v1'

// Build the default live values from the static USE_OF_FUNDS list. `rentMonths`
// is a UI-only field that drives the rent £ amount via a snap lookup.
function buildDefaults() {
  const byKey = Object.fromEntries(USE_OF_FUNDS.map(u => [u.key, u]))
  return {
    investment: BOROUGH_RAISE_TARGET,
    rentMonths: 3,
    rent:       byKey.rent.amount,      // £27,078 = 3 months
    hardware:   byKey.hardware.amount,  // £24,000 max
    ip:         byKey.ip.amount,        // £12,000 fixed
    stock:      byKey.stock.amount,     // £4,900 default
  }
}

// Map rentMonths slider position → £ deposit amount via the lease snaps.
function rentAmountForMonths(months) {
  const snap = USE_OF_FUNDS_RANGES.rent.snaps.find(s => s.months === months)
  return snap ? snap.amount : USE_OF_FUNDS_RANGES.rent.snaps[0].amount
}

// Compute the derived snapshot shape from a values map. `total`,
// `allocated`, `workingCapital`, `overAllocated` are all derived.
// IP is always fixed at the contractual £12k — no override.
function deriveSnapshot(v) {
  const ipFixed = USE_OF_FUNDS_RANGES.ip.fixed
  const total = v.investment
  const allocated = v.rent + v.hardware + ipFixed + v.stock
  return {
    ...v,
    ip: ipFixed,                                          // always £12k
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

const LockedFundingContext = createContext({
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

export function LockedFundingProvider({ children }) {
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
        rentMonths: lock.rentMonths ?? d.rentMonths,
        rent:       lock.rent       ?? d.rent,
        hardware:   lock.hardware   ?? d.hardware,
        ip:         lock.ip         ?? d.ip,
        stock:      lock.stock      ?? d.stock,
      }
    }
    return buildDefaults()
  })

  const isFounder = readIsFounder()
  const isLocked  = snapshot !== null
  const canEdit   = isFounder && !isLocked

  // Persist live values (founder only) so editing progress survives reload.
  useEffect(() => {
    if (!isFounder) return
    try { localStorage.setItem(LIVE_KEY, JSON.stringify(values)) } catch {}
  }, [values, isFounder])

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

  const ctx = {
    values, snapshot, effective,
    isLocked, isFounder, canEdit,
    setValue, lock, unlock, reset,
  }

  return (
    <LockedFundingContext.Provider value={ctx}>
      {children}
    </LockedFundingContext.Provider>
  )
}

export function useLockedFunding() {
  return useContext(LockedFundingContext)
}

// Re-export for convenience so consumers can pull the range without a
// second import.
export { FUNDING_RANGE }
