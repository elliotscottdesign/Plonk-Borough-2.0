// ─── Finance Overview · data snapshot ────────────────────────────────────────
// Sources: Xero P&L (all bank lines reconciled, refreshed 7 Aug 2026) + the
// Lightspeed "Line transactions" export 19 Jun – 6 Aug 2026. Not live — ask
// Claude (finance lane) to refresh after a new till export / Xero session.
// When the Omniboost Lightspeed→Xero sync goes live this file becomes obsolete
// and the section should read from the till feed instead.

export const ASOF = { books: '7 Aug 2026', till: '6 Aug 2026', opened: '19 Jun 2026' }

// P&L totals from Xero (1 Jun – 10 Aug 2026, accrual, No VAT basis)
export const PNL = {
  income: 86882.45,          // 200 Sales — Lightspeed payouts + SumUp + Stripe net
  costOfSales: 34785.87,     // CoGS + hourly wages
  overheads: 29137.33,
  netPosition: 22959.25,     // before PAYE/pension/director pay + accountant adjustments
}

// Where the income came from (banked, per Monzo/Xero)
export const INCOME_CHANNELS = [
  { name: 'Card takings — Lightspeed till', amount: 72960.00, color: '#4FC3F7' },
  { name: 'SumUp secondary till',           amount: 14200.00, color: '#34D399' },
  { name: 'Stripe / online (net of refunds)', amount: -277.55, color: '#9CA3AF' },
]

// Segregated spend — every expense category with money against it, Xero books
export const SPEND_CATEGORIES = [
  { name: 'Stock — drink, food, ice (CoGS)', amount: 23645.57, color: '#4FC3F7' },
  { name: 'Wages — hourly staff',            amount: 11140.30, color: '#E67E22' },
  { name: 'General expenses',                amount: 11234.44, color: '#A78BFA' },
  { name: 'Logistics — van driver',          amount: 4815.00,  color: '#F87171' },
  { name: 'Repairs & fit-out',               amount: 3865.94,  color: '#FBBF24' },
  { name: 'IT & software',                   amount: 2989.26,  color: '#34D399' },
  { name: 'Rent & lease fees',               amount: 1781.14,  color: '#F472B6' },
  { name: 'DJs & entertainment',             amount: 1718.40,  color: '#C084FC' },
  { name: 'Cleaning & waste',                amount: 1486.02,  color: '#60A5FA' },
  { name: 'Insurance',                       amount: 762.29,   color: '#9CA3AF' },
  { name: 'Print & stationery',              amount: 204.00,   color: '#FDE047' },
  { name: 'Motor & fuel',                    amount: 146.67,   color: '#FB923C' },
  { name: 'Travel & taxis',                  amount: 109.97,   color: '#2DD4BF' },
  { name: 'Phone & internet',                amount: 24.20,    color: '#94A3B8' },
]

// Till gross by month (Lightspeed line transactions, SALE lines only)
export const TILL = {
  total: 70224.38,
  tradingDays: 47,
  monthly: [
    { label: 'June (from 19th)', gross: 17220.53 },
    { label: 'July',             gross: 46464.48 },
    { label: 'Aug (1–6)',        gross: 6539.37 },
  ],
  categories: [
    { name: 'Drinks',   amount: 63157.50, color: '#4FC3F7' },
    { name: 'Food',     amount: 3806.63,  color: '#34D399' },
    { name: 'Games',    amount: 3047.00,  color: '#C084FC' },
    { name: 'Bar Food', amount: 114.50,   color: '#FBBF24' },
    { name: 'Misc',     amount: 98.75,    color: '#9CA3AF' },
  ],
  weekday: [
    { day: 'Mon', gross: 1344.20 }, { day: 'Tue', gross: 4271.21 },
    { day: 'Wed', gross: 7794.87 }, { day: 'Thu', gross: 7604.13 },
    { day: 'Fri', gross: 15326.23 }, { day: 'Sat', gross: 28153.94 },
    { day: 'Sun', gross: 5729.80 },
  ],
  topItems: [
    { name: 'Camden Hells Lager (pint)', qty: 3333, value: 21967.11 },
    { name: 'House Pale (pint)',         qty: 760,  value: 4773.68 },
    { name: 'Smash Burger',              qty: 205,  value: 2472.00 },
    { name: 'Aperol Spritz',             qty: 222,  value: 2253.66 },
    { name: 'Spicy Cucumber Margarita',  qty: 181,  value: 1828.76 },
  ],
  // Sales keyed straight into the card machine never create till lines —
  // that's why bank card takings (£72,960 net) exceed till gross here.
  keyedSalesNote: true,
}

// Bills still to pay — compiled from a Gmail statement trawl, 10 Aug 2026.
// Xero's aged-payables shows £0 because forwarded bills sit as unapproved
// drafts; until they're approved (Business → Bills to pay → Draft) this
// email-evidence list is the best view of what's owed.
export const OWED = {
  asOf: '10 Aug 2026 (founder-reviewed)',
  confirmed: [
    { name: 'Five Points Brewing — July statement', amount: 3688.50, due: 'Payment plan', note: '3 weekly instalments agreed — make sure the 15 Aug direct debit doesn’t also collect' },
    { name: 'Fine Cider Company', amount: 282.97, due: '26 Aug', note: 'INV-33442 · the older £215.97 invoice is paid' },
    { name: 'BOC gas', amount: 199.48, due: 'Queried', note: 'Founder disputed 9 Aug — unresolved, not paid' },
    { name: 'Trilogy Print (PLONK GOLF debt)', amount: 888.00, due: '—', note: 'Old-entity debt — founder to decide if Hackney pays it' },
    { name: 'Umbrella Brewing — invoice 12565', amount: 0, due: '24 Jul', note: 'UNPAID (no bank payment since 23 Jul) — amount in the PDF; old Plonk-era debt also still owed' },
  ],
  possible: [
    { name: 'The Drinks Club — new orders', amount: 1558.51, note: 'Delivering 11 Aug, invoice to follow (prior £2,541.91 paid 10 Aug)' },
    { name: 'Five Points — Aug invoice IV-75402', amount: 1376.50, note: 'Due 15 Sep, not overdue' },
    { name: 'Man & Van — INV2067 only', amount: 380.00, note: 'Founder: earlier invoices paid; only the 9 Aug one outstanding' },
    { name: 'Friendly Waste', amount: 1486.02, note: 'Billed to “No Dice Bars Ltd”; ~£420 possibly part-paid' },
    { name: 'Kartel / Damian Thomas (DJ)', amount: 250.00, note: '£250 “sent” 13 Jul, never confirmed; + a 16 Jul gig invoice (amount in PDF)' },
  ],
  unknownAmounts: ['Umbrella invoice 12565 + old Plonk-era debt', 'Kartel — 16 Jul gig invoice', 'Krzysztof (Diffriend) — 28 Feb gig invoice'],
  confirmedTotal: 5058.95,
  possibleTotal: 5051.03,
}
// Paid & cleared per founder review 10 Aug: BCS £295.91 ✓, Fine Cider £215.97 ✓,
// Man & Van INV2059 £1,765 + INV2038 £1,280 ✓.

// VAT registration tracker (£90k rolling 12-month gross taxable turnover)
export const VAT = {
  threshold: 90000,
  turnoverAtTillDate: 88800,  // gross card (£74.2k) + SumUp gross (£14.4k) + Stripe, at 6 Aug
  crossedEstimate: 'week of 7 August 2026',
  notifyBy: '30 September 2026',
  effectiveFrom: '1 October 2026',
}
