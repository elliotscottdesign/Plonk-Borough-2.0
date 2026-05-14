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
// Hackney's deployed Apps Script web app — separate from Borough's
// (see infra/lock-sync-apps-script-hackney.gs). Each deck MUST hit its
// own endpoint; sharing one would cause the two decks to overwrite each
// other's locked container on every founder lock. Empty = localStorage-
// only (no cross-device sync).
export const LOCK_SYNC_URL = 'https://script.google.com/macros/s/AKfycbxksN8yyi-G0rI59O8j20v12tpk0vT1oWPUNMTvgPj--9DZGXT2OglCDvQUSuKRCPPD/exec'
export const LOCK_SYNC_SECRET = ''

// === NOTES SYNC ENDPOINT ============================================
// Hackney's deployed Apps Script web app for the per-page notes
// feature — separate from Borough's (and from the Hackney lock-sync).
// Each deck has its own Notes sheet so investor notes against the
// Borough deck never bleed into the Hackney one. Empty = localStorage-
// only mode (notes work, but no cross-device sync + no founder email).
//
// Deployment instructions in infra/notes-apps-script-hackney.gs.
//
// Endpoints (handled by infra/notes-apps-script-hackney.gs):
//   GET  ?code=<CODE>           → { notes: <blob>|null }
//   GET  ?all=1&secret=<SECRET> → { rows: [{ code, notes, updatedAt }] }
//   POST { code, notes, page, text, secret? } → upserts row + emails founder
export const NOTES_SYNC_URL = 'https://script.google.com/macros/s/AKfycbxnfgCTDYsjvQdBWwO3Fjta6tQiFCsWkSHuSJUvvfXidawoEhPg7eHsNX6rm4ZEk60osg/exec'
export const NOTES_SYNC_SECRET = ''
// Founder email — receives a notification when any user leaves a note.
export const NOTES_FOUNDER_EMAIL = 'elliotscottdesign@gmail.com'

// === DEAL STRUCTURE ===
// HURRIED-SALE ROUND · £50,000 total raised for 50% of the company.
// Founder retains 50% pre-money (not for sale) AND personally buys back
// £20,000 of the round (= 20% of the company) — so post-round the founder
// holds 70% (50% retained + 20% bought back). The remaining £30,000 of
// the round (= 30% of the company) is the only portion available to
// external investors. £50k for 50% implies pre-money £50k, post-money
// £100k, entry 1.62× the £30,896 verified 2025 profit — well below the
// 4.1× sector average, reflecting the hurried sale.
//
// Cap table — live state of the round:
//   Founder retained (pre-money holdback)   50%   £0    — not for sale
//   Founder buyback                         20%   £20k  — SOLD (founder)
//   Investor #1                                   5%    £5k  — SOLD (external)
//   Available to external investors         25%   £25k  — FOR SALE
//                                          ----   ----
//                                          100%   £50k
//
// Returns shown on the deck assume a NEW external investor takes their
// own slice of the remaining £25k. The default models a single investor
// taking the full £25k (= 25% equity). The FundingSlider on Cover lets
// them model a smaller stake (£5k → 5%, £10k → 10%, etc.). Equity is
// always investment / £100k post-money. Founder slice of profits =
// 70% (= founder retained 50% + buyback 20%); Investor #1 (committed) takes
// 5%; the new investor takes whatever they subscribe for, up to the
// £25k remaining.
export const DEAL = {
  // Single-investor view (drives the deck's headline numbers / returns)
  investment: 25000,             // max a NEW investor can take = remaining available
  investorEq: 0.25,              // 25% if they take the full remaining stake
  founderEq: 0.70,               // 50% retained + 20% buyback (other 5% sits with Investor #1)

  // Round-level breakdown (informational — shown on Investment Summary)
  roundSize:        50000,       // total raise this round
  roundEquity:      0.50,        // half the company is being sold
  founderRetained:  0.50,        // pre-money holdback — never sold
  founderBuyback:   20000,
  founderBuybackEq: 0.20,

  // Commitments already SOLD this round — add new entries here as cheques
  // arrive. The Investment Summary's RoundProgressBlock iterates over
  // this list to render the cap-table + progress bar.
  commitments: [
    { label: 'Founder buyback', amount: 20000, equity: 0.20, type: 'founder',  status: 'sold' },
    { label: 'Investor #1',          amount:  5000, equity: 0.05, type: 'external', status: 'sold' },
  ],

  availableAmount:  25000,       // = roundSize - sum(commitments)
  availableEq:      0.25,        // = roundEquity - sum(committed equity)
  founderTotalPost: 0.70,        // 50% + 20%
  externalPostEq:   0.30,        // 5% (committed) + 25% (available) = 30% external pool

  // Share / governance
  shareClass: 'B (non-voting)',  // Round 1: B shares only. Founder retains 100% of A shares.
  totalBEquity:     0.50,        // 50% of the company is B-class (everyone selling/holding in this round)
  preferredYield:   0.10,        // 10% preferred yield on EXTERNAL B-class capital invested.
                                 // Paid each year BEFORE the pro-rata residual split. Funded
                                 // from operating profit AFTER director salary + working-capital
                                 // top-up. Founder's £20k B-class BUYBACK does NOT receive
                                 // preferred — external B holders rank ahead of founder B in
                                 // the dividend queue. Non-cumulative (unpaid preferred does
                                 // not roll forward).
  multiple: 1.6184,              // entry multiple — preMoney / 2025 EBITDA (50000 / 30896.17)
  exitMultiple: 4,               // exit multiple at Y5 — held at sector average
  preMoney: 50000,
  postMoney: 100000,
  preferred: 0,                  // no preferred return
  aSharePriority: 0,             // no founder priority slice

  // Defaults reflect Y1 base case profit £85,181 with the 10% preferred
  // yield applied to external B-class capital:
  //   Total external B (Investor #1 £5k + new investor £25k) = £30k
  //   Total preferred (10%) = £3,000/yr funded from profit
  //   New investor's preferred share = £2,500 (25k of 30k external)
  //   Residual (£82,181) split pro-rata across all equity:
  //     New investor (25%) = £20,545
  //   New investor Y1 dividend = £23,045
  investorDividend: 23045,
  totalInvestorReturn: 23045,
  coc: 0.9218,                   // 92.18% on £25k invested
  payback: 1.085,                // years (25,000 / 23,045)
  aShareThreshold: 5000,         // 5% of post-money £100k — governance floor
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
//                   + new rent £48,750 (9 paying months × £65k/12; 3-mo rent-free)
//                   + rates £16,830 (2025 × 1.10, pending Hackney confirm)
//                   = £91,419
//   VAT             44,994 × 1.15 = £51,743 (scales with revenue)
//   Director         15,885 (separate line)
//   Op profit (after director) ≈ £85,181 → margin ≈ 13.8%
//
// Lease economics: £65,000 + VAT per annum (NET in P&L — VAT-registered
// bar recovers input VAT). Forecast year May 2026 → Apr 2027 has 3
// months rent-free at the start (May–Jul 2026), then 9 paying months
// at £65k/12 = £48,750. Steady state Y2 = £65,000 net. Y3 onwards
// grows at +3% pa (lease uplift clause). Old Plonk arrangement was
// £94,146/yr — the new lease saves ~£29k/yr at steady state, plus an
// additional ~£16,250 in Y1 from the rent-free start.
export const FORECAST = {
  revenue:    618804.17,
  wages:      179872,
  variable:   194704,           // sum of stock + operational variable, all × 1.10
  fixed:       91419,           // rent £48,750 + rates £16,830 + other fixed × 1.10
  vatNet:      51743,           // 2025 VAT × 1.15 (scales with revenue)
  director:    15885,           // separate line (inc £885 employer NI)
  rent:        48750,           // Y1 with 3-mo rent-free; £65,000 / 12 × 9 paying months (net)
  rates:       16830,           // 2025 × 1.10 — Hackney Council confirmation pending
  profit:      85181,           // revenue − wages − variable − fixed − VAT − director
  margin:       0.1377,         // profit / revenue
}

// === INCOME BY SOURCE (Jan–Dec 2025, BAR-ONLY VIEW) ===
// Hackney is presented as a Bar entity going forward — the Plonk Golf
// course is a separately-incorporated operator and its golf-round
// revenue does NOT belong in No Dice Hackney's historic sales mix.
// The "Online golf (DMN)" line that was previously here (£39,288)
// has been removed from this breakdown — that revenue stream is
// shown on the Plonk page (HACKNEY_GOLF_2025) instead.
//
// Source: Weekly Merged 2024-2026 tab, Jan–Dec 2025 columns aggregated,
// minus the online-golf row. Bar-only sources sum to £523,398 (was
// £562,686 with golf included). The deck uses Monthly Summary's £538k
// as the headline annual revenue elsewhere; this breakdown represents
// the relative shares of each bar-side income source for the donut.
//
// Notes on what stays here:
//   • Game & Drink — drink component is bar revenue and stays 100%
//     with No Dice per the Plonk Operations agreement (the drink
//     dwarfs the bundled golf round)
//   • Pool tournament entries + Pool tickets — bar-side activity,
//     stays 100% with No Dice
export const INCOME_SOURCES = [
  { name: 'Bar takings',                amount: 484684, pct: 92.6, color: '#0D1F4C' },
  { name: 'Office bookings / hires',    amount:  28120, pct:  5.4, color: '#1976D2' },
  { name: 'Game & Drink',               amount:   4824, pct:  0.9, color: '#F59E0B' },
  { name: 'Pool tournament entries',    amount:   3570, pct:  0.7, color: '#1E88E5' },
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
// Per user direction (May 2026):
//   • Rent: NEW lease — £65,000 + VAT per annum (net in P&L). 3-month
//     rent-free start (May–Jul 2026). 3-month deposit on signing.
//     3% annual uplift on rent.
//       Y1 = 9 paying months × (£65k/12) = £48,750
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
  rentY1:           48750,              // 9 paying months × £65k/12 (3 months rent-free)
  rentSteady:       65000,              // Y2 full year
  rentUplift:       0.03,               // 3% annual uplift on rent (Y3+ compounds)
  rentFreeMonths:   3,                  // May–Jul 2026
  depositMonths:    3,                  // 3-month deposit
  depositInc:       19500,              // 3 × £6,500 inc VAT — paid monthly during rent-free
  depositPaidMonthly: true,             // £6,500/mo across the first 3 trading months
                                        // (= the 3 rent-free months) so does not consume Day-1 raise
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
// Palette designed for dark-background legibility — Tailwind 400-level
// hues so every category reads cleanly in chart bars / lines AND in
// tooltip text. Wages and Drinks & Gas (biggest two) take the warmest
// reds; Fixed Costs steps to purple so it stands out from the warm
// cost family without breaking the cost-side feel; the smaller
// categories spread across pink / orange / amber / yellow.
export const COST_CATEGORIES = [
  { name: 'Wages',          amount: 175531, pct: 36.2, color: '#F87171' }, // red 400
  { name: 'Drinks & Gas',   amount: 134123, pct: 27.6, color: '#FB923C' }, // orange 400
  { name: 'Fixed Costs',    amount: 132936, pct: 27.4, color: '#C084FC' }, // purple 400 — stands out
  { name: 'Cleaning',       amount:  16492, pct:  3.4, color: '#F472B6' }, // pink 400
  { name: 'DJs',            amount:  10300, pct:  2.1, color: '#FCA5A5' }, // rose 300
  { name: 'Arcades',        amount:   8202, pct:  1.7, color: '#FDBA74' }, // orange 300
  { name: 'Food',           amount:   7887, pct:  1.6, color: '#FBBF24' }, // amber 400
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
// Peak £76,920 (Aug), low £33,833 (Feb), year-end £67,046 (Apr).
//
// Rent-free period change (May 2026): the lease moved from a 4-month
// rent-free start (May–Aug 26) to a 3-month rent-free start (May–Jul
// 26). Net effect on Y1 cashflow: Aug 26 now has £5,416.67 of rent
// added, and every subsequent closing balance drops by the same
// amount. Pattern below: rows 1-3 (May-Jul) unchanged from the
// rent-free Excel snapshot; row 4 (Aug 26) net reduced by £5,416.67;
// rows 5-12 closings each shifted -£5,416.67 vs the workbook's
// original 4-mo-rent-free numbers. The May/Jun/Jul nets and Sep-Apr
// nets stay the same — only Aug 26 gains a rent line.
export const HACKNEY_CASHFLOW = [
  { month: 'May 26', net:  19889.52, closing: 19889.52 },
  { month: 'Jun 26', net:  33900.15, closing: 53789.67 },
  { month: 'Jul 26', net:   9146.58, closing: 62936.25 },
  { month: 'Aug 26', net:  13984.25, closing: 76920.50 },   // rent now starts here (was 19400.92 / 82337.17 under 4-mo rent-free)
  { month: 'Sep 26', net:  -4703.39, closing: 72217.11 },
  { month: 'Oct 26', net:     94.91, closing: 72312.02 },
  { month: 'Nov 26', net:  -9186.49, closing: 63125.53 },
  { month: 'Dec 26', net:  -5509.88, closing: 57615.65 },
  { month: 'Jan 27', net:  -8369.97, closing: 49245.68 },
  { month: 'Feb 27', net: -15412.44, closing: 33833.24 },
  { month: 'Mar 27', net:  20129.18, closing: 53962.42 },
  { month: 'Apr 27', net:  13083.32, closing: 67045.74 },
]

// Working-capital safety zone — the bank balance the company commits to
// keeping at all times once the reserve is built.
//   • FLOOR  £30,000 — three months' rent equivalent. Operational red line;
//                      we never let the bank balance fall below this.
//   • TARGET £45,000 — floor + £15k cushion for VAT bills, supplier swings
//                      and one-off equipment / repairs. Once we're here we
//                      consider the working-capital pot fully built.
// Investor dividends are gated on the reserve sitting AT OR ABOVE the FLOOR.
// The founder draws their quarterly share regardless, since they cannot
// wait for the pot to build. Investor's deferred quarters get caught up
// later, once the reserve is fully built (≥ TARGET).
export const HACKNEY_WORKING_CAPITAL_FLOOR  = 30000
export const HACKNEY_WORKING_CAPITAL_TARGET = 45000

export const HACKNEY_CASH = {
  peak: 82337,        // Aug 2026
  low: 39250,         // Feb 2027
  yearEnd: 72462,     // Apr 2027
  safetyFloor:  HACKNEY_WORKING_CAPITAL_FLOOR,   // £30k red line
  safetyTarget: HACKNEY_WORKING_CAPITAL_TARGET,  // £45k fully-funded target
}

// === WAGES — 2025 ROTA REFERENCE (4-role calculator basis) ===
// Source: live rota Google Sheets (sheet 1NgIp2TcNPcf9pWcD5CVELexarlmnxe9jeC61aTCZKy0)
// Aggregated 2025 bar-only shifts. Filters applied:
//   • Roles kept: Bar Staff, Supervisor, Assistant Manager, Manager
//   • Roles excluded: Golf Host (mini-golf), Kitchen, blank-role rows
//   • Date validation: dropped rows with empty / unparseable dates
//   • Day-of-week validation: zero mismatches in the source
// Hourly rotaed totals from the source: Bar Staff 4,506.3 · Supervisor
// 1,216.5 · Asst. Manager 1,796.2 · Manager 1,375.1.
//
// Manual correction — Manager + Asst. Manager set to 2,080 hrs (40 ×
// 52, full-time salaried basis). The rota cloud under-records these
// two salaried roles because it only logs on-floor scheduled shifts
// — it does not capture management / admin / supplier / HR time
// that's part of their salaried scope. The financial truth
// (PL_WAGE_BASE £179,872 from Weekly Merged G15) already pays both
// roles for full-time work, so 2,080 hrs is the correct hours basis
// for any £-derivation. Bar Staff and Supervisor stay at the
// rota-recorded figures (these are paid hourly and the rota is the
// truth for those).
export const WAGE_RATES = [
  { role: 'Bar Staff',     rate: 13.82, hours: 4506.3, color: '#E67E22' },
  { role: 'Supervisor',    rate: 15.12, hours: 1216.5, color: '#D4A843' },
  { role: 'Asst. Manager', rate: 16.46, hours: 2080,   color: '#94A3B8' },  // 40 × 52 (salaried)
  { role: 'Manager',       rate: 18.26, hours: 2080,   color: '#0D9488' },  // 40 × 52 (salaried)
]

// Raw rota figures as recorded in the live rota cloud — kept here so the
// 2025 Performance tab can render a transparent investor-facing wage
// reconciliation (raw rota → manual salaried correction → financial truth).
// These are the figures an investor will see if they pull the rota Google
// Sheet directly; the two salaried roles come in below 40 × 52 because the
// rota only logs on-floor scheduled shifts, not management / admin time.
export const WAGE_RATES_ROTA_RAW_2025 = [
  { role: 'Bar Staff',     rate: 13.82, hoursRaw: 4506.3, hoursAdjusted: 4506.3, salaried: false, color: '#E67E22' },
  { role: 'Supervisor',    rate: 15.12, hoursRaw: 1216.5, hoursAdjusted: 1216.5, salaried: false, color: '#D4A843' },
  { role: 'Asst. Manager', rate: 16.46, hoursRaw: 1796.2, hoursAdjusted: 2080,   salaried: true,  color: '#94A3B8' },
  { role: 'Manager',       rate: 18.26, hoursRaw: 1375.1, hoursAdjusted: 2080,   salaried: true,  color: '#0D9488' },
]

// === WAGE FINANCIAL TRUTH — Weekly Merged 2024-2026 ==================
// Methodology rule for the Hackney deck: the only true financial wage
// data for 2025 comes from Weekly Merged 2024-2026 (which is what
// Monthly Summary G15 aggregates). The live rota Google Sheet is for
// HOURS / DATE / TIME / ROLE allocation only — never for £ figures.
// Weekly Merged splits wages by COMPONENT (gross pay, NIC, pension,
// holiday, sick, freelance) — NOT by ROLE — so any role-level £
// attribution (e.g. Golf Host, Bar Staff) is an estimate derived
// from rota hours × rate, not financial truth.
export const PL_WAGE_BASE = 179872            // 2025 financial-truth wage line — Monthly Summary G15 (= Weekly Merged 2024-2026 wage rows aggregated)
// ROTA_TOTAL derives from WAGE_RATES so any hours/rate correction
// (e.g. Manager + Asst. Manager set to 2,080 full-time-salaried
// basis) keeps the multiplier in sync. With the corrected salaried
// hours, ROTA_TOTAL ≈ £152,888 and WAGE_OVERHEAD_MULT ≈ 1.176 —
// closer to the true ~17–21% NIC + pension + holiday loading than
// the old empirical 1.355 figure (which was inflated because the
// rota under-counted salaried hours).
export const ROTA_TOTAL = WAGE_RATES.reduce((s, r) => s + r.rate * r.hours, 0)
export const WAGE_OVERHEAD_MULT = PL_WAGE_BASE / ROTA_TOTAL   // empirical multiplier reconciling rota gross to financial-truth payroll · derived, not contractual

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
// Hurried-sale round with a 10% preferred yield on EXTERNAL B-class
// capital. Each year, after director salary + working-capital top-up:
//   1. External B holders receive 10% × their invested capital as
//      preferred dividend. Founder B does NOT get preferred.
//   2. Residual splits pro-rata across all equity (A + B).
// Assuming full subscription (Investor #1 £5k + new investor £25k):
//   • Total external B:          £30,000
//   • Annual preferred pool:     £3,000  (Investor #1 £500 + new £2,500)
//   • Residual (Y1):             £82,181
//   • New investor (25%) Y1:     £2,500 preferred + £20,545 residual = £23,045
//   • Everyone-else Y1:          £62,136
// Slides recompute live via computeInvestorDividend(); this constant
// is the un-locked fallback only.
export const WATERFALL = {
  operatingProfit: 85181,
  preferred: 3000,                 // 10% × £30k external B at full subscription
  aSharePriority: 0,
  remainingPool: 82181,            // = operatingProfit - preferred
  investorDividend: 23045,         // new investor at 25% (£2,500 preferred + £20,545 residual)
  founderDividend: 62136,          // = 85,181 - 23,045
  totalInvestor: 23045,
  totalFounder: 62136,
}

// === 5-YEAR INVESTOR RETURNS ===
// HURRIED-SALE ROUND · 30/70 pro-rata (investor / founder) at the full
// £30k available stake, no preferred return. Year-1 profit £85,181 from
// the 2026 cost model (£65k+VAT pa lease with 3-mo rent-free Y1 start +
// 10% uplift on stock and other fixed lines). Y2 onwards rent steps up
// to the £65,000 headline; Y3+ grows at +3% pa per the lease uplift
// clause. Revenue and variable costs grow at 7.5% YoY; wages, fixed
// (other), rates and director are held flat. Investor share = 30% ×
// profit each year (founder retains 70% = 50% pre-money + 20% buyback).
// On a £30k investment basis: Y1 dividend £25,554 = 85% cash-on-cash,
// 1.2-year payback, ~14× money-on-money over the full 5-year hold
// (dividends + Y5 exit at 4× EBITDA). Powers the multi-year payout
// schedule on the WaterfallReturns slide.
//
// vs the old £45,632 forecast (which assumed the legacy Plonk rent of
// £94,146): the new £65k lease saves ~£29k/yr at steady state, plus
// another ~£16,250 in Y1 from the 3-month rent-free start. Combined
// with the +15% revenue assumption, that flows straight through to
// operating profit and compounds over the 5-year exit.
//
// Note (May 2026 lease change): rent-free period reduced from 4 months
// to 3 months. Y1 only is affected — adds £5,417 of rent in Aug 26 and
// drops Y1 op profit by the same amount. Y2-Y5 unchanged (always full
// rent). Cumulative dividends and total-returned re-summed; IRR is the
// same flow shape but Y1 inflow drops by £2,708 — recomputed below.
export const HACKNEY_INVESTOR_RETURNS = {
  year1: {
    profit:          85181,
    investorEq:      0.25,
    investorReturn:  23045,           // preferred £2,500 + residual £20,545
    coc:              0.9218,         // 23045 / 25000
    paybackYears:     1.085,          // 25000 / 23045
  },
  // 'investorShare' = a NEW investor taking the full £25k remaining
  // stake (= 25% of company). Each year:
  //   • Preferred:  £2,500   (10% × £25k invested capital — fixed)
  //   • Residual:   25% × (profit − £3,000 total external B preferred)
  // 'founderShare' bundles everyone-else (founder 70% A+B residual +
  // Investor #1 5% residual + Investor #1's £500 annual preferred).
  fiveYear: [
    { year: 'Y1 2026/27', revenue: 618804.17, profit:  85181.41, investorShare: 23045.35, founderShare:  62136.06 },
    { year: 'Y2 2027/28', revenue: 665214.48, profit:  96856.85, investorShare: 25964.21, founderShare:  70892.64 },
    { year: 'Y3 2028/29', revenue: 715105.57, profit: 124928.65, investorShare: 32982.16, founderShare:  91946.49 },
    { year: 'Y4 2029/30', revenue: 768738.49, profit: 155192.97, investorShare: 40548.24, founderShare: 114644.73 },
    { year: 'Y5 2030/31', revenue: 826393.88, profit: 187818.27, investorShare: 48704.57, founderShare: 139113.70 },
  ],
  cumulativeDividends: 171244.53,     // = base £162,494.53 + 5 × £2,500 preferred = +£12,500 over 5 yrs
  exit: {
    y5Ebitda:         187818.27,
    multiple:         4,
    businessValue:    751273.08,
    investorProceeds: 187818.27,      // 25% of business value (exit is pro-rata, no preferred at exit)
    founderProceeds:  563454.81,      // 75% of business value
  },
  totalReturned:      359062.80,      // cumulativeDividends + exit.investorProceeds
  multipleOfMoney:   14.3625,         // totalReturned / 25,000 (was 14.26× under flat-£5k preferred)
  irr:                1.210,          // IRR on flows: -25000, +23045, +25964, +32982, +40548, +236523 (Y5 div + exit)
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
export const HACKNEY_RAISE_TARGET = 25000

// === USE OF FUNDS ===
// Six EXPLICIT slider categories (stock, rent, garden, interior, marketing,
// legals + restart). Working Capital is the 7th line, derived as
// HACKNEY_RAISE_TARGET minus the sum of the six. Defaults below are the
// "headline" values for each line; founder drags to reallocate.
export const USE_OF_FUNDS = [
  { key: 'stock',     item: 'Assets — Liquidator (all bar fit-out)', amount: 12000, vat: 'inc VAT', note: 'All bar assets from the liquidator — £10k + VAT = £12k inc VAT. Renegotiated May 2026; ~50% saving on the original quote. Covers bar equipment, kitchen, fridges/cellar, glassware, POS, games — operational from Day 1.' },
  { key: 'rent',      item: 'Landlord — Rent Deposit (3 mo)',   amount:     0, vat: null,      note: 'Lease deposit £19,500 inc VAT (3 mo × £6,500). Paid monthly from trading cash during the 3-month rent-free period — does NOT consume Day-1 raise. Slider lets the founder elect to ring-fence the deposit upfront instead (1 / 2 / 3 months at the inc-VAT figure).' },
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
  stock:     { min: 0,    max: 12000, step: 500, label: 'Assets — Liquidator (all bar fit-out)' },
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

// === 2026 PERFORMANCE — TAB CONSTANTS ================================
// Mirrors Borough's BusinessExplorer 2026 tab structure but adapted to
// Hackney's bar-only post-restructure shape:
//   • Golf is moving to a separate operator entity, so the golf
//     growth lever is dropped (4 levers, not 5)
//   • Rent is the £65k+VAT lease (Y1 £48,750 with 3-mo rent-free,
//     Y2+ £65,000 with 3% annual uplift) — NOT 15% of turnover
//   • Office Costs structure is copied from Borough (same line items,
//     same defaults — per founder direction)

// Donut palette for the 2026 Income breakdown (cyan family). Borough
// uses #0E7490..#A5F3FC; we use the same for visual consistency.
export const INCOME_2026_COLORS = ['#0E7490','#0891B2','#06B6D4','#22D3EE','#67E8F9','#A5F3FC']

// Custom Scenario levers — one per commercial revenue line. Keys map
// to the forecast.growth state shape ({ bar, office, tournament, pool }).
// Service Charge is intentionally excluded (derived passive line).
// Golf is intentionally excluded (moving to operator entity).
// Bases pulled from INCOME_SOURCES (= 2025 actuals).
export const HACKNEY_SCENARIO_LEVERS = [
  { key: 'bar',        labelKey: 'Bar',                    incomeKey: 'Bar takings',             color: INCOME_2026_COLORS[0], base: 484684 },
  { key: 'office',     labelKey: 'Office bookings / hires', incomeKey: 'Office bookings / hires', color: INCOME_2026_COLORS[2], base:  28120 },
  // Game & Drink bundles a round of golf with a venue drink. Despite
  // the round, 100% of the revenue stays with No Dice (per Plonk
  // Operations going-forward agreement) — the drink component is bar
  // revenue and dwarfs the golf-round portion. Total 2025 G&D sales
  // £4,824 = £4,714 online + £110 office (DMN SKUs).
  { key: 'gameDrink',  labelKey: 'Game & Drink (golf + drink bundle)', incomeKey: 'Game & Drink', color: INCOME_2026_COLORS[1], base: 4824 },
  { key: 'tournament', labelKey: 'Pool tournament entries', incomeKey: 'Pool tournament entries',  color: INCOME_2026_COLORS[3], base:   3570 },
  { key: 'pool',       labelKey: 'Pool tickets (DMN)',      incomeKey: 'Pool tickets (DMN)',       color: INCOME_2026_COLORS[5], base:   2200 },
]

// Office Costs — annual £ defaults per line. Same line items + values
// as Borough (founder confirmed the data is shared).
export const HACKNEY_OFFICE_COST_ITEMS = [
  { id: 'xero',         label: 'Xero accounting',            note: '£25/mo × 12' },
  { id: 'rotacloud',    label: 'RotaCloud',                  note: '~£40/mo for 10 users × 12' },
  { id: 'claude',       label: 'Claude Pro',                 note: '£20/mo × 12' },
  { id: 'google',       label: 'Google Workspace',           note: '£25/mo × 12' },
  { id: 'webhosting',   label: 'Web hosting',                note: 'Annual prepay (~£42/mo equiv.)' },
  { id: 'amazonPrime',  label: 'Amazon Prime',               note: '£8.99/mo × 12 — venue stock + supplies' },
  { id: 'accounting',   label: 'Accounting fees',            note: 'Annual fees' },
  { id: 'director',     label: "Directors' compensation",    note: 'Total director comp budget' },
]
export const HACKNEY_OFFICE_COSTS_2026_DEFAULTS = {
  xero:         300,
  rotacloud:    480,
  claude:       240,
  google:       300,
  webhosting:   500,
  amazonPrime:  108,
  accounting:  3000,
  director:   30000,
}
export const sumHackneyOfficeCosts = (state = {}) =>
  HACKNEY_OFFICE_COST_ITEMS.reduce(
    (sum, item) => sum + (state[item.id] ?? HACKNEY_OFFICE_COSTS_2026_DEFAULTS[item.id]),
    0,
  )

// Fixed Cost editor — line items match HACKNEY_FIXED_COSTS_2025 minus
// rent (rent is driven by FORECAST_RULES.rentY1, not the editor) and
// minus rates (which is the council line and gets its own toggle).
// Defaults are 2025 actuals × 1.10 inflation, per the FORECAST_RULES
// fixedUplift rule.
export const HACKNEY_FIXED_COST_ITEMS = [
  { id: 'rates',       label: 'Business Rates',  ref2025: 15300, note: 'Hackney Council · 2025 × 1.10' },
  { id: 'electricity', label: 'Electricity',     ref2025: 12750, note: '2025 × 1.10' },
  { id: 'water',       label: 'Water',           ref2025:  2550, note: '2025 × 1.10' },
  { id: 'insurance',   label: 'Insurance',       ref2025:  2754, note: '2025 × 1.10' },
  { id: 'license',     label: 'License',         ref2025:  1275, note: '2025 × 1.10' },
  { id: 'prsPpl',      label: 'PRS / PPL',       ref2025:  1530, note: '2025 × 1.10' },
  { id: 'internet',    label: 'Internet',        ref2025:  1445, note: '2025 × 1.10' },
  { id: 'lightspeed',  label: 'Lightspeed',      ref2025:   931, note: '2025 × 1.10' },
  { id: 'tvLicense',   label: 'TV License',      ref2025:   255, note: '2025 × 1.10' },
]
export const HACKNEY_FIXED_COSTS_2026_DEFAULTS = HACKNEY_FIXED_COST_ITEMS.reduce(
  (acc, it) => { acc[it.id] = Math.round(it.ref2025 * 1.10); return acc },
  {},
)
export const sumHackneyFixedCostsAnnual = (state = {}) =>
  HACKNEY_FIXED_COST_ITEMS.reduce(
    (sum, it) => sum + (state[it.id] ?? HACKNEY_FIXED_COSTS_2026_DEFAULTS[it.id]),
    0,
  )

// === FORECAST RULES (2026 Performance) ==============================
// Single source of truth for the cost-uplift assumptions. Consumed by
// BusinessExplorer's 2026 tab AND the WaterfallReturns distribution
// calendar (so monthly profit numbers stay consistent across slides).
export const FORECAST_RULES = {
  revenueGrowth:   0.15,                // base case
  variableUplift:  0.10,                // stock + variable cats
  fixedUplift:     0.10,                // non-rent, non-rates fixed lines
  rentAnnualNet:   65000,
  rentY1:          48750,               // 9 paying months × £65k/12 (3-mo rent-free)
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
  // HURRIED-SALE ROUND — post-money valuation is FIXED at £100k (the
  // company is selling 50% for £50k). Any investor's equity slice is
  // their cash / £100k. Founder retained slice is 50% (pre-money
  // holdback) plus 20% (£20k founder buyback) = 70%, leaving 30%
  // (£30k) available externally.
  //   £5k  → 5%  equity
  //   £10k → 10% equity
  //   £30k → 30% equity (full available external slice)
  const POST_MONEY = 100000
  const postMoney  = POST_MONEY
  const investorEq = Math.min(0.30, Math.max(0, investment / postMoney))
  const founderEq  = 1 - investorEq
  const preMoney   = postMoney - investment
  const ebitda     = 30896.17                       // = ACTUALS_2025.profit
  const impliedMult = ebitda > 0 ? preMoney / ebitda : 0
  return { investment, preMoney, postMoney, investorEq, founderEq, impliedMult }
}

// computeInvestorDividend — Round 1 B-class share of annual operating
// profit including the EXTERNAL-B-only preferred dividend.
//
// Mechanic (each year, after director salary + working-capital top-up):
//   1. EXTERNAL B-class holders receive a preferred dividend equal to
//      preferredYield × their invested capital. Founder's £20k B-class
//      buyback does NOT receive preferred — external B ranks ahead of
//      founder B in the dividend queue.
//   2. Remaining profit splits pro-rata across ALL equity (founder A +
//      founder B + Investor #1 + new investor).
//
// `investmentAmount` is the new investor's £ cheque (drives both their
// preferred entitlement and their equity %, since postMoney is fixed at
// £100k). Investor #1's preferred contribution is read from
// DEAL.commitments where type === 'external'.
//
// Examples (Y1 profit £85,181, 10% yield, Investor #1 already £5k in):
//   Invest £25k → preferred £2,500 + residual £20,545 = £23,045
//   Invest £10k → preferred £1,000 + residual  £8,368 = £9,368
//   Invest  £5k → preferred   £500 + residual  £4,209 = £4,709
//   Invest  £1k → preferred   £100 + residual    £846 = £946
export function computeInvestorDividend(profit, investmentAmount, opts) {
  opts = opts || {}
  const yieldPct = opts.preferredYield ?? DEAL.preferredYield ?? 0
  const POST_MONEY = 100000
  const inv = Math.max(0, investmentAmount || 0)

  // External B capital already committed (excludes founder buyback)
  const committedExternal = (DEAL.commitments || [])
    .filter(c => c.type === 'external')
    .reduce((s, c) => s + (c.amount || 0), 0)

  // Total external B capital this round = committed + the new investor
  const totalExternalCapital = committedExternal + inv
  const grossPreferred       = totalExternalCapital * yieldPct

  const p = Math.max(0, profit || 0)
  const preferred = Math.min(grossPreferred, p)
  const residual  = p - preferred

  // New investor's slice of preferred (pro-rata to capital within external B)
  const investorPref = totalExternalCapital > 0
    ? preferred * (inv / totalExternalCapital)
    : 0
  // New investor's residual share (pro-rata to equity)
  const investorEq    = inv / POST_MONEY
  const residualShare = residual * investorEq
  return investorPref + residualShare
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

// === GOLF OPERATIONS — 2025 ACTUALS + GO-FORWARD STRUCTURE ===========
// Pre-liquidation, the mini-golf course operated next door (Mentmore
// Terrace adjacent site). Customers bought tickets two ways:
//   1. Online via Design My Night (DMN) — £-priced ticket SKUs.
//      Some SKUs include arcade-token bundles (e.g. "Golf + 4 Tokens"
//      includes 4 tokens used in the venue's arcade machines). Tokens
//      are NOT a redemption mechanic for the £ ticket value — the
//      ticket pays for the round of golf, the tokens are an arcade
//      add-on bundled into certain SKUs.
//   2. At the till — direct cash/card sale at the venue (golf round
//      only, no token bundle).
// Customers played golf and (with tokens) used the arcades. Bar / food
// / party spend was incremental on top.
//
// Going forward (2026+), the golf course is being separated:
//   • Golf operated by a SEPARATE company (own entity, own books)
//   • No Dice continues to HOST + OPERATE the course (still the
//     customer-facing operator on site)
//   • No Dice keeps:
//       - 100% of bar revenue (unchanged)
//       - 100% of food revenue (unchanged)
//       - 100% of party / private hire revenue (unchanged)
//       - 100% of arcade token revenue — both online ticket-bundled
//         tokens AND tokens sold at the bar till. The operator
//         takes NO share of token value; tokens are entirely a
//         No Dice revenue line.
//   • Golf operator keeps:
//       - 100% of till ticket sales (was No Dice's)
//       - The £-ticket portion of online sales (golf round component)
//
// Cost structure for the golf side in 2025 (per founder):
//   • Rent — yes (course site is a separate lease)
//   • Some host wages — yes (busy times only — course was always
//     OPEN regardless of whether a dedicated host was rota'd; bar
//     staff and supervisors covered the host role outside busy times)
//   • Maintenance — yes (founder to approximate)
//   • Upgrade — yes (founder to approximate)
//   • Bills — NONE (no utilities billed against the course)
//   • Business rates — NONE (no rates paid on the course site)
//
// Sources for figures below:
//   • onlineTickets   — Design My Night sales export, Hackney venue,
//                        1.1.2025 – 31.12.2025. Sourced from the live
//                        per-SKU breakdown (HACKNEY_DMN_SKUS_ONLINE_2025,
//                        £44,812.35) — NOT from INCOME_SOURCES, which is
//                        the bar-only view and no longer carries an
//                        Online golf line (golf moved to the operator
//                        entity for the going-forward bar narrative).
//   • Pool tournament entries are NOT a golf line — they're bar-side
//     and stay 100% with No Dice. Tracked on Business Explorer via
//     INCOME_SOURCES["Pool tournament entries"] (2025) and HACKNEY_SCENARIO_LEVERS
//     ["tournament"] (2026 forecast).
//   • tillTickets     — Weekly Merged 2024-2026 row 3, walk-in
//                        ticket sales for 1.1.2025 – 31.12.2025
//   • hostWages       — live rota Google Sheet, "Golf host" role
//                        rows (course always open; host scheduled
//                        for busy periods only)
//   • rentShare       — TBD (lease apportioned to course site only)
//   • maintenance / upgrade — founder approximations, TBD
export const HACKNEY_GOLF_2025 = {
  // Revenue lines (what came IN to No Dice as the operating venue in 2025)
  revenue: {
    onlineTickets:    44812,    // £ — Hackney DMN online ticket sales (status=complete).
                                //     Source: Design My Night sales export aggregated
                                //     from HACKNEY_DMN_SKUS_ONLINE_2025 (£44,812.35)
    tillTickets:      25503,    // £ — direct ticket sales at venue till. Source: Weekly
                                //     Merged 2024-2026 row 3 ("Total Walk In Golf
                                //     Tickets"), 52 weeks of 2025 summed (£25,502.77)
    // POOL tournament entries removed from this object — they are NOT a
    // golf line. Pool tournaments (Doubles + Singles Pool Tournament SKUs
    // sold via DMN, £3,570 in 2025) are bar-side activity and stay 100%
    // with No Dice. They're tracked on the main 2025 income breakdown via
    // INCOME_SOURCES['Pool tournament entries'] and forecast on the 2026
    // Performance tab via HACKNEY_SCENARIO_LEVERS['tournament']. They do
    // not feature in the golf P&L.
  },
  // Costs attributable to running the golf course in 2025.
  //
  // METHODOLOGY NOTE — wages: Weekly Merged 2024-2026 (rows 14-24) is
  // the only true financial source for 2025 wage spend, but it splits
  // wages by COMPONENT (gross pay, NIC, pension, holiday, sick,
  // freelance) — NOT by ROLE. There is no "Golf Host" line in the
  // financials. The hostWages figure below is therefore a rota-derived
  // operational allocation, not financial truth: 248.2 hrs × £13.15
  // rota rate × WAGE_OVERHEAD_MULT (≈1.355 for NIC + pension + holiday)
  // ≈ £4,423 fully-loaded. Use it as the founder's working estimate;
  // refine via payroll re-cut if a hard P&L attribution is ever needed.
  costs: {
    hostWages:         4423,    // £ — rota-derived estimate (248.2 hrs ×
                                //     £13.15 × 1.355). Operational
                                //     allocation, not Weekly Merged truth.
    rentShare:        24000,    // £ — separate course-site lease, £24,000/yr inc VAT (founder)
    maintenance:       3000,    // £ — founder approximation, 2025
    upgrade:          20000,    // £ — founder approximation, 2025: new holes
                                //     installed, new paint job, new theming
                                //     extending from the bar side
    utilities:            0,    // £ — no bills paid for the course
    businessRates:        0,    // £ — no rates paid on the course site
  },
}

// === GOLF HOST — 2025 MONTHLY ROTA AGGREGATE ==========================
// OPERATIONAL DATA ONLY — hours scheduled per role per month.
// Pulled from the live rota Google Sheet (Role = "Golf host", date in
// calendar-year 2025). Surfaces the seasonal pattern of when a
// dedicated host was rota'd: Jan–Apr ran consistently, May–Jun dark,
// summer pickup Jul–Aug, then dark Sep–Dec onwards. (Note: course
// was always OPEN regardless — bar staff / supervisors covered the
// host role outside dedicated host shifts.)
//
// `costGross` shown below is the rota's own Cost column (hours ×
// rota hourly rate) — included for operational reference only. It
// is NOT the financial wage attribution. Weekly Merged 2024-2026
// is the financial source of truth for wages and does not break
// out a Golf Host line, so any £ attribution to this role is an
// estimate, not a P&L figure.
export const HACKNEY_GOLF_HOST_2025_MONTHLY = [
  { month: 'Jan', shifts: 6, hours: 41.5, costGross:  546 },
  { month: 'Feb', shifts: 7, hours: 38.5, costGross:  506 },
  { month: 'Mar', shifts: 5, hours: 34.0, costGross:  447 },
  { month: 'Apr', shifts: 7, hours: 48.2, costGross:  634 },
  { month: 'May', shifts: 0, hours:  0.0, costGross:    0 },
  { month: 'Jun', shifts: 0, hours:  0.0, costGross:    0 },
  { month: 'Jul', shifts: 2, hours: 21.5, costGross:  283 },
  { month: 'Aug', shifts: 6, hours: 64.5, costGross:  848 },
  { month: 'Sep', shifts: 0, hours:  0.0, costGross:    0 },
  { month: 'Oct', shifts: 0, hours:  0.0, costGross:    0 },
  { month: 'Nov', shifts: 0, hours:  0.0, costGross:    0 },
  { month: 'Dec', shifts: 0, hours:  0.0, costGross:    0 },
]

export const HACKNEY_GOLF_HOST_2025_TOTALS = {
  // Operational rota data only. costGross is the rota Cost column
  // (rota rate × hours) — useful for "would the £ be material?"
  // sanity but not a financial-truth wage figure.
  shifts:     33,        // total 2025 shifts
  hours:     248.2,      // total 2025 hours
  costGross: 3265,       // £3,264.55 rounded — rota Cost column. OPERATIONAL ONLY
                         // (Weekly Merged 2024-2026 is the financial source of
                         // truth; it does not break out Golf Host as a line)
  activeMonths: 6,       // Jan, Feb, Mar, Apr, Jul, Aug
  darkMonths:  6,        // May, Jun, Sep, Oct, Nov, Dec
}

// === WALK-IN GOLF TILL TICKETS — 2025 MONTHLY =========================
// Pulled from Weekly Merged 2024-2026 row 3 ("Total Walk In Golf
// Tickets"). 52 weeks of 2025 aggregated by week-start month. Total
// 2025 = £25,502.77 (rounded to £25,503 in HACKNEY_GOLF_2025.revenue.
// tillTickets above). Note: till sales ran every month of 2025 — even
// in May / Jun / Sep / Oct / Nov / Dec when the rota had ZERO Golf
// Host shifts — meaning bar staff and supervisors were ringing up
// walk-in tickets at the till even when the dedicated host role wasn't
// rota'd. That's part of the investor narrative for why the course
// was a hidden cost-of-distraction on the bar P&L.
export const HACKNEY_GOLF_TILL_2025_MONTHLY = [
  { month: 'Jan', weeks: 4, revenue:  1048 },
  { month: 'Feb', weeks: 4, revenue:  1611 },
  { month: 'Mar', weeks: 5, revenue:  2954 },
  { month: 'Apr', weeks: 4, revenue:  2435 },
  { month: 'May', weeks: 4, revenue:  2446 },
  { month: 'Jun', weeks: 5, revenue:  2627 },
  { month: 'Jul', weeks: 4, revenue:  2628 },
  { month: 'Aug', weeks: 3, revenue:  2588 },
  { month: 'Sep', weeks: 6, revenue:  2554 },
  { month: 'Oct', weeks: 4, revenue:  2002 },
  { month: 'Nov', weeks: 4, revenue:  1353 },
  { month: 'Dec', weeks: 5, revenue:  1260 },
]

// === WALK-IN GOLF — TILL SKU BREAKDOWN (Goodtill 2025 Jan–23 Sep, CLEAN) =====
// Per-product aggregate of every till transaction tagged either OTHER - GOLF
// or OTHER - GOLF & GAMES that represents a golf round (or a golf+token
// bundle). No scanning happens at Hackney, so each line is a real cash
// transaction at the bar till.
//
// Source: data/hackney_2025_till_sales_clean.csv (deduplicated). The raw
// Goodtill export at data/hackney_2025_till_sales.csv had ~26.7% of all
// rows as exact duplicates (same Sale ID + second + product + price + qty
// + discount + total + takeaway flag + notes). Genuine 2-unit purchases
// would appear as a single qty=2 line; repeated qty=1 clones at the same
// instant are not legitimate distinct purchases.
//
// Headline impact for golf specifically:
//   Pre-dedup:  9,915 lines · 10,437 units · £95,861.58
//   Post-dedup: 5,693 lines ·  6,221 units · £58,242.97  (−39.2% revenue,
//                                                         −42.6% lines)
//
// Schema mirrors HACKNEY_DMN_SKUS_ONLINE_2025 (sku, rounds, tokens, price,
// sold, revenue) so the same SkuTable renderer is reusable. `sold` counts
// units (Goodtill Quantity column), not lines.
export const HACKNEY_GOLF_TILL_SKUS_2025 = [
  { sku: 'Peak Adult — Round of Golf',                       rounds: 1, tokens: 0, price: 12.87, sold: 1914, revenue: 24641.77 },
  { sku: 'Adult — Round of Golf (legacy £5/£6 button)',      rounds: 1, tokens: 0, price:  5.26, sold: 1743, revenue:  9173.80 },
  { sku: 'Off Peak Adult — Round of Golf',                   rounds: 1, tokens: 0, price:  9.86, sold:  911, revenue:  8981.28 },
  { sku: 'Peak Adult — Golf and Five Arcade Tokens',         rounds: 1, tokens: 5, price: 15.94, sold:  405, revenue:  6456.00 },
  { sku: 'Off Peak Adult — Golf and Five Arcade Tokens',     rounds: 1, tokens: 5, price: 12.35, sold:  166, revenue:  2050.92 },
  { sku: 'Under 18s — Round of Golf (legacy)',               rounds: 1, tokens: 0, price:  5.22, sold:  355, revenue:  1851.40 },
  { sku: 'Off Peak Under 18s — Round of Golf',               rounds: 1, tokens: 0, price:  5.49, sold:  286, revenue:  1569.15 },
  { sku: 'Peak Under 18s — Round of Golf',                   rounds: 1, tokens: 0, price:  7.43, sold:  193, revenue:  1434.75 },
  { sku: 'Peak Under 18s — Golf and Five Arcade Tokens',     rounds: 1, tokens: 5, price: 11.91, sold:   41, revenue:   488.40 },
  { sku: 'Off Peak Under 18s — Golf and Five Arcade Tokens', rounds: 1, tokens: 5, price: 10.00, sold:   39, revenue:   390.00 },
  { sku: 'Adult — Round of Golf & Four Tokens',              rounds: 1, tokens: 4, price:  8.63, sold:   45, revenue:   388.41 },
  { sku: 'Peak Adult — Round of Golf & Four Tokens',         rounds: 1, tokens: 4, price: 11.30, sold:   23, revenue:   260.00 },
  { sku: 'Night Golf',                                       rounds: 1, tokens: 0, price:  5.29, sold:   45, revenue:   238.25 },
  { sku: '2-4-1 — Adult — Round of Golf',                    rounds: 1, tokens: 0, price:  4.60, sold:   30, revenue:   138.03 },
  { sku: 'Under 18s — Round of Golf & Four Tokens',          rounds: 1, tokens: 4, price:  8.50, sold:    9, revenue:    76.50 },
  { sku: 'Off Peak Adult — Round of Golf & Four Tokens',     rounds: 1, tokens: 4, price:  8.50, sold:    7, revenue:    59.50 },
  { sku: '2-4-1 — Adult — Round of Golf & Four Tokens',      rounds: 1, tokens: 4, price:  8.41, sold:    2, revenue:    16.81 },
  { sku: 'Under 18s — Round of Golf (£6 button)',            rounds: 1, tokens: 0, price:  6.00, sold:    2, revenue:    12.00 },
  { sku: '2-4-1 — Under 18s — Round of Golf',                rounds: 1, tokens: 0, price:  5.00, sold:    2, revenue:    10.00 },
  { sku: 'Plonk Medal',                                      rounds: 1, tokens: 0, price:  6.00, sold:    1, revenue:     6.00 },
  { sku: 'Mothers Day Golf (£0 — staff comp)',               rounds: 1, tokens: 0, price:  0.00, sold:    2, revenue:     0.00 },
]

// Aggregate roll-ups for the headline strip on the Walk-In Till section.
// Pre-computed so the React layer can render them without re-summing.
// All values are post-dedup (data/hackney_2025_till_sales_clean.csv).
export const HACKNEY_GOLF_TILL_SKUS_GRAND_2025 = {
  totalSold:        6221,
  totalRevenue:     58242.97,
  // Split between pure golf rounds and golf+token bundles for the headline.
  roundsSold:       5484,    // qty across SKUs with tokens === 0
  roundsRevenue:    48056.43,
  bundlesSold:      737,
  bundlesRevenue:   10186.54,
  // Bundled tokens carried inside the Golf+Tokens SKUs above (units ×
  // tokens-per-unit, summed). 100% of token revenue stays with No Dice.
  tokensTotal:      3599,
}

// Monthly walk-in golf till totals — per-month £ summed across every
// golf-tagged line in the cleaned Goodtill export. Used as the till-side
// bar chart on the Walk-In Till section. Sep is partial (Goodtill data
// ends 23 Sep when Hackney migrated to Lightspeed); Oct–Dec are not in
// this dataset.
export const HACKNEY_GOLF_TILL_SKUS_MONTHLY_2025 = [
  { month: 'Jan', revenue: 4645 },
  { month: 'Feb', revenue: 6079 },
  { month: 'Mar', revenue: 6904 },
  { month: 'Apr', revenue: 6349 },
  { month: 'May', revenue: 7986 },
  { month: 'Jun', revenue: 6084 },
  { month: 'Jul', revenue: 7349 },
  { month: 'Aug', revenue: 9818 },
  { month: 'Sep', revenue: 3028 },
]

// Go-forward (2026+) revenue split between the new golf operator and No Dice.
// Each line records what NO DICE retains under the new structure. Anything
// the operator takes as their share is the complement (1 - retained).
export const HACKNEY_GOLF_GOING_FORWARD = {
  structure: {
    operator:   'Separate company (newly incorporated)',
    host:       'No Dice — continues to host + operate the course on site',
    cashflow:   'Settled monthly between the two entities',
  },
  noDiceRetains: [
    { line: 'Bar revenue',                pct: 1.00, note: 'Unchanged — 100% to No Dice' },
    { line: 'Food revenue',               pct: 1.00, note: 'Unchanged — 100% to No Dice' },
    { line: 'Party / private hire',       pct: 1.00, note: 'Unchanged — 100% to No Dice' },
    { line: 'Arcade token revenue',       pct: 1.00, note: '100% to No Dice — operator takes no share of token value' },
    { line: 'Online ticket — golf round', pct: 0.00, note: 'Operator keeps the £-ticket portion (it is their core business)' },
    { line: 'Till ticket sales',          pct: 0.00, note: 'Operator keeps it (it is their core business)' },
    { line: 'Pool tournament entries',    pct: 1.00, note: '100% to No Dice — pool tournaments are a bar-side activity, operator takes no share' },
  ],
  noDiceTakesOver: [
    'Course hosting + operations on site (course was always open in 2025; bar staff covered the host role outside dedicated host shifts)',
    'Customer-facing presence — bar / food / party / token spend continues to land with No Dice',
    'Token sales — both bundled inside online tickets and walk-up at the bar till; 100% revenue retained',
  ],
  golfCompanyTakesOver: [
    '100% of till ticket sales (formerly No Dice revenue)',
    'The £-ticket portion of online sales (golf round component)',
    'Golf course cost base — rent, maintenance, upgrades, dedicated host wages',
  ],
}

// === HACKNEY DMN ONLINE TICKETS — 2025 ACTUALS =======================
// Source: Design My Night sales export (Hackney sheet, gid=1525692404)
// Filtered: Venue = "Plonk Golf - Hackney", Event Date in 2025.
//   • Status "complete"  → online portal revenue (£ recorded on sheet)
//   • Status "external"  → in-venue / office sales (sheet records £0;
//                          imputed below at average online unit price
//                          per archetype, identical method to Borough)
//   • Status "rejected"  → excluded
//
// IMPORTANT — TOKEN MODEL (correcting earlier deck copy):
// Tickets are NOT redeemed for tokens at the bar. Some SKUs (e.g.
// "Adult — Golf + 4 Tokens") BUNDLE arcade tokens into the ticket
// price; the customer uses those tokens in the venue's arcade
// machines. Tokens are an arcade add-on inside the SKU, not a £
// redemption mechanic.
//
// GO-FORWARD ECONOMICS (2026+):
// Tokens continue to be sold by No Dice — both bundled inside
// online tickets AND at the bar till — and 100% of token revenue
// stays with No Dice. The operator takes NO share of token value;
// tokens are entirely a No Dice revenue line.

// 2025 Hackney SKUs sold ONLINE (status = complete on the DMN sheet).
// Aggregated by archetype (time-of-day slot suffix stripped). Revenue
// is the actual sum of "Total Item Price" rows. `tokens` is the
// number of arcade tokens bundled per SKU; `rounds` is the number
// of golf rounds. price = average unit price observed in 2025 (some
// SKUs vary across the day — peak / off-peak — so this is the
// blended figure, not a single list price).
export const HACKNEY_DMN_SKUS_ONLINE_2025 = [
  { sku: 'Adult — Golf + 4 Tokens',                 rounds: 1, tokens: 4, price:  8.94, sold: 3429, revenue: 30622.20 },
  { sku: 'Under 18s — Round of Golf',                rounds: 1, tokens: 0, price:  5.43, sold:  472, revenue:  2558.00 },
  { sku: 'Adult — Round of Golf',                    rounds: 1, tokens: 0, price:  5.54, sold:  378, revenue:  2109.00 },
  { sku: 'Pool Table Reservation — 30 Mins',         rounds: 0, tokens: 0, price:  5.00, sold:  383, revenue:  1913.00 },
  { sku: 'Adult — Game & Drink',                     rounds: 1, tokens: 3, price: 10.00, sold:  176, revenue:  1760.00 },
  { sku: 'Under 18s — Golf + 4 Tokens',              rounds: 1, tokens: 4, price:  8.93, sold:  166, revenue:  1477.15 },
  { sku: 'Doubles Pool Tournament Team Entry',       rounds: 0, tokens: 0, price:  9.96, sold:  129, revenue:  1285.00 },
  { sku: 'Plonk Bottomless Brunch',                  rounds: 0, tokens: 0, price: 35.00, sold:   25, revenue:   875.00 },
  { sku: "Add a Jug of Plonker's Punch",             rounds: 0, tokens: 0, price: 25.00, sold:   24, revenue:   600.00 },
  { sku: 'Singles Pool Tournament Entry',            rounds: 0, tokens: 0, price:  5.00, sold:  113, revenue:   565.00 },
  { sku: 'Add a Bucket of Beers',                    rounds: 0, tokens: 0, price: 25.00, sold:   17, revenue:   425.00 },
  { sku: 'Pool Table Reservation — One Hour',        rounds: 0, tokens: 0, price:  5.00, sold:   41, revenue:   205.00 },
  { sku: 'Add a Tray of Shots',                      rounds: 0, tokens: 0, price: 18.00, sold:    9, revenue:   162.00 },
  { sku: 'Add Five Arcade Tokens (add-on)',          rounds: 0, tokens: 5, price:  3.36, sold:   38, revenue:   130.00 },
  { sku: 'Pumpkin Carving',                          rounds: 0, tokens: 0, price:  5.00, sold:   18, revenue:    90.00 },
  { sku: 'Round of Golf (legacy SKU)',               rounds: 1, tokens: 0, price:  6.00, sold:    6, revenue:    36.00 },
]

// 2025 Hackney SKUs sold OFFICE / EXTERNAL (status = external; payment
// at venue till, sheet records £0). Revenue imputed at the average
// online unit price per archetype × quantity sold — same method as
// Borough. Gives a complete picture of total venue volume.
export const HACKNEY_DMN_SKUS_OFFICE_2025 = [
  { sku: 'Adult — Golf + 4 Tokens',                 rounds: 1, tokens: 4, price: 8.94, sold: 1041, revenue:  9310.92 },
  { sku: 'Under 18s — Round of Golf',                rounds: 1, tokens: 0, price: 5.43, sold:  147, revenue:   798.91 },
  { sku: 'Singles Pool Tournament Entry',            rounds: 0, tokens: 0, price: 5.00, sold:   90, revenue:   450.00 },
  { sku: 'Adult — Round of Golf',                    rounds: 1, tokens: 0, price: 5.54, sold:   88, revenue:   487.84 },
  { sku: 'Doubles Pool Tournament Team Entry',       rounds: 0, tokens: 0, price: 9.96, sold:   84, revenue:   836.44 },
  { sku: 'Pool Table Reservation — 30 Mins',         rounds: 0, tokens: 0, price: 5.00, sold:   41, revenue:   205.00 },
  { sku: 'Under 18s — Golf + 4 Tokens',              rounds: 1, tokens: 4, price: 8.93, sold:   37, revenue:   330.36 },
  { sku: 'Plonk Bottomless Brunch',                  rounds: 0, tokens: 0, price:35.00, sold:   16, revenue:   560.00 },
  { sku: 'Adult — Game & Drink',                     rounds: 1, tokens: 3, price:10.00, sold:   11, revenue:   110.00 },
  { sku: 'Pool Table Reservation — One Hour',        rounds: 0, tokens: 0, price: 5.00, sold:    2, revenue:    10.00 },
]

// Per-month split: online (actual portal revenue) vs office (imputed).
export const HACKNEY_DMN_MONTHLY_2025 = [
  { month: 'Jan', onlineQty: 362, onlineRev: 2656.50, officeQty:  14, officeRev:   94.79 },
  { month: 'Feb', onlineQty: 325, onlineRev: 2586.30, officeQty:  94, officeRev:  775.15 },
  { month: 'Mar', onlineQty: 420, onlineRev: 3218.00, officeQty: 144, officeRev: 1036.44 },
  { month: 'Apr', onlineQty: 565, onlineRev: 4618.15, officeQty: 173, officeRev: 1893.40 },
  { month: 'May', onlineQty: 586, onlineRev: 4635.70, officeQty:  74, officeRev:  588.71 },
  { month: 'Jun', onlineQty: 540, onlineRev: 4072.70, officeQty: 132, officeRev: 1017.14 },
  { month: 'Jul', onlineQty: 496, onlineRev: 4543.00, officeQty: 159, officeRev: 1229.56 },
  { month: 'Aug', onlineQty: 623, onlineRev: 5527.90, officeQty:  97, officeRev:  820.24 },
  { month: 'Sep', onlineQty: 417, onlineRev: 3643.40, officeQty: 154, officeRev: 1273.14 },
  { month: 'Oct', onlineQty: 430, onlineRev: 3591.20, officeQty:  93, officeRev:  745.41 },
  { month: 'Nov', onlineQty: 381, onlineRev: 3111.50, officeQty: 127, officeRev:  966.90 },
  { month: 'Dec', onlineQty: 279, onlineRev: 2608.00, officeQty: 306, officeRev: 2658.59 },
]

// Grand totals — online actual revenue + office imputed revenue.
export const HACKNEY_DMN_GRAND_2025 = {
  onlineQty:  5424, onlineRev: 44812.35,                 // status=complete
  officeQty:  1567, officeRev: 13099.48,                 // status=external, imputed
  totalQty:   6991, totalRev:  57911.83,                 // combined Hackney 2025 DMN volume
  // Token analytics — 100% No Dice revenue, no operator share
  tokensOnline:    15098,                                // 4-token SKUs × qty + Add-Five × qty
  tokensOffice:     4385,                                // same calc for external SKUs
  tokensTotal:     19483,                                // bundled into Hackney DMN tickets in 2025
  // The actual £ paid out to arcade-machine operators per token is
  // already booked inside the bar P&L's "Arcades" cost category
  // (COST_CATEGORIES → Arcades, ~£8,202 for 2025). The Weekly Merged
  // 2024-2026 sheet's ARCADES rows (Pinball Geoff + LTF/JP) net to
  // £7,850.19 across 52 weeks of 2025 — small variance to the £8,202
  // P&L figure is normal categorisation rounding. No separate token-
  // settlement line needs to be modelled — this cost is already inside
  // the Variable Costs / Arcades line on the 2025 Performance tab.
  arcadesPaidWeeklyMerged2025: 7850.19,                  // financial truth from Weekly Merged ARCADES rows
}

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
