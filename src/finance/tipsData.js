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
  '2026-07': { skye: 179.38, theo: 146.45, elliot: 91.75, rhys: 39.88 }, // elliot incl. unattributed £7.42
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
