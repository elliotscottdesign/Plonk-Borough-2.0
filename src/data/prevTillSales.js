// ─── Borough Market historic till sales aggregates ─────────────────────
// Source: 5 yearly Goodtill exports (2020-2024) merged into the main
// project workbook. Aggregated by year × category in the
// "Category Aggregates" tab via Apps Script (buildCategoryAggregates).
//
// Years 2020 and 2021 are intentionally excluded — those weren't full
// trading years (Borough opened Oct 2020 + lockdown impact 2021).
// 2022-2024 represent the full 11pm-license trading period.
//
// IMPORTANT — read before using these numbers:
//   • These are sales VOLUME (units sold), not financial revenue.
//   • Many till lines show a 100% discount because pre-booked packages
//     run through the till as £0 sales (the cash was collected up-front
//     via online booking, not on the till). The "zeroLines" / "pctZero"
//     fields capture this.
//   • For actual cash revenue see the monthly trading P&Ls — that's the
//     authoritative source for financial remuneration.
//   • The use case for this data is volume analysis: how many golf
//     tickets did we sell at the till? What does that look like under
//     a price-rise scenario?
// ───────────────────────────────────────────────────────────────────────

// Per-year top categories sorted by units sold (qty), descending.
// Each row: { name, qty, net, total, lines, zeroLines, pctZero }
export const PREV_TILL_SALES = {
  2022: [
    { name: 'BEER & CIDER - BOTTLED',          qty: 9133, net: 34080.72, total: 40888.10, lines: 8745, zeroLines: 943, pctZero: 10.8 },
    { name: 'OTHER - GOLF',                    qty: 2864, net: 25486.89, total: 30590.36, lines: 2792, zeroLines:   2, pctZero:  0.1 },
    { name: 'SOFT DRINKS',                     qty: 2065, net:  3888.45, total:  4669.26, lines: 2029, zeroLines: 189, pctZero:  9.3 },
    { name: 'SPIRITS - GIN & VODKA',           qty: 1473, net:  6504.87, total:  7805.63, lines: 1212, zeroLines: 203, pctZero: 16.7 },
    { name: 'COCKTAILS - HOUSE',               qty: 1219, net: 12382.24, total: 14855.00, lines: 1195, zeroLines:  56, pctZero:  4.7 },
    { name: 'SPIRITS - PREMIXED',              qty: 1169, net:  5327.50, total:  6393.00, lines: 1153, zeroLines: 102, pctZero:  8.8 },
    { name: 'WINE & PROSECCO',                 qty:  716, net:  4041.33, total:  4850.15, lines:  679, zeroLines:  59, pctZero:  8.7 },
    { name: 'SPIRITS - TEQUILA & SHOTS',       qty:  683, net:  1855.08, total:  2226.46, lines:  581, zeroLines: 105, pctZero: 18.1 },
    { name: 'COCKTAILS - CLASSIC',             qty:  451, net:  3680.10, total:  4416.24, lines:  431, zeroLines:  39, pctZero:  9.0 },
    { name: 'SPIRITS - RUM & BRANDY',          qty:  448, net:  2124.35, total:  2549.10, lines:  370, zeroLines:  54, pctZero: 14.6 },
    { name: 'OTHER - GOLF & GAMES',            qty:  346, net:  3252.27, total:  3901.95, lines:  337, zeroLines:   0, pctZero:  0.0 },
    { name: 'COCKTAILS - MOCKTAILS',           qty:  216, net:   955.38, total:  1147.24, lines:  214, zeroLines:   8, pctZero:  3.7 },
    { name: 'SPIRITS - WHISKEY & BOURBON',     qty:  124, net:   715.55, total:   858.83, lines:  119, zeroLines:  11, pctZero:  9.2 },
    { name: 'OTHER - BAR SNACKS',              qty:   99, net:   119.62, total:   143.54, lines:   99, zeroLines:   3, pctZero:  3.0 },
    { name: 'SOFT DRINKS - JUICE',             qty:   80, net:   180.37, total:   216.44, lines:   79, zeroLines:   7, pctZero:  8.9 },
    { name: '(Uncategorised)',                 qty:   59, net:   957.77, total:   957.77, lines:   51, zeroLines:   0, pctZero:  0.0 },
    { name: 'SPIRITS - LIQUEURS & APERITIFS',  qty:   48, net:   184.36, total:   221.25, lines:   37, zeroLines:   5, pctZero: 13.5 },
  ],
  2023: [
    { name: 'BEER & CIDER - BOTTLED',          qty: 18335, net: 71985.73, total: 86404.85, lines: 17474, zeroLines: 1782, pctZero: 10.2 },
    { name: 'OTHER - GOLF',                    qty:  4905, net: 41785.63, total: 50148.60, lines:  4787, zeroLines:    0, pctZero:  0.0 },
    { name: 'COCKTAILS - HOUSE',               qty:  4600, net: 46094.25, total: 55328.12, lines:  4480, zeroLines:  187, pctZero:  4.2 },
    { name: 'SOFT DRINKS',                     qty:  4224, net:  6693.69, total:  8033.22, lines:  4047, zeroLines:  478, pctZero: 11.8 },
    { name: 'SPIRITS - GIN & VODKA',           qty:  3688, net: 19502.97, total: 23403.48, lines:  3122, zeroLines:  380, pctZero: 12.2 },
    { name: 'OTHER - GOLF & GAMES',            qty:  2803, net: 25209.56, total: 30249.20, lines:  2766, zeroLines:   12, pctZero:  0.4 },
    { name: 'WINE & PROSECCO',                 qty:  1856, net: 11284.64, total: 13541.15, lines:  1685, zeroLines:  269, pctZero: 16.0 },
    { name: 'SPIRITS - TEQUILA & SHOTS',       qty:  1787, net:  6493.94, total:  7791.72, lines:  1191, zeroLines:  129, pctZero: 10.8 },
    { name: 'COCKTAILS - CLASSIC',             qty:  1625, net: 13082.06, total: 15694.16, lines:  1517, zeroLines:   94, pctZero:  6.2 },
    { name: 'SPIRITS - RUM & BRANDY',          qty:  1463, net:  7281.79, total:  8738.68, lines:  1163, zeroLines:  198, pctZero: 17.0 },
    { name: 'OTHER - BAR SNACKS',              qty:  1159, net:  1116.86, total:  1337.73, lines:  1017, zeroLines:  168, pctZero: 16.5 },
    { name: 'COCKTAILS - MOCKTAILS',           qty:   930, net:  3823.06, total:  4587.68, lines:   904, zeroLines:  139, pctZero: 15.4 },
    { name: '(Uncategorised)',                 qty:   601, net:  4992.13, total:  5089.74, lines:   523, zeroLines:   12, pctZero:  2.3 },
    { name: 'SPIRITS - WHISKEY & BOURBON',     qty:   556, net:  2902.61, total:  3483.44, lines:   456, zeroLines:   85, pctZero: 18.6 },
    { name: 'SOFT DRINKS - JUICE',             qty:   344, net:   773.17, total:   927.75, lines:   334, zeroLines:   28, pctZero:  8.4 },
    { name: 'SPIRITS - LIQUEURS & APERITIFS',  qty:   194, net:   865.08, total:  1038.17, lines:   143, zeroLines:    9, pctZero:  6.3 },
    { name: 'SPIRITS - G&T',                   qty:   169, net:  1233.66, total:  1481.04, lines:   163, zeroLines:    3, pctZero:  1.8 },
    { name: 'SPIRITS - PREMIXED',              qty:     2, net:    10.00, total:    12.00, lines:     2, zeroLines:    0, pctZero:  0.0 },
  ],
  2024: [
    { name: 'BEER & CIDER - BOTTLED',          qty: 16969, net: 65520.65, total: 78654.04, lines: 15830, zeroLines: 1921, pctZero: 12.1 },
    { name: 'OTHER - GOLF',                    qty:  5791, net: 52244.23, total: 62704.89, lines:  5553, zeroLines:   10, pctZero:  0.2 },
    { name: 'SOFT DRINKS',                     qty:  4456, net:  8129.78, total:  9763.17, lines:  4096, zeroLines:  576, pctZero: 14.1 },
    { name: 'BEER - DRAUGHT',                  qty:  4078, net: 23934.75, total: 28721.94, lines:  3618, zeroLines:  131, pctZero:  3.6 },
    { name: 'OTHER - GOLF & GAMES',            qty:  3894, net: 29839.58, total: 35802.83, lines:  3690, zeroLines:   16, pctZero:  0.4 },
    { name: 'COCKTAILS - HOUSE',               qty:  3565, net: 35470.87, total: 42564.81, lines:  3382, zeroLines:  123, pctZero:  3.6 },
    { name: 'SPIRITS - GIN & VODKA',           qty:  2935, net: 17535.96, total: 21045.64, lines:  2456, zeroLines:  419, pctZero: 17.1 },
    { name: 'WINE & PROSECCO',                 qty:  2890, net: 18487.10, total: 22182.85, lines:  2514, zeroLines:  422, pctZero: 16.8 },
    { name: 'COCKTAILS - CLASSIC',             qty:  1790, net: 16367.10, total: 19640.59, lines:  1712, zeroLines:  131, pctZero:  7.7 },
    { name: 'SPIRITS - TEQUILA & SHOTS',       qty:  1626, net:  5934.46, total:  7120.26, lines:  1050, zeroLines:  169, pctZero: 16.1 },
    { name: 'SPIRITS - RUM & BRANDY',          qty:  1036, net:  6015.27, total:  7219.12, lines:   864, zeroLines:  185, pctZero: 21.4 },
    { name: 'COCKTAILS - MOCKTAILS',           qty:   823, net:  3629.30, total:  4355.17, lines:   795, zeroLines:   82, pctZero: 10.3 },
    { name: 'OTHER - BAR SNACKS',              qty:   791, net:   933.57, total:  1116.99, lines:   748, zeroLines:  107, pctZero: 14.3 },
    { name: 'SPIRITS - WHISKEY & BOURBON',     qty:   484, net:  2910.51, total:  3492.86, lines:   395, zeroLines:   76, pctZero: 19.2 },
    { name: '(Uncategorised)',                 qty:   327, net:  9681.19, total: 10188.35, lines:   255, zeroLines:   25, pctZero:  9.8 },
    { name: 'COCKTAIL INGREDIENTS',            qty:   322, net:  2963.30, total:  3556.19, lines:   318, zeroLines:   13, pctZero:  4.1 },
    { name: 'SOFT DRINKS - JUICE',             qty:   300, net:   570.92, total:   685.09, lines:   288, zeroLines:   59, pctZero: 20.5 },
    { name: 'SPIRITS - LIQUEURS & APERITIFS',  qty:   149, net:   765.25, total:   918.70, lines:   139, zeroLines:   18, pctZero: 12.9 },
    { name: 'FOOD - KIDS SNACKS',              qty:     5, net:    12.50, total:    15.00, lines:     5, zeroLines:    0, pctZero:  0.0 },
  ],
}

// Categories that count as "golf tickets" — surfaced separately on each
// year's view even if they're outside the top 10 by quantity.
export const GOLF_CATEGORIES = ['OTHER - GOLF', 'OTHER - GOLF & GAMES']

export const PREV_TILL_YEARS = [2022, 2023, 2024]

// Compute aggregate totals for a given year's category list.
export function totalsForYear(year) {
  const rows = PREV_TILL_SALES[year] || []
  const totalQty       = rows.reduce((s, r) => s + r.qty, 0)
  const totalNet       = rows.reduce((s, r) => s + r.net, 0)
  const totalLines     = rows.reduce((s, r) => s + r.lines, 0)
  const totalZeroLines = rows.reduce((s, r) => s + r.zeroLines, 0)
  return {
    totalQty,
    totalNet,
    totalLines,
    totalZeroLines,
    pctZero: totalLines ? (totalZeroLines / totalLines) * 100 : 0,
  }
}
