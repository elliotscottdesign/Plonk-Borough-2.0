// Hackney 2025 till sales — aggregated from data/hackney_2025_till_sales_clean.csv
// (cleaned Goodtill export, COMPLETED orders only, 1 Jan 2025 → 23 Sep 2025).
//
// ⚠ DATA GAP: No till data from 24 Sep 2025 onwards. On that date Hackney
// migrated off Goodtill to Lightspeed. Q4 2025 figures live in Lightspeed
// reports, not in this dataset.
//
// ─── Source: cleaned dataset (deduplicated) ──────────────────────────
// Numbers below come from data/hackney_2025_till_sales_clean.csv, which is a
// dedupe of the raw Goodtill export at data/hackney_2025_till_sales.csv. The
// raw file is preserved untouched for audit; the clean file removes 25,796
// exact-duplicate rows (≈26.7% of the export) where every identity-bearing
// field — Sale ID + Sale Time + Order Status + Product + Quantity + Unit
// Price + Sale Discount + Total + Eat-in/Takeaway + Item Notes — matched an
// earlier row exactly. Genuine 2-unit purchases would appear in Goodtill as
// a single qty=2 line; repeated qty=1 lines at the same Sale ID + second +
// product + price are not legitimate distinct purchases.
//
// Headline impact of the dedup:
//   COMPLETED revenue:   £628,227 → £513,686  (−£114,541, −18.2%)
//   COMPLETED line count:  86,822 → 69,164    (−17,658, −20.3%)
//   Distinct Sale IDs:     43,784 → 43,784    (unchanged — same sales,
//                                              fewer line items per sale)
// See data/README.md and the header block in
// data/hackney_2025_till_sales_clean.csv for full provenance.
//
// ─── Reclassification of OTHER - GOLF / OTHER - GOLF & GAMES ──────────
// Goodtill's two ambiguous activity buckets are split per-product into
// seven clean categories so the deck shows real product mix instead of
// an opaque catch-all (totals tie to the cleaned source):
//   GOLF - Rounds          £48,123   (Peak / Off-Peak + legacy £5/£6 button)
//   POOL - Reservations    £24,183
//   ARCADE - Tokens        £11,706
//   GOLF + TOKEN BUNDLES   £10,187
//   GAME & DRINK BUNDLES   £1,255    (Tuesday Drink & Game etc.)
//   TOURNAMENTS            £15       (2 pool entries · 0 golf)
//   OTHER - MISC fragment  £163      (folded into the existing OTHER - MISC line)
//
// Per-SKU label cleanups applied to the raw CSV before dedup:
//   • "Six Arcade Tokens"   → merged into "6 Tokens"
//   • "Golf Tournament Entry" (1 line, 8 Jan 2025) → relabelled
//     "Pool Tournament Entry" (founder confirmed Hackney does not
//     run golf tournaments)
//
// Token-pricing note: per-token unit price changed during 2025 (founder
// adjusted the bundle prices over the year). Per-token avg drifts
// ~£0.77–£0.85 across SKUs.
//
// Categories are sorted descending by units sold. `monthly` is a 9-element
// array aligned to `months` (Jan … Sep). The Sep figure is partial — only
// 23 days, hence the visual "data ends here" treatment in the chart.
export const HACKNEY_2025_TILL_SALES = {
  totalRevenue: 513686,
  totalTxns: 43784,
  lastDate: "2025-09-23",
  months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"],
  monthlyTotals: [50747, 63004, 64570, 59634, 64169, 57173, 58219, 70544, 25626],
  categories: [
    { name: "BEER - DRAUGHT", total: 153012, qty: 23391, monthly: [14840, 18083, 19316, 17627, 18909, 18523, 17427, 20027, 8260] },
    { name: "BEER & CIDER - BOTTLED", total: 38771, qty: 7966, monthly: [3959, 4797, 4034, 4005, 4849, 4524, 4838, 5527, 2237] },
    { name: "SOFT DRINKS", total: 16265, qty: 6195, monthly: [1786, 1675, 1766, 1773, 2038, 1920, 2019, 2380, 909] },
    { name: "GOLF - Rounds", total: 48123, qty: 5500, monthly: [3506, 4396, 5208, 4706, 5717, 5403, 6686, 9561, 2940] },
    { name: "COCKTAILS - HOUSE", total: 56850, qty: 5114, monthly: [4166, 7165, 6598, 5941, 7788, 6752, 6545, 9361, 2535] },
    { name: "COCKTAILS - CLASSIC", total: 43448, qty: 3877, monthly: [3298, 3794, 6174, 6202, 5383, 5366, 5431, 5838, 1962] },
    { name: "POOL - Reservations", total: 24183, qty: 3837, monthly: [3371, 3418, 3063, 2690, 3056, 2265, 2380, 2880, 1061] },
    { name: "SPIRITS - GIN & VODKA", total: 26761, qty: 3528, monthly: [2899, 3796, 3838, 3297, 3150, 2743, 2635, 3127, 1276] },
    { name: "WINE & PROSECCO", total: 29398, qty: 3196, monthly: [3098, 3471, 4593, 4032, 3611, 2660, 2948, 3589, 1397] },
    { name: "ARCADE - Tokens", total: 11706, qty: 2290, monthly: [1218, 1572, 1512, 1438, 1252, 984, 1331, 1668, 732] },
    { name: "SPIRITS - TEQUILA & SHOTS", total: 11077, qty: 1836, monthly: [1437, 1513, 1902, 1370, 1289, 925, 1112, 1057, 473] },
    { name: "SPIRITS - RUM & BRANDY", total: 11125, qty: 1386, monthly: [1027, 1545, 1115, 1413, 1493, 1430, 1035, 1668, 401] },
    { name: "OTHER - BAR SNACKS", total: 2316, qty: 1244, monthly: [289, 244, 266, 378, 322, 174, 275, 243, 125] },
    { name: "BEER CANS", total: 4475, qty: 887, monthly: [599, 395, 529, 471, 585, 530, 599, 498, 268] },
    { name: "SPIRITS - WHISKEY & BOURBON", total: 5873, qty: 746, monthly: [537, 803, 961, 848, 615, 513, 689, 689, 218] },
    { name: "GOLF + TOKEN BUNDLES", total: 10187, qty: 737, monthly: [1139, 1683, 1696, 1657, 2271, 717, 678, 257, 88] },
    { name: "SOFT DRINKS - JUICE", total: 1703, qty: 640, monthly: [130, 209, 214, 216, 213, 176, 157, 288, 100] },
    { name: "COCKTAILS - MOCKTAILS", total: 3472, qty: 633, monthly: [526, 578, 718, 254, 261, 337, 335, 339, 125] },
    { name: "OTHER - MISC", total: 3335, qty: 347, monthly: [148, 112, 296, 477, 612, 388, 308, 869, 125] },
    { name: "SPEED PAGE", total: 2138, qty: 341, monthly: [22, 615, 250, 295, 321, 269, 98, 68, 200] },
    { name: "SPIRITS - LIQUEURS & APERITIFS", total: 1817, qty: 320, monthly: [306, 283, 223, 192, 134, 157, 201, 195, 128] },
    { name: "FOOD - HOT DOGS", total: 2018, qty: 218, monthly: [1011, 851, 10, 50, 0, 75, 21, 0, 0] },
    { name: "FOOD TACOS", total: 1517, qty: 167, monthly: [585, 932, 0, 0, 0, 0, 0, 0, 0] },
    { name: "FOOD SIDES", total: 1389, qty: 156, monthly: [541, 826, 0, 0, 0, 23, 0, 0, 0] },
    { name: "OTHER - TEA & COFFEE", total: 413, qty: 154, monthly: [122, 87, 67, 47, 27, 0, 21, 18, 24] },
    { name: "GAME & DRINK BUNDLES", total: 1255, qty: 127, monthly: [35, 68, 68, 236, 248, 80, 170, 320, 30] },
    { name: "Pizza", total: 489, qty: 49, monthly: [0, 0, 0, 0, 0, 220, 269, 0, 0] },
    { name: "COCKTAILS - PRIVATE HIRE", total: 367, qty: 37, monthly: [125, 88, 99, 0, 0, 0, 11, 33, 11] },
    { name: "OTHER - ID CHECK", total: 0, qty: 36, monthly: [0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { name: "COCKTAIL INGREDIENTS", total: 48, qty: 4, monthly: [12, 0, 36, 0, 0, 0, 0, 0, 0] },
    { name: "TOURNAMENTS", total: 15, qty: 3, monthly: [10, 5, 0, 0, 0, 0, 0, 0, 0] },
    { name: "SPIRITS - PREMIXED", total: 12, qty: 2, monthly: [0, 0, 0, 12, 0, 0, 0, 0, 0] },
  ],
}

export const HACKNEY_2025_DISCOUNTS = {
  totalGross: 541094,
  totalDiscount: 27408.27,
  discountRate: 5.07,
  totalOrders: 43784,
  discountedOrders: 2729,
  discountedOrderPct: 6.2,
  avgDiscountPerDiscountedOrder: 10.04,
  monthly: [
    { month: "Jan", gross: 53377, discount: 2630.30, rate: 4.93 },
    { month: "Feb", gross: 65804, discount: 2799.94, rate: 4.25 },
    { month: "Mar", gross: 67306, discount: 2735.96, rate: 4.06 },
    { month: "Apr", gross: 64411, discount: 4777.07, rate: 7.42 },
    { month: "May", gross: 69004, discount: 4835.27, rate: 7.01 },
    { month: "Jun", gross: 61264, discount: 4090.27, rate: 6.68 },
    { month: "Jul", gross: 60670, discount: 2451.38, rate: 4.04 },
    { month: "Aug", gross: 72711, discount: 2167.09, rate: 2.98 },
    { month: "Sep", gross: 26547, discount: 920.99, rate: 3.47 },
  ],
  categories: [
    { name: "BEER - DRAUGHT", gross: 156783, discount: 3771.09, rate: 2.41 },
    { name: "COCKTAILS - HOUSE", gross: 59364, discount: 2513.55, rate: 4.23 },
    { name: "COCKTAILS - CLASSIC", gross: 44891, discount: 1443.22, rate: 3.21 },
    { name: "BEER & CIDER - BOTTLED", gross: 43735, discount: 4963.60, rate: 11.35 },
    { name: "WINE & PROSECCO", gross: 31787, discount: 2389.00, rate: 7.52 },
    { name: "SPIRITS - GIN & VODKA", gross: 29529, discount: 2767.89, rate: 9.37 },
    { name: "SOFT DRINKS", gross: 18272, discount: 2006.64, rate: 10.98 },
    { name: "SPIRITS - TEQUILA & SHOTS", gross: 13487, discount: 2409.94, rate: 17.87 },
    { name: "SPIRITS - RUM & BRANDY", gross: 12562, discount: 1436.76, rate: 11.44 },
    // ─── Reclassified from OTHER - GOLF / OTHER - GOLF & GAMES (clean) ─
    { name: "GOLF - Rounds", gross: 48317, discount: 194.45, rate: 0.40 },
    { name: "POOL - Reservations", gross: 24375, discount: 192.00, rate: 0.79 },
    { name: "ARCADE - Tokens", gross: 11770, discount: 64.06, rate: 0.54 },
    { name: "GOLF + TOKEN BUNDLES", gross: 10257, discount: 70.00, rate: 0.68 },
    { name: "GAME & DRINK BUNDLES", gross: 1335, discount: 80.00, rate: 5.99 },
    { name: "TOURNAMENTS", gross: 15, discount: 0, rate: 0 },
    // ─── End reclassification ────────────────────────────────────────
    { name: "SPIRITS - WHISKEY & BOURBON", gross: 6450, discount: 577.49, rate: 8.95 },
    { name: "BEER CANS", gross: 4763, discount: 288.60, rate: 6.06 },
    { name: "COCKTAILS - MOCKTAILS", gross: 3646, discount: 174.23, rate: 4.78 },
    { name: "OTHER - MISC", gross: 3182, discount: 9.70, rate: 0.30 },
    { name: "SPEED PAGE", gross: 2220, discount: 81.56, rate: 3.67 },
    { name: "OTHER - BAR SNACKS", gross: 2426, discount: 110.28, rate: 4.55 },
    { name: "FOOD - HOT DOGS", gross: 2144, discount: 125.31, rate: 5.85 },
    { name: "SPIRITS - LIQUEURS & APERITIFS", gross: 2107, discount: 290.05, rate: 13.77 },
    { name: "SOFT DRINKS - JUICE", gross: 1961, discount: 257.78, rate: 13.15 },
    { name: "FOOD TACOS", gross: 1700, discount: 183.10, rate: 10.77 },
    { name: "FOOD SIDES", gross: 1425, discount: 35.07, rate: 2.46 },
    { name: "Pizza", gross: 493, discount: 4.00, rate: 0.81 },
    { name: "OTHER - TEA & COFFEE", gross: 473, discount: 59.60, rate: 12.61 },
    { name: "COCKTAILS - PRIVATE HIRE", gross: 402, discount: 34.70, rate: 8.63 },
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