// Hackney 2026 till sales — Lightspeed export (plonkgolfltd · London Fields),
// the same venue as the Goodtill 2025 data after the 24 Sep 2025 migration.
// Covers 1 Jan → 10 Mar 2026. NOTE: the venue was CLOSED most of January
// (sales on 1 Jan, then nothing until 23 Jan) so the Jan bar reflects ~10
// trading days, not a full month. February is complete; March is partial
// (to the 10th). Figures are NET inc-VAT. Categories mapped from item names
// onto the same 31-category scheme as 2025. Render is bar-only.
//
// Source: plonkgolfltd_plonk-londonfields_transactions_20250901_20260331.csv
export const HACKNEY_2026_TILL_SALES = {
  totalRevenue: 48768,
  totalTxns: 4257,
  lastDate: "2026-03-10",
  months: ["Jan", "Feb", "Mar"],
  monthlyTotals: [11066, 28500, 9203],
  categories: [
    { name: "BEER - DRAUGHT", total: 20680, qty: 6092, monthly: [5175, 11857, 3648] },
    { name: "COCKTAILS - HOUSE", total: 4316, qty: 613, monthly: [756, 2829, 731] },
    { name: "WINE & PROSECCO", total: 3448, qty: 755, monthly: [761, 2196, 492] },
    { name: "POOL - Reservations", total: 3233, qty: 430, monthly: [662, 1945, 627] },
    { name: "BEER & CIDER - BOTTLED", total: 2581, qty: 647, monthly: [517, 1535, 529] },
    { name: "GOLF - Rounds", total: 2567, qty: 394, monthly: [534, 1470, 564] },
    { name: "SPIRITS - TEQUILA & SHOTS", total: 1832, qty: 465, monthly: [337, 1215, 280] },
    { name: "SPIRITS - GIN & VODKA", total: 1801, qty: 496, monthly: [566, 975, 261] },
    { name: "SOFT DRINKS", total: 1527, qty: 674, monthly: [414, 831, 282] },
    { name: "COCKTAILS - CLASSIC", total: 1492, qty: 230, monthly: [393, 758, 341] },
    { name: "ARCADE - Tokens", total: 1126, qty: 299, monthly: [218, 740, 168] },
    { name: "FOOD SIDES", total: 792, qty: 114, monthly: [4, 116, 673] },
    { name: "SPIRITS - RUM & BRANDY", total: 762, qty: 200, monthly: [267, 397, 98] },
    { name: "OTHER - MISC", total: 747, qty: 361, monthly: [73, 456, 218] },
    { name: "SOFT DRINKS - JUICE", total: 709, qty: 258, monthly: [97, 496, 116] },
    { name: "SPIRITS - WHISKEY & BOURBON", total: 332, qty: 83, monthly: [77, 242, 14] },
    { name: "OTHER - BAR SNACKS", total: 278, qty: 176, monthly: [59, 193, 26] },
    { name: "OTHER - TEA & COFFEE", total: 190, qty: 69, monthly: [50, 110, 30] },
    { name: "GOLF + TOKEN BUNDLES", total: 148, qty: 15, monthly: [38, 40, 70] },
    { name: "SPIRITS - LIQUEURS & APERITIFS", total: 124, qty: 38, monthly: [68, 52, 4] },
    { name: "GAME & DRINK BUNDLES", total: 70, qty: 7, monthly: [0, 40, 30] },
    { name: "COCKTAILS - MOCKTAILS", total: 6, qty: 1, monthly: [0, 6, 0] },
    { name: "BEER CANS", total: 4, qty: 1, monthly: [0, 4, 0] },
    { name: "OTHER - ID CHECK", total: 0, qty: 9, monthly: [0, 0, 0] },
  ],
}
