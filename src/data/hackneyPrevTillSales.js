// ─── Hackney historic till sales aggregates · 2020-2024 ─────────────────
// Source: Goodtill yearly exports merged via Apps Script and aggregated in
// the main Hackney workbook's `Category Aggregates` tab.
//
// Coverage notes:
//   • 2020 — partial year, COVID lockdowns. £63,606 / 4,820 orders.
//   • 2021 — restrictions still active. £162,324 / 11,323 orders.
//   • 2022 — first "normal" year. £178,425 / 13,110 orders.
//   • 2023 — strong growth. £246,351 / 20,468 orders.
//   • 2024 — continued growth. £296,962 / 24,820 orders.
//
// IMPORTANT — read before using these numbers:
//   • Sales VOLUME, not financial revenue. Till totals inc-VAT, post-discount,
//     pre-refund. Diverge from the P&L by VAT layer + restatements.
//   • Zero-priced lines are common (pre-paid online packages, comps, mixers
//     bundled with spirits). pctZero captures this.
//   • For audited revenue see the Weekly Merged 2024-2026 sheet.
//
// (Uncategorised) → OTHER - MISC: rows where the till had a blank Category
// in the source were originally aggregated under "(Uncategorised)". They've
// been folded into the "OTHER - MISC" bucket here so every line falls into
// a real category. The product-level signal needed for a finer split is
// no longer available because the historical Sales Items tab was deleted
// from the project workbook (cell limit) — the source workbooks remain if
// a future re-run with proper Product Name → Category mapping is needed.
// ───────────────────────────────────────────────────────────────────────

export const HACKNEY_PREV_TILL_SALES = {
  2020: [
    { name: "OTHER - MISC"                            , qty:  7062, net:   25803.36, total:   30476.03, lines:  6767, zeroLines:  390, pctZero:   5.8 },
    { name: "BEER - DRAUGHT"                          , qty:  3405, net:   14506.79, total:   17415.39, lines:  3271, zeroLines:   77, pctZero:   2.4 },
    { name: "BEER & CIDER - BOTTLED"                  , qty:   883, net:    2972.90, total:    3568.78, lines:   839, zeroLines:   61, pctZero:   7.3 },
    { name: "OTHER - GOLF & GAMES"                    , qty:   699, net:    5689.19, total:    5751.40, lines:   662, zeroLines:    0, pctZero:   0.0 },
    { name: "SPIRITS - RUM & BRANDY"                  , qty:   345, net:    1562.24, total:    1874.40, lines:   325, zeroLines:   26, pctZero:   8.0 },
    { name: "SOFT DRINKS"                             , qty:   301, net:     646.67, total:     768.40, lines:   289, zeroLines:   14, pctZero:   4.8 },
    { name: "FOOD - HOT DOGS"                         , qty:   169, net:     778.46, total:     857.85, lines:   151, zeroLines:   41, pctZero:  27.2 },
    { name: "OTHER - BAR SNACKS"                      , qty:   153, net:     181.84, total:     211.40, lines:   151, zeroLines:    1, pctZero:   0.7 },
    { name: "SOFT DRINKS - JUICE"                     , qty:   145, net:     265.17, total:     304.00, lines:   142, zeroLines:    9, pctZero:   6.3 },
    { name: "COCKTAILS - HOUSE"                       , qty:   144, net:     911.46, total:    1093.90, lines:   139, zeroLines:    8, pctZero:   5.8 },
    { name: "OTHER - TEA & COFFEE"                    , qty:    83, net:     197.06, total:     207.00, lines:    79, zeroLines:    0, pctZero:   0.0 },
    { name: "SPIRITS - LIQUEURS & APERITIFS"          , qty:    75, net:     334.89, total:     401.80, lines:    74, zeroLines:    0, pctZero:   0.0 },
    { name: "SPIRITS - TEQUILA & SHOTS"               , qty:    70, net:     278.44, total:     334.00, lines:    54, zeroLines:    0, pctZero:   0.0 },
    { name: "SPIRITS - WHISKEY & BOURBON"             , qty:    55, net:     264.16, total:     316.95, lines:    55, zeroLines:    3, pctZero:   5.5 },
    { name: "FOOD - ICE CREAM"                        , qty:     9, net:      23.31, total:      24.50, lines:     9, zeroLines:    0, pctZero:   0.0 },
  ],
  2021: [
    { name: "COCKTAILS - HOUSE"                       , qty:  7386, net:   54075.92, total:   64879.41, lines:  6307, zeroLines:  317, pctZero:   5.0 },
    { name: "OTHER - MISC"                            , qty:  6044, net:   16985.58, total:   19366.95, lines:  5115, zeroLines:  315, pctZero:   6.2 },
    { name: "BEER - DRAUGHT"                          , qty:  4896, net:   20806.28, total:   24975.76, lines:  3594, zeroLines:  168, pctZero:   4.7 },
    { name: "BEER & CIDER - BOTTLED"                  , qty:  2236, net:    7971.13, total:    9559.48, lines:  1745, zeroLines:  115, pctZero:   6.6 },
    { name: "FOOD - HOT DOGS"                         , qty:  1906, net:   11694.09, total:   12483.26, lines:  1687, zeroLines:  107, pctZero:   6.3 },
    { name: "OTHER - GOLF & GAMES"                    , qty:  1330, net:   10984.71, total:   11780.95, lines:  1247, zeroLines:    3, pctZero:   0.2 },
    { name: "SPIRITS - TEQUILA & SHOTS"               , qty:   722, net:    2191.15, total:    2629.51, lines:   397, zeroLines:   80, pctZero:  20.2 },
    { name: "OTHER - BAR SNACKS"                      , qty:   584, net:     848.29, total:     903.10, lines:   550, zeroLines:    8, pctZero:   1.5 },
    { name: "SPIRITS - GIN & VODKA"                   , qty:   564, net:    2774.33, total:    3329.01, lines:   468, zeroLines:   35, pctZero:   7.5 },
    { name: "SOFT DRINKS - JUICE"                     , qty:   469, net:    1245.58, total:    1321.20, lines:   429, zeroLines:   22, pctZero:   5.1 },
    { name: "SPIRITS - RUM & BRANDY"                  , qty:   422, net:    2054.95, total:    2465.65, lines:   321, zeroLines:   26, pctZero:   8.1 },
    { name: "COCKTAILS - MOCKTAILS"                   , qty:   323, net:    1614.86, total:    1732.50, lines:   281, zeroLines:    5, pctZero:   1.8 },
    { name: "SOFT DRINKS"                             , qty:   282, net:     539.81, total:     577.80, lines:   252, zeroLines:    8, pctZero:   3.2 },
    { name: "COCKTAILS - CLASSIC"                     , qty:   234, net:    1675.94, total:    2011.16, lines:   198, zeroLines:   15, pctZero:   7.6 },
    { name: "COCKTAILS - SLUSHIES"                    , qty:   223, net:     959.26, total:    1151.13, lines:   155, zeroLines:   30, pctZero:  19.4 },
    { name: "OTHER - TEA & COFFEE"                    , qty:   187, net:     432.95, total:     462.50, lines:   171, zeroLines:    2, pctZero:   1.2 },
    { name: "FOOD - ICE CREAM"                        , qty:   143, net:     347.17, total:     366.60, lines:   135, zeroLines:    1, pctZero:   0.7 },
    { name: "OLD STOCK"                               , qty:   139, net:     439.36, total:     486.00, lines:   126, zeroLines:   13, pctZero:  10.3 },
    { name: "WINE & PROSECCO"                         , qty:   111, net:     600.86, total:     720.90, lines:   101, zeroLines:   30, pctZero:  29.7 },
    { name: "SPIRITS - WHISKEY & BOURBON"             , qty:   108, net:     429.30, total:     515.25, lines:    69, zeroLines:    7, pctZero:  10.1 },
    { name: "SPIRITS - LIQUEURS & APERITIFS"          , qty:    67, net:     274.92, total:     330.00, lines:    54, zeroLines:    6, pctZero:  11.1 },
    { name: "SPEED PAGE"                              , qty:    36, net:     173.94, total:     208.75, lines:    36, zeroLines:    8, pctZero:  22.2 },
    { name: "SPIRITS - G&T"                           , qty:     5, net:      45.85, total:      55.00, lines:     5, zeroLines:    0, pctZero:   0.0 },
    { name: "OTHER - PLONK PACKS"                     , qty:     1, net:      11.43, total:      12.00, lines:     1, zeroLines:    0, pctZero:   0.0 },
  ],
  2022: [
    { name: "BEER - DRAUGHT"                          , qty:  6674, net:   28145.92, total:   33782.53, lines:  5383, zeroLines:  514, pctZero:   9.5 },
    { name: "COCKTAILS - HOUSE"                       , qty:  4113, net:   31802.70, total:   38153.19, lines:  3606, zeroLines:  538, pctZero:  14.9 },
    { name: "BEER & CIDER - BOTTLED"                  , qty:  3096, net:   11316.81, total:   13562.18, lines:  2811, zeroLines:  341, pctZero:  12.1 },
    { name: "OTHER - MISC"                            , qty:  2923, net:    4131.51, total:    4682.76, lines:  2780, zeroLines:  127, pctZero:   4.6 },
    { name: "OTHER - GOLF & GAMES"                    , qty:  2461, net:   17422.44, total:   20706.04, lines:  2253, zeroLines:   37, pctZero:   1.6 },
    { name: "COCKTAILS - CLASSIC"                     , qty:  1774, net:   12555.98, total:   15067.59, lines:  1542, zeroLines:  201, pctZero:  13.0 },
    { name: "SPIRITS - TEQUILA & SHOTS"               , qty:  1657, net:    4465.15, total:    5358.13, lines:  1101, zeroLines:  239, pctZero:  21.7 },
    { name: "SPIRITS - GIN & VODKA"                   , qty:  1646, net:    7773.73, total:    9328.60, lines:  1387, zeroLines:  170, pctZero:  12.3 },
    { name: "COCKTAILS - SLUSHIES"                    , qty:  1442, net:    8502.12, total:   10202.43, lines:  1237, zeroLines:  195, pctZero:  15.8 },
    { name: "FOOD - HOT DOGS"                         , qty:  1426, net:    7034.40, total:    8297.06, lines:  1255, zeroLines:  164, pctZero:  13.1 },
    { name: "WINE & PROSECCO"                         , qty:   802, net:    3651.63, total:    4381.97, lines:   703, zeroLines:  184, pctZero:  26.2 },
    { name: "SPIRITS - RUM & BRANDY"                  , qty:   791, net:    3606.96, total:    4327.94, lines:   673, zeroLines:  126, pctZero:  18.7 },
    { name: "COCKTAILS - MOCKTAILS"                   , qty:   727, net:    2783.42, total:    3291.81, lines:   679, zeroLines:   93, pctZero:  13.7 },
    { name: "SOFT DRINKS - JUICE"                     , qty:   460, net:    1117.71, total:    1324.35, lines:   428, zeroLines:   13, pctZero:   3.0 },
    { name: "SOFT DRINKS"                             , qty:   444, net:     952.06, total:    1129.50, lines:   432, zeroLines:   33, pctZero:   7.6 },
    { name: "OTHER - BAR SNACKS"                      , qty:   414, net:     516.31, total:     611.30, lines:   387, zeroLines:    3, pctZero:   0.8 },
    { name: "SPIRITS - WHISKEY & BOURBON"             , qty:   266, net:    1284.64, total:    1541.61, lines:   214, zeroLines:   30, pctZero:  14.0 },
    { name: "SPEED PAGE"                              , qty:   197, net:     797.82, total:     957.39, lines:   184, zeroLines:   42, pctZero:  22.8 },
    { name: "SPIRITS - LIQUEURS & APERITIFS"          , qty:   125, net:     496.24, total:     595.51, lines:   101, zeroLines:   20, pctZero:  19.8 },
    { name: "OTHER - TEA & COFFEE"                    , qty:   111, net:     228.39, total:     267.00, lines:    96, zeroLines:    3, pctZero:   3.1 },
    { name: "FOOD - ICE CREAM"                        , qty:    79, net:     185.83, total:     222.00, lines:    72, zeroLines:    4, pctZero:   5.6 },
    { name: "COCKTAILS - PRIVATE HIRE"                , qty:    51, net:      55.84, total:      67.00, lines:    47, zeroLines:   40, pctZero:  85.1 },
    { name: "SPIRITS - G&T"                           , qty:    40, net:     249.77, total:     299.75, lines:    36, zeroLines:    3, pctZero:   8.3 },
    { name: "FOOD SIDES"                              , qty:    32, net:     223.02, total:     267.75, lines:    31, zeroLines:    0, pctZero:   0.0 },
  ],
  2023: [
    { name: "BEER - DRAUGHT"                          , qty: 11561, net:   52581.60, total:   63098.02, lines:  9847, zeroLines:  505, pctZero:   5.1 },
    { name: "OTHER - GOLF & GAMES"                    , qty:  7118, net:   32381.15, total:   38840.71, lines:  6709, zeroLines:   43, pctZero:   0.6 },
    { name: "COCKTAILS - HOUSE"                       , qty:  4322, net:   38073.46, total:   45677.47, lines:  3835, zeroLines:  283, pctZero:   7.4 },
    { name: "BEER & CIDER - BOTTLED"                  , qty:  4079, net:   15478.96, total:   18573.34, lines:  3781, zeroLines:  289, pctZero:   7.6 },
    { name: "OTHER - MISC"                            , qty:  3947, net:    1053.15, total:    1179.74, lines:  3748, zeroLines:  182, pctZero:   4.9 },
    { name: "SPIRITS - GIN & VODKA"                   , qty:  1831, net:    9842.24, total:   11811.42, lines:  1595, zeroLines:  156, pctZero:   9.8 },
    { name: "SPIRITS - TEQUILA & SHOTS"               , qty:  1662, net:    5446.88, total:    6535.08, lines:  1026, zeroLines:  272, pctZero:  26.5 },
    { name: "FOOD - HOT DOGS"                         , qty:  1610, net:   10450.77, total:   12543.02, lines:  1395, zeroLines:  103, pctZero:   7.4 },
    { name: "COCKTAILS - CLASSIC"                     , qty:  1484, net:   11715.95, total:   14057.75, lines:  1290, zeroLines:   67, pctZero:   5.2 },
    { name: "SOFT DRINKS"                             , qty:  1003, net:    1990.42, total:    2388.17, lines:   965, zeroLines:   82, pctZero:   8.5 },
    { name: "SPIRITS - RUM & BRANDY"                  , qty:   843, net:    3990.82, total:    4788.92, lines:   685, zeroLines:  102, pctZero:  14.9 },
    { name: "COCKTAILS - SLUSHIES"                    , qty:   667, net:    4714.58, total:    5657.40, lines:   590, zeroLines:   24, pctZero:   4.1 },
    { name: "OTHER - BAR SNACKS"                      , qty:   636, net:     721.57, total:     865.55, lines:   607, zeroLines:   73, pctZero:  12.0 },
    { name: "WINE & PROSECCO"                         , qty:   592, net:    3638.81, total:    4367.18, lines:   560, zeroLines:   64, pctZero:  11.4 },
    { name: "FOOD SIDES"                              , qty:   544, net:    5031.06, total:    6037.34, lines:   514, zeroLines:   19, pctZero:   3.7 },
    { name: "SPIRITS - WHISKEY & BOURBON"             , qty:   524, net:    2362.29, total:    2834.85, lines:   393, zeroLines:   58, pctZero:  14.8 },
    { name: "COCKTAILS - MOCKTAILS"                   , qty:   442, net:    1821.98, total:    2187.89, lines:   426, zeroLines:   38, pctZero:   8.9 },
    { name: "SOFT DRINKS - JUICE"                     , qty:   319, net:     696.62, total:     835.84, lines:   308, zeroLines:   29, pctZero:   9.4 },
    { name: "SPIRITS - LIQUEURS & APERITIFS"          , qty:   247, net:     937.19, total:    1124.78, lines:   171, zeroLines:   28, pctZero:  16.4 },
    { name: "OTHER - TEA & COFFEE"                    , qty:   220, net:     487.60, total:     585.37, lines:   191, zeroLines:    1, pctZero:   0.5 },
    { name: "SPEED PAGE"                              , qty:   166, net:    1019.90, total:    1224.06, lines:   163, zeroLines:   25, pctZero:  15.3 },
    { name: "COCKTAILS - PRIVATE HIRE"                , qty:    57, net:     145.12, total:     174.10, lines:    44, zeroLines:   27, pctZero:  61.4 },
    { name: "FOOD TACOS"                              , qty:    53, net:     422.38, total:     507.00, lines:    51, zeroLines:    1, pctZero:   2.0 },
    { name: "OTHER - ID CHECK"                        , qty:    44, net:       0.00, total:       0.00, lines:    40, zeroLines:   40, pctZero: 100.0 },
    { name: "BEER CANS"                               , qty:    34, net:     114.47, total:     137.25, lines:    34, zeroLines:    4, pctZero:  11.8 },
    { name: "SPIRITS - G&T"                           , qty:    31, net:     210.28, total:     252.45, lines:    29, zeroLines:    1, pctZero:   3.4 },
    { name: "FOOD - KIDS SNACKS"                      , qty:    23, net:      54.94, total:      66.00, lines:    22, zeroLines:    0, pctZero:   0.0 },
  ],
  2024: [
    { name: "BEER - DRAUGHT"                          , qty: 16406, net:   80071.11, total:   96070.97, lines: 14349, zeroLines:  514, pctZero:   3.6 },
    { name: "OTHER - GOLF & GAMES"                    , qty:  8142, net:   36028.80, total:   43215.90, lines:  7767, zeroLines:   63, pctZero:   0.8 },
    { name: "OTHER - MISC"                            , qty:  4327, net:   19733.90, total:   23538.26, lines:  4085, zeroLines:  250, pctZero:   6.1 },
    { name: "BEER & CIDER - BOTTLED"                  , qty:  4287, net:   16656.71, total:   19987.91, lines:  4090, zeroLines:  390, pctZero:   9.5 },
    { name: "COCKTAILS - CLASSIC"                     , qty:  2348, net:   21189.39, total:   25423.13, lines:  2220, zeroLines:  102, pctZero:   4.6 },
    { name: "COCKTAILS - HOUSE"                       , qty:  2178, net:   18478.22, total:   22167.49, lines:  2022, zeroLines:  190, pctZero:   9.4 },
    { name: "SOFT DRINKS"                             , qty:  1466, net:    3638.19, total:    4366.82, lines:  1429, zeroLines:   72, pctZero:   5.0 },
    { name: "SPIRITS - GIN & VODKA"                   , qty:  1421, net:    8492.84, total:   10192.28, lines:  1246, zeroLines:   73, pctZero:   5.9 },
    { name: "SPIRITS - TEQUILA & SHOTS"               , qty:  1421, net:    7633.02, total:    9159.29, lines:  1041, zeroLines:   73, pctZero:   7.0 },
    { name: "OTHER - BAR SNACKS"                      , qty:   944, net:    1319.64, total:    1581.98, lines:   894, zeroLines:   70, pctZero:   7.8 },
    { name: "FOOD - HOT DOGS"                         , qty:   912, net:    6448.76, total:    7737.75, lines:   828, zeroLines:   47, pctZero:   5.7 },
    { name: "FOOD TACOS"                              , qty:   887, net:    7158.73, total:    8591.70, lines:   825, zeroLines:   62, pctZero:   7.5 },
    { name: "SPIRITS - RUM & BRANDY"                  , qty:   712, net:    4221.70, total:    5066.24, lines:   553, zeroLines:   47, pctZero:   8.5 },
    { name: "FOOD SIDES"                              , qty:   700, net:    5229.64, total:    6274.70, lines:   664, zeroLines:   13, pctZero:   2.0 },
    { name: "BEER CANS"                               , qty:   608, net:    2274.23, total:    2727.37, lines:   594, zeroLines:   44, pctZero:   7.4 },
    { name: "SPIRITS - WHISKEY & BOURBON"             , qty:   458, net:    2794.95, total:    3354.06, lines:   367, zeroLines:   39, pctZero:  10.6 },
    { name: "SOFT DRINKS - JUICE"                     , qty:   331, net:     767.97, total:     921.45, lines:   306, zeroLines:   15, pctZero:   4.9 },
    { name: "COCKTAILS - MOCKTAILS"                   , qty:   283, net:    1129.48, total:    1354.98, lines:   274, zeroLines:   16, pctZero:   5.8 },
    { name: "SPEED PAGE"                              , qty:   209, net:    1228.09, total:    1473.92, lines:   205, zeroLines:   30, pctZero:  14.6 },
    { name: "SPIRITS - LIQUEURS & APERITIFS"          , qty:   190, net:     916.92, total:    1099.95, lines:   165, zeroLines:    8, pctZero:   4.8 },
    { name: "WINE & PROSECCO"                         , qty:   189, net:    1471.70, total:    1766.67, lines:   184, zeroLines:    9, pctZero:   4.9 },
    { name: "COCKTAILS - PRIVATE HIRE"                , qty:   183, net:     557.50, total:     668.80, lines:   141, zeroLines:   85, pctZero:  60.3 },
    { name: "OTHER - TEA & COFFEE"                    , qty:    73, net:     175.74, total:     210.85, lines:    61, zeroLines:    7, pctZero:  11.5 },
    { name: "OTHER - ID CHECK"                        , qty:    40, net:       0.00, total:       0.00, lines:    40, zeroLines:   40, pctZero: 100.0 },
    { name: "OTHER - PLONK PACKS"                     , qty:     3, net:       8.33, total:      10.00, lines:     3, zeroLines:    2, pctZero:  66.7 },
  ],
}

// Year-level summary cards · order count + revenue + category count.
export const HACKNEY_PREV_TILL_YEAR_TOTALS = {
  2020: { orders:  4820, revenue:  63606, categories: 15, note: "Partial year · COVID lockdowns" },
  2021: { orders: 11323, revenue: 162324, categories: 24, note: "Restrictions still active" },
  2022: { orders: 13110, revenue: 178425, categories: 24, note: "First full normal year" },
  2023: { orders: 20468, revenue: 246351, categories: 27, note: "Strong growth · +38%" },
  2024: { orders: 24820, revenue: 296962, categories: 25, note: "Continued growth · +21%" },
}

export const HACKNEY_PREV_TILL_YEARS = [2020, 2021, 2022, 2023, 2024]

// Categories that count as "golf tickets" — surfaced separately on each
// year's view even if they're outside the top 10 by quantity.
export const HACKNEY_GOLF_CATEGORIES = ['OTHER - GOLF', 'OTHER - GOLF & GAMES']

// Compute aggregate totals for a given year's category list.
export function hackneyTotalsForYear(year) {
  const rows = HACKNEY_PREV_TILL_SALES[year] || []
  const totalQty       = rows.reduce((s, r) => s + r.qty, 0)
  const totalNet       = rows.reduce((s, r) => s + r.net, 0)
  const totalGross     = rows.reduce((s, r) => s + r.total, 0)
  const totalLines     = rows.reduce((s, r) => s + r.lines, 0)
  const totalZeroLines = rows.reduce((s, r) => s + r.zeroLines, 0)
  return { totalQty, totalNet, totalGross, totalLines, totalZeroLines,
           pctZero: totalLines > 0 ? totalZeroLines / totalLines * 100 : 0 }
}
