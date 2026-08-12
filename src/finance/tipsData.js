// ─── Card tips per person, by month (finance lane owns this file) ────────────
// Source: Lightspeed Payments export (Order reports → Payments, "Gratuity
// amount" column), attributed via till login → person mapping set by the
// founder on 11 Aug 2026: Trial→Theo, Ruby→Skye, Rhys→Rhys, Elliot S→Elliot.
// Covers 19 Jun – 10 Aug 2026 (full-history export received 11 Aug; earlier
// exports were range-capped). Login "Jonny B" → Jonny (Brooks).
// Refresh: founder exports a new payments CSV → Claude (finance lane) updates
// these numbers. Unattributed = tips on payments with no till login recorded;
// they get folded into the pool at payout time at the founder's discretion.
//
// Payout rules (Employment (Allocation of Tips) Act 2023): 100% passed on,
// no deductions except tax, paid by end of the month after they were earned.
//
// KITCHEN FOOD-TIP RULE (founder, 12 Aug 2026): if an order contained ANY food
// (accounting group Food or Bar Food) then the WHOLE tip on that order goes to
// the kitchen team who worked that shift, split equally if more than one chef.
// Kitchen team = staff with role "Kitchen / Barback" who clocked in that day.
// Method: payments export joined to line transactions on (order total, time)
// to see which orders had food; rota clock-ins give the chef. Days before the
// rota went live (8 Jul 2026) have no chef on record — those food tips stay
// with the bar staff until the founder confirms who cooked.

// Per-day food sales, food-order tips and the chef(s) on shift — 19 Jun to
// 31 Jul 2026. "—" days had no kitchen-role staff clocked in.
export const FOOD_TIP_DAYS = [
  { date: '2026-06-19', foodSales: 138.20, foodTips: 1.22, chefs: [] },
  { date: '2026-06-20', foodSales: 245.00, foodTips: 3.27, chefs: [] },
  { date: '2026-06-21', foodSales: 23.10,  foodTips: 3.37, chefs: [] },
  { date: '2026-06-24', foodSales: 54.80,  foodTips: 0.87, chefs: [] },
  { date: '2026-06-26', foodSales: 80.10,  foodTips: 1.55, chefs: [] },
  { date: '2026-07-01', foodSales: 77.00,  foodTips: 0.50, chefs: [] },
  { date: '2026-07-02', foodSales: 96.00,  foodTips: 1.15, chefs: [] },
  { date: '2026-07-03', foodSales: 261.00, foodTips: 1.20, chefs: [] },
  { date: '2026-07-04', foodSales: 283.50, foodTips: 9.60, chefs: [] },
  { date: '2026-07-08', foodSales: 15.50,  foodTips: 3.15, chefs: [] },
  { date: '2026-07-09', foodSales: 167.00, foodTips: 1.50, chefs: ['Natthasiri'] },
  { date: '2026-07-10', foodSales: 120.40, foodTips: 4.55, chefs: [] },
  { date: '2026-07-18', foodSales: 45.50,  foodTips: 49.36, chefs: ['Natthasiri'] },
  { date: '2026-07-24', foodSales: 215.80, foodTips: 6.64, chefs: ['Natthasiri'] },
  { date: '2026-07-25', foodSales: 380.50, foodTips: 5.70, chefs: ['Natthasiri'] },
  { date: '2026-07-30', foodSales: 535.83, foodTips: 2.08, chefs: ['Leonie', 'Natthasiri'] },
]
// Food sales on days with no tips are omitted above; full-period food sales
// 19 Jun–31 Jul = £3,525.33, of which £95.71 of tips arrived on food orders.
export const FOOD_TIP_TOTALS = { foodSales: 3525.33, foodTips: 95.71, assignedToChefs: 65.28, awaitingChefName: 30.43 }

export const TIPS_META = {
  updated: '11 Aug 2026',
  coverageFrom: '19 Jun 2026',
  coverageTo: '10 Aug 2026',
  // Founder ruling 11 Aug: unattributed tips and the "Jonny B" login's tips
  // are folded into Elliot's numbers below.
  unattributed: {},
}

// month (YYYY-MM) → first-name → £
const TIPS_BY_MONTH = {
  '2026-06': { elliot: 153.48, rhys: 13.54, skye: 8.46 },              // elliot incl. Jonny B £17.48
  // July after the KITCHEN FOOD-TIP RULE (see FOOD_TIP_RULE below): £65.28 of
  // tips on orders containing food moved from the bar logins to the chefs on
  // that shift. £20.15 stays with the bar (June/early-July days have no rota).
  '2026-07': { skye: 120.47, theo: 143.40, elliot: 89.93, rhys: 38.38, natthasiri: 64.24, leonie: 1.04 },
  '2026-08': { theo: 47.92, skye: 61.61, elliot: 28.86, rhys: 2.13 },    // elliot incl. unattributed £4.30
}

const MONTH_LABELS = { '2026-06': 'June 2026 (from 19th)', '2026-07': 'July 2026', '2026-08': 'August 2026' }

const firstNameKey = (name) => String(name || '').trim().split(/\s+/)[0].toLowerCase()

// Rows [{month, label, amount}] for one staff member, newest first.
export function tipsForStaff(name) {
  const key = firstNameKey(name)
  const rows = []
  for (const m of Object.keys(TIPS_BY_MONTH).sort().reverse()) {
    const amt = TIPS_BY_MONTH[m][key]
    if (amt != null) rows.push({ month: m, label: MONTH_LABELS[m] || m, amount: amt })
  }
  return rows
}

export function tipsForStaffMonth(name, month) {
  const amt = TIPS_BY_MONTH[month]?.[firstNameKey(name)]
  return amt == null ? 0 : amt
}
