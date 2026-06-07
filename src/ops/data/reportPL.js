// First live Report — "Bar-only 2025 sales on the 2026 cost base" (Hackney).
//
// Re-cuts 2025 to the BAR-ONLY basis the venue runs on going forward: golf
// tickets are handed to Plonk Golf (no longer No Dice revenue) and the golf
// running-costs leave with them. Then it applies the 2026 predicted cost base
// (new £65k lease, +10% inflation, new director line).
//
// Why golf comes out: the lower rent is the counterpart to giving up golf —
// crediting the rent cut while still counting golf income would double-count
// the upside. Founder-confirmed: strip all £70,315 golf tickets + ~£31,423
// golf costs.
//
// ⚠ The source figures don't fully reconcile at line level (Monthly Summary
// £538k vs the bar-only income breakdown £523k vs golf ticket totals), so this
// is built as a transparent BRIDGE off the audited £30,896 actual profit — a
// planning view, not a re-audited P&L. Re-cut cleanly from the weekly P&L when
// a hard bar-only attribution is needed.
import { ACTUALS_2025, MONTHLY_INCOME, FORECAST, HACKNEY_FIXED_COSTS_2026 } from '../../data/hackney.js'

const A = ACTUALS_2025
export const RENT_2025 = 94146
export const GOLF_TICKETS = 70315          // £44,812 online (DMN) + £25,503 walk-in till
export const GOLF_COSTS   = 31423          // course lease £24k + host wages £4.4k + maintenance £3k
const OTHER_FIXED_2025 = A.fixedCosts - RENT_2025
const VAR_INFLATION = 0.10
const OTHER_FIXED_INFLATION = 0.10
const DIRECTOR = FORECAST.director          // 15,885

export const BAR_REVENUE = A.revenue - GOLF_TICKETS                 // ≈ £467,776
// Bar-only 2025 profit on the OLD cost base (golf gone, old £94k rent):
const BAR_2025_OLD = A.profit - GOLF_TICKETS + GOLF_COSTS           // ≈ −£7,996

const varInflation   = A.variableCosts * VAR_INFLATION             // £16,745
const otherInflation = OTHER_FIXED_2025 * OTHER_FIXED_INFLATION    // £2,073

function scenario(label, rent) {
  const profit = BAR_2025_OLD + (RENT_2025 - rent) - varInflation - otherInflation - DIRECTOR
  return {
    label, revenue: BAR_REVENUE, rent, profit,
    profitBeforeDirector: profit + DIRECTOR,
    margin: profit / BAR_REVENUE,
  }
}

export const ACTUAL_2025 = {                 // as reported, golf included (context)
  label: '2025 actual (golf included)',
  revenue: A.revenue, profit: A.profit, margin: A.profit / A.revenue,
}
export const RECOST_Y1     = scenario('Bar-only · 2026 costs · Year 1 (rent-free start)', HACKNEY_FIXED_COSTS_2026.rentY1)
export const RECOST_STEADY = scenario('Bar-only · 2026 costs · steady state', HACKNEY_FIXED_COSTS_2026.rentSteady)
export const Y1_RENT_FREE_BONUS = HACKNEY_FIXED_COSTS_2026.rentSteady - HACKNEY_FIXED_COSTS_2026.rentY1

// Bridge: audited 2025 actual → bar-only steady-state, every step visible.
export const BRIDGE = [
  { label: 'Golf tickets — handed to Plonk Golf', delta: -GOLF_TICKETS, note: 'no longer No Dice revenue' },
  { label: 'Golf running-costs removed',          delta: +GOLF_COSTS,   note: 'course lease, host, maintenance' },
  { label: 'Bar rent saving (£94k → £65k lease)', delta: RENT_2025 - HACKNEY_FIXED_COSTS_2026.rentSteady },
  { label: 'Variable cost inflation (+10%)',      delta: -varInflation },
  { label: 'Other fixed inflation (+10%)',        delta: -otherInflation },
  { label: 'New director salary',                 delta: -DIRECTOR },
]

export const DECK_FORECAST = { revenue: FORECAST.revenue, profit: FORECAST.profit, margin: FORECAST.margin }
export const MONTHLY_2025 = MONTHLY_INCOME   // golf-inclusive monthly shape (context)
