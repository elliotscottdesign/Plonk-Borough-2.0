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
