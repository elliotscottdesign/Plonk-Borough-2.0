// NO DICE BOROUGH LTD — VERIFIED FINANCIAL DATA
// All figures from verified 2025 categorised weekly P&L and GA4 (Windsor.ai)

export const BUSINESS = {
  name: 'No Dice Borough Ltd',
  location: 'Borough Market, SE1',
  description: 'Experience bar · Mini golf · Pool · Arcades · Board games',
}

// === DEAL STRUCTURE ===
export const DEAL = {
  investment: 150000,
  founderEq: 0.51,
  investorEq: 0.49,
  multiple: 1.6979,
  preMoney: 156122,
  postMoney: 306122,
  preferred: 12000,       // 8% × £150k
  aSharePriority: 44000,  // to founder entity
  investorDividend: 66123,
  totalInvestorReturn: 78123,
  coc: 0.5208,
  payback: 1.92,
  aShareThreshold: 15306, // 5% of post-money
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
export const FORECAST = {
  revenue: 852891,
  profit: 190945,
  margin: 0.224,
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
export const WATERFALL = {
  operatingProfit: 190945,
  preferred: 12000,
  aSharePriority: 44000,
  remainingPool: 134945,
  investorDividend: 66123,
  founderDividend: 68822,
  totalInvestor: 78123,
  totalFounder: 112822,
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
export const USE_OF_FUNDS = [
  { item: 'Plonk IP & Goodwill',        amount: 72000, pct: 48.0, note: 'Brand, gaming IP, customer data, trading goodwill' },
  { item: 'Hardware from Liquidators',   amount: 24000, pct: 16.0, note: 'Bar & kitchen equipment — operational from Day 1' },
  { item: 'Landlord Rent Deposit',       amount: 27078, pct: 18.1, note: '3 months deposit — covers May, Jun, Jul' },
  { item: 'Stock & Supplier Restart',    amount: 12000, pct:  8.0, note: 'Opening stock, software, supplier agreements' },
  { item: 'Working Capital',             amount: 14922, pct:  9.9, note: 'Staged into business per cash flow forecast' },
]

// === IP & LICENSING — ISOLATED DEV SHEET ===
// Source: "ALL DMN 2025 transactions ALL SITES.xlsx" — every transaction row for Borough venue in 2025,
// split by Status column (Online portal = 'complete', Office team = 'external', rejected dropped).
// This dataset is intentionally isolated from the existing deck constants while we develop the new
// Holding-Co × Venue commission model.
//
// Key finding from the data:
//   - ONLINE portal (Status = complete): 15,188 tickets / £211,163.70 — revenue flows through the online system
//     (matches the existing deck's "Online Golf Tickets £210,485" — small delta = categorisation edge cases).
//   - OFFICE/TILL (Status = external): 4,512 tickets / £0 — these are reservations booked by the office team;
//     payment happens through the venue's till, NEVER through the online system.
//   - Under the new model the office/bookings-team channel goes away entirely. These customers will either
//     self-serve online (moving volume + revenue into the online channel) or contact the venue directly
//     (which the venue handles itself — Holding Co takes no commission).
//
// Structural assumptions (v1, adjustable later):
//   - Booking fee: 10% ADDED ON TOP of ticket price at checkout (customer-facing). Kept by Holding Co.
//   - Commission: SEPARATE %, taken from the VENUE on gross online ticket sales. Holding Co's license fee.
//   - Token value: £0.325 per arcade token, NO VAT on tokens. Each "Golf + 4 Tokens" SKU bundles 4 tokens (£1.30 per ticket).
//   - Under the new model, tokens move to in-store TILL only — online SKUs will be re-priced to strip the token component.

export const IP_LICENSING_TOKEN_VALUE = 0.325   // £ per arcade token, no VAT
export const IP_LICENSING_BOOKING_FEE_PCT = 0.10 // 10% added on top at checkout, kept by Holding Co

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

// 2025 Borough office/external SKUs (Status = external). Payment via till — £0 online revenue.
// Same price column kept for reference (what a customer would pay if bought online at list price).
export const IP_LICENSING_SKUS_OFFICE_2025 = [
  { sku: 'Adult — Golf + 4 Tokens (Peak)',        tokens: 4, price: 16.00, sold: 1977, revenue: 0.00 },
  { sku: 'Off-Peak Adult — Golf + 4 Tokens',      tokens: 4, price: 12.50, sold: 1868, revenue: 0.00 },
  { sku: 'Under 18s — Golf + 4 Tokens',           tokens: 4, price: 10.00, sold:  268, revenue: 0.00 },
  { sku: 'Off-Peak Under 18s — Golf + 4 Tokens',  tokens: 4, price: 10.00, sold:    8, revenue: 0.00 },
  { sku: 'Game & Drink',                           tokens: 0, price: 12.00, sold:  276, revenue: 0.00 },
  { sku: 'Late Night Golf',                        tokens: 0, price:  5.00, sold:   12, revenue: 0.00 },
  { sku: 'Pool Table Reservation — 30 Mins',       tokens: 0, price:  5.00, sold:  103, revenue: 0.00 },
  { sku: 'Doubles Pool Tournament',                tokens: 0, price:  5.00, sold:    0, revenue: 0.00 },
  { sku: 'Extra Arcade Tokens (add-on)',           tokens: 0, price:  5.00, sold:    0, revenue: 0.00 },
  { sku: "Valentine's Day Deal",                   tokens: 0, price: 50.00, sold:    0, revenue: 0.00 },
]

// Per-month split: online (revenue-bearing) vs office (till-only, £0 online revenue).
export const IP_LICENSING_MONTHLY_2025 = [
  { month: 'Jan', onlineQty: 1333, onlineRev: 19589.30, officeQty: 298, officeRev: 0.00 },
  { month: 'Feb', onlineQty: 1525, onlineRev: 22026.70, officeQty: 183, officeRev: 0.00 },
  { month: 'Mar', onlineQty: 1214, onlineRev: 17373.20, officeQty: 349, officeRev: 0.00 },
  { month: 'Apr', onlineQty: 1141, onlineRev: 15215.80, officeQty: 353, officeRev: 0.00 },
  { month: 'May', onlineQty: 1075, onlineRev: 15355.50, officeQty: 295, officeRev: 0.00 },
  { month: 'Jun', onlineQty:  908, onlineRev: 12648.70, officeQty: 391, officeRev: 0.00 },
  { month: 'Jul', onlineQty: 1052, onlineRev: 14498.80, officeQty: 423, officeRev: 0.00 },
  { month: 'Aug', onlineQty: 1380, onlineRev: 18644.95, officeQty: 167, officeRev: 0.00 },
  { month: 'Sep', onlineQty: 1126, onlineRev: 15127.70, officeQty: 351, officeRev: 0.00 },
  { month: 'Oct', onlineQty: 1519, onlineRev: 20779.00, officeQty: 274, officeRev: 0.00 },
  { month: 'Nov', onlineQty: 1319, onlineRev: 18428.25, officeQty: 470, officeRev: 0.00 },
  { month: 'Dec', onlineQty: 1596, onlineRev: 21475.80, officeQty: 958, officeRev: 0.00 },
]

// Grand totals
export const IP_LICENSING_GRAND_2025 = {
  onlineQty: 15188, onlineRev: 211163.70,
  officeQty:  4512, officeRev:      0.00,
  totalQty:  19700, totalRev:  211163.70,
}
