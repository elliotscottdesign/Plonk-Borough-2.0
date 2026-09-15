// ─── Q1 REVIEW · Investor-portal quarterly review data ──────────────────
//
// Feeds the private "Quarterly Review" tab visible to the founder (888999)
// and the three confirmed investors (LEONIE / MIKE / LEE01). Compares the
// first ~3 months of trading (opened 19 Jun 2026) against the Y1 forecast
// pro-rated to the same 88-day window.
//
// ── DATA SOURCES ────────────────────────────────────────────────────────
//
//   • XERO_SNAPSHOT  — live pull from the Xero MCP connector (No Dice
//     Hackney LTD, org id 9fc05c86-…). Committed to the repo as a static
//     snapshot because the browser can't hit MCP directly. Refresh by
//     asking Claude to "refresh the investor review" — I re-pull the same
//     four MCP endpoints and update this file.
//
//   • FORECAST_PRORATED — the Y1 forecast from src/data/hackney.js
//     (revenue £618,804.17, EBITDA £85,181.41, wages £179,872, rent
//     £48,750) scaled linearly to the 88-day window. Linear proration
//     understates late-summer + December bar peaks — this is intentionally
//     the flat, defensible baseline any investor would compute themselves.
//
//   • RESERVE_FLOOR — the £30k working-capital floor per Investors'
//     Agreement clause 4. No dividend may be declared until reserves are
//     at or above the floor at a review date.
//
// The tab itself (src/hackney/tabs/QuarterlyReview.jsx) also carries a
// small set of founder-editable fields (private events list, staff-cost
// override, opening-context banner, founder's note) that sync
// cross-device via the existing signatures Apps Script — those fields
// are NOT in this file; this file is static, versioned truth.

// ── TRADING WINDOW ──────────────────────────────────────────────────────
// Opened 19 Jun 2026 (per memory: project_help_out_portal — "get Hackney
// bar open by 19 Jun 2026"). Snapshot cut on 14 Sep 2026. 88 calendar
// days = 24.1% of Y1.
export const TRADING_START = '2026-06-19'
export const SNAPSHOT_END  = '2026-09-14'
export const TRADING_DAYS  = 88

// ── XERO SNAPSHOT · 2026-09-14 ──────────────────────────────────────────
// Pulled live from Xero MCP:
//   • get_profit_and_loss (2026-06-19 → 2026-09-14, ACCRUAL)
//   • get_cash_position   (today)
//   • get_aged_payables   (today)
//   • get_aged_receivables (today)
//   • get_organisation_financial_year
export const XERO_SNAPSHOT = {
  snapshotDate:  '2026-09-14',
  windowStart:   '2026-06-19',
  windowEnd:     '2026-09-14',
  currency:      'GBP',
  organisation:  'No Dice Hackney LTD',
  lastRefreshedIso: '2026-09-14T19:55:08Z',

  // ── Profit & Loss (accrual basis) ─────────────────────────────────
  pnl: {
    accountingBasis:   'ACCRUAL',
    totalIncome:       136380.67,   // Sales (single account — bar + food + private events)
    totalCostOfSales:   71121.89,
    grossProfit:        65258.78,   // 47.85% GM
    totalExpenses:      34941.58,
    netProfit:          30317.20,   // 22.23% NP margin on revenue

    // Cost-of-sales breakdown (accounts_count 4)
    costOfSalesAccounts: [
      { name: 'Cost of Goods Sold',           amount: 38755.81 },  // stock + drinks + food inputs
      { name: 'Direct Wages',                 amount: 23659.43 },  // paid via payroll
      { name: 'Freelance & Contract Staff',   amount:  8527.90 },  // DJs, event contractors
      { name: 'Direct Expenses',              amount:   178.75 },
    ],

    // Expense accounts — non-zero only. Marketing, salaries, depreciation
    // are all £0 as of this snapshot; called out below in ZERO_LINES.
    expenseAccounts: [
      { name: 'General Expenses',              amount: 13568.77 },
      { name: 'Rent',                          amount:  7012.87 },  // still in the rent-free tail
      { name: 'Postage, Freight & Courier',    amount:  5195.00 },
      { name: 'IT Software and Consumables',   amount:  3487.21 },
      { name: 'Cleaning',                      amount:  1530.00 },
      { name: 'Insurance',                     amount:  1509.49 },
      { name: 'Repairs & Maintenance',         amount:  1168.72 },
      { name: 'Entertainment · 100% business', amount:   282.61 },
      { name: 'Telephone & Internet',          amount:   280.86 },
      { name: 'Market & Competitor Research',  amount:   217.75 },
      { name: 'Staff Welfare & Refreshments',  amount:   214.18 },
      { name: 'Travel · National',             amount:   183.45 },
      { name: 'Motor Vehicle Expenses',        amount:   146.67 },
      { name: 'Entertainment · 0%',            amount:   100.00 },
      { name: 'Staff Training',                amount:    33.00 },
      { name: 'Charitable & Political Donations', amount: 11.00 },
    ],

    // Story lines: what we DIDN'T spend. These are the accounts sitting
    // at £0.00 that the Y1 forecast assumed would be non-zero.
    zeroLines: [
      { name: 'Advertising & Marketing', forecast:  5000 },
      { name: 'Depreciation Expense',    forecast:  8000 },  // Y1 CapEx amortisation
      { name: 'Salaries',                forecast: 15885 },  // director salary (bar-only P&L)
      { name: 'Bank Fees',               forecast:   400 },
      { name: 'Audit & Accountancy',     forecast:  1200 },
      { name: 'Legal Expenses',          forecast:   500 },
      { name: 'Light, Power, Heating',   forecast:  4800 },  // included in General Expenses in-period
    ],
  },

  // ── Cash & liquidity ──────────────────────────────────────────────
  cash: {
    balance:      12643.92,   // GBP bank balance today
    receivables:      0.00,   // amount owed TO us
    payables:      3041.93,   // amount WE owe (mirrors payables.total)
  },

  // ── Aged payables ─────────────────────────────────────────────────
  payables: {
    total:               3041.93,
    billCount:                 6,
    supplierCount:             5,
    overdue:             1770.50,   // 58.2% of total is 1-month overdue
    overduePercentage:      58.2,
    ageBuckets: {
      current:              1271.43,   // Five Points, due 15 Sep (tomorrow-ish)
      lessThanOneMonth:        0.00,
      oneMonth:             1770.50,
      twoMonths:               0.00,
      threeMonths:             0.00,
      olderThanThreeMonths:    0.00,
    },
    topCreditors: [
      { name: 'Storage Solutions London Ltd', owed: 1320.00, share: 43.4, oldestDue: '2026-08-03' },
      { name: 'Five Points',                  owed: 1271.43, share: 41.8, oldestDue: '2026-09-15' }, // not yet overdue
      { name: 'BCS Supplies',                 owed:  250.50, share:  8.2, oldestDue: '2026-08-12' },
      { name: 'Ben Stewart (Willy Delphia)',  owed:  100.00, share:  3.3, oldestDue: '2026-08-09' },
      { name: 'Nicola Mannini',               owed:  100.00, share:  3.3, oldestDue: '2026-08-13' },
    ],
  },

  // ── Aged receivables ──────────────────────────────────────────────
  receivables: {
    total: 0,
    invoiceCount: 0,
    customerCount: 0,
  },

  // ── Financial year context ────────────────────────────────────────
  financialYear: {
    start: '2026-05-01',
    end:   '2027-04-30',
  },
}

// ── Y1 FORECAST · pro-rated to the 88-day window ────────────────────────
// Source figures from src/data/hackney.js FORECAST + HACKNEY_INVESTOR_RETURNS
// FY 2026/27 (May 26 → Apr 27). Linear pro-ration by calendar days.
const YEAR_DAYS = 365
const PRORATION = TRADING_DAYS / YEAR_DAYS

export const FORECAST_PRORATED = {
  proration:        PRORATION,           // 0.2411
  days:             TRADING_DAYS,        // 88
  yearDays:         YEAR_DAYS,

  // Top line
  revenue:         Math.round(618804 * PRORATION),   // 149,163 (Y1 £618,804 × 88/365)
  variableCosts:   Math.round(194704 * PRORATION),   // stock + variable × 88/365
  wagesAll:        Math.round(179872 * PRORATION),   // payroll wage base × 88/365
  fixedCosts:      Math.round( 25839 * PRORATION),   // non-rent fixed
  rent:            Math.round( 48750 * PRORATION),   // 9 paying months × £65k/12 pro-rated
  marketing:       Math.round(  5000 * PRORATION),   // Y1 marketing line
  operatingProfit: Math.round( 85181 * PRORATION),   // £20,532
}

// ── Reserve floor · Investors' Agreement clause 4 ──────────────────────
export const RESERVE_FLOOR = 30000

// ── Round 1 story · the un-drawn raise ─────────────────────────────────
// The Y1 forecast assumed £49,000 of Round 1 capital was drawn on day 1
// (£25k founder A subscription + £24k external B). As of the snapshot
// date, £7k of the external pool has been sold (Michael 3, Leonie 3,
// Lee 1) but the founder has NOT drawn the £25k A subscription and none
// of the raise has been spent on capex or marketing. Investors see this
// as accessible upside for Round 2 or as-and-when the operating cash
// permits it.
export const UNDRAWN_RAISE = {
  founderASubscriptionCommitted: 25000,   // planned but not yet drawn
  externalRaised:                 7000,   // Michael + Leonie + Lee, invoiced
  externalRemaining:             17000,   // open external pool
  capexPlanned:                  25000,   // fit-out + garden + interior
  capexActual:                       0,   // £0 depreciation confirms this
  marketingPlanned:               5000,
  marketingActual:                   0,
}
