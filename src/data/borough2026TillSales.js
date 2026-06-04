// Borough 2026 till sales — Lightspeed export (plonkgolfltd · London Bridge),
// the same physical venue as the Goodtill 2025 data after the mid-Sep 2025
// till migration. Covers 1 Jan → 10 Mar 2026 (March is partial — only the
// first 10 days are in the export, hence the lower bar and the 'partial'
// coverage treatment).
//
// Figures are NET inc-VAT — every till line netted together (sales minus the
// voids / comps / corrections that reverse them), i.e. what customers actually
// paid through the till. Categories are derived from the Lightspeed SKU
// product-type code, mapped onto the same 21-category Goodtill taxonomy used
// for 2025 so the two years read like-for-like (spirit / cocktail sub-splits
// are best-effort from item names — see build note in the PR).
//
// Source CSV: MAIN plonkgolfltd_plonk-londonbridge_transactions_20250901_20260331.csv
export const BOROUGH_2026_TILL_SALES = {
  "totalRevenue": 61106,
  "totalTxns": 3868,
  "lastDate": "2026-03-10",
  "months": ["Jan", "Feb", "Mar"],
  "monthlyTotals": [26517, 27572, 7018],
  "categories": [
    {
      "name": "OTHER - GOLF",
      "total": 15481,
      "qty": 1407,
      "monthly": [6796, 6887, 1799]
    },
    {
      "name": "BEER - DRAUGHT",
      "total": 14881,
      "qty": 3626,
      "monthly": [6597, 6636, 1648]
    },
    {
      "name": "BEER & CIDER - BOTTLED",
      "total": 5661,
      "qty": 1245,
      "monthly": [2442, 2404, 816]
    },
    {
      "name": "SPIRITS - GIN & VODKA",
      "total": 5311,
      "qty": 1385,
      "monthly": [2432, 2247, 632]
    },
    {
      "name": "WINE & PROSECCO",
      "total": 4399,
      "qty": 836,
      "monthly": [1744, 1995, 660]
    },
    {
      "name": "OTHER - GOLF & GAMES",
      "total": 3501,
      "qty": 608,
      "monthly": [1787, 1395, 318]
    },
    {
      "name": "COCKTAILS - CLASSIC",
      "total": 2380,
      "qty": 202,
      "monthly": [964, 1188, 228]
    },
    {
      "name": "SOFT DRINKS",
      "total": 2316,
      "qty": 1174,
      "monthly": [912, 1152, 252]
    },
    {
      "name": "SPIRITS - RUM & BRANDY",
      "total": 2050,
      "qty": 500,
      "monthly": [1128, 777, 145]
    },
    {
      "name": "COCKTAILS - HOUSE",
      "total": 1693,
      "qty": 142,
      "monthly": [731, 878, 84]
    },
    {
      "name": "SPIRITS - TEQUILA & SHOTS",
      "total": 947,
      "qty": 207,
      "monthly": [401, 486, 60]
    },
    {
      "name": "SPIRITS - WHISKEY & BOURBON",
      "total": 807,
      "qty": 229,
      "monthly": [252, 482, 72]
    },
    {
      "name": "OTHER - MISC",
      "total": 800,
      "qty": 159,
      "monthly": [19, 556, 225]
    },
    {
      "name": "SPIRITS - LIQUEURS & APERITIFS",
      "total": 414,
      "qty": 143,
      "monthly": [96, 258, 60]
    },
    {
      "name": "SOFT DRINKS - JUICE",
      "total": 224,
      "qty": 77,
      "monthly": [97, 124, 4]
    },
    {
      "name": "OTHER - BAR SNACKS",
      "total": 178,
      "qty": 107,
      "monthly": [69, 95, 15]
    },
    {
      "name": "COCKTAILS - MOCKTAILS",
      "total": 60,
      "qty": 10,
      "monthly": [48, 12, 0]
    },
  ]
}
