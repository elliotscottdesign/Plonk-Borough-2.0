// Hackney 2025 till sales — aggregated from data/hackney_2025_till_sales.csv
// (Goodtill export, COMPLETED orders only, 1 Jan 2025 → 23 Sep 2025).
//
// ⚠ DATA GAP: No till data from 24 Sep 2025 onwards. On that date Hackney
// migrated off Goodtill to Lightspeed. Q4 2025 figures live in Lightspeed
// reports, not in this dataset.
//
// ─── Reclassification of OTHER - GOLF / OTHER - GOLF & GAMES ──────────
// The raw Goodtill export carried two ambiguous activity buckets:
//   • OTHER - GOLF (£59,266) — full-price Peak/Off-Peak structured rounds
//   • OTHER - GOLF & GAMES (£76,772) — a catch-all that mixed legacy
//     £5–6 golf rounds, ALL pool reservations, ALL arcade tokens, golf+
//     token bundles, drink bundles and tournaments
// Combined £136,038 was hard to interpret — the same activity flowed
// through two buttons. Per-product analysis on the raw 89,521-line CSV
// split this into seven clean buckets (totals tie):
//   GOLF - Rounds          £80,088   (5,176 new pricing + 3,689 legacy £5–6)
//   POOL - Reservations    £25,087   (3,950 lines)
//   GOLF + TOKEN BUNDLES   £15,840   (1,063 bundle SKUs)
//   ARCADE - Tokens        £13,380   (2,664 standalone token sales)
//   GAME & DRINK BUNDLES   £1,449    (Tuesday Drink & Game etc.)
//   TOURNAMENTS            £15       (1 Pool entry on 8 Jan + 1 on 1 Feb)
//   OTHER - MISC fragment  £179      (folded into the existing OTHER - MISC line)
//
// Per-SKU label cleanups applied to the raw CSV (Goodtill staff used
// duplicate buttons for the same product):
//   • "Six Arcade Tokens"   → merged into "6 Tokens" (470 combined lines · £2,389)
//   • "Golf Tournament Entry" (1 line, 8 Jan 2025) → relabelled
//     "Pool Tournament Entry" (founder confirmed: Hackney does not
//     run golf tournaments)
//
// Token-pricing note: per-token unit price changed during 2025 (founder
// adjusted the bundle prices over the year). Per-token avg therefore
// drifts ~£0.77–£0.83 across SKUs:
//   5 Arcade Tokens  £4.00 avg → £0.80 / token
//   6 Tokens         £5.08 avg → £0.85 / token
//   12 Tokens        £9.18 avg → £0.77 / token
//
// Categories are sorted descending by total revenue. `monthly` is a 9-element
// array aligned to `months` (Jan … Sep). The Sep figure is partial — only
// 23 days, hence the visual "data ends here" treatment in the chart.
export const HACKNEY_2025_TILL_SALES = {
  totalRevenue: 628227,
  totalTxns: 43784,
  lastDate: "2025-09-23",
  months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"],
  monthlyTotals: [59804, 75259, 77511, 72913, 79610, 69897, 72956, 87400, 32876],
  categories: [
    { name: "BEER - DRAUGHT", total: 191599, qty: 29634, monthly: [17515, 22294, 23294, 21891, 24281, 23308, 22727, 25242, 11045] },
    { name: "GOLF - Rounds", total: 80088, qty: 8865, monthly: [5948, 6972, 9046, 8040, 9373, 8730, 10787, 16059, 5131] },
    { name: "COCKTAILS - HOUSE", total: 65913, qty: 5984, monthly: [4613, 8345, 7504, 6984, 9064, 7892, 7580, 10888, 3042] },
    { name: "COCKTAILS - CLASSIC", total: 49579, qty: 4508, monthly: [3947, 4166, 6821, 6936, 6356, 6283, 6269, 6446, 2354] },
    { name: "BEER & CIDER - BOTTLED", total: 46378, qty: 9926, monthly: [4544, 5707, 4781, 4858, 5867, 5579, 5819, 6597, 2626] },
    { name: "WINE & PROSECCO", total: 32470, qty: 3550, monthly: [3406, 3715, 4991, 4515, 4220, 2864, 3245, 3997, 1518] },
    { name: "SPIRITS - GIN & VODKA", total: 28205, qty: 3800, monthly: [3022, 3990, 4007, 3446, 3294, 2845, 2904, 3263, 1435] },
    { name: "POOL - Reservations", total: 25087, qty: 3950, monthly: [3469, 3548, 3220, 2780, 3180, 2325, 2455, 2995, 1116] },
    { name: "SOFT DRINKS", total: 18045, qty: 6922, monthly: [1943, 1840, 1934, 1980, 2199, 2155, 2285, 2671, 1038] },
    { name: "GOLF + TOKEN BUNDLES", total: 15840, qty: 1063, monthly: [1895, 2688, 2499, 2635, 3304, 1033, 1233, 387, 167] },
    { name: "SPIRITS - TEQUILA & SHOTS", total: 13714, qty: 2390, monthly: [1599, 1848, 2383, 1709, 1707, 1066, 1482, 1367, 554] },
    { name: "ARCADE - Tokens", total: 13380, qty: 2664, monthly: [1385, 1839, 1673, 1716, 1428, 1112, 1550, 1817, 860] },
    { name: "SPIRITS - RUM & BRANDY", total: 11612, qty: 1453, monthly: [1049, 1615, 1128, 1488, 1583, 1496, 1091, 1750, 413] },
    { name: "SPIRITS - WHISKEY & BOURBON", total: 6227, qty: 810, monthly: [543, 826, 1015, 928, 691, 528, 722, 746, 228] },
    { name: "BEER CANS", total: 5170, qty: 1044, monthly: [792, 490, 631, 524, 622, 558, 678, 579, 297] },
    { name: "COCKTAILS - MOCKTAILS", total: 3905, qty: 716, monthly: [566, 631, 794, 318, 313, 376, 374, 350, 182] },
    { name: "OTHER - MISC", total: 3430, qty: 357, monthly: [148, 113, 321, 498, 638, 400, 308, 880, 125] },
    { name: "OTHER - BAR SNACKS", total: 2852, qty: 1581, monthly: [345, 300, 332, 453, 419, 218, 353, 289, 144] },
    { name: "SPEED PAGE", total: 2377, qty: 389, monthly: [22, 663, 262, 337, 346, 301, 116, 84, 246] },
    { name: "SPIRITS - LIQUEURS & APERITIFS", total: 2176, qty: 392, monthly: [340, 328, 294, 251, 176, 196, 234, 214, 143] },
    { name: "FOOD - HOT DOGS", total: 2159, qty: 236, monthly: [1053, 928, 10, 63, 0, 75, 31, 0, 0] },
    { name: "SOFT DRINKS - JUICE", total: 1921, qty: 724, monthly: [145, 225, 244, 240, 243, 191, 169, 330, 134] },
    { name: "FOOD TACOS", total: 1599, qty: 203, monthly: [594, 1004, 0, 0, 0, 0, 0, 0, 0] },
    { name: "FOOD SIDES", total: 1496, qty: 170, monthly: [573, 901, 0, 0, 0, 23, 0, 0, 0] },
    { name: "GAME & DRINK BUNDLES", total: 1449, qty: 129, monthly: [35, 92, 68, 256, 278, 90, 190, 400, 40] },
    { name: "Pizza", total: 576, qty: 57, monthly: [0, 0, 0, 0, 0, 253, 323, 0, 0] },
    { name: "COCKTAILS - PRIVATE HIRE", total: 455, qty: 46, monthly: [158, 88, 154, 0, 0, 0, 11, 33, 11] },
    { name: "OTHER - TEA & COFFEE", total: 449, qty: 171, monthly: [131, 99, 70, 56, 27, 0, 21, 18, 27] },
    { name: "COCKTAIL INGREDIENTS", total: 48, qty: 4, monthly: [12, 0, 36, 0, 0, 0, 0, 0, 0] },
    { name: "TOURNAMENTS", total: 15, qty: 2, monthly: [10, 5, 0, 0, 0, 0, 0, 0, 0] },
    { name: "SPIRITS - PREMIXED", total: 12, qty: 2, monthly: [0, 0, 0, 12, 0, 0, 0, 0, 0] },
    { name: "OTHER - ID CHECK", total: 0, qty: 43, monthly: [0, 0, 0, 0, 0, 0, 0, 0, 0] },
  ],
}

export const HACKNEY_2025_DISCOUNTS = {
  totalGross: 628227,
  totalDiscount: 39180.65,
  discountRate: 6.24,
  totalOrders: 43784,
  discountedOrders: 2713,
  discountedOrderPct: 6.2,
  avgDiscountPerDiscountedOrder: 14.44,
  monthly: [
    { month: "Jan", gross: 59804, discount: 3157.65, rate: 5.28 },
    { month: "Feb", gross: 75259, discount: 3770.35, rate: 5.01 },
    { month: "Mar", gross: 77511, discount: 3391.16, rate: 4.38 },
    { month: "Apr", gross: 72913, discount: 6307.47, rate: 8.65 },
    { month: "May", gross: 79610, discount: 7319.89, rate: 9.19 },
    { month: "Jun", gross: 69897, discount: 6175.56, rate: 8.84 },
    { month: "Jul", gross: 72956, discount: 3704.48, rate: 5.08 },
    { month: "Aug", gross: 87400, discount: 3883.42, rate: 4.44 },
    { month: "Sep", gross: 32876, discount: 1470.67, rate: 4.47 },
  ],
  categories: [
    { name: "BEER & CIDER - BOTTLED", gross: 46378, discount: 7995.87, rate: 17.24 },
    { name: "BEER - DRAUGHT", gross: 191599, discount: 7240.09, rate: 3.78 },
    { name: "SPIRITS - GIN & VODKA", gross: 28205, discount: 3530.53, rate: 12.52 },
    { name: "COCKTAILS - HOUSE", gross: 65913, discount: 3243.18, rate: 4.92 },
    { name: "SPIRITS - TEQUILA & SHOTS", gross: 13714, discount: 3106.19, rate: 22.65 },
    { name: "WINE & PROSECCO", gross: 32470, discount: 2928.18, rate: 9.02 },
    { name: "COCKTAILS - CLASSIC", gross: 49579, discount: 2442.5, rate: 4.93 },
    { name: "SOFT DRINKS", gross: 18045, discount: 2361.02, rate: 13.08 },
    { name: "SPIRITS - RUM & BRANDY", gross: 11612, discount: 1590.57, rate: 13.7 },
    // ─── Reclassified from OTHER - GOLF / OTHER - GOLF & GAMES ───────
    { name: "GOLF - Rounds", gross: 80088, discount: 707.24, rate: 0.88 },
    { name: "POOL - Reservations", gross: 25087, discount: 519.06, rate: 2.07 },
    { name: "ARCADE - Tokens", gross: 13380, discount: 168.34, rate: 1.26 },
    { name: "GOLF + TOKEN BUNDLES", gross: 15840, discount: 114.58, rate: 0.72 },
    { name: "GAME & DRINK BUNDLES", gross: 1449, discount: 80.0, rate: 5.52 },
    { name: "TOURNAMENTS", gross: 15, discount: 0, rate: 0 },
    // ─── End reclassification ────────────────────────────────────────
    { name: "SPIRITS - WHISKEY & BOURBON", gross: 6227, discount: 706.6, rate: 11.35 },
    { name: "BEER CANS", gross: 5170, discount: 448.06, rate: 8.67 },
    { name: "FOOD TACOS", gross: 1599, discount: 418.6, rate: 26.18 },
    { name: "SPIRITS - LIQUEURS & APERITIFS", gross: 2176, discount: 333.95, rate: 15.35 },
    { name: "SOFT DRINKS - JUICE", gross: 1921, discount: 296.89, rate: 15.46 },
    { name: "SPEED PAGE", gross: 2377, discount: 255.56, rate: 10.75 },
    { name: "COCKTAILS - MOCKTAILS", gross: 3905, discount: 220.28, rate: 5.64 },
    { name: "OTHER - BAR SNACKS", gross: 2852, discount: 144.08, rate: 5.05 },
    { name: "FOOD - HOT DOGS", gross: 2159, discount: 146.11, rate: 6.77 },
    { name: "OTHER - TEA & COFFEE", gross: 449, discount: 75.2, rate: 16.74 },
    { name: "COCKTAILS - PRIVATE HIRE", gross: 455, discount: 45.7, rate: 10.04 },
    { name: "FOOD SIDES", gross: 1496, discount: 48.57, rate: 3.25 },
    { name: "OTHER - MISC", gross: 3430, discount: 9.7, rate: 0.28 },
    { name: "Pizza", gross: 576, discount: 4.0, rate: 0.69 },
  ],
}
export const HACKNEY_2025_DISCOUNT_CODES = {
  note: "Goodtill records the \u00a3 amount of each discount and a free-text staff note \u2014 it does NOT store a named campaign / promo code. The patterns below are inferred from those staff notes.",
  promotionColumn: [
    { value: "-5", rows: 66 },
    { value: "-10", rows: 8 },
    { value: "-9", rows: 2 },
    { value: "-4.75", rows: 2 },
    { value: "-4.5", rows: 2 },
    { value: "-2.5", rows: 2 },
    { value: "-17", rows: 1 },
    { value: "-8.34", rows: 1 },
    { value: "-4.17", rows: 1 },
    { value: "-13.99", rows: 1 },
    { value: "-9.5", rows: 1 },
  ],
  freeMixers: [
    { name: "Soda Water", rows: 861, units: 870 },
    { name: "Coke", rows: 696, units: 730 },
    { name: "Schweppes Tonic Water", rows: 556, units: 579 },
    { name: "Schweppes Lemonade", rows: 289, units: 302 },
    { name: "Tommys Margarita", rows: 253, units: 505 },
    { name: "Mango Mojito", rows: 165, units: 328 },
    { name: "Diet Coke", rows: 131, units: 134 },
    { name: "spicy cucmber marg", rows: 120, units: 238 },
    { name: "ginger beer", rows: 113, units: 119 },
    { name: "Cazcabel Blanco", rows: 102, units: 315 },
  ],
  onePoundMixers: [
    { name: "Schweppes Tonic Water", rows: 778, units: 778 },
    { name: "Coke", rows: 554, units: 554 },
    { name: "Schweppes Lemonade", rows: 326, units: 326 },
    { name: "Diet Coke", rows: 186, units: 186 },
    { name: "Pineapple Juice", rows: 50, units: 50 },
    { name: "cranberry", rows: 41, units: 41 },
    { name: "Orange Juice", rows: 21, units: 21 },
    { name: "apple juice", rows: 16, units: 16 },
  ],
  magnitudeBuckets: [
    { bucket: "< 25%", rows: 2941, value: 2419.11 },
    { bucket: "25\u201350%", rows: 590, value: 1750.3 },
    { bucket: "50\u2013100% (BOGOF / 2-for-1)", rows: 4172, value: 34841.67 },
  ],
}