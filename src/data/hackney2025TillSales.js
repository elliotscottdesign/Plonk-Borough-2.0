// Hackney till sales — 2025 (backfilled to full year). BAR-LED venue; the
// render layer (TabTillSales2025) restates every aggregate bar-only.
//
// 1 Jan → 23 Sep 2025: Goodtill export (COMPLETED orders, cleaned/deduped).
// 24 Sep → 31 Dec 2025: Lightspeed export (plonkgolfltd · London Fields — the
//   same venue, after the 24 Sep 2025 till migration). The 16–23 Sep overlap
//   in the Lightspeed file is excluded so Goodtill remains the source for that
//   window. September combines Goodtill (1–23) + Lightspeed (24–30).
//
// Goodtill = gross customer payments inc-VAT (after till discounts). Lightspeed
// = NET inc-VAT (sales minus voids/comps/corrections). For the Lightspeed
// period categories are mapped from item names onto the original Goodtill
// 31-category scheme so the full year reads on one taxonomy (best-effort on the
// spirit/cocktail and beer draught/bottled sub-splits).
//
// `monthly` is a 12-element array aligned to `months` (Jan … Dec).
export const HACKNEY_2025_TILL_SALES = {
  totalRevenue: 611670,
  totalTxns: 52073,
  lastDate: "2025-12-31",
  months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  monthlyTotals: [50747, 63004, 64570, 59634, 64169, 57173, 58219, 70544, 32466, 34439, 29642, 27063],
  categories: [
    { name: "BEER - DRAUGHT", total: 193837, qty: 35332, monthly: [14840, 18083, 19316, 17627, 18909, 18523, 17427, 20027, 11388, 14173, 13047, 10476] },
    { name: "COCKTAILS - HOUSE", total: 69294, qty: 6700, monthly: [4166, 7165, 6598, 5941, 7788, 6752, 6545, 9361, 3219, 4384, 3204, 4172] },
    { name: "GOLF - Rounds", total: 53181, qty: 6442, monthly: [3506, 4396, 5208, 4706, 5717, 5403, 6686, 9561, 3282, 1960, 1585, 1171] },
    { name: "COCKTAILS - CLASSIC", total: 47134, qty: 4434, monthly: [3298, 3794, 6174, 6202, 5383, 5366, 5431, 5838, 2111, 1368, 1051, 1118] },
    { name: "BEER & CIDER - BOTTLED", total: 44086, qty: 9257, monthly: [3959, 4797, 4034, 4005, 4849, 4524, 4838, 5527, 2543, 1687, 1701, 1621] },
    { name: "WINE & PROSECCO", total: 35634, qty: 4610, monthly: [3098, 3471, 4593, 4032, 3611, 2660, 2948, 3589, 1562, 2280, 2019, 1771] },
    { name: "SPIRITS - GIN & VODKA", total: 31000, qty: 4874, monthly: [2899, 3796, 3838, 3297, 3150, 2743, 2635, 3127, 1604, 1660, 1106, 1145] },
    { name: "POOL - Reservations", total: 29522, qty: 4646, monthly: [3371, 3418, 3063, 2690, 3056, 2265, 2380, 2880, 1420, 1670, 1810, 1501] },
    { name: "SOFT DRINKS", total: 18696, qty: 7678, monthly: [1786, 1675, 1766, 1773, 2038, 1920, 2019, 2380, 1136, 833, 704, 667] },
    { name: "ARCADE - Tokens", total: 14113, qty: 2982, monthly: [1218, 1572, 1512, 1438, 1252, 984, 1331, 1668, 850, 634, 854, 802] },
    { name: "SPIRITS - TEQUILA & SHOTS", total: 13973, qty: 2600, monthly: [1437, 1513, 1902, 1370, 1289, 925, 1112, 1057, 701, 1247, 660, 761] },
    { name: "SPIRITS - RUM & BRANDY", total: 13094, qty: 2120, monthly: [1027, 1545, 1115, 1413, 1493, 1430, 1035, 1668, 572, 806, 575, 417] },
    { name: "GOLF + TOKEN BUNDLES", total: 10282, qty: 751, monthly: [1139, 1683, 1696, 1657, 2271, 717, 678, 257, 88, 38, 57, 0] },
    { name: "SPIRITS - WHISKEY & BOURBON", total: 6635, qty: 1029, monthly: [537, 803, 961, 848, 615, 513, 689, 689, 273, 338, 124, 245] },
    { name: "BEER CANS", total: 4497, qty: 893, monthly: [599, 395, 529, 471, 585, 530, 599, 498, 281, 9, 0, 0] },
    { name: "OTHER - MISC", total: 3999, qty: 531, monthly: [148, 112, 296, 477, 612, 388, 308, 869, 285, 149, 236, 119] },
    { name: "COCKTAILS - MOCKTAILS", total: 3724, qty: 687, monthly: [526, 578, 718, 254, 261, 337, 335, 339, 213, 131, 33, 0] },
    { name: "OTHER - BAR SNACKS", total: 2877, qty: 1543, monthly: [289, 244, 266, 378, 322, 174, 275, 243, 169, 193, 206, 118] },
    { name: "SOFT DRINKS - JUICE", total: 2725, qty: 957, monthly: [130, 209, 214, 216, 213, 176, 157, 288, 156, 420, 244, 302] },
    { name: "SPIRITS - LIQUEURS & APERITIFS", total: 2274, qty: 427, monthly: [306, 283, 223, 192, 134, 157, 201, 195, 128, 58, 168, 231] },
    { name: "SPEED PAGE", total: 2138, qty: 341, monthly: [22, 615, 250, 295, 321, 269, 98, 68, 200, 0, 0, 0] },
    { name: "FOOD - HOT DOGS", total: 2018, qty: 218, monthly: [1011, 851, 10, 50, 0, 75, 21, 0, 0, 0, 0, 0] },
    { name: "FOOD SIDES", total: 1788, qty: 172, monthly: [541, 826, 0, 0, 0, 23, 0, 0, 142, 0, 4, 253] },
    { name: "GAME & DRINK BUNDLES", total: 1705, qty: 175, monthly: [35, 68, 68, 236, 248, 80, 170, 320, 90, 260, 70, 60] },
    { name: "FOOD TACOS", total: 1517, qty: 167, monthly: [585, 932, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { name: "OTHER - TEA & COFFEE", total: 868, qty: 316, monthly: [122, 87, 67, 47, 27, 0, 21, 18, 43, 140, 182, 113] },
    { name: "Pizza", total: 489, qty: 49, monthly: [0, 0, 0, 0, 0, 220, 269, 0, 0, 0, 0, 0] },
    { name: "COCKTAILS - PRIVATE HIRE", total: 367, qty: 37, monthly: [125, 88, 99, 0, 0, 0, 11, 33, 11, 0, 0, 0] },
    { name: "COCKTAIL INGREDIENTS", total: 48, qty: 4, monthly: [12, 0, 36, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { name: "TOURNAMENTS", total: 15, qty: 3, monthly: [10, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { name: "SPIRITS - PREMIXED", total: 12, qty: 2, monthly: [0, 0, 0, 12, 0, 0, 0, 0, 0, 0, 0, 0] },
    { name: "OTHER - ID CHECK", total: 0, qty: 44, monthly: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
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