// ─── No Dice Consumables — BCS Supplies operating costs ─────────────────
// Auto-seeded from 24 BCS Supplies invoices (Jan 2025 → Feb 2026, 14 months)
// covering Plonk (Hackney). Total tracked spend: £1,704.32 across 48 distinct SKUs.
//
// Unlike Costing, this is NOT cost-of-sales — these are operational running
// costs (paper, cleaning chemicals, bar disposables, glassware). The sheet
// tracks latest unit price + 14-month spend + rough monthly burn so the founder
// can see where the consumables budget actually goes and re-order intelligently.
//
// Numbers persist to localStorage when the user edits — same pattern as Costing.
// Source PDFs sat in `/Desktop/BCS Supplies 2025 Hackney/` on the founder's Mac.
// ───────────────────────────────────────────────────────────────────────

export const TRACKING_MONTHS = 14

export const CATEGORIES = [
  { key: 'paper',          label: 'Paper & Disposables' },
  { key: 'chemicals',      label: 'Cleaning Chemicals' },
  { key: 'tools_cleaning', label: 'Cleaning Tools' },
  { key: 'glassware',      label: 'Glassware' },
  { key: 'bar_tools',      label: 'Bar Tools' },
  { key: 'ashtray',        label: 'Ashtrays' },
  { key: 'other',          label: 'Other' },
]

export const CONSUMABLES = [
  {
    code: 'AK039', name: 'Toilet Roll, 2 Ply, Desna, Eco 320',
    category: 'paper', pack: '2 Ply',
    latestPrice: 12.3, latestDate: '26 Feb 2026',
    orders: 13, totalQty: 27.0, totalSpend: 332.1, avgPerMonth: 23.72,
    supplier: 'BCS Supplies',
  },
  {
    code: 'AFR125-B', name: 'Centrefeed, 2Ply, Blue, enov, 150m',
    category: 'paper', pack: '2Ply',
    latestPrice: 11.63, latestDate: '26 Feb 2026',
    orders: 11, totalQty: 25.0, totalSpend: 290.75, avgPerMonth: 20.77,
    supplier: 'BCS Supplies',
  },
  {
    code: 'AL155', name: 'Sip Straw, Black, Paper, 5.5"',
    category: 'paper', pack: '',
    latestPrice: 2.35, latestDate: '27 Nov 2025',
    orders: 7, totalQty: 19.0, totalSpend: 44.65, avgPerMonth: 3.19,
    supplier: 'BCS Supplies',
  },
  {
    code: 'AK088', name: 'Straw, Black, Paper, 8"',
    category: 'paper', pack: '',
    latestPrice: 2.45, latestDate: '26 Feb 2026',
    orders: 2, totalQty: 9.0, totalSpend: 22.05, avgPerMonth: 1.57,
    supplier: 'BCS Supplies',
  },
  {
    code: 'IMP1207', name: 'Date Labels, Detailed',
    category: 'paper', pack: '',
    latestPrice: 6.74, latestDate: '16 Oct 2025',
    orders: 2, totalQty: 2.0, totalSpend: 13.48, avgPerMonth: 0.96,
    supplier: 'BCS Supplies',
  },
  {
    code: 'IMP1572', name: 'Plasters, Food Area Blue, Assorted',
    category: 'paper', pack: '',
    latestPrice: 3.24, latestDate: '12 Feb 2026',
    orders: 2, totalQty: 3.0, totalSpend: 9.72, avgPerMonth: 0.69,
    supplier: 'BCS Supplies',
  },
  {
    code: 'IMP1519', name: 'Napkin, 24cm, 2 ply, 4 Fold, Cocktail, Black 1.00 42.55 20% 42.55 SA-051 - L Nitrile Gloves, Examination, Powder Free, Large, Blue',
    category: 'paper', pack: '24cm',
    latestPrice: 5.66, latestDate: '16 Jun 2025',
    orders: 1, totalQty: 1.0, totalSpend: 5.66, avgPerMonth: 0.4,
    supplier: 'BCS Supplies',
  },
  {
    code: 'AD107', name: 'J Cloth, Ocean Wipe, Green',
    category: 'paper', pack: '',
    latestPrice: 3.94, latestDate: '18 Dec 2025',
    orders: 1, totalQty: 1.0, totalSpend: 3.94, avgPerMonth: 0.28,
    supplier: 'BCS Supplies',
  },
  {
    code: 'TB788', name: 'Spray Cleaner with Bactericide, Envirological, Lift, 5L',
    category: 'chemicals', pack: '5L',
    latestPrice: 15.56, latestDate: '18 Dec 2025',
    orders: 3, totalQty: 5.0, totalSpend: 77.8, avgPerMonth: 5.56,
    supplier: 'BCS Supplies',
  },
  {
    code: 'BAR030-75', name: 'Enov H030 eClear, Glass & Mirror Cleaner, 750ml',
    category: 'chemicals', pack: '750ml',
    latestPrice: 14.9, latestDate: '9 Oct 2025',
    orders: 4, totalQty: 4.0, totalSpend: 59.6, avgPerMonth: 4.26,
    supplier: 'BCS Supplies',
  },
  {
    code: 'TB783', name: 'Floor Cleaner, Bactericidal, 5L',
    category: 'chemicals', pack: '5L',
    latestPrice: 10.65, latestDate: '12 Feb 2026',
    orders: 3, totalQty: 5.0, totalSpend: 53.25, avgPerMonth: 3.8,
    supplier: 'BCS Supplies',
  },
  {
    code: 'TB244', name: 'Drain Unblocker Gel, Mr Muscle, 1L',
    category: 'chemicals', pack: '1L',
    latestPrice: 6.59, latestDate: '16 Oct 2025',
    orders: 4, totalQty: 7.0, totalSpend: 46.13, avgPerMonth: 3.29,
    supplier: 'BCS Supplies',
  },
  {
    code: 'TB343', name: 'Hand Soap, Peach, 5L',
    category: 'chemicals', pack: '5L',
    latestPrice: 13.6, latestDate: '12 Feb 2026',
    orders: 3, totalQty: 3.0, totalSpend: 40.8, avgPerMonth: 2.91,
    supplier: 'BCS Supplies',
  },
  {
    code: 'IMP1874', name: 'Washroom Cleaner, Lift Bath and Washroom, 750ml',
    category: 'chemicals', pack: '750ml',
    latestPrice: 3.24, latestDate: '29 Jan 2026',
    orders: 4, totalQty: 11.0, totalSpend: 35.64, avgPerMonth: 2.55,
    supplier: 'BCS Supplies',
  },
  {
    code: 'TB779', name: 'Degreaser, Spray On, 5L',
    category: 'chemicals', pack: '5L',
    latestPrice: 32.84, latestDate: '20 Nov 2025',
    orders: 1, totalQty: 1.0, totalSpend: 32.84, avgPerMonth: 2.35,
    supplier: 'BCS Supplies',
  },
  {
    code: 'BGA010-DN', name: 'Enov eBreezz, 2 in 1 Air Freshener & Sanitiser, Desert Noir, 500ml',
    category: 'chemicals', pack: '500ml',
    latestPrice: 2.16, latestDate: '26 Feb 2026',
    orders: 11, totalQty: 12.0, totalSpend: 25.92, avgPerMonth: 1.85,
    supplier: 'BCS Supplies',
  },
  {
    code: 'BCR079-BL', name: 'enov W079 FreshWave Ocean Urinal Channel,Blocks (3 Kg)',
    category: 'chemicals', pack: '3 Kg',
    latestPrice: 12.4, latestDate: '27 Nov 2025',
    orders: 2, totalQty: 2.0, totalSpend: 24.8, avgPerMonth: 1.77,
    supplier: 'BCS Supplies',
  },
  {
    code: 'BGA010-CS', name: 'Enov eBreezz, 2 in 1 Air Freshener & Sanitiser, Citrus Sensation, 500ml',
    category: 'chemicals', pack: '500ml',
    latestPrice: 2.16, latestDate: '26 Feb 2026',
    orders: 9, totalQty: 11.0, totalSpend: 23.76, avgPerMonth: 1.7,
    supplier: 'BCS Supplies',
  },
  {
    code: 'TB776', name: 'Bleach, Thick, 5L',
    category: 'chemicals', pack: '5L',
    latestPrice: 11.17, latestDate: '26 Feb 2026',
    orders: 2, totalQty: 2.0, totalSpend: 22.34, avgPerMonth: 1.6,
    supplier: 'BCS Supplies',
  },
  {
    code: 'BGA010-CY', name: 'Enov eBreezz, 2 in 1 Air Freshener & Sanitiser, Sweet Cranberry, 500ml',
    category: 'chemicals', pack: '500ml',
    latestPrice: 2.16, latestDate: '26 Feb 2026',
    orders: 7, totalQty: 9.0, totalSpend: 19.44, avgPerMonth: 1.39,
    supplier: 'BCS Supplies',
  },
  {
    code: 'TA787', name: 'Dishwash and Glasswash Detergent, 5L',
    category: 'chemicals', pack: '5L',
    latestPrice: 15.26, latestDate: '16 Oct 2025',
    orders: 1, totalQty: 1.0, totalSpend: 15.26, avgPerMonth: 1.09,
    supplier: 'BCS Supplies',
  },
  {
    code: 'TA789', name: 'Rinse Aid, Dishwash & Glasswash, 5L',
    category: 'chemicals', pack: '5L',
    latestPrice: 11.26, latestDate: '16 Oct 2025',
    orders: 1, totalQty: 1.0, totalSpend: 11.26, avgPerMonth: 0.8,
    supplier: 'BCS Supplies',
  },
  {
    code: 'TB461', name: 'Washing Up Liquid, Enov, 15%, 5L',
    category: 'chemicals', pack: '5L',
    latestPrice: 9.95, latestDate: '29 Jan 2026',
    orders: 1, totalQty: 1.0, totalSpend: 9.95, avgPerMonth: 0.71,
    supplier: 'BCS Supplies',
  },
  {
    code: 'IMP1808', name: 'Toilet Cleaner, Apple, 750ml',
    category: 'chemicals', pack: '750ml',
    latestPrice: 1.48, latestDate: '16 Oct 2025',
    orders: 3, totalQty: 5.0, totalSpend: 7.4, avgPerMonth: 0.53,
    supplier: 'BCS Supplies',
  },
  {
    code: 'IMP1720', name: 'Spray Cleaner with Bactericide, Envirological, Lift, 750ml',
    category: 'chemicals', pack: '750ml',
    latestPrice: 1.71, latestDate: '29 Jan 2026',
    orders: 2, totalQty: 3.0, totalSpend: 5.13, avgPerMonth: 0.37,
    supplier: 'BCS Supplies',
  },
  {
    code: 'IMP1223', name: 'Descaler and Sanitizer, 750ml',
    category: 'chemicals', pack: '750ml',
    latestPrice: 3.7, latestDate: '26 Feb 2026',
    orders: 1, totalQty: 1.0, totalSpend: 3.7, avgPerMonth: 0.26,
    supplier: 'BCS Supplies',
  },
  {
    code: 'IMP1216', name: 'Degreaser, Spray On, 750ml',
    category: 'chemicals', pack: '750ml',
    latestPrice: 2.89, latestDate: '20 Nov 2025',
    orders: 1, totalQty: 1.0, totalSpend: 2.89, avgPerMonth: 0.21,
    supplier: 'BCS Supplies',
  },
  {
    code: 'IMP1632', name: 'Renovating Powder, Glass, 10Kg',
    category: 'tools_cleaning', pack: '10Kg',
    latestPrice: 45.05, latestDate: '9 Oct 2025',
    orders: 1, totalQty: 1.0, totalSpend: 45.05, avgPerMonth: 3.22,
    supplier: 'BCS Supplies',
  },
  {
    code: 'HYJ730-12', name: 'JanSan Multifold Contract Kentucky Mop,Head 12oz (Mop)',
    category: 'tools_cleaning', pack: '12oz',
    latestPrice: 1.72, latestDate: '6 Oct 2025',
    orders: 3, totalQty: 18.0, totalSpend: 42.78, avgPerMonth: 3.06,
    supplier: 'BCS Supplies',
  },
  {
    code: 'BB092-25', name: 'JanSan Water Softener Salt Granules 25Kg',
    category: 'tools_cleaning', pack: '25Kg',
    latestPrice: 5.66, latestDate: '12 Feb 2026',
    orders: 2, totalQty: 3.0, totalSpend: 22.07, avgPerMonth: 1.58,
    supplier: 'BCS Supplies',
  },
  {
    code: 'HN201', name: 'JanSan Toilet Brush Set with Potted Holder, White',
    category: 'tools_cleaning', pack: '',
    latestPrice: 1.47, latestDate: '29 Jan 2026',
    orders: 1, totalQty: 1.0, totalSpend: 1.47, avgPerMonth: 0.1,
    supplier: 'BCS Supplies',
  },
  {
    code: 'TC627', name: 'Wine Glass, Vino, 16.5oz, LCE @250ml',
    category: 'glassware', pack: '16.5oz',
    latestPrice: 53.14, latestDate: '20 Nov 2025',
    orders: 1, totalQty: 2.0, totalSpend: 106.28, avgPerMonth: 7.59,
    supplier: 'BCS Supplies',
  },
  {
    code: 'TC739', name: 'Shot Glass, American, 1oz',
    category: 'glassware', pack: '1oz',
    latestPrice: 12.73, latestDate: '5 Dec 2025',
    orders: 1, totalQty: 5.0, totalSpend: 63.65, avgPerMonth: 4.55,
    supplier: 'BCS Supplies',
  },
  {
    code: 'TB057', name: 'Old Fashioned, Symphony, 11.25oz',
    category: 'glassware', pack: '11.25oz',
    latestPrice: 11.58, latestDate: '3 Jul 2025',
    orders: 1, totalQty: 2.0, totalSpend: 23.16, avgPerMonth: 1.65,
    supplier: 'BCS Supplies',
  },
  {
    code: 'IMP1041', name: 'Champagne Stopper',
    category: 'glassware', pack: '',
    latestPrice: 2.57, latestDate: '4 Sep 2025',
    orders: 1, totalQty: 1.0, totalSpend: 2.57, avgPerMonth: 0.18,
    supplier: 'BCS Supplies',
  },
  {
    code: 'IMP1894', name: 'Wine Sealer, Vacu Vin, Tops Only',
    category: 'bar_tools', pack: '',
    latestPrice: 3.99, latestDate: '29 Jan 2026',
    orders: 3, totalQty: 6.0, totalSpend: 23.94, avgPerMonth: 1.71,
    supplier: 'BCS Supplies',
  },
  {
    code: 'TB021', name: 'Spirit Pour, Free Flow',
    category: 'bar_tools', pack: '',
    latestPrice: 9.9, latestDate: '4 Sep 2025',
    orders: 1, totalQty: 2.0, totalSpend: 19.8, avgPerMonth: 1.41,
    supplier: 'BCS Supplies',
  },
  {
    code: 'AC128', name: 'Speed Pourer Caps',
    category: 'bar_tools', pack: '',
    latestPrice: 3.3, latestDate: '29 Jan 2026',
    orders: 2, totalQty: 5.0, totalSpend: 16.5, avgPerMonth: 1.18,
    supplier: 'BCS Supplies',
  },
  {
    code: 'TA589', name: 'Jigger, Banded, 25/50ml',
    category: 'bar_tools', pack: '50ml',
    latestPrice: 5.72, latestDate: '18 Dec 2025',
    orders: 1, totalQty: 2.0, totalSpend: 11.44, avgPerMonth: 0.82,
    supplier: 'BCS Supplies',
  },
  {
    code: 'TB794', name: 'Boston Shaker Can, 18oz (Single)',
    category: 'bar_tools', pack: '18oz',
    latestPrice: 4.07, latestDate: '18 Dec 2025',
    orders: 1, totalQty: 2.0, totalSpend: 8.14, avgPerMonth: 0.58,
    supplier: 'BCS Supplies',
  },
  {
    code: 'TB020', name: 'Cocktail Mixing Spoon, 11"',
    category: 'bar_tools', pack: '',
    latestPrice: 4.07, latestDate: '18 Dec 2025',
    orders: 1, totalQty: 2.0, totalSpend: 8.14, avgPerMonth: 0.58,
    supplier: 'BCS Supplies',
  },
  {
    code: 'IMP1480', name: 'Jigger, 25ml CA',
    category: 'bar_tools', pack: '25ml',
    latestPrice: 2.52, latestDate: '18 Dec 2025',
    orders: 1, totalQty: 2.0, totalSpend: 5.04, avgPerMonth: 0.36,
    supplier: 'BCS Supplies',
  },
  {
    code: 'AN109', name: 'Bar Knife, 8"',
    category: 'bar_tools', pack: '',
    latestPrice: 3.7, latestDate: '18 Dec 2025',
    orders: 1, totalQty: 1.0, totalSpend: 3.7, avgPerMonth: 0.26,
    supplier: 'BCS Supplies',
  },
  {
    code: 'IMP1161', name: 'Mesh Strainer, 9\'\'',
    category: 'bar_tools', pack: '',
    latestPrice: 3.24, latestDate: '16 Jun 2025',
    orders: 1, totalQty: 1.0, totalSpend: 3.24, avgPerMonth: 0.23,
    supplier: 'BCS Supplies',
  },
  {
    code: 'IMP1867', name: 'Cork Screw, Double Reach',
    category: 'bar_tools', pack: '',
    latestPrice: 2.01, latestDate: '21 Aug 2025',
    orders: 1, totalQty: 1.0, totalSpend: 2.01, avgPerMonth: 0.14,
    supplier: 'BCS Supplies',
  },
  {
    code: 'AN110', name: 'Ashtray, Melamine, Black, 100mm',
    category: 'ashtray', pack: '',
    latestPrice: 1.56, latestDate: '3 Jul 2025',
    orders: 1, totalQty: 7.0, totalSpend: 10.92, avgPerMonth: 0.78,
    supplier: 'BCS Supplies',
  },
  {
    code: 'IMP1141', name: 'JanSan Linen Union Glass Cloth',
    category: 'other', pack: '',
    latestPrice: 8.24, latestDate: '29 Jan 2026',
    orders: 3, totalQty: 3.0, totalSpend: 24.72, avgPerMonth: 1.77,
    supplier: 'BCS Supplies',
  },
  {
    code: 'HHJ500-BN', name: 'JanSan Kentucky Wooden Handle & Metal,Fitting 54" 137cm',
    category: 'other', pack: '137cm',
    latestPrice: 6.48, latestDate: '12 Feb 2026',
    orders: 2, totalQty: 3.0, totalSpend: 19.44, avgPerMonth: 1.39,
    supplier: 'BCS Supplies',
  },
]

export const STORE_KEY = 'ndb_ops_consumables_v1'

export function loadOverrides() {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (!raw) return { prices: {}, onhand: {}, notes: {} }
    const p = JSON.parse(raw)
    return { prices: p.prices || {}, onhand: p.onhand || {}, notes: p.notes || {} }
  } catch { return { prices: {}, onhand: {}, notes: {} } }
}

export function saveOverrides(state) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)) } catch {}
}