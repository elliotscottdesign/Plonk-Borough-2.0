import React, { createContext, useContext, useState, useCallback } from 'react'

// ─── Locked-forecast context ───────────────────────────────────────────
// When the user clicks "Lock" on the 2026 Performance tab, the live
// forecast totals are captured into a snapshot. Deck slides (and the
// Custom scenario cards on each one) read from this snapshot to show
// the user's modelled scenario alongside the static Conservative /
// Base / Optimistic presets.
//
// snapshot shape: {
//   revenue:        number  // Adjusted Revenue 2026
//   totalCosts:     number  // Total Costs 2026 (incl. VAT)
//   ebitda:         number  // Revenue − operating costs (excl. VAT)
//   profitAfterVat: number  // Revenue − total costs (= bottom line)
//   netVat:         number  // Net VAT to HMRC
//   opProfit:       number  // alias for profitAfterVat (waterfall slide)
//   margin:         number  // ebitda margin as decimal (0.30 = 30%)
//   profitAfterVatMargin: number
// } | null
//
// snapshot is null when the tab is unlocked. Slides that read it should
// fall back to their static base values when null.
// ───────────────────────────────────────────────────────────────────────

const LockedForecastContext = createContext({
  snapshot: null,
  isLocked: false,
  lock: () => {},
  unlock: () => {},
})

export function LockedForecastProvider({ children }) {
  const [snapshot, setSnapshot] = useState(null)

  const lock = useCallback((data) => {
    setSnapshot(data ?? null)
  }, [])

  const unlock = useCallback(() => {
    setSnapshot(null)
  }, [])

  const value = {
    snapshot,
    isLocked: snapshot !== null,
    lock,
    unlock,
  }

  return (
    <LockedForecastContext.Provider value={value}>
      {children}
    </LockedForecastContext.Provider>
  )
}

export function useLockedForecast() {
  return useContext(LockedForecastContext)
}
