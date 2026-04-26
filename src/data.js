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
export const WORKBOOK_URL = 'https://docs.google.com/spreadsheets/d/1PY9VuebugqUwZ57UN48tlP-GHuHA5QzB/edit?usp=sharing'

// === DEAL STRUCTURE ===
// Investment ask £79,000 inc VAT. 50/50 equity — pre-money equal to investment (£79k),
// post-money £158k. Multiple works out at 0.86× 2025 EBITDA (distressed pricing).
//
// Forecast operating profit (2026 base case) lowered to £124k — reflects the realistic
// 2026 P&L under the new cost rules (wages +10%, fixed +10%, drinks = 30% of bar,
// hosting fixed, everything else scaled) instead of the old 22.4%-margin blanket.
//
// DISTRIBUTION MODEL: pure pro-rata — all shareholders paid at the same time by equity %.
// No preferred return, no A-share priority. Full operating profit flows through the split.
export const DEAL = {
  investment: 79000,
  founderEq: 0.50,
  investorEq: 0.50,
  multiple: 0.8592,
  preMoney: 79000,
  postMoney: 158000,
  preferred: 0,              // removed — pure pro-rata, no preferred tier
  aSharePriority: 0,         // removed — pure pro-rata, no founder priority slice
  investorDividend: 62000,   // 50% × £124,000 base-case operating profit
  totalInvestorReturn: 62000,// equals dividend (no preferred top-up)
  coc: 0.7848,               // 78.5% on £79k invested
  payback: 1.27,             // years
  aShareThreshold: 7900,     // 5% of post-money — governance floor for A-share voting rights
}

// === 2025 ACTUALS ===
export const ACTUALS_2025 = {
  revenue: 741644,
  wages: 242370,
  fixedCosts: 165059,
  drinksGas: 81732,
  vatNet: 78851,
  cleaning: 21842,
  arcades: 17152,
  food: 9101,
  googleAds: 8918,   // website/Lithos costs in P&L (not pure Google Ads)
  cardCharges: 5443,
  profit: 111177,
  ebitda: 91950,
}

// === 2026 FORECAST (Base Case +15%) ===
// Profit lowered from £190,945 (old 22.4% blanket margin) to £124,000 — reflects the
// real 2026 cost model (wages +10%, fixed +10%, drinks = 30% of bar, etc.).
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
export const COST_CATEGORIES = [
  { name: 'Wages',        amount: 242370, pct: 38.5, color: '#4A0000' },
  { name: 'Fixed Costs',  amount: 165059, pct: 26.2, color: '#7B0000' },
  { name: 'Drinks & Gas', amount:  81732, pct: 13.0, color: '#B71C1C' },
  { name: 'VAT (Net)',     amount:  78851, pct: 12.5, color: '#C62828' },
  { name: 'Cleaning',     amount:  21842, pct:  3.5, color: '#E53935' },
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

// === WAGES — 2026 PLANNING RATES ===
export const WAGE_RATES = [
  { role:'Bar Staff',        rate:13.85, hours:4967, color:'#E67E22' },
  { role:'Supervisor',       rate:14.35, hours:2859, color:'#D4A843' },
  { role:'Asst. Manager',    rate:15.38, hours:505,  color:'#94A3B8' },
  { role:'Manager',          rate:18.00, hours:1712, color:'#0D9488' },
]

export const PL_WAGE_BASE = 242370
export const ROTA_TOTAL   = 152801

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
// VAT reclaimable on Hardware (£4,000), IP (£2,000), Stock & Setup (£500) = ~£6,500 total,
// recovered against the first HMRC VAT return.
// Hardware bumped to £24,000 inc VAT (£20,000 + VAT) for full bar & kitchen equipment fitout.
// Stock & Setup trimmed to £3,000 (itemised — see STOCK_SETUP_DETAIL); £5,000 moved to
// Working Capital so the buffer covers more of the early-trading runway.
export const USE_OF_FUNDS = [
  { item: 'Rent in Advance (3 months)',  amount: 27078, pct: 34.3, vat: 'inc VAT', note: '3 months rent paid up front — covers May, Jun, Jul 2026 at the contractual 15% of 2025 turnover rate. NO deposit required. From August 2026 rent reverts to 15% of actual quarterly turnover (variable rent, scales with trading).' },
  { item: 'Hardware from Liquidators',   amount: 24000, pct: 30.4, vat: 'inc VAT', note: 'Bar & kitchen equipment (£20,000 + VAT) — operational from Day 1' },
  { item: 'IP License Fee',              amount: 12000, pct: 15.2, vat: 'inc VAT', note: 'One-off licensing fee paid to No Dice Bars LTD — grants indefinite use of the Plonk name. No Dice Bars LTD also runs online sales campaigns and platform maintenance under an ongoing commission, replacing the old Design My Night bookings provider' },
  { item: 'Stock & Operational Setup',   amount:  3000, pct:  3.8, vat: 'inc VAT', note: 'Itemised: opening alcohol stock, software subs (Xero/Rota Cloud/Google), internet, cleaning restart' },
  { item: 'Working Capital',             amount: 12922, pct: 16.4, vat: null,      note: 'Staged into business per cash flow forecast — covers early trading runway' },
]

// === HARDWARE FROM LIQUIDATORS — itemised £20,000 ex VAT breakdown ===
// Detail behind the £24,000 inc VAT "Hardware from Liquidators" line.
// All amounts shown EX VAT (£20,000 ex VAT  →  £24,000 inc VAT after 20% VAT).
// Each line is a category of physical equipment purchased from the liquidation.
// Reflected in the central workbook (Investment Valuation 1 sheet, Section 4b
// detail rows below the Stock & Setup breakdown).
export const HARDWARE_BREAKDOWN = [
  { item: 'Mini golf course',                       amount: 4000,  note: 'Holes, putting surfaces, course fittings & feature props' },
  { item: 'Bar equipment across site',              amount: 10000, note: 'Beer lines, fridges, glasswash, bar tops, taps, ice machine, POS hardware' },
  { item: 'Wet stock consumables & tools',          amount: 2000,  note: 'Glassware, cleaning chemicals, repair tools, hand-trolleys, small wares' },
  { item: 'Arcade machines, furniture & fittings',  amount: 4000,  note: 'Arcade cabinets, pool tables, board game stock, seating, lighting fittings' },
]

// === STOCK & OPERATIONAL SETUP — itemised £3,000 breakdown ===
// Detail behind the £3,000 "Stock & Operational Setup" line in USE_OF_FUNDS.
// Mix of one-off costs (alcohol, internet hardware, cleaning restart) and
// 3-month subscription pre-pays (matches the 3-month advance-rent cadence).
// Reflected in the central workbook (Investment Valuation 1 sheet, Section 4
// detail rows below the headline use-of-funds table).
export const STOCK_SETUP_DETAIL = [
  { item: 'Alcohol stock (opening fill)',                amount: 1500, type: 'oneOff',     note: 'Wines, spirits, beer for Day 1 trading' },
  { item: 'Soft drinks, mixers & non-alcohol stock',     amount:   300, type: 'oneOff',    note: 'Opening fill — cocktail mixers, soft drinks, juices' },
  { item: 'Ice supplies (first delivery)',               amount:    30, type: 'oneOff',     note: 'Daily delivery contract — first delivery only' },
  { item: 'Cleaning contracts restart',                  amount:   250, type: 'oneOff',     note: 'Deep clean + first month commercial cleaning' },
  { item: 'Internet — Starlink / BT Business',           amount:   300, type: 'setupPlus1', note: 'Hardware setup + first month connectivity' },
  { item: 'App & booking platform setup',                amount:   200, type: 'oneOff',     note: 'Plonk Golf booking system, delivery app integrations' },
  { item: 'Xero accounting',                             amount:    75, type: 'sub3mo',     note: '£25/mth × 3 — cloud accounting' },
  { item: 'Rota Cloud — staff scheduling',               amount:    75, type: 'sub3mo',     note: '£25/mth × 3 — rota & timesheet system' },
  { item: 'Google Workspace',                            amount:    75, type: 'sub3mo',     note: 'Email + Drive + collab tools — 3 months × 2 users' },
  { item: 'Spotify Business',                            amount:    60, type: 'sub3mo',     note: '£20/mth × 3 — bar music licensing' },
  { item: 'Supplier contract deposits',                  amount:   135, type: 'oneOff',     note: 'Water cooler, refuse, gas/electricity meter deposits' },
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
export const IP_LICENSING_SKUS_ONLINE_2025 = [
  { sku: 'Adult — Golf + 4 Tokens (Peak)',        tokens: 4, price: 16.00, sold: 9646, revenue: 153995.10 },
  { sku: 'Off-Peak Adult — Golf + 4 Tokens',      tokens: 4, price: 12.50, sold: 2932, revenue:  36485.00 },
  { sku: 'Under 18s — Golf + 4 Tokens',           tokens: 4, price: 10.00, sold:  970, revenue:   9677.00 },
  { sku: 'Off-Peak Under 18s — Golf + 4 Tokens',  tokens: 4, price: 10.00, sold:    0, revenue:      0.00 },
  { sku: 'Game & Drink',                           tokens: 0, price: 12.00, sold:  393, revenue:   4713.60 },
  { sku: 'Late Night Golf',                        tokens: 0, price:  5.00, sold:  788, revenue:   3940.00 },
  { sku: 'Pool Table Reservation — 30 Mins',       tokens: 0, price:  5.00, sold:  422, revenue:   2108.00 },
  { sku: 'Doubles Pool Tournament',                tokens: 0, price:  5.00, sold:    5, revenue:     40.00 },
  { sku: 'Extra Arcade Tokens (add-on)',           tokens: 0, price:  5.00, sold:   31, revenue:    155.00 },
  { sku: "Valentine's Day Deal",                   tokens: 0, price: 50.00, sold:    1, revenue:     50.00 },
]

// 2025 Borough office/external SKUs (Status = external). Payment happens at venue till — the online
// system records £0. Revenue here is IMPUTED at SKU list price (qty × price) to give a complete
// picture of real venue revenue. Actual till revenue may differ if the office team discounts/comps.
export const IP_LICENSING_SKUS_OFFICE_2025 = [
  { sku: 'Adult — Golf + 4 Tokens (Peak)',        tokens: 4, price: 16.00, sold: 1977, revenue: 31632.00 },
  { sku: 'Off-Peak Adult — Golf + 4 Tokens',      tokens: 4, price: 12.50, sold: 1868, revenue: 23350.00 },
  { sku: 'Under 18s — Golf + 4 Tokens',           tokens: 4, price: 10.00, sold:  268, revenue:  2680.00 },
  { sku: 'Off-Peak Under 18s — Golf + 4 Tokens',  tokens: 4, price: 10.00, sold:    8, revenue:    80.00 },
  { sku: 'Game & Drink',                           tokens: 0, price: 12.00, sold:  276, revenue:  3312.00 },
  { sku: 'Late Night Golf',                        tokens: 0, price:  5.00, sold:   12, revenue:    60.00 },
  { sku: 'Pool Table Reservation — 30 Mins',       tokens: 0, price:  5.00, sold:  103, revenue:   515.00 },
  { sku: 'Doubles Pool Tournament',                tokens: 0, price:  5.00, sold:    0, revenue:     0.00 },
  { sku: 'Extra Arcade Tokens (add-on)',           tokens: 0, price:  5.00, sold:    0, revenue:     0.00 },
  { sku: "Valentine's Day Deal",                   tokens: 0, price: 50.00, sold:    0, revenue:     0.00 },
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

// Grand totals
export const IP_LICENSING_GRAND_2025 = {
  onlineQty: 15188, onlineRev: 211163.70,                 // actual online portal revenue
  officeQty:  4512, officeRev:  61629.00,                 // imputed at SKU list price
  totalQty:  19700, totalRev:  272792.70,                 // combined Borough 2025 revenue
}
