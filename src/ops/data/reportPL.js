// First live Report — "2025 sales on the 2026 cost base" (Hackney).
//
// Takes 2025 ACTUAL sales & P&L (canonical Monthly Summary basis — ties to the
// £30,896 actual profit) and re-costs it with the 2026 PREDICTED cost rules,
// so the founder sees what last year's trade would earn under the new lease
// and predicted costs. Two rent scenarios: Year-1 (3-month rent-free start)
// and steady state (full £65k lease).
//
// 2026 cost rules (per src/data/hackney.js):
//   • Rent: 2025 £94,146 → new lease £65,000/yr net. Year 1 = £48,750
//     (3 months rent-free). Wages: unchanged. VAT: scales with sales, so
//     unchanged at 2025 sales level. Variable & other-fixed: +10% inflation.
//     Director: new separate £15,885 line in 2026.
import { ACTUALS_2025, MONTHLY_INCOME, FORECAST, HACKNEY_FIXED_COSTS_2026 } from '../../data/hackney.js'

const A = ACTUALS_2025
export const RENT_2025 = 94146                         // old Plonk lease
const OTHER_FIXED_2025 = A.fixedCosts - RENT_2025      // Monthly-Summary residual
const VAR_INFLATION = 0.10
const OTHER_FIXED_INFLATION = 0.10
const DIRECTOR = FORECAST.director                     // 15,885 — new 2026 line

const variable2026   = A.variableCosts * (1 + VAR_INFLATION)
const otherFixed2026 = OTHER_FIXED_2025 * (1 + OTHER_FIXED_INFLATION)

function pnl(label, rent) {
  const fixed  = rent + otherFixed2026
  const costs  = A.wages + variable2026 + fixed + A.vatNet + DIRECTOR
  const profit = A.revenue - costs
  return {
    label, revenue: A.revenue, wages: A.wages, variable: variable2026,
    rent, otherFixed: otherFixed2026, fixed, vat: A.vatNet, director: DIRECTOR,
    profit, profitBeforeDirector: profit + DIRECTOR,
    margin: profit / A.revenue,
  }
}

export const ACTUAL_2025 = {
  label: '2025 actual',
  revenue: A.revenue, wages: A.wages, variable: A.variableCosts,
  rent: RENT_2025, otherFixed: OTHER_FIXED_2025, fixed: A.fixedCosts,
  vat: A.vatNet, director: 0,
  profit: A.profit, profitBeforeDirector: A.profit, margin: A.profit / A.revenue,
}
export const RECOST_Y1     = pnl('2025 sales · 2026 costs · Year 1 (rent-free start)', HACKNEY_FIXED_COSTS_2026.rentY1)
export const RECOST_STEADY = pnl('2025 sales · 2026 costs · steady state', HACKNEY_FIXED_COSTS_2026.rentSteady)

// Bridge: 2025 actual profit → steady-state recosted profit
export const BRIDGE = [
  { label: 'Rent saving (new £65k lease vs old £94k)', delta: RENT_2025 - HACKNEY_FIXED_COSTS_2026.rentSteady },
  { label: 'Variable cost inflation (+10%)',           delta: -(variable2026 - A.variableCosts) },
  { label: 'Other fixed inflation (+10%)',             delta: -(otherFixed2026 - OTHER_FIXED_2025) },
  { label: 'New director salary',                      delta: -DIRECTOR },
]

export const Y1_RENT_FREE_BONUS = HACKNEY_FIXED_COSTS_2026.rentSteady - HACKNEY_FIXED_COSTS_2026.rentY1

export const DECK_FORECAST = {   // context: the deck's full +15%-sales forecast
  revenue: FORECAST.revenue, profit: FORECAST.profit, margin: FORECAST.margin,
}

export const MONTHLY_2025 = MONTHLY_INCOME
export const PL_LINES = ['revenue', 'wages', 'variable', 'fixed', 'vat', 'director', 'profit']
export const PL_LABELS = {
  revenue: 'Revenue (sales)', wages: 'Wages', variable: 'Variable costs (stock, gas…)',
  fixed: 'Fixed costs (rent, rates, utilities…)', vat: 'VAT (net)',
  director: 'Director salary', profit: 'Profit',
}
