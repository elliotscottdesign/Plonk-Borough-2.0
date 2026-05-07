// NO DICE BOROUGH LTD — VERIFIED FINANCIAL DATA
// All figures from verified 2025 categorised weekly P&L and GA4 (Windsor.ai)

export const BUSINESS = {
  name: 'No Dice Borough Ltd',
  location: 'Borough Market, SE1',
  description: 'Experience bar · Mini golf · Pool · Arcades · Board games',
}

// === EXTERNAL WORKBOOK ===
// Central financial workbook — investors view monthly P&L, scenarios, valuation
// breakdowns alongside the deck. Updated to match data.js after every restructure.
export const WORKBOOK_URL = 'https://docs.google.com/spreadsheets/d/1dtqbmoKK01oRY-0Zi1ZllVh82NiIGk8eS-l8aKJG_8Y/edit?usp=sharing'

// === LOCK SYNC ENDPOINT ===
// Cross-device sync for the 2026 Performance locked snapshot.
//
// When the founder clicks Lock on the 2026 Performance tab, the snapshot is
// (1) saved to localStorage (per-browser fallback) and (2) POSTed to this URL
// for cross-device sync. On every page boot, data-bootstrap.js GETs from
// this URL and seeds the LockedForecastContext — so investors visiting from
// any browser see the founder's latest locked forecast.
//
// To enable, deploy ONE of the two server snippets in /infra and paste the
// resulting URL below. Leave empty to fall back to localStorage-only mode.
//   - infra/lock-sync-apps-script.gs   — Google Apps Script web app (free,
//                                        writes to a cell on the existing
//                                        workbook, simplest setup).
//   - infra/lock-sync-worker.js        — Cloudflare Worker + KV (also free,
//                                        slightly faster, fully decoupled
//                                        from the workbook).
//
// Both implementations expect:
//   GET  → { snapshot: <object>|null }
//   POST { snapshot: <object>|null } → { ok: true }
export const LOCK_SYNC_URL = 'https://script.google.com/macros/s/AKfycbyg5MJVpguI-PfaDZj9R151iCppXScwHEAGXJ7fnDm_luhqbjjF8684XVy4-S1UtjS5/exec'
// Optional shared secret — sent with POST requests for write authorisation.
// The server snippets check this before writing. Leave empty if your endpoint
// is already access-restricted (e.g. Cloudflare Worker behind Access).
export const LOCK_SYNC_SECRET = ''

// === NOTES SYNC ENDPOINT ============================================
// Separate Apps Script web app for the per-page notes feature. Stores
// each access code's notes blob (one row per code) in a "Notes" sheet
// and emails the founder when a note is saved. Deployment instructions
// in infra/notes-apps-script.gs.
//
// Until this URL is set, notes still work locally (localStorage
// namespaced by access code) — the server POST + email simply skip,
// and the founder cross-user view shows the local user only.
//
// Endpoints (handled by infra/notes-apps-script.gs):
//   GET  ?code=<CODE>           → { notes: <blob>|null }
//   GET  ?all=1&secret=<SECRET> → { rows: [{ code, notes, updatedAt }] }
//   POST { code, notes, page, text, secret? } → upserts row + emails founder
export const NOTES_SYNC_URL = 'https://script.google.com/macros/s/AKfycbzvyCat8VRBwpAqtlNmkXnYmnmNiTKkA8mW-ySPp53LJF0IAk7NnrjKlFZlRPoqTFy-/exec'
export const NOTES_SYNC_SECRET = ''
// Founder email — receives a notification when any user leaves a note.
export const NOTES_FOUNDER_EMAIL = 'elliotscottdesign@gmail.com'

// === DEAL STRUCTURE ===
// Investment ask £79,000 inc VAT. 50/50 equity — pre-money equal to investment (£79k),
// post-money £158k. Multiple works out at 0.86× 2025 EBITDA (distressed pricing).
//
// Forecast operating profit (2026 base case) reflects the realistic 2026 P&L under
// the new cost rules: wages +10%, non-rent fixed +10%, drinks = 30% of bar, rent =
// 15% of turnover (contractual, NO inflation), everything else scales with revenue.
// Replaces the older 22.4%-margin blanket and the now-deprecated flat rent inflation.
//
// DISTRIBUTION MODEL: pure pro-rata — all shareholders paid at the same time by equity %.
// No preferred return, no A-share priority. Full operating profit flows through the split.
// 50/50 pro-rata equity split — single share class. The investor and the
// founder both hold 50% of the post-money equity. Every other deal figure
// (pre-money, post-money, multiple, A-share floor, investor dividend, CoC,
// payback) flexes with the locked Cover funding amount and is computed live
// via computeDealFromInvestment(investment).
//
// Historical fields (DEAL.investment, DEAL.preMoney, DEAL.postMoney,
// DEAL.multiple, DEAL.investorDividend, DEAL.totalInvestorReturn, DEAL.coc,
// DEAL.payback, DEAL.aShareThreshold, DEAL.preferred, DEAL.aSharePriority)
// were stripped on 2026-04-30 — no consumer reads them anymore. Use
// computeDealFromInvestment(funding.investment) instead.
export const DEAL = {
  founderEq: 0.50,
  investorEq: 0.50,
}

// === 2025 ACTUALS ===
// Reconciled to "Borough Weekly Totals CATEGORISED PAST 14 MONTHS V2.xlsx" — the
// authoritative weekly P&L. 2025 = ISO weeks starting 30/12/24 through 28/12/25
// (52 weeks in source xlsx cols 12-63). Categories below match source summary
// rows R70-R77 exactly. See the workbook's "2025 Weekly Categorised Costs"
// sheet for the full week-by-week breakdown.
export const ACTUALS_2025 = {
  revenue: 741644,
  wages: 242370,
  fixedCosts: 165647,   // source R71 — was £165,059 (£588 drift, line item moved between extractions)
  drinksGas: 80609,     // source R72 — Nisbets (£1,123) reclassified to cleaning per source
  vatNet: 78851,
  cleaning: 22965,      // source R73 — now includes Nisbets Stock £1,123
  arcades: 17152,
  food: 9101,
  googleAds: 8918,      // website/Lithos costs in P&L (not pure Google Ads)
  cardCharges: 5443,
  profit: 111177,
  ebitda: 91950,
}

// === 2026 FORECAST (Base Case +15%) ===
// Profit reflects the real 2026 cost model — wages +10%, non-rent fixed +10%,
// drinks = 30% of bar, rent = 15% of turnover (contractual, NO inflation), etc.
export const FORECAST = {
  revenue: 852891,
  profit: 124000,
  margin: 0.1454,
}

// === INCOME BY SOURCE (Jan–Dec 2025) ===
export const INCOME_SOURCES = [
  { name: 'Spend at Bar',       amount: 362836, pct: 48.9, color: '#0D1F4C' },
  { name: 'Online Golf Tickets',amount: 210485, pct: 28.4, color: '#1565C0' },
  { name: 'Bookings & Events',  amount: 106023, pct: 14.3, color: '#1976D2' },
  { name: 'Private Hires',      amount:  44999, pct:  6.1, color: '#1E88E5' },
  { name: 'Service Charge',     amount:  15102, pct:  2.0, color: '#039BE5' },
  { name: 'Pool Tickets',       amount:   2198, pct:  0.3, color: '#4FC3F7' },
]

// === COSTS BY CATEGORY (Jan–Dec 2025) ===
// Reconciled to source xlsx R70-R77. Total: £631,056.
export const COST_CATEGORIES = [
  { name: 'Wages',        amount: 242370, pct: 38.4, color: '#4A0000' },
  { name: 'Fixed Costs',  amount: 165647, pct: 26.2, color: '#7B0000' },
  { name: 'Drinks & Gas', amount:  80609, pct: 12.8, color: '#B71C1C' },
  { name: 'VAT (Net)',     amount:  78851, pct: 12.5, color: '#C62828' },
  { name: 'Cleaning',     amount:  22965, pct:  3.6, color: '#E53935' },
  { name: 'Arcades',      amount:  17152, pct:  2.7, color: '#D84315' },
  { name: 'Food',         amount:   9101, pct:  1.4, color: '#EF6C00' },
  { name: 'Google/Digital',amount:  8918, pct:  1.4, color: '#F9A825' },
  { name: 'Card Charges', amount:   5443, pct:  0.9, color: '#FDD835' },
]

// === MONTHLY DATA (Jan–Dec 2025) ===
export const MONTHLY_INCOME = [
  { month: 'Jan', amount: 56225  },
  { month: 'Feb', amount: 56314  },
  { month: 'Mar', amount: 58218  },
  { month: 'Apr', amount: 53275  },
  { month: 'May', amount: 46513  },
  { month: 'Jun', amount: 59875  },
  { month: 'Jul', amount: 60901  },
  { month: 'Aug', amount: 56214  },
  { month: 'Sep', amount: 56246  },
  { month: 'Oct', amount: 53213  },
  { month: 'Nov', amount: 62892  },
  { month: 'Dec', amount: 121758 },
]

export const MONTHLY_COSTS = [
  { month:'Jan', wages:19401, fixed:12658, drinks:6736, vat:5798, cleaning:1654, arcades:1287, food:652, google:743, card:420 },
  { month:'Feb', wages:16556, fixed:11826, drinks:6621, vat:6024, cleaning:1487, arcades:1430, food:758, google:629, card:415 },
  { month:'Mar', wages:24622, fixed:12957, drinks:5279, vat:6350, cleaning:2001, arcades:1287, food:869, google:743, card:435 },
  { month:'Apr', wages:21824, fixed:11371, drinks:4614, vat:5943, cleaning:1817, arcades:1287, food:869, google:629, card:399 },
  { month:'May', wages:20881, fixed:10356, drinks:6684, vat:4644, cleaning:1656, arcades:1287, food:760, google:629, card:349 },
  { month:'Jun', wages:25393, fixed:13206, drinks:8333, vat:6045, cleaning:1893, arcades:1430, food:869, google:743, card:449 },
  { month:'Jul', wages:22360, fixed:13359, drinks:9247, vat:5974, cleaning:2212, arcades:1430, food:978, google:743, card:456 },
  { month:'Aug', wages:20563, fixed:12387, drinks:6443, vat:5972, cleaning:1893, arcades:1430, food:868, google:629, card:421 },
  { month:'Sep', wages:19309, fixed:14116, drinks:6078, vat:5727, cleaning:1754, arcades:1430, food:651, google:629, card:421 },
  { month:'Oct', wages:17420, fixed:13617, drinks:8278, vat:4912, cleaning:1893, arcades:1430, food:651, google:629, card:399 },
  { month:'Nov', wages:16110, fixed:15188, drinks:9666, vat:6099, cleaning:1539, arcades:1430, food:652, google:629, card:471 },
  { month:'Dec', wages:17931, fixed:24018, drinks:3753, vat:15364, cleaning:2039, arcades:1430, food:652, google:743, card:1007 },
]

export const MONTHLY_PROFIT = [
  { month:'Jan', income:56225,  profit:6318  },
  { month:'Feb', income:56314,  profit:9270  },
  { month:'Mar', income:58218,  profit:3835  },
  { month:'Apr', income:53275,  profit:4020  },
  { month:'May', income:46513,  profit:-704  },
  { month:'Jun', income:59875,  profit:1340  },
  { month:'Jul', income:60901,  profit:4288  },
  { month:'Aug', income:56214,  profit:5992  },
  { month:'Sep', income:56246,  profit:5675  },
  { month:'Oct', income:53213,  profit:4781  },
  { month:'Nov', income:62892,  profit:11201 },
  { month:'Dec', income:121758, profit:55162 },
]

// === WAGES — 2026 PLANNING RATES + HOURS ===
// 2026 staffing model:
//   Bar Staff      same as 2025 (4,967 hrs)
//   Shift Sup      part-time            1,000 hrs  (was 2,859 — supervisor hours
//                                                   reallocated to a 2nd full-time
//                                                   asst manager, see below)
//   Asst Manager   full-time            2,000 hrs  (was   505 — promoted to FT)
//   Manager        full-time            2,000 hrs  (was 1,712 — bumped to FT)
// Total 2026 hours: 9,967 (vs 10,043 in 2025) — slight reduction with senior shift.
//
// The P&L wage line in 2026 = (sum of slider rate × hours above) × overhead
// multiplier (= ACTUALS_2025.wages / ROTA_TOTAL = ~1.586). The multiplier covers
// Employer NICs, pension auto-enrolment, holiday pay, agency cover, training.
export const WAGE_RATES = [
  { role:'Bar Staff',        rate:13.85, hours:4967, color:'#E67E22' },
  { role:'Supervisor',       rate:14.35, hours:1000, color:'#D4A843' },
  { role:'Asst. Manager',    rate:15.38, hours:2000, color:'#94A3B8' },
  { role:'Manager',          rate:18.00, hours:2000, color:'#0D9488' },
]

export const PL_WAGE_BASE = 242370   // 2025 verified P&L wage line
export const ROTA_TOTAL   = 152801   // 2025 rota cost (rate × hours, before overhead)
// 2025 P&L : Rota = 1.5862 — used to scale 2026 rota cost up to a P&L-equivalent figure.
export const WAGE_OVERHEAD_MULT = PL_WAGE_BASE / ROTA_TOTAL

// === DIGITAL MARKETING (GA4 verified) ===
export const MARKETING = {
  // 2025 actuals
  googleAdsSpend2025: 580,
  googleAdsClicks: 1827,
  googleAdsCPC: 0.32,
  googleAdsConversions: 105,
  googleAdsCostPerConv: 5.53,
  googleAdsActiveDays: 37,
  organicSessions2025: 77801,
  organicSessions2024: 114228,
  // 2026 plan
  websiteMaintenance: 3492,  // £291/mth
  seoOutreach: 10464,        // £872/mth
  googleAdsBudget2026: 7200, // £600/mth
  totalDigital2026: 21156,
}

// === WATERFALL ===
// Pure pro-rata — no preferred or A-share priority. Operating profit splits 50/50.
export const WATERFALL = {
  operatingProfit: 124000,
  preferred: 0,
  aSharePriority: 0,
  remainingPool: 124000,       // = operating profit (no tier deductions)
  investorDividend: 62000,     // 50% × £124,000
  founderDividend: 62000,      // 50% × £124,000
  totalInvestor: 62000,
  totalFounder: 62000,
}

// === WORKING-CAPITAL RESERVE ===
// Two-zone safety band used by the Distribution Calendar on the Investor
// Returns slide. The FLOOR comes live from useLockedFunding().effective.rent
// (the rent-prepay snap chosen on Use of Funds — £9,026 / £18,052 / £27,078
// for 1 / 2 / 3 months). The TARGET adds a cushion for VAT bills + supplier
// swings + repairs, mirroring the Hackney deck's £30k/£45k floor/target
// pattern but anchored to Borough's own rent-prepay constant so the band
// scales with the locked use-of-funds choice.
export const BOROUGH_WORKING_CAPITAL_CUSHION = 15000

// === 5-YEAR INVESTOR RETURNS ===
// Y1 profit = FORECAST.profit (£124,000 base case under the new 2026 cost
// model). Y2-Y5 compound at +10% YoY — placeholder assumption that should
// be reviewed against the workbook's multi-year P&L when one is built.
// Y5 exit pegged at 4× EBITDA (sector standard for hospitality/leisure
// asset sales — same multiple Hackney uses).
//
// Investor / founder shares assume the static 50/50 equity split (DEAL
// .investorEq, .founderEq). The slide overlays the live locked investment
// to compute MoM / CoC / IRR — those flex with the funding slider; the
// underlying profit + revenue series here does not.
const _byo_5y_compound = (base, rate, years) =>
  Array.from({ length: years }, (_, i) => Math.round(base * Math.pow(1 + rate, i)))
const _byo_y_profits   = _byo_5y_compound(124000, 0.10, 5)   // FORECAST.profit
const _byo_y_revenues  = _byo_5y_compound(852891, 0.10, 5)   // FORECAST.revenue
const _byo_y5_ebitda   = _byo_y_profits[4]
const _byo_exit_value  = _byo_y5_ebitda * 4

export const BOROUGH_INVESTOR_RETURNS = {
  fiveYear: _byo_y_profits.map((profit, i) => ({
    year:          `Y${i + 1} ${2026 + i}/${(27 + i).toString().padStart(2, '0')}`,
    revenue:       _byo_y_revenues[i],
    profit,
    investorShare: profit * 0.5,
    founderShare:  profit * 0.5,
  })),
  cumulativeDividends: _byo_y_profits.reduce((s, p) => s + p * 0.5, 0),
  exit: {
    y5Ebitda:         _byo_y5_ebitda,
    multiple:         4,
    businessValue:    _byo_exit_value,
    investorProceeds: _byo_exit_value * 0.5,
    founderProceeds:  _byo_exit_value * 0.5,
  },
}

// === DISTRIBUTION CALENDAR (12-month, quarterly dividends) ===
// Working-capital-first model: every month's operating profit refills the
// reserve (target passed as opts.reserveTarget — caller supplies the live
// funding.rent floor) before any distribution. Once the reserve is full,
// surplus profit accrues into a quarterly dividend pool. At quarter-end
// (Mar / Jun / Sep / Dec) the accrued surplus pays out — split by
// investorEq / founderEq (defaults to DEAL's 50/50). Loss months net
// against the reserve before any subsequent dividend.
//
// Borough monthly profit series = MONTHLY_PROFIT (2025 actuals) scaled
// proportionally up to FORECAST.profit (£124k 2026 base case) so seasonality
// is preserved while the annual total reflects the 2026 forecast.
//
// Output shape matches the Hackney equivalent so the slide renders the
// same way:
//   calendar  — 12 rows: { month, profit, reserveAdd, reserveBalance,
//                          surplus, cumulativeAccrual, isQuarterEnd,
//                          dividendPaid, investorShare, founderShare,
//                          reservePct }
//   quarterly — 4 rows: Q1-Q4 dividend payouts.
//   summary   — { reserveTarget, reserveFullMonth, annualProfit,
//                 totalDividends, totalInvestor, totalFounder,
//                 yearEndAccrual, yearEndReserve }.
export function computeBoroughDistributionCalendar(opts = {}) {
  const reserveTarget = opts.reserveTarget ?? 27078   // 3-month rent default
  const investorEq    = opts.investorEq    ?? 0.5
  const founderEq     = opts.founderEq     ?? (1 - investorEq)

  // Scale the 2025 monthly profit series to the 2026 forecast total so
  // seasonality is preserved.
  const baseAnnual = MONTHLY_PROFIT.reduce((s, m) => s + m.profit, 0)
  const scale      = baseAnnual > 0 ? 124000 / baseAnnual : 1   // FORECAST.profit

  const QUARTER_END_IDX = new Set([2, 5, 8, 11])  // Mar / Jun / Sep / Dec
  let reserveBalance    = 0
  let cumulativeAccrual = 0
  let reserveFullMonth  = null

  const calendar = MONTHLY_PROFIT.map((row, i) => {
    const monthlyProfit = row.profit * scale
    let reserveAdd = 0
    let surplus    = 0

    if (monthlyProfit >= 0) {
      const room = Math.max(0, reserveTarget - reserveBalance)
      reserveAdd = Math.min(monthlyProfit, room)
      reserveBalance += reserveAdd
      surplus = monthlyProfit - reserveAdd
    } else {
      const loss = -monthlyProfit
      const fromReserve = Math.min(reserveBalance, loss)
      reserveBalance -= fromReserve
      reserveAdd = -fromReserve
      surplus = -(loss - fromReserve)
    }

    cumulativeAccrual += surplus
    if (reserveBalance >= reserveTarget && !reserveFullMonth) reserveFullMonth = row.month

    const isQuarterEnd = QUARTER_END_IDX.has(i)
    let dividendPaid  = 0
    let investorShare = 0
    let founderShare  = 0
    if (isQuarterEnd) {
      dividendPaid  = Math.max(0, cumulativeAccrual)
      investorShare = dividendPaid * investorEq
      founderShare  = dividendPaid * founderEq
      cumulativeAccrual -= dividendPaid
    }

    return {
      month: row.month,
      profit: monthlyProfit,
      reserveAdd,
      reserveBalance,
      surplus,
      cumulativeAccrual,
      isQuarterEnd,
      dividendPaid,
      investorShare,
      founderShare,
      reservePct: Math.min(1, reserveBalance / reserveTarget),
    }
  })

  const quarterly = calendar.filter(c => c.isQuarterEnd).map((q, i) => ({
    quarter:       `Q${i + 1}`,
    endMonth:      q.month,
    dividend:      q.dividendPaid,
    investorShare: q.investorShare,
    founderShare:  q.founderShare,
  }))

  return {
    calendar,
    quarterly,
    summary: {
      reserveTarget,
      reserveFullMonth: reserveFullMonth ?? 'not reached in Y1',
      annualProfit:     calendar.reduce((s, m) => s + m.profit, 0),
      totalDividends:   quarterly.reduce((s, q) => s + q.dividend, 0),
      totalInvestor:    quarterly.reduce((s, q) => s + q.investorShare, 0),
      totalFounder:     quarterly.reduce((s, q) => s + q.founderShare, 0),
      yearEndAccrual:   cumulativeAccrual,
      yearEndReserve:   reserveBalance,
    },
  }
}

// === GOVERNANCE ===
export const GOVERNANCE = {
  ordinaryThreshold: 0.50,
  reservedThreshold: 0.75,
  aShareMinEquity: 0.05,
  reservedMatters: [
    'Sale of the business or any material asset',
    'Winding up or dissolution of the company',
    'Issuance of new shares or new share classes',
    'Amendment to Articles or Shareholders Agreement',
    'Taking on debt above £25,000',
    'Acquisition of another business',
    'Change of business purpose or trading name',
    'Appointment or removal of a Director',
    'Distributions exceeding the approved waterfall',
    'Related-party transactions above £10,000',
  ],
}

// === USE OF FUNDS ===
// All figures shown inc VAT. Total investment ask £79,000 cash.
// VAT reclaimable on Hardware (£4,000), IP (£2,000), Stock & Setup (£500 — only the
// inc-VAT component; rates and licence fees inside Stock & Setup are VAT-exempt) =
// ~£6,500 total, recovered against the first HMRC VAT return.
// Hardware bumped to £24,000 inc VAT (£20,000 + VAT) for full bar & kitchen equipment fitout.
// Stock & Setup expanded from £4,900 → £5,400 to include a £500 insurance
// premium (VAT-exempt) alongside the first-month business rates (£1,800)
// and alcohol licence change (£100). Working Capital reduced by £500 in
// lockstep — total raise unchanged at £79,000.
export const USE_OF_FUNDS = [
  { key: 'rent',     item: 'Rent in Advance (3 months)',  amount: 27078, pct: 34.3, vat: 'inc VAT', note: '3 months rent paid up front — covers May, Jun, Jul 2026 at the contractual 15% of 2025 turnover rate. NO deposit required. From August 2026 rent reverts to 15% of actual quarterly turnover (variable rent, scales with trading).' },
  { key: 'hardware', item: 'Hardware from Liquidators',   amount: 24000, pct: 30.4, vat: 'inc VAT', note: 'Bar & kitchen equipment (£20,000 + VAT) — operational from Day 1' },
  { key: 'ip',       item: 'IP License Fee',              amount: 12000, pct: 15.2, vat: 'inc VAT', note: 'One-off licensing fee paid to No Dice Bars LTD — grants indefinite use of the Plonk name. No Dice Bars LTD also runs online sales campaigns and platform maintenance under an ongoing commission, replacing the old Design My Night bookings provider' },
  { key: 'stock',    item: 'Stock & Operational Setup',   amount:  5400, pct:  6.8, vat: 'inc VAT', note: 'Itemised: opening alcohol stock, software subs (Xero/Rota Cloud/Google), internet, cleaning restart, insurance premium, business rates (first month) + alcohol licence change' },
  { key: 'working',  item: 'Working Capital',             amount: 10522, pct: 13.3, vat: null,      note: 'Staged into business per cash flow forecast — covers early trading runway' },
]

// === USE OF FUNDS — slider ranges ===
// Per-line slider config consumed by the lockable Use of Funds tool. Rent
// is a 1/2/3-month snap (lease cadence — no half-months). Hardware tops
// out at the £24k-inc-VAT liquidator quote (you can buy less, never more).
// IP is fixed (one-off contract, not a slider). Stock & Setup is a small
// continuous range around the £5,400 default. Working Capital is the
// derived residual (funding − allocated) and never has its own slider.
export const USE_OF_FUNDS_RANGES = {
  // Rent in Advance — three contractual snap points only.
  rent: {
    snaps: [
      { months: 1, amount:  9026, label: '1 mo' },
      { months: 2, amount: 18052, label: '2 mo' },
      { months: 3, amount: 27078, label: '3 mo' },
    ],
  },
  // Hardware from Liquidators — continuous, capped at £24k inc VAT.
  hardware: { min: 0,    max: 24000, step: 1000 },
  // Stock & Operational Setup — narrow flex band around the £4.9k default.
  stock:    { min: 3000, max: 8000,  step: 100  },
  // IP License Fee — fixed contractual amount, no slider.
  ip:       { fixed: 12000 },
}

// === FUNDING SLIDER RANGE ===
// Min / max / step for the FundingSlider on the Cover slide. £79k is the
// default raise but the founder can lock at any value in this band. Min
// chosen so even a 1-month-rent + £0-hardware + £12k-IP + £3k-stock
// configuration leaves headroom for working capital.
export const FUNDING_RANGE = { min: 50000, max: 100000, step: 5000 }
export const BOROUGH_RAISE_TARGET = 79000

// === A-SHARE THRESHOLD ===
// Minimum investor cheque to qualify as A-share (full voting rights).
// Set as 5% of post-money so it scales with the locked raise:
//   £79k raise  → £7,900 A-share floor
//   £100k raise → £10,000 A-share floor
//   £50k raise  → £5,000 A-share floor (legacy formula — superseded)
// Cheques below this threshold receive B-shares (limited voting).
//
// NEW (April 2026): the threshold is now a flat £10,000 across both
// venues — confirmed with the user. Cheques ≥ £10k = A-shares (full
// voting + first claim on dividends). Cheques < £10k = B-shares
// (limited voting + paid AFTER A-shares are paid in full).
export const A_SHARE_THRESHOLD_PCT = 0.05    // legacy — kept for backward compat
export const A_SHARE_FLOOR         = 10000   // canonical flat floor

// === computeDealFromInvestment ===
// Single source of truth for valuation maths. Every consumer slide
// (Cover stat cards, MarketContext multiple, InvestmentSummary, Waterfall
// per-investor returns, VenueInfo) calls this with the locked / live
// funding amount and reads back pre-money / post-money / multiple /
// A-share threshold. Mirrors Hackney's helper of the same name.
export function computeDealFromInvestment(investment) {
  const preMoney      = investment
  const postMoney     = investment * 2
  const investorEq    = 0.5
  const founderEq     = 0.5
  const ebitda        = 91950        // = ACTUALS_2025.ebitda — basis for the headline multiple
  const impliedMult   = ebitda > 0 ? preMoney / ebitda : 0
  // Flat £10k floor (canonical). The legacy 5%-of-post-money formula is
  // preserved as `aShareFloorLegacy` for any consumer that still wants it.
  const aShareFloor       = A_SHARE_FLOOR
  const aShareFloorLegacy = Math.round(postMoney * A_SHARE_THRESHOLD_PCT)
  return { investment, preMoney, postMoney, investorEq, founderEq, impliedMult, aShareFloor, aShareFloorLegacy }
}

// === GROWTH ASSUMPTION — DJ NIGHTS (NOTE for the central workbook) ===
// DJ programming is the anchor lever in the weekend bar uplift. Founder
// model May 2026:
//   • Today — a "good" Saturday rings ~£3,500 inc VAT on the bar.
//   • Target — a "great" Saturday with a busy DJ room rings ~£5,000.
//   • DJ-attributable share of the Saturday uplift: ~£1,000/Sat inc VAT.
//   • Same playbook on Fridays: ~£500/Fri inc VAT incremental.
//   • £1,500/week × 52 = £78,000/year inc VAT — the CEILING for what
//     DJ programming can credibly deliver in a year. All incremental to
//     walk-in trade with zero additional fixed cost.
//   • £78,000 / £741,644 (ACTUALS_2025.revenue) = 10.51% of total annual
//     revenue — this is the hard upper bound on the DJ slider on the
//     Growth Drivers page (slider max = 10.5%). Default sits at 10% so
//     the slider can move both ways from a near-ceiling starting point.
// ACTION REQUIRED — mirror this assumption in the central Google Sheet
// (https://docs.google.com/spreadsheets/d/1dtqbmoKK01oRY-0Zi1ZllVh82NiIGk8eS-l8aKJG_8Y)
// so the workbook scenario rows match what the deck shows. Cannot be
// written from the codebase.

// === HARDWARE FROM LIQUIDATORS — itemised £20,000 ex VAT breakdown ===
// Detail behind the £24,000 inc VAT "Hardware from Liquidators" line.
// All amounts shown EX VAT (£20,000 ex VAT  →  £24,000 inc VAT after 20% VAT).
// Each line is a category of physical equipment purchased from the liquidation.
// Reflected in the central workbook (Investment Valuation 1 sheet, Section 4b
// detail rows below the Stock & Setup breakdown).
export const HARDWARE_BREAKDOWN = [
  { item: 'Mini golf course',                       amount: 4000,  note: 'Holes, putting surfaces, course fittings & feature props' },
  { item: 'Bar equipment across site',              amount: 8000,  note: 'Beer lines, fridges, glasswash, bar tops, taps, ice machine, POS hardware' },
  { item: 'Wet stock consumables & tools',          amount: 2000,  note: 'Glassware, cleaning chemicals, repair tools, hand-trolleys, small wares' },
  { item: 'Arcade machines, furniture & fittings',  amount: 6000,  note: 'Arcade cabinets, pool tables, board game stock, seating, lighting fittings' },
]

// === STOCK & OPERATIONAL SETUP — itemised £5,400 breakdown ===
// Detail behind the £5,400 "Stock & Operational Setup" line in USE_OF_FUNDS.
// Mix of inc-VAT items (alcohol, software subs, internet, cleaning restart) and
// VAT-exempt regulatory costs (business rates, council licence fees). 3-month
// subscription pre-pays match the 3-month advance-rent cadence so the venue
// trades from Day 1.
// Reflected in the central workbook (Investment Valuation 1 sheet, Section 4a).
export const STOCK_SETUP_DETAIL = [
  { item: 'Alcohol stock (opening fill)',                amount: 1635, type: 'oneOff',     vatExempt: false, note: 'Wines, spirits, beer for Day 1 trading' },
  { item: 'Soft drinks, mixers & non-alcohol stock',     amount:  300, type: 'oneOff',     vatExempt: false, note: 'Opening fill — cocktail mixers, soft drinks, juices' },
  { item: 'Ice supplies (first delivery)',               amount:   30, type: 'oneOff',     vatExempt: false, note: 'Daily delivery contract — first delivery only' },
  { item: 'Cleaning contracts restart',                  amount:  250, type: 'oneOff',     vatExempt: false, note: 'Deep clean + first month commercial cleaning' },
  { item: 'Internet — Starlink / BT Business',           amount:  300, type: 'setupPlus1', vatExempt: false, note: 'Hardware setup + first month connectivity' },
  { item: 'App & booking platform setup',                amount:  200, type: 'oneOff',     vatExempt: false, note: 'Plonk Golf booking system, delivery app integrations' },
  { item: 'Xero accounting',                             amount:   75, type: 'sub3mo',     vatExempt: false, note: '£25/mth × 3 — cloud accounting' },
  { item: 'Rota Cloud — staff scheduling',               amount:   75, type: 'sub3mo',     vatExempt: false, note: '£25/mth × 3 — rota & timesheet system' },
  { item: 'Google Workspace',                            amount:   75, type: 'sub3mo',     vatExempt: false, note: 'Email + Drive + collab tools — 3 months × 2 users' },
  { item: 'Spotify Business',                            amount:   60, type: 'sub3mo',     vatExempt: false, note: '£20/mth × 3 — bar music licensing' },
  { item: 'Insurance premium (annual)',                  amount:  500, type: 'oneOff',     vatExempt: false, note: 'Combined liability + contents — annual premium paid up-front before opening' },
  { item: 'Business rates (first month)',                amount: 1800, type: 'monthly',    vatExempt: true,  note: 'First month UK business rates due before/at opening — Southwark Council (post-relief)' },
  { item: 'Alcohol licence change (DPS)',                amount:  100, type: 'oneOff',     vatExempt: true,  note: 'Designated Premises Supervisor change fee — Southwark Licensing' },
]

// === IP & LICENSING — ISOLATED DEV SHEET ===
// Source: "ALL DMN 2025 transactions ALL SITES.xlsx" — every transaction row for Borough venue in 2025,
// split by Status column (Online portal = 'complete', Office team = 'external', rejected dropped).
// This dataset is intentionally isolated from the existing deck constants while we develop the new
// Plonk Golf × Venue commission model.
//
// Key finding from the data:
//   - ONLINE portal (Status = complete): 15,188 tickets / £211,163.70 — revenue flows through the online system
//     (matches the existing deck's "Online Golf Tickets £210,485" — small delta = categorisation edge cases).
//   - OFFICE/TILL (Status = external): 4,512 tickets / £0 — these are reservations booked by the office team;
//     payment happens through the venue's till, NEVER through the online system.
//   - Under the new model the office/bookings-team channel goes away entirely. These customers will either
//     self-serve online (moving volume + revenue into the online channel) or contact the venue directly
//     (which the venue handles itself — Plonk Golf takes no commission).
//
// Structural assumptions (v1, adjustable later):
//   - Booking fee: 10% ADDED ON TOP of ticket price at checkout (customer-facing). Kept by Plonk Golf.
//   - Commission: SEPARATE %, taken from the VENUE on gross online ticket sales. Plonk Golf's license fee.
//   - Token value: £0.325 per arcade token, NO VAT on tokens. Each "Golf + 4 Tokens" SKU bundles 4 tokens (£1.30 per ticket).
//   - Under the new model, tokens move to in-store TILL only — online SKUs will be re-priced to strip the token component.

export const IP_LICENSING_TOKEN_VALUE = 0.325    // £ per arcade token, no VAT
export const IP_LICENSING_BOOKING_FEE_PCT = 0.10 // 10% added on top at checkout, kept by Plonk Golf
export const IP_LICENSING_PAYMENT_FEE_PCT = 0.015 // Stripe-style online payment processor fee — applied to any revenue that flows through the online payment provider (all online SKUs + office bookings if Plonk Golf's bookings manager processes them digitally). Deducted from Plonk Golf P&L as a cost.

// 2025 Borough online-portal SKUs (Status = complete). Revenue flows through online system.
// `rounds` = golf rounds bundled into the SKU (Pool/token-only SKUs = 0 rounds).
export const IP_LICENSING_SKUS_ONLINE_2025 = [
  { sku: 'Adult — Golf + 4 Tokens (Peak)',        rounds: 1, tokens: 4, price: 16.00, sold: 9646, revenue: 153995.10 },
  { sku: 'Off-Peak Adult — Golf + 4 Tokens',      rounds: 1, tokens: 4, price: 12.50, sold: 2932, revenue:  36485.00 },
  { sku: 'Under 18s — Golf + 4 Tokens',           rounds: 1, tokens: 4, price: 10.00, sold:  970, revenue:   9677.00 },
  { sku: 'Off-Peak Under 18s — Golf + 4 Tokens',  rounds: 1, tokens: 4, price: 10.00, sold:    0, revenue:      0.00 },
  { sku: 'Game & Drink',                          rounds: 1, tokens: 3, price: 12.00, sold:  393, revenue:   4713.60 },
  { sku: 'Late Night Golf',                       rounds: 1, tokens: 0, price:  5.00, sold:  788, revenue:   3940.00 },
  { sku: 'Pool Table Reservation — 30 Mins',      rounds: 0, tokens: 0, price:  5.00, sold:  422, revenue:   2108.00 },
  { sku: 'Doubles Pool Tournament',               rounds: 0, tokens: 0, price:  5.00, sold:    5, revenue:     40.00 },
  { sku: 'Extra Arcade Tokens (add-on)',          rounds: 0, tokens: 0, price:  5.00, sold:   31, revenue:    155.00 },
  // Valentine's Day Deal removed — withdrawn from Plonk promotional sales / no longer commissionable revenue.
]

// 2025 Borough office/external SKUs (Status = external). Payment happens at venue till — the online
// system records £0. Revenue here is IMPUTED at SKU list price (qty × price) to give a complete
// picture of real venue revenue. Actual till revenue may differ if the office team discounts/comps.
export const IP_LICENSING_SKUS_OFFICE_2025 = [
  { sku: 'Adult — Golf + 4 Tokens (Peak)',        rounds: 1, tokens: 4, price: 16.00, sold: 1977, revenue: 31632.00 },
  { sku: 'Off-Peak Adult — Golf + 4 Tokens',      rounds: 1, tokens: 4, price: 12.50, sold: 1868, revenue: 23350.00 },
  { sku: 'Under 18s — Golf + 4 Tokens',           rounds: 1, tokens: 4, price: 10.00, sold:  268, revenue:  2680.00 },
  { sku: 'Off-Peak Under 18s — Golf + 4 Tokens',  rounds: 1, tokens: 4, price: 10.00, sold:    8, revenue:    80.00 },
  { sku: 'Game & Drink',                          rounds: 1, tokens: 3, price: 12.00, sold:  276, revenue:  3312.00 },
  { sku: 'Late Night Golf',                       rounds: 1, tokens: 0, price:  5.00, sold:   12, revenue:    60.00 },
  { sku: 'Pool Table Reservation — 30 Mins',      rounds: 0, tokens: 0, price:  5.00, sold:  103, revenue:   515.00 },
  { sku: 'Doubles Pool Tournament',               rounds: 0, tokens: 0, price:  5.00, sold:    0, revenue:     0.00 },
  { sku: 'Extra Arcade Tokens (add-on)',          rounds: 0, tokens: 0, price:  5.00, sold:    0, revenue:     0.00 },
  // Valentine's Day Deal removed — withdrawn from Plonk promotional sales / no longer commissionable revenue.
]

// Per-month split: online (actual portal revenue) vs office (imputed at list price per SKU).
export const IP_LICENSING_MONTHLY_2025 = [
  { month: 'Jan', onlineQty: 1333, onlineRev: 19589.30, officeQty: 298, officeRev:  3836.50 },
  { month: 'Feb', onlineQty: 1525, onlineRev: 22026.70, officeQty: 183, officeRev:  2406.50 },
  { month: 'Mar', onlineQty: 1214, onlineRev: 17373.20, officeQty: 349, officeRev:  4822.00 },
  { month: 'Apr', onlineQty: 1141, onlineRev: 15215.80, officeQty: 353, officeRev:  4777.50 },
  { month: 'May', onlineQty: 1075, onlineRev: 15355.50, officeQty: 295, officeRev:  4071.50 },
  { month: 'Jun', onlineQty:  908, onlineRev: 12648.70, officeQty: 391, officeRev:  5440.50 },
  { month: 'Jul', onlineQty: 1052, onlineRev: 14498.80, officeQty: 423, officeRev:  5845.50 },
  { month: 'Aug', onlineQty: 1380, onlineRev: 18644.95, officeQty: 167, officeRev:  2005.50 },
  { month: 'Sep', onlineQty: 1126, onlineRev: 15127.70, officeQty: 351, officeRev:  5085.50 },
  { month: 'Oct', onlineQty: 1519, onlineRev: 20779.00, officeQty: 274, officeRev:  4007.50 },
  { month: 'Nov', onlineQty: 1319, onlineRev: 18428.25, officeQty: 470, officeRev:  6560.00 },
  { month: 'Dec', onlineQty: 1596, onlineRev: 21475.80, officeQty: 958, officeRev: 12770.50 },
]

// Grand totals — derived from the SKU arrays above so any SKU change
// (add/remove/edit) reconciles automatically without a second source
// of truth to update.
const _onlineQty = IP_LICENSING_SKUS_ONLINE_2025.reduce((s, r) => s + r.sold, 0)
const _onlineRev = IP_LICENSING_SKUS_ONLINE_2025.reduce((s, r) => s + r.revenue, 0)
const _officeQty = IP_LICENSING_SKUS_OFFICE_2025.reduce((s, r) => s + r.sold, 0)
const _officeRev = IP_LICENSING_SKUS_OFFICE_2025.reduce((s, r) => s + r.revenue, 0)
export const IP_LICENSING_GRAND_2025 = {
  onlineQty: _onlineQty,            // actual online portal revenue
  onlineRev: _onlineRev,
  officeQty: _officeQty,            // imputed at SKU list price
  officeRev: _officeRev,
  totalQty:  _onlineQty + _officeQty,
  totalRev:  _onlineRev + _officeRev,
}

// === PLONK GOLF COMMISSION INCOME (2025 verified) ===
// Online Ticket Commission line from the source weekly P&L (R67) — £8,419.39
// in 2025. This is Plonk Golf's commission income from running the online
// booking platform — NOT venue revenue. Treated as Plonk Golf P&L on the
// IP & Licensing tab. The deck's separate "Service Charge £15,102" income
// line on the venue side is drawn from DMN data (10% of office-processed
// volume) and is unrelated to this commission line.
export const IP_LICENSING_COMMISSION_2025 = {
  onlineTicketCommission: 8419.39,
  source: 'Borough Weekly Totals CATEGORISED PAST 14 MONTHS V2.xlsx · CLEAR TOTALS · row 67 · sum cols 12-63',
  note: 'Verified 2025 commission income to Plonk Golf for running the online booking platform. Replaces Design My Night going forward — same commercial relationship, new entity.',
}

// === IP & LICENSING — DEFAULT COMMISSION RATES ===
// 2026 Performance treats Plonk Golf's commission as a venue cost line
// driven by these defaults. Founder can override via the IP & Licensing
// → Commissions sliders, then lock; locked rates cascade across every
// scenario calc in the deck (TabPerformance, InvestmentSummary,
// WaterfallReturns, TabCashflow).
//
// Booking fee is INTENTIONALLY excluded from venue costs — historically
// it was misattributed to old Plonk; under the new model it's collected
// at checkout and goes to the bookings system to cover its costs, never
// to No Dice or Plonk.
export const IP_LICENSING_DEFAULT_COMMISSIONS = {
  onlinePct: 10,    // % of online golf ticket revenue
  officePct: 10,    // % of office golf bookings revenue (imputed at list price)
}

// Commissionable golf revenue — Plonk Golf's commission applies only
// to the GOLF ROUND portion of each ticket. Three filter rules:
//   1. Keep only SKUs that carry a golf round (rounds > 0)
//   2. Exclude mixed bundles where a non-golf component (drink) is
//      bundled in — currently just "Game & Drink"
//   3. Within each remaining SKU, deduct the token component (tokens
//      × IP_LICENSING_TOKEN_VALUE × sold) so commission only lands
//      on the pure golf portion
//
// Used by 2026 Performance and every scenario calc in the deck to
// scale commission with the golf growth lever.
const COMMISSION_EXCLUDED_BUNDLES = new Set([
  'Game & Drink',                  // golf + drink mixed bundle, no clean split
])
const _commissionableGolfRev = (skus) =>
  skus
    .filter(s => s.rounds > 0 && !COMMISSION_EXCLUDED_BUNDLES.has(s.sku))
    .reduce((sum, s) => sum + (s.revenue - s.tokens * IP_LICENSING_TOKEN_VALUE * s.sold), 0)

// Online golf-only revenue (commissionable, ex-tokens, ex-mixed-bundles).
// 2025 baseline ≈ £186,484. Multiplied by golf growth factor for 2026.
export const IP_LICENSING_ONLINE_GOLF_REV_2025 = _commissionableGolfRev(IP_LICENSING_SKUS_ONLINE_2025)

// Office golf-only revenue (commissionable, ex-tokens, ex-mixed-bundles).
// 2025 baseline ≈ £52,446. Imputed at SKU list price × volume.
export const IP_LICENSING_OFFICE_GOLF_REV_2025 = _commissionableGolfRev(IP_LICENSING_SKUS_OFFICE_2025)

// === IP & LICENSING — VENUE ANNUAL SAVINGS ===
// Cost lines that move OFF the venue P&L under the new Plonk Golf
// franchise model. These are ALREADY implicit in the 2026 Performance
// cost stack (no bookings-manager wage in the wage calculator, no
// Lithos hosting in fixed costs, no SEO retainer, no online payment
// fees) — re-exported here so the 2026 Performance "Savings vs old
// model" callout and the Plonk · How It Works tab share a single
// source of truth.
export const IP_LICENSING_VENUE_SAVINGS = {
  onlinePaymentFees:     Math.round(IP_LICENSING_GRAND_2025.onlineRev * IP_LICENSING_PAYMENT_FEE_PCT),
  webHostingLithos:      3492,    // £291/mo × 12 — Lithos website maintenance plan
  bookingsManagerAnnual: 34320,   // £660/wk × 52 — replaced by chatbot + AI booking flow
  seoLithos:             10464,   // £872/mo × 12 — Lithos SEO + outreach retainer
}
export const IP_LICENSING_VENUE_SAVINGS_ANNUAL =
  IP_LICENSING_VENUE_SAVINGS.onlinePaymentFees +
  IP_LICENSING_VENUE_SAVINGS.webHostingLithos +
  IP_LICENSING_VENUE_SAVINGS.bookingsManagerAnnual +
  IP_LICENSING_VENUE_SAVINGS.seoLithos
