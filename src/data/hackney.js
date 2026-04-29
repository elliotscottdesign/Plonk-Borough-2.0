// NO DICE HACKNEY LTD — FRAMEWORK DATA FILE
//
// Mirrors the export shape of src/data.js (Borough) so the cloned Hackney
// slides can read the same constants by name. Hackney values are populated
// where verified against the workbook; everywhere else carries a clearly-
// marked TBD placeholder.
//
// Structural decisions vs Borough:
//   • Single share class (no A/B distinction). 50/50 founder/investor.
//   • No preferred return. Pure pro-rata distribution by equity %.
//   • Bar-only entity — mini golf excluded from every line.
//   • No paid Google Ads — organic + local + events only.
//   • Plonk Golf IP/licensing model not applicable here (kept as empty
//     stubs so the Plonk tab can render without breaking).
//
// Source workbook: No_Dice_Hackney_Bar_Only_Investor_Pack.xlsx (39 sheets,
// 3,751 formulas, 0 errors). DO NOT modify the workbook.

// Sentinel marker — used in slides to render a "TBD" pill for missing values.
// Importing modules can check `value === TBD` before rendering.
export const TBD = '__TBD__'

export const BUSINESS = {
  name: 'No Dice Hackney Ltd',
  location: 'London Fields, London E8',
  description: 'Bar · DJ & events · Garden · Pool · Arcades · Board games',
}

// === EXTERNAL WORKBOOK ===
// Hackney financial workbook — investors view monthly P&L, scenarios,
// valuation breakdowns alongside the deck. Mirrors the Borough setup
// (Google Sheets, "Anyone with link · Viewer"). Update this URL after
// every workbook restructure so the React deck and the Sheets stay in
// lockstep.
export const WORKBOOK_URL = 'https://docs.google.com/spreadsheets/d/1ICwGynpIMGDZHS4C0dJ0GUilZRgD1UdTmTGWAe7m5bg/edit?usp=sharing'

// === LOCK SYNC ENDPOINT ===
// Same shape as Borough's. Empty = localStorage-only (no cross-device sync).
export const LOCK_SYNC_URL = ''
export const LOCK_SYNC_SECRET = ''

// === DEAL STRUCTURE ===
// £100,000 investment for 50% equity. Pre-money = investment (£100k) →
// post-money £200k. Implied 3.24× EBITDA on £30,896 verified 2025 profit
// (below the 4.1× hospitality sector average per Houlihan Lokey H1 2025).
// Pure pro-rata — no preferred return, no founder priority slice.
export const DEAL = {
  investment: 100000,
  founderEq: 0.50,
  investorEq: 0.50,
  multiple: 3.236647,            // entry multiple — investment / 2025 EBITDA
  exitMultiple: 4,               // exit multiple at Y5 — held at sector average
  preMoney: 100000,
  postMoney: 200000,
  preferred: 0,                  // no preferred return
  aSharePriority: 0,             // no founder priority slice
  // Defaults reflect the latest Y1 base case profit £90,598 × 50% = £45,299
  // (50/50 pro-rata). Slides that consume the locked Use-of-Funds snapshot
  // override these via computeDealFromInvestment(snapshot.total); these
  // constants are the un-locked fallback only.
  investorDividend: 45299,
  totalInvestorReturn: 45299,
  coc: 0.4530,                   // 45.30% on £100k invested
  payback: 2.21,                 // years (100,000 / 45,299)
  aShareThreshold: 10000,        // 5% of post-money — governance floor
}

// === 2025 ACTUALS (BAR-ONLY, MINI GOLF EXCLUDED) ===
// Verified from the workbook: Monthly Summary!ANNUAL TOTAL row.
// Borough categorises costs into 9 lines (drinks/gas, cleaning, arcades, etc.).
// Hackney's workbook only splits Fixed / Variable / Wages / VAT — sub-category
// breakdown is TBD pending a separate restatement of the 2025 P&L.
export const ACTUALS_2025 = {
  revenue: 538090.57,            // Excel: Monthly Summary!C15
  wages: 179871.99,              // Excel: Monthly Summary!G15 (fully-loaded inc 21.4% NIC + pension + holiday)
  fixedCosts: 114880,            // Excel: Monthly Summary!E15
  variableCosts: 167448.63,      // Excel: Monthly Summary!F15
  vatNet: 44993.78,              // Excel: Monthly Summary!H15
  profit: 30896.17,              // Excel: Monthly Summary!I15
  ebitda: 30896.17,              // Bar-only entity — EBITDA = profit (no D&A line)
  // TBD: Borough-style category breakdown below. Re-extract from weekly P&L
  // when we restate Hackney 2025 into the same nine-category schema.
  drinksGas: TBD,
  cleaning: TBD,
  arcades: TBD,
  food: TBD,
  googleAds: 0,                  // Hackney runs zero paid search
  cardCharges: TBD,
}

// === 2026/27 FORECAST (Base Case +15%) ===
// Forecast period: May 2026 → Apr 2027. Rebuilt April 2026 with the new
// lease terms per user direction (see HACKNEY_FIXED_COSTS_2026):
// £65,000 + VAT per annum, 3-month deposit, 3% annual uplift.
//
// Build:
//   Revenue        538,090.57 × 1.15  =     618,804.17
//   Wages           179,872 (PL_WAGE_BASE — calculator default)
//   Variable +10%   2025 stock + variable cats × 1.10
//                   = (134,123 + 7,887 + 16,492 + 10,300 + 8,202) × 1.10
//                   = 177,004 × 1.10 ≈ 194,704
//   Fixed Y1:       Other fixed (£23,490) × 1.10 = £25,839
//                   + new rent £43,333 (8 paying months × £65k/12; 4-mo rent-free)
//                   + rates £16,830 (2025 × 1.10, pending Hackney confirm)
//                   = £86,002
//   VAT             44,994 × 1.15 = £51,743 (scales with revenue)
//   Director         15,885 (separate line)
//   Op profit (after director) ≈ £90,598 → margin ≈ 14.6%
//
// Lease economics: £65,000 + VAT per annum (NET in P&L — VAT-registered
// bar recovers input VAT). Forecast year May 2026 → Apr 2027 has 4
// months rent-free at the start (May–Aug 2026), then 8 paying months
// at £65k/12 = £43,333. Steady state Y2 = £65,000 net. Y3 onwards
// grows at +3% pa (lease uplift clause). Old Plonk arrangement was
// £94,146/yr — the new lease saves ~£29k/yr at steady state, plus an
// additional ~£21,667 in Y1 from the rent-free start.
export const FORECAST = {
  revenue:    618804.17,
  wages:      179872,
  variable:   194704,           // sum of stock + operational variable, all × 1.10
  fixed:       86002,           // rent £43,333 + rates £16,830 + other fixed × 1.10
  vatNet:      51743,           // 2025 VAT × 1.15 (scales with revenue)
  director:    15885,           // separate line (inc £885 employer NI)
  rent:        43333,           // Y1 with 4-mo rent-free; £65,000 / 12 × 8 paying months (net)
  rates:       16830,           // 2025 × 1.10 — Hackney Council confirmation pending
  profit:      90598,           // revenue − wages − variable − fixed − VAT − director
  margin:       0.1464,         // profit / revenue
}

// === INCOME BY SOURCE (Jan–Dec 2025) ===
// TBD: Hackney's bar-only revenue isn't yet split by source in the workbook.
// Source: Weekly Merged 2024-2026 tab, Jan–Dec 2025 columns aggregated.
// Total = £557,861 (£19.8k higher than Monthly Summary's £538,091; the
// Weekly Merged tab is gross of categorisation differences and includes
// some pre-restatement items). The deck uses Monthly Summary's £538k as
// the headline annual revenue; this breakdown represents the relative
// shares of each income source.
export const INCOME_SOURCES = [
  { name: 'Bar takings',                amount: 484684, pct: 86.9, color: '#0D1F4C' },
  { name: 'Online golf (DMN)',          amount:  39288, pct:  7.0, color: '#1565C0' },
  { name: 'Office bookings / hires',    amount:  28120, pct:  5.0, color: '#1976D2' },
  { name: 'Tournament entry',           amount:   3570, pct:  0.6, color: '#1E88E5' },
  { name: 'Pool tickets (DMN)',         amount:   2200, pct:  0.4, color: '#039BE5' },
  { name: 'Service charge',             amount:      0, pct:  0.0, color: '#4FC3F7' },
]

// === FIXED COSTS — 2025 SUB-LINE BREAKDOWN ===
// Source: Weekly Merged 2024-2026 tab, fixed-cost rows aggregated for 2025.
// Used to drive the 2026 forecast: rent and rates are replaced with the new
// lease + Hackney Council figures; the rest of the fixed-cost base uplifts
// by +10%.
export const HACKNEY_FIXED_COSTS_2025 = [
  { key: 'rent',        label: 'Rent',          amount: 94146 },
  { key: 'rates',       label: 'Business Rates',amount: 15300 },
  { key: 'electricity', label: 'Electricity',   amount: 12750 },
  { key: 'water',       label: 'Water',         amount:  2550 },
  { key: 'insurance',   label: 'Insurance',     amount:  2754 },
  { key: 'license',     label: 'License',       amount:  1275 },
  { key: 'prsPpl',      label: 'PRS / PPL',     amount:  1530 },
  { key: 'internet',    label: 'Internet',      amount:  1445 },
  { key: 'lightspeed',  label: 'Lightspeed',    amount:   931 },
  { key: 'tvLicense',   label: 'TV License',    amount:   255 },
]

// === FIXED COSTS — 2026 FORECAST RULES ===
// Per user direction (April 2026):
//   • Rent: NEW lease — £65,000 + VAT per annum (net in P&L). 4-month
//     rent-free start (May–Aug 2026). 3-month deposit on signing.
//     3% annual uplift on rent.
//       Y1 = 8 paying months × (£65k/12) = £43,333
//       Y2 = £65,000 (full year, headline)
//       Y3 = £65,000 × 1.03  = £66,950
//       Y4 = £65,000 × 1.03² = £68,959
//       Y5 = £65,000 × 1.03³ = £71,027
//   • Business Rates: 2025 actual × 1.10 = £16,830. Subject to Hackney
//     Council assessment with the relief change (75% → 40% in 2025/26)
//     so this is a placeholder pending confirmation.
//   • All other fixed lines (electricity, water, insurance, license,
//     PRS/PPL, internet, lightspeed, TV license): +10% on 2025 actuals.
export const HACKNEY_FIXED_COSTS_2026 = {
  rentAnnualNet:    65000,              // £65,000 + VAT pa (net in P&L)
  rentY1:           43333,              // 8 paying months × £65k/12 (4 months rent-free)
  rentSteady:       65000,              // Y2 full year
  rentUplift:       0.03,               // 3% annual uplift on rent (Y3+ compounds)
  rentFreeMonths:   4,                  // May–Aug 2026
  depositMonths:    3,                  // 3-month deposit
  depositInc:       19500,              // 3 × £6,500 inc VAT — paid monthly during rent-free
  depositPaidMonthly: true,             // £6,500/mo across the first 3 trading months,
                                        // overlaps with rent-free start so does not consume Day-1 raise
  rates:            16830,
  otherUplift:      0.10,               // applied to non-rent, non-rates lines
}

// === COSTS BY CATEGORY (Jan–Dec 2025) ===
// Source: Weekly Merged 2024-2026 tab. Category-header rows aggregate the
// sub-line items below them (verified: sum of category headers = sheet's
// row 79 "Costs TOTAL inc VAT" = £485,470). Total runs £23k higher than
// Monthly Summary's £462,201 due to categorisation differences (some
// items in Weekly Merged are pre-restatement). Monthly Summary remains
// the canonical totals; this table shows the cost-mix shares.
export const COST_CATEGORIES = [
  { name: 'Wages',          amount: 175531, pct: 36.2, color: '#4A0000' },
  { name: 'Drinks & Gas',   amount: 134123, pct: 27.6, color: '#7B0000' },
  { name: 'Fixed Costs',    amount: 132936, pct: 27.4, color: '#B71C1C' },
  { name: 'Cleaning',       amount:  16492, pct:  3.4, color: '#C62828' },
  { name: 'DJs',            amount:  10300, pct:  2.1, color: '#E53935' },
  { name: 'Arcades',        amount:   8202, pct:  1.7, color: '#D84315' },
  { name: 'Food',           amount:   7887, pct:  1.6, color: '#EF6C00' },
]

// === MONTHLY DATA (Jan–Dec 2025) ===
// Excel: Monthly Summary!C3:I14. Income + profit verified;
// monthly cost-by-category split is TBD.
export const MONTHLY_INCOME = [
  { month: 'Jan', amount: 26867    },
  { month: 'Feb', amount: 32999.58 },
  { month: 'Mar', amount: 52040.38 },
  { month: 'Apr', amount: 48158.36 },
  { month: 'May', amount: 43489.18 },
  { month: 'Jun', amount: 62703.56 },
  { month: 'Jul', amount: 44999.83 },
  { month: 'Aug', amount: 63368.62 },
  { month: 'Sep', amount: 38564.91 },
  { month: 'Oct', amount: 39863.27 },
  { month: 'Nov', amount: 48740.74 },
  { month: 'Dec', amount: 36295.14 },
]

// Per-month cost split by category. Source: Weekly Merged 2024-2026 tab,
// 2025 columns aggregated by week-end month. Each row is gross-of-VAT per
// the Weekly Merged convention. Annual sums match COST_CATEGORIES totals.
// VAT, card-charges, Google-Ads not separately tracked in Weekly Merged
// (Google Ads = £0 anyway for Hackney; VAT recorded as a single annual
// difference in Monthly Summary).
export const MONTHLY_COSTS = [
  { month:'Jan', wages:  6116, fixed:  7770, drinks:  3753, cleaning:  567, arcades:  637, food:  738, djs:  600 },
  { month:'Feb', wages: 12740, fixed: 10360, drinks:  8993, cleaning: 1239, arcades:  310, food: 1003, djs:  800 },
  { month:'Mar', wages: 14164, fixed: 12950, drinks:  9777, cleaning: 1829, arcades: 1227, food:  375, djs: 1000 },
  { month:'Apr', wages: 13603, fixed: 10360, drinks: 13596, cleaning:  993, arcades:  374, food:  372, djs:  800 },
  { month:'May', wages: 14503, fixed: 10360, drinks: 13960, cleaning: 1110, arcades:  763, food:  591, djs:  800 },
  { month:'Jun', wages: 19250, fixed: 12950, drinks: 15369, cleaning: 1642, arcades:  868, food: 1024, djs: 1000 },
  { month:'Jul', wages: 14058, fixed: 10360, drinks: 11045, cleaning: 1718, arcades:  430, food:  690, djs:  800 },
  { month:'Aug', wages: 18243, fixed: 12950, drinks: 16718, cleaning: 1173, arcades: 1090, food:  655, djs: 1200 },
  { month:'Sep', wages: 16931, fixed: 10559, drinks:  9679, cleaning: 1181, arcades:  654, food:  910, djs:  800 },
  { month:'Oct', wages: 13157, fixed: 10559, drinks:  8873, cleaning: 2234, arcades:  330, food:  360, djs:  800 },
  { month:'Nov', wages: 19314, fixed: 13199, drinks: 11945, cleaning: 1603, arcades:  733, food:  659, djs: 1000 },
  { month:'Dec', wages: 13453, fixed: 10559, drinks: 10414, cleaning: 1203, arcades:  785, food:  510, djs:  700 },
]

export const MONTHLY_PROFIT = [
  { month: 'Jan', income: 26867,    profit:   703.39 },
  { month: 'Feb', income: 32999.58, profit: -1449.55 },
  { month: 'Mar', income: 52040.38, profit:  9183.67 },
  { month: 'Apr', income: 48158.36, profit:  7356.63 },
  { month: 'May', income: 43489.18, profit:  1192.78 },
  { month: 'Jun', income: 62703.56, profit:  7773.94 },
  { month: 'Jul', income: 44999.83, profit:  4684.73 },
  { month: 'Aug', income: 63368.62, profit:  8506.70 },
  { month: 'Sep', income: 38564.91, profit: -3331.77 },
  { month: 'Oct', income: 39863.27, profit:  1174.53 },
  { month: 'Nov', income: 48740.74, profit: -1928.63 },
  { month: 'Dec', income: 36295.14, profit: -2970.25 },
]

// === 2026/27 CASH FLOW FORECAST (May 2026 – Apr 2027) ===
// Excel: Cash Flow Forecast!B30:M31 (net flow + cumulative cash).
// Peak £82,337 (Aug), low £39,250 (Feb), year-end £72,462 (Apr).
export const HACKNEY_CASHFLOW = [
  { month: 'May 26', net:  19889.52, closing: 19889.52 },
  { month: 'Jun 26', net:  33900.15, closing: 53789.67 },
  { month: 'Jul 26', net:   9146.58, closing: 62936.25 },
  { month: 'Aug 26', net:  19400.92, closing: 82337.17 },
  { month: 'Sep 26', net:  -4703.39, closing: 77633.78 },
  { month: 'Oct 26', net:     94.91, closing: 77728.69 },
  { month: 'Nov 26', net:  -9186.49, closing: 68542.20 },
  { month: 'Dec 26', net:  -5509.88, closing: 63032.32 },
  { month: 'Jan 27', net:  -8369.97, closing: 54662.35 },
  { month: 'Feb 27', net: -15412.44, closing: 39249.91 },
  { month: 'Mar 27', net:  20129.18, closing: 59379.09 },
  { month: 'Apr 27', net:  13083.32, closing: 72462.41 },
]

export const HACKNEY_CASH = {
  peak: 82337,        // Aug 2026
  low: 39250,         // Feb 2027
  yearEnd: 72462,     // Apr 2027
  safetyFloor: 25000, // user-set floor; Feb low stays £14k above
}

// === WAGES — 2025 ROTA REFERENCE (4-role calculator basis) ===
// Source: live rota Google Sheets (sheet 1NgIp2TcNPcf9pWcD5CVELexarlmnxe9jeC61aTCZKy0)
// Aggregated 2025 bar-only shifts. Filters applied:
//   • Roles kept: Bar Staff, Supervisor, Assistant Manager, Manager
//   • Roles excluded: Golf Host (mini-golf), Kitchen, blank-role rows
//   • Date validation: dropped rows with empty / unparseable dates (these
//     are summary/spacer rows in the source — without this filter Bar Staff
//     was over-counted by ~1,400 hrs)
//   • Day-of-week validation: zero mismatches in the source
// Total 8,894.1 hrs / £132,725.49 gross. Used as the calculator basis on
// Business Explorer 2026 Performance.
export const WAGE_RATES = [
  { role: 'Bar Staff',     rate: 13.82, hours: 4506.3, color: '#E67E22' },
  { role: 'Supervisor',    rate: 15.12, hours: 1216.5, color: '#D4A843' },
  { role: 'Asst. Manager', rate: 16.46, hours: 1796.2, color: '#94A3B8' },
  { role: 'Manager',       rate: 18.26, hours: 1375.1, color: '#0D9488' },
]

export const PL_WAGE_BASE = 179872            // 2025 verified P&L wage line — Monthly Summary!G15
export const ROTA_TOTAL   = 132725            // 2025 gross rota cost — live rota aggregate (validated, dated shifts only)
export const WAGE_OVERHEAD_MULT = PL_WAGE_BASE / ROTA_TOTAL   // ≈ 1.355 — covers NIC + pension + holiday plus shift-level overtime/holiday rates

// === MODELLED STAFFING — full 12-role build-out ===
// Source: Wages Breakdown sheet, modelled staffing block (rows 10–40).
// This is the venue at full operational capacity (£387,795.30/yr fully-loaded).
// Differs from PL_WAGE_BASE (£179,872 — 2025 actuals at lean staffing) because
// it shows what the venue COULD cost if every modelled role is filled. Useful
// as a reference panel on the Business Explorer 2025 Performance tab.
export const HACKNEY_WAGE_MODEL = {
  loadingPct: 0.214,            // employer NIC + pension + holiday
  totals: {
    grossWeekly:    6143,
    grossMonthly:   26619.67,
    grossAnnual:    319436,
    loadedWeekly:   7457.60,
    loadedMonthly:  32316.28,
    loadedAnnual:   387795.30,
  },
  groups: [
    { key: 'management', title: '1. Management', subtotal: 72259.20, roles: [
      { role: 'Director / Owner',                 headcount: 1, hours: 'salary', rate: null,   weekly:  305.48, annual: 15885 },
      { role: 'General Manager',                  headcount: 1, hours: 40,        rate: 18.26,  weekly:  730.40, annual: 37980.80 },
      { role: 'Assistant Manager',                headcount: 1, hours: 40,        rate: 16.48,  weekly:  659.20, annual: 34278.40 },
    ] },
    { key: 'supervisory', title: '2. Supervisory', subtotal: 50186.24, roles: [
      { role: 'Supervisor (Senior)',              headcount: 1, hours: 40,        rate: 15.08,  weekly:  603.20, annual: 31366.40 },
      { role: 'Supervisor (Junior / Cover)',      headcount: 1, hours: 24,        rate: 15.08,  weekly:  361.92, annual: 18819.84 },
    ] },
    { key: 'barStaff', title: '3. Bar Staff', subtotal: 128419.20, roles: [
      { role: 'Bar Lead / Head Bartender',        headcount: 1, hours: 40,        rate: 14.31,  weekly:  572.40, annual: 29764.80 },
      { role: 'Bartender (FT)',                   headcount: 2, hours: 40,        rate: 13.81,  weekly: 1104.80, annual: 57449.60 },
      { role: 'Bartender (PT)',                   headcount: 2, hours: 20,        rate: 13.81,  weekly:  552.40, annual: 28724.80 },
      { role: 'Bar Back / Runner (PT)',           headcount: 1, hours: 24,        rate: 10.00,  weekly:  240.00, annual: 12480 },
    ] },
    { key: 'floorEvents', title: '4. Floor & Events', subtotal: 50793.60, roles: [
      { role: 'Floor Staff / Events Host (FT)',   headcount: 1, hours: 40,        rate: 12.21,  weekly:  488.40, annual: 25396.80 },
      { role: 'Floor Staff / Events Host (PT)',   headcount: 2, hours: 20,        rate: 12.21,  weekly:  488.40, annual: 25396.80 },
    ] },
    { key: 'cleaningMaintenance', title: '5. Cleaning & Maintenance', subtotal: 17777.76, roles: [
      { role: 'Cleaning Staff',                   headcount: 1, hours: 20,        rate: 12.21,  weekly:  244.20, annual: 12698.40 },
      { role: 'Maintenance / Handyperson',        headcount: 1, hours:  8,        rate: 12.21,  weekly:   97.68, annual:  5079.36 },
    ] },
  ],
}

// === DIGITAL MARKETING ===
// Hackney runs zero paid search. Channels: organic social, local listings,
// events & partnerships. Total ~£8k/yr (~1% of forecast revenue).
export const MARKETING = {
  // 2025 actuals — Hackney has no Google Ads history
  googleAdsSpend2025: 0,
  googleAdsClicks: 0,
  googleAdsCPC: 0,
  googleAdsConversions: 0,
  googleAdsCostPerConv: 0,
  googleAdsActiveDays: 0,
  organicSessions2025: TBD,
  organicSessions2024: TBD,
  // 2026 plan — organic / local / events only
  websiteMaintenance: TBD,
  seoOutreach: 3000,             // organic social allowance
  googleAdsBudget2026: 0,        // intentionally zero
  totalDigital2026: 8000,        // £3k organic + £2k local + £3k events
}

// === WATERFALL ===
// Pure pro-rata 50/50. No preferred, no founder priority slice.
// Y1 base profit £90,598 → £45,299 each. Slides that consume a locked
// Use-of-Funds snapshot recompute these live; this constant is the
// un-locked fallback.
export const WATERFALL = {
  operatingProfit: 90598,
  preferred: 0,
  aSharePriority: 0,
  remainingPool: 90598,
  investorDividend: 45299,
  founderDividend: 45299,
  totalInvestor: 45299,
  totalFounder: 45299,
}

// === 5-YEAR INVESTOR RETURNS ===
// Pure pro-rata 50/50, no preferred return. Year-1 profit £90,598 from
// the new 2026 cost model (£65k+VAT pa lease with 4-mo rent-free Y1
// start + 10% uplift on stock and other fixed lines). Y2 onwards rent
// steps up to the £65,000 headline; Y3+ grows at +3% pa per the lease
// uplift clause. Revenue and variable costs grow at 7.5% YoY; wages,
// fixed (other), rates and director are held flat. Investor share =
// 50% × profit each year. Powers the multi-year payout schedule on the
// WaterfallReturns slide.
//
// vs the old £45,632 forecast (which assumed the legacy Plonk rent of
// £94,146): the new £65k lease saves ~£29k/yr at steady state, plus
// another ~£21,667 in Y1 from the 4-month rent-free start. Combined
// with the +15% revenue assumption, that flows straight through to
// operating profit and compounds over the 5-year exit.
export const HACKNEY_INVESTOR_RETURNS = {
  year1: {
    profit:          90598,
    investorEq:      0.5,
    investorReturn:  45299,
    coc:              0.4530,
    paybackYears:     2.21,
  },
  fiveYear: [
    { year: 'Y1 2026/27', revenue: 618804.17, profit:  90598.41, investorShare: 45299.20, founderShare: 45299.21 },
    { year: 'Y2 2027/28', revenue: 665214.48, profit:  96856.85, investorShare: 48428.42, founderShare: 48428.43 },
    { year: 'Y3 2028/29', revenue: 715105.57, profit: 124928.65, investorShare: 62464.32, founderShare: 62464.33 },
    { year: 'Y4 2029/30', revenue: 768738.49, profit: 155192.97, investorShare: 77596.48, founderShare: 77596.49 },
    { year: 'Y5 2030/31', revenue: 826393.88, profit: 187818.27, investorShare: 93909.13, founderShare: 93909.14 },
  ],
  cumulativeDividends: 327697.55,     // Sum of investor shares Y1–Y5
  exit: {
    y5Ebitda:         187818.27,
    multiple:         4,
    businessValue:    751273.08,
    investorProceeds: 375636.54,
    founderProceeds:  375636.54,
  },
  totalReturned:      703334.09,
  multipleOfMoney:    7.0333,
  irr:                0.6915,         // IRR on flows: -100k, +45299, +48428, +62464, +77596, +469546
}

// === GOVERNANCE ===
// Mirrors Borough's reserved-matters list — confirm any Hackney-specific
// additions (e.g. landlord consents) before sign-off.
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

// === RAISE TARGET ===
// Fixed total investment ask. The slider tool allocates this across explicit
// use-of-funds buckets; whatever's left after the 6 explicit sliders becomes
// Working Capital (a derived residual line, displayed but not user-editable).
// Drag stock down → working capital up. Drag everything to minimum → working
// capital is the bulk of the raise. The total raised stays at this target;
// only the allocation between explicit spend and working-capital float varies.
export const HACKNEY_RAISE_TARGET = 100000

// === USE OF FUNDS ===
// Six EXPLICIT slider categories (stock, rent, garden, interior, marketing,
// legals + restart). Working Capital is the 7th line, derived as
// HACKNEY_RAISE_TARGET minus the sum of the six. Defaults below are the
// "headline" values for each line; founder drags to reallocate.
export const USE_OF_FUNDS = [
  { key: 'stock',     item: 'Stock Purchase — Liquidators',     amount: 24000, vat: 'inc VAT', note: 'Bar & kitchen equipment from liquidators — operational from Day 1.' },
  { key: 'rent',      item: 'Landlord — Rent Deposit (3 mo)',   amount:     0, vat: null,      note: 'Lease deposit £19,500 inc VAT (3 mo × £6,500). Paid monthly from trading cash during the 4-month rent-free period — does NOT consume Day-1 raise. Slider lets the founder elect to ring-fence the deposit upfront instead (1 / 2 / 3 months at the inc-VAT figure).' },
  { key: 'garden',    item: 'Garden Refurbishment',             amount: 12000, vat: 'inc VAT', note: 'Outdoor trading area refurb — soundproofing investment is the priority spend.' },
  { key: 'interior',  item: 'Interior Completion & Signage',    amount: 10000, vat: 'inc VAT', note: 'Fit-out completion, signage, internal acoustic treatment.' },
  { key: 'marketing', item: 'Marketing — Pre-launch & Year 1',  amount:  3000, vat: 'inc VAT', note: 'Organic / local listings / events — no paid Google Ads spend.' },
  { key: 'legals',    item: 'Legals & Restart',                 amount:  2000, vat: null,      note: 'Solicitor fees, share registry, restart admin.' },
]

// === USE OF FUNDS — slider ranges ===
// Drives the calculator on the Use of Funds slide. Rent is a snap slider
// (1 / 2 / 3 months). Everything else is continuous within min/max with a
// £500 step. Founder locks a snapshot which then flows into Investment
// Summary, Waterfall Returns, and Cash Flow Forecast downstream.
export const USE_OF_FUNDS_RANGES = {
  stock:     { min: 0,    max: 24000, step: 500, label: 'Stock Purchase — Liquidators' },
  rent:      { snaps: [
    { months: 0, amount:     0, label: 'Paid monthly' },
    { months: 1, amount:  6500, label: '1 month' },
    { months: 2, amount: 13000, label: '2 months' },
    { months: 3, amount: 19500, label: '3 months' },
  ], label: 'Landlord — Rent Deposit' },
  garden:    { min: 1000, max: 12000, step: 500, label: 'Garden Refurbishment' },
  interior:  { min: 1000, max: 12000, step: 500, label: 'Interior Completion & Signage' },
  marketing: { min: 1000, max:  6000, step: 500, label: 'Marketing — Pre-launch & Year 1' },
  legals:    { min: 1000, max:  3000, step: 500, label: 'Legals & Restart' },
}

// 50/50 split is the fixed structural decision (pure pro-rata, single share
// class). The slider tool varies the investment size; pre-money flexes to
// equal the investment so the 50/50 split holds, and the implied EBITDA
// multiple is the derived result. Helper exported so the calculator and
// downstream slides share a single computation path.
//
//   investorEq = 0.5 (fixed)
//   founderEq  = 0.5 (fixed)
//   preMoney   = investment           (so 50/50 holds)
//   postMoney  = investment × 2
//   multiple   = preMoney / 2025 EBITDA  (derived — see helper below)
//
// Smaller raise = smaller implied pre-money = smaller implied multiple. The
// founder gives up the same 50%, just on a smaller pie. Logic checks out
// when the raise is sized to "minimum-viable to get safe and reopen" —
// further rounds price off live trading, not the seed pre-money.
// Live forecast operating profit — accepts an optional wages override
// (e.g. the locked Wage Calculator total). Wages reduce profit 1:1 (every
// other line in FORECAST is independent of wages), so we compute as a
// delta against PL_WAGE_BASE rather than re-deriving the full P&L. When
// no override is provided, returns the static FORECAST.profit.
export function computeForecastProfit(wagesOverride) {
  const wages = Number.isFinite(wagesOverride) && wagesOverride > 0 ? wagesOverride : PL_WAGE_BASE
  const wageDelta = wages - PL_WAGE_BASE
  return FORECAST.profit - wageDelta
}

// === FORECAST RULES (2026 Performance) ==============================
// Single source of truth for the cost-uplift assumptions. Consumed by
// BusinessExplorer's 2026 tab AND the WaterfallReturns distribution
// calendar (so monthly profit numbers stay consistent across slides).
export const FORECAST_RULES = {
  revenueGrowth:   0.15,                // base case
  variableUplift:  0.10,                // stock + variable cats
  fixedUplift:     0.10,                // non-rent, non-rates fixed lines
  rentAnnualNet:   65000,
  rentY1:          43333,               // 8 paying months × £65k/12 (4-mo rent-free)
  rentSteady:      65000,
  rentUplift:      0.03,
  rates:           16830,               // 2025 × 1.10
}

// Monthly forecast — 12 rows, May 2026 → Apr 2027 trading year (presented
// in calendar Jan-Dec order using the 2025 monthly seasonality scaled to
// 2026 rules). Output rows: { month, income, profit, wages, fixed, ... }.
// `wagesOverride` cascades the locked Wage Calculator into per-month
// wages by scaling proportionally so seasonality is preserved.
export function computeForecastMonthly(wagesOverride) {
  const r = 1 + FORECAST_RULES.revenueGrowth
  const v = 1 + FORECAST_RULES.variableUplift
  const f = 1 + FORECAST_RULES.fixedUplift
  const monthlyRates = FORECAST_RULES.rates / 12
  const otherFixed2025Total = HACKNEY_FIXED_COSTS_2025
    .filter(l => l.key !== 'rent' && l.key !== 'rates')
    .reduce((s, l) => s + l.amount, 0)
  const monthlyFixedTotal2025 = MONTHLY_COSTS.reduce((s, m) => s + m.fixed, 0)
  const targetWageAnnual = Number.isFinite(wagesOverride) && wagesOverride > 0 ? wagesOverride : PL_WAGE_BASE
  const wageScale = PL_WAGE_BASE > 0 ? targetWageAnnual / PL_WAGE_BASE : 1
  const monthlyRentAvg = FORECAST_RULES.rentY1 / 12

  return MONTHLY_INCOME.map((row, i) => {
    const mc = MONTHLY_COSTS[i]
    const variable = (mc.drinks + mc.cleaning + mc.djs + mc.arcades + mc.food) * v
    const otherFixedShare = monthlyFixedTotal2025 > 0
      ? mc.fixed * (otherFixed2025Total / monthlyFixedTotal2025) * f
      : 0
    const fixed = otherFixedShare + monthlyRentAvg + monthlyRates
    const wages = mc.wages * wageScale
    const income = row.amount * r
    const totalCost = variable + fixed + wages
    return {
      month: row.month,
      income,
      profit: income - totalCost,
      wages, fixed,
      rent: monthlyRentAvg,
      rates: monthlyRates,
      drinks: mc.drinks * v, cleaning: mc.cleaning * v,
      djs: mc.djs * v, arcades: mc.arcades * v, food: mc.food * v,
    }
  })
}

// === DISTRIBUTION CALENDAR (12-month, quarterly dividends) ============
// Working-capital-first model: every month's operating profit refills
// the £30k working-capital reserve before any distribution. Once the
// reserve is full, surplus profit accrues into a quarterly dividend
// pool. At the end of each calendar quarter (Mar / Jun / Sep / Dec)
// the accrued surplus pays out — investor takes 50%, founder 50%
// (pure pro-rata, single share class). Months that run a loss are
// netted against the reserve before any subsequent dividend.
//
// Output:
//   calendar    — 12 rows, one per month, with reserveBalance,
//                  reserveAdd, surplus, cumulativeAccrual,
//                  isQuarterEnd, dividendPaid, investorShare,
//                  founderShare.
//   quarterly   — 4 rows (Q1–Q4) summarising each payout.
//   summary     — { totalDividends, totalInvestor, totalFounder,
//                    reserveFullMonth, annualProfit }.
export const HACKNEY_WORKING_CAPITAL_RESERVE = 30000

export function computeDistributionCalendar(wagesOverride, opts = {}) {
  const reserveTarget = opts.reserveTarget ?? HACKNEY_WORKING_CAPITAL_RESERVE
  const investorEq    = opts.investorEq    ?? 0.5
  const founderEq     = opts.founderEq     ?? (1 - investorEq)
  const monthly       = computeForecastMonthly(wagesOverride)

  let reserveBalance  = 0
  let cumulativeAccrual = 0   // surplus accrued since last dividend payout
  let reserveFullMonth = null

  // Quarter-end indices using calendar months (Mar, Jun, Sep, Dec → indices 2, 5, 8, 11)
  const QUARTER_END_IDX = new Set([2, 5, 8, 11])

  const calendar = monthly.map((row, i) => {
    const monthlyProfit = row.profit
    let reserveAdd = 0
    let surplus    = 0

    if (monthlyProfit >= 0) {
      // Refill reserve first, then any leftover becomes surplus.
      const room = Math.max(0, reserveTarget - reserveBalance)
      reserveAdd = Math.min(monthlyProfit, room)
      reserveBalance += reserveAdd
      surplus = monthlyProfit - reserveAdd
    } else {
      // A loss eats into the reserve before it eats into accrued surplus.
      const loss = -monthlyProfit
      const fromReserve = Math.min(reserveBalance, loss)
      reserveBalance -= fromReserve
      reserveAdd = -fromReserve
      const remainder = loss - fromReserve
      surplus = -remainder
    }

    cumulativeAccrual += surplus
    if (reserveBalance >= reserveTarget && !reserveFullMonth) reserveFullMonth = row.month

    const isQuarterEnd = QUARTER_END_IDX.has(i)
    let dividendPaid  = 0
    let investorShare = 0
    let founderShare  = 0
    if (isQuarterEnd) {
      // Only positive cumulative accrual pays out; if Q ran a net loss
      // the deficit carries into the next quarter (no clawback).
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

  const quarterly = calendar
    .filter(c => c.isQuarterEnd)
    .map((q, i) => ({
      quarter: `Q${i + 1}`,
      endMonth: q.month,
      dividend: q.dividendPaid,
      investorShare: q.investorShare,
      founderShare: q.founderShare,
    }))

  const totalDividends = quarterly.reduce((s, q) => s + q.dividend, 0)
  const totalInvestor  = quarterly.reduce((s, q) => s + q.investorShare, 0)
  const totalFounder   = quarterly.reduce((s, q) => s + q.founderShare, 0)
  const annualProfit   = monthly.reduce((s, m) => s + m.profit, 0)

  return {
    calendar,
    quarterly,
    summary: {
      reserveTarget,
      reserveFullMonth: reserveFullMonth ?? 'not reached in Y1',
      annualProfit,
      totalDividends,
      totalInvestor,
      totalFounder,
      // Surplus that's still accrued at year-end (didn't pay out as a
      // quarterly dividend — usually £0 if Dec is a quarter-end).
      yearEndAccrual: cumulativeAccrual,
      yearEndReserve: reserveBalance,
    },
  }
}

export function computeDealFromInvestment(investment) {
  const preMoney      = investment
  const postMoney     = investment * 2
  const investorEq    = 0.5
  const founderEq     = 0.5
  const ebitda        = 30896.17                    // = ACTUALS_2025.profit
  const impliedMult   = ebitda > 0 ? preMoney / ebitda : 0
  return { investment, preMoney, postMoney, investorEq, founderEq, impliedMult }
}

// === HARDWARE FROM LIQUIDATORS — itemised breakdown ===
// TBD: Hackney's £42,000 stock-purchase line isn't yet itemised by category.
// Likely splits: bar equipment, kitchen, fridges/cellar, glassware/POS,
// games (pool, arcades). Confirm with the liquidator inventory.
export const HARDWARE_BREAKDOWN = [
  { item: 'Bar equipment & cellar',   amount: TBD, note: 'Beer lines, fridges, glasswash, taps, ice machine, POS hardware' },
  { item: 'Kitchen equipment',        amount: TBD, note: 'Counters, fridges, prep, small wares' },
  { item: 'Glassware & wet stock',    amount: TBD, note: 'Glassware, cleaning chemicals, repair tools, hand-trolleys, small wares' },
  { item: 'Games & furniture',        amount: TBD, note: 'Pool tables, arcades, board game stock, seating, lighting fittings' },
]

// === STOCK & OPERATIONAL SETUP — itemised breakdown ===
// TBD: Hackney's £9,250 "Legals, Restart & Working Capital" line and parts
// of the £10k Interior Completion line will need a similar itemisation.
// For now, all rows TBD — populate from the workbook once available.
export const STOCK_SETUP_DETAIL = [
  { item: 'Alcohol stock (opening fill)',     amount: TBD, type: 'oneOff',     vatExempt: false, note: 'Wines, spirits, beer for Day 1 trading' },
  { item: 'Soft drinks & mixers',              amount: TBD, type: 'oneOff',     vatExempt: false, note: 'Cocktail mixers, soft drinks, juices' },
  { item: 'Cleaning contracts restart',        amount: TBD, type: 'oneOff',     vatExempt: false, note: 'Deep clean + first month commercial cleaning' },
  { item: 'Internet — Starlink / BT Business', amount: TBD, type: 'setupPlus1', vatExempt: false, note: 'Hardware setup + first month connectivity' },
  { item: 'Booking platform setup',            amount: TBD, type: 'oneOff',     vatExempt: false, note: 'Booking system, delivery app integrations' },
  { item: 'Xero accounting',                   amount: TBD, type: 'sub3mo',     vatExempt: false, note: 'Cloud accounting' },
  { item: 'Rota Cloud — staff scheduling',     amount: TBD, type: 'sub3mo',     vatExempt: false, note: 'Rota & timesheet system' },
  { item: 'Spotify Business',                  amount: TBD, type: 'sub3mo',     vatExempt: false, note: 'Bar music licensing' },
  { item: 'Business rates (first month)',      amount: TBD, type: 'monthly',    vatExempt: true,  note: 'First month UK business rates — Hackney Council (post-relief)' },
  { item: 'Alcohol licence change (DPS)',      amount: TBD, type: 'oneOff',     vatExempt: true,  note: 'Designated Premises Supervisor change fee — Hackney Licensing' },
]

// === IP & LICENSING — NOT APPLICABLE TO HACKNEY ===
// Plonk Golf IP/licensing model is Borough-specific (the franchise dev area).
// Stubs kept so the cloned Plonk tab can render without import errors —
// every value empty/zero. If Hackney later adopts a Plonk Golf relationship,
// populate these from the equivalent Hackney IP & Licensing workbook.
export const IP_LICENSING_TOKEN_VALUE = 0
export const IP_LICENSING_BOOKING_FEE_PCT = 0
export const IP_LICENSING_PAYMENT_FEE_PCT = 0
export const IP_LICENSING_SKUS_ONLINE_2025 = []
export const IP_LICENSING_SKUS_OFFICE_2025 = []
export const IP_LICENSING_MONTHLY_2025 = []
export const IP_LICENSING_GRAND_2025 = {
  onlineQty: 0, onlineRev: 0,
  officeQty: 0, officeRev: 0,
  totalQty: 0,  totalRev: 0,
}
export const IP_LICENSING_COMMISSION_2025 = {
  onlineTicketCommission: 0,
  source: 'N/A — Plonk Golf model not in scope for Hackney bar-only entity.',
  note: 'TBD: revisit if Hackney adopts a Plonk Golf relationship.',
}
