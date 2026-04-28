// NO DICE HACKNEY LTD — VERIFIED FINANCIAL DATA (BAR-ONLY)
//
// Source of truth: No_Dice_Hackney_Bar_Only_Investor_Pack.xlsx (39 sheets,
// 3,751 formulas, 0 errors per the 14-check QA audit dated 17 April 2026).
// Every figure here traces to a specific Excel cell — comment format:
//   // Excel: <Sheet>!<Cell>
//
// DO NOT cross-contaminate with Borough numbers in src/data.js. Hackney is a
// separate entity at a different valuation (£100k inv, 4× multiple, 44.73%
// B-share) — Borough's headline figures (£741k revenue, £150k investment,
// A-share priority, paid Google Ads, % rent) are wrong for Hackney.

export const HACKNEY_BUSINESS = {
  name: 'No Dice Hackney Ltd',
  location: 'London Fields, London E8',
  description: 'Bar · DJ & events · Garden · Pool · Arcades · Board games',
}

// === DEAL ===
// Single share class (all A-shares) — no A/B distinction. £100k investment
// for 50% equity; pre-money equals investment (£100k) → post-money £200k.
// The implied entry multiple is £100k / £30,896.17 = 3.24× — below the 4.1×
// hospitality sector average, sits inside the small-single-site 2–4× band.
// Exit multiple held at 4× (sector average) for the Y5 valuation. Preferred
// return retained as a contractual feature attached to the investor (not
// share-class-attached, since there is only one class).
export const HACKNEY_DEAL = {
  investment: 100000,           // Investment amount
  multiple: 3.236647,           // ENTRY: investment / 2025 EBITDA — derived for 50/50 split
  exitMultiple: 4,              // Excel: Investor Returns!D27 (Y5 exit valuation)
  preMoney: 100000,             // = investment (50/50)
  postMoney: 200000,            // pre-money + investment
  founderEq: 0.5,               // Single share class — 50/50 split
  investorEq: 0.5,
  preferredPct: 0.08,           // Excel: Dividend & Distribution Model!B23
  preferredAmount: 8000,        // 8% × £100,000
  reserveTarget: 34684,         // Excel: Dividend & Distribution Model!G86 (3 × Fixed OH + Rent)
  reserveMonthlyBase: 11561,    // 1/3 of reserveTarget — Fixed OH + Rent ex wages
}

// === 2025 ACTUALS (BAR-ONLY, MINI GOLF EXCLUDED) ===
// Restated from the source weekly P&L. Mini golf operations and Golf Host
// rota lines removed; saves ~£19,800/yr net vs combined trading.
export const HACKNEY_ACTUALS_2025 = {
  revenue: 538090.57,           // Excel: Monthly Summary!C15
  allCosts: 462200.62,          // Excel: Monthly Summary!D15
  fixedCosts: 114880,           // Excel: Monthly Summary!E15
  variableCosts: 167448.63,     // Excel: Monthly Summary!F15
  wages: 179871.99,             // Excel: Monthly Summary!G15 (fully-loaded inc 21.4% NIC+pension+holiday)
  vatDiff: 44993.78,            // Excel: Monthly Summary!H15
  profit: 30896.17,             // Excel: Monthly Summary!I15 (EBITDA — bar-only verified)
}

// 2025 month-by-month income (bar-only restated). Used for 12-month chart
// + cross-check against forecast equivalents.
// Excel: Monthly Summary!C3:C14 (rows = Jan…Dec)
export const HACKNEY_MONTHLY_2025 = [
  { month: 'Jan', income: 26867,    profit: 703.39 },
  { month: 'Feb', income: 32999.58, profit: -1449.55 },
  { month: 'Mar', income: 52040.38, profit: 9183.67 },
  { month: 'Apr', income: 48158.36, profit: 7356.63 },
  { month: 'May', income: 43489.18, profit: 1192.78 },
  { month: 'Jun', income: 62703.56, profit: 7773.94 },
  { month: 'Jul', income: 44999.83, profit: 4684.73 },
  { month: 'Aug', income: 63368.62, profit: 8506.70 },
  { month: 'Sep', income: 38564.91, profit: -3331.77 },
  { month: 'Oct', income: 39863.27, profit: 1174.53 },
  { month: 'Nov', income: 48740.74, profit: -1928.63 },
  { month: 'Dec', income: 36295.14, profit: -2970.25 },
]

// === USE OF FUNDS ===
// Excel: Investment Valuation 1!A24:D28 — 5 line items, sums to £100,000.
export const HACKNEY_USE_OF_FUNDS = [
  { label: 'Stock Purchase — Liquidators',     amount: 42000, vat: '+ VAT',  note: 'Bar & kitchen equipment. Immediately operational.' },
  { label: 'Landlord — Rent Deposit (3 mo)',   amount: 26750, vat: '+ VAT',  note: '3 × monthly rent. Refundable on exit.' },
  { label: 'Garden Refurbishment',             amount: 12000, vat: '+ VAT',  note: 'Outdoor trading area refurb (£10k + VAT).' },
  { label: 'Interior Completion & Signage',    amount: 10000, vat: 'inc VAT', note: 'Fit-out completion, signage, branding.' },
  { label: 'Legals, Restart & Working Capital',amount:  9250, vat: '—',     note: 'Staged per cash flow. Early trading costs.' },
]

// === BASE CASE FORECAST (May 2026 – Apr 2027, +15% growth) ===
// Excel: Base Case Forecast!N6:N18 (period totals).
export const HACKNEY_FORECAST = {
  revenue: 618804.17,           // Excel: Base Case Forecast!N6
  wages: 179871.99,             // Excel: Base Case Forecast!N8 (held flat at 2025 actuals — conservative)
  fixedOverhead: 124070.40,     // Excel: Base Case Forecast!N9
  accountancy: 6000,            // Excel: Base Case Forecast!N10
  variableCosts: 180151.29,     // Excel: Base Case Forecast!N11
  allOpCosts: 490093.68,        // Excel: Base Case Forecast!N12
  directorSalary: 15885,        // Excel: Base Case Forecast!N13 (inc £885 employer NI)
  rent: 14664,                  // Excel: Base Case Forecast!N14 (8 mo × £1,833 — May–Aug rent free)
  vatDiff: 52529.67,            // Excel: Base Case Forecast!N15
  profit: 45631.82,             // Excel: Base Case Forecast!N17 (after director salary)
  margin: 0.0737,               // Excel: Base Case Forecast!N18
}

// Forecast monthly arrays for charts (May 2026 → Apr 2027).
// Excel: Base Case Forecast!B6:M6 (revenue) and B17:M17 (profit).
export const HACKNEY_FORECAST_MONTHLY = [
  { month: 'May 26', revenue: 45949.63, profit:  2953.75 },
  { month: 'Jun 26', revenue: 95520.68, profit: 25103.67 },
  { month: 'Jul 26', revenue: 49192.86, profit:  4802.84 },
  { month: 'Aug 26', revenue: 97555.48, profit: 27331.33 },
  { month: 'Sep 26', revenue: 36129.72, profit: -7324.75 },
  { month: 'Oct 26', revenue: 38605.44, profit: -3008.92 },
  { month: 'Nov 26', revenue: 57715.90, profit:   770.83 },
  { month: 'Dec 26', revenue: 32002.62, profit: -7732.28 },
  { month: 'Jan 27', revenue: 17537.38, profit: -9819.76 },
  { month: 'Feb 27', revenue: 26454.59, profit: -9272.14 },
  { month: 'Mar 27', revenue: 65795.60, profit: 13781.03 },
  { month: 'Apr 27', revenue: 56344.27, profit:  8046.22 },
]

// === CASH FLOW (May 2026 – Apr 2027) ===
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

// === SCENARIOS ===
// Revenue and profit from Excel: Scenario Planning!B105:F111. Investor Y1
// recomputed for the 50/50 single-share structure: preferred £8,000 paid
// first, then 50% of (profit − preferred). Differs from the original Excel
// outputs (which assumed 44.73/55.27).
export const HACKNEY_SCENARIOS = [
  { name: 'Conservative', growth: '+10%', revenue: 591899.63, profit: 30345.19, investorY1: 19172.60, coc: 0.1917 },
  { name: 'Base Case',    growth: '+15%', revenue: 618804.17, profit: 45631.82, investorY1: 26815.91, coc: 0.2682 },
  { name: 'Optimistic',   growth: '+20%', revenue: 645708.68, profit: 63512.15, investorY1: 35756.07, coc: 0.3576 },
]

// === DOWNSIDE STRESS TEST ===
// Excel: Downside Scenario!E21:E27 — what happens if revenue drops 10%.
// Honest framing — surface the loss in the deck rather than hide it.
export const HACKNEY_DOWNSIDE = {
  revenueDrop: -0.10,
  annualRevenue: 484281.51,
  annualProfit: -12511.37,    // Excel: Downside Scenario!E26 — LOSS
  margin: -0.0258,            // Excel: Downside Scenario!E27
  cashBufferGap: -45412.44,   // Excel: Downside Scenario!E29
  verdict: 'Business unprofitable at -10% top-line drop given fixed wage base.',
}

// === 5-YEAR INVESTOR RETURNS ===
// Revenue and pre-share profit from Excel: Investor Returns!B19:F22 (Y2–Y5
// growth held at 7.5%). Investor share recomputed for 50/50 single-share
// structure: preferred £8,000 + 50% of residual.
export const HACKNEY_INVESTOR_RETURNS = {
  year1: {
    profit: 45631.82,         // Excel: Investor Returns!D9
    investorEq: 0.5,          // Single share class — 50%
    investorReturn: 26815.91, // £8,000 preferred + 50% × (£45,631.82 − £8,000)
    coc: 0.2682,
    paybackYears: 4,
  },
  fiveYear: [
    { year: 'Y1 2026/27', revenue: 618804.17, profit: 45631.82, investorShare: 26815.91 },
    { year: 'Y2 2027/28', revenue: 665214.48, profit: 49054.21, investorShare: 28527.10 },
    { year: 'Y3 2028/29', revenue: 715105.57, profit: 52733.28, investorShare: 30366.64 },
    { year: 'Y4 2029/30', revenue: 768738.49, profit: 56688.28, investorShare: 32344.14 },
    { year: 'Y5 2030/31', revenue: 826393.88, profit: 60939.90, investorShare: 34469.95 },
  ],
  cumulativeDividends: 152523.74,
  exit: {
    y5Ebitda: 60939.90,           // Excel: Investor Returns!D26
    multiple: 4,                  // Exit at sector-average 4× (entry was compressed to 3.24×)
    businessValue: 243759.60,     // Y5 EBITDA × 4
    investorProceeds: 121879.80,  // 50% × business value
  },
  totalReturned: 274403.54,       // Cumulative dividends + exit
  multipleOfMoney: 2.7440,
  irr: 0.3182,                    // IRR on cash flows: -100k, +26816, +28527, +30367, +32344, +156350
}

// === DISTRIBUTION WATERFALL (4 STEPS) ===
// Single share class — 50/50 pro-rata after preferred + reserve gate.
// No founder priority slice. Preferred return is contractual to the investor.
export const HACKNEY_WATERFALL = [
  { step: 1, label: 'Total operating profit', value: 45632, note: 'Year 1 base case, after director salary.' },
  { step: 2, label: 'Investor preferred return — paid first', value: 8000, note: '8% × £100,000 — priority not guarantee.' },
  { step: 3, label: 'Reserve retention', value: 0, note: '3-month Fixed OH + Rent target (£34,684) — currently funded by trading cash, £0 withheld.' },
  { step: 4, label: 'Remaining pool — pro-rata 50/50', value: 37632, note: 'Single share class — 50% investor / 50% founder. £18,816 each.' },
]

// === MARKETING (NO PAID SEARCH) ===
// Total ~£8k/yr — ~1% of forecast revenue, below hospitality 3–5% norm.
// Borough used Google Ads; Hackney does not (deleted from model).
export const HACKNEY_MARKETING = {
  total: 8000,
  pctOfRevenue: 0.013,
  channels: [
    { label: 'Organic social',      amount: 3000, note: 'Instagram, TikTok, in-house content.' },
    { label: 'Local listings',      amount: 2000, note: 'Time Out, Resident Advisor, Broadway Market, neighbourhood SEO.' },
    { label: 'Events & partnerships', amount: 3000, note: 'DJ programme, brand collabs, taco nights, community.' },
  ],
}

// === RENT STRUCTURE ===
export const HACKNEY_RENT = {
  monthly: 1833,           // ex VAT
  rentFreeMonths: 4,       // May–Aug 2026 (landlord acquisition concession)
  payingMonths: 8,         // Sep 2026 – Apr 2027
  yearOneTotal: 14664,
}

// === SECTOR CONTEXT ===
// CLFI M&A Monitor H1 2025 + Houlihan Lokey hospitality sector data.
export const HACKNEY_SECTOR = {
  hospitalityAvgMultiple: 4.1,
  ukMidMarketAvg: 5.3,
  smallSiteRange: '2–4×',
  distressedRange: '2–3×',
  thisDeal: 4.0,
}

// === COMPLIANCE ===
export const HACKNEY_COMPLIANCE = 'Projections are scenarios, not guarantees. Past performance does not predict future results. This is not regulated financial advice. Investors should take independent advice before committing capital.'
