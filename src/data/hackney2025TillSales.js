// Hackney 2025 till sales — aggregated from data/hackney_2025_till_sales.csv
// (Goodtill export, COMPLETED orders only, 1 Jan 2025 → 23 Sep 2025).
//
// ⚠ DATA GAP: No till data from 24 Sep 2025 onwards. On that date Hackney
// migrated off Goodtill to Lightspeed. Q4 2025 figures live in Lightspeed
// reports, not in this dataset.
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
    { name: "OTHER - GOLF & GAMES", total: 76772, qty: 12020, monthly: [7947, 9938, 10149, 9943, 10772, 6908, 8035, 9644, 3434] },
    { name: "COCKTAILS - HOUSE", total: 65913, qty: 5984, monthly: [4613, 8345, 7504, 6984, 9064, 7892, 7580, 10888, 3042] },
    { name: "OTHER - GOLF", total: 59266, qty: 5325, monthly: [4812, 5208, 6390, 5496, 6833, 6389, 8194, 12064, 3879] },
    { name: "COCKTAILS - CLASSIC", total: 49579, qty: 4508, monthly: [3947, 4166, 6821, 6936, 6356, 6283, 6269, 6446, 2354] },
    { name: "BEER & CIDER - BOTTLED", total: 46378, qty: 9926, monthly: [4544, 5707, 4781, 4858, 5867, 5579, 5819, 6597, 2626] },
    { name: "WINE & PROSECCO", total: 32470, qty: 3550, monthly: [3406, 3715, 4991, 4515, 4220, 2864, 3245, 3997, 1518] },
    { name: "SPIRITS - GIN & VODKA", total: 28205, qty: 3800, monthly: [3022, 3990, 4007, 3446, 3294, 2845, 2904, 3263, 1435] },
    { name: "SOFT DRINKS", total: 18045, qty: 6922, monthly: [1943, 1840, 1934, 1980, 2199, 2155, 2285, 2671, 1038] },
    { name: "SPIRITS - TEQUILA & SHOTS", total: 13714, qty: 2390, monthly: [1599, 1848, 2383, 1709, 1707, 1066, 1482, 1367, 554] },
    { name: "SPIRITS - RUM & BRANDY", total: 11612, qty: 1453, monthly: [1049, 1615, 1128, 1488, 1583, 1496, 1091, 1750, 413] },
    { name: "SPIRITS - WHISKEY & BOURBON", total: 6227, qty: 810, monthly: [543, 826, 1015, 928, 691, 528, 722, 746, 228] },
    { name: "BEER CANS", total: 5170, qty: 1044, monthly: [792, 490, 631, 524, 622, 558, 678, 579, 297] },
    { name: "COCKTAILS - MOCKTAILS", total: 3905, qty: 716, monthly: [566, 631, 794, 318, 313, 376, 374, 350, 182] },
    { name: "OTHER - MISC", total: 3251, qty: 330, monthly: [132, 111, 288, 485, 596, 392, 294, 828, 125] },
    { name: "OTHER - BAR SNACKS", total: 2852, qty: 1581, monthly: [345, 300, 332, 453, 419, 218, 353, 289, 144] },
    { name: "SPEED PAGE", total: 2377, qty: 389, monthly: [22, 663, 262, 337, 346, 301, 116, 84, 246] },
    { name: "SPIRITS - LIQUEURS & APERITIFS", total: 2176, qty: 392, monthly: [340, 328, 294, 251, 176, 196, 234, 214, 143] },
    { name: "FOOD - HOT DOGS", total: 2159, qty: 236, monthly: [1053, 928, 10, 63, 0, 75, 31, 0, 0] },
    { name: "SOFT DRINKS - JUICE", total: 1921, qty: 724, monthly: [145, 225, 244, 240, 243, 191, 169, 330, 134] },
    { name: "FOOD TACOS", total: 1599, qty: 203, monthly: [594, 1004, 0, 0, 0, 0, 0, 0, 0] },
    { name: "FOOD SIDES", total: 1496, qty: 170, monthly: [573, 901, 0, 0, 0, 23, 0, 0, 0] },
    { name: "Pizza", total: 576, qty: 57, monthly: [0, 0, 0, 0, 0, 253, 323, 0, 0] },
    { name: "COCKTAILS - PRIVATE HIRE", total: 455, qty: 46, monthly: [158, 88, 154, 0, 0, 0, 11, 33, 11] },
    { name: "OTHER - TEA & COFFEE", total: 449, qty: 171, monthly: [131, 99, 70, 56, 27, 0, 21, 18, 27] },
    { name: "COCKTAIL INGREDIENTS", total: 48, qty: 4, monthly: [12, 0, 36, 0, 0, 0, 0, 0, 0] },
    { name: "SPIRITS - PREMIXED", total: 12, qty: 2, monthly: [0, 0, 0, 12, 0, 0, 0, 0, 0] },
    { name: "OTHER - ID CHECK", total: 0, qty: 43, monthly: [0, 0, 0, 0, 0, 0, 0, 0, 0] },
  ],
}
