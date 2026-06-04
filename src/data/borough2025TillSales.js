// Borough till sales — 2025 (backfilled to full year).
//
// Jan 3 → 14 Sep 2025: Goodtill export (COMPLETED orders only).
// 16 Sep → 31 Dec 2025: Lightspeed export (plonkgolfltd · London Bridge — the
//   same physical venue, after the mid-Sep 2025 till migration). 15 Sep is the
//   one missing day (the migration cut-over). September is now near-complete:
//   Goodtill (1–14) + Lightspeed (16–30) combined into the one month bar.
//
// Goodtill figures are gross customer payments inc-VAT (after till discounts,
// before refund/comp/restatement). Lightspeed figures are NET inc-VAT — every
// till line netted together (sales minus the voids/comps/corrections that
// reverse them) — i.e. the same "what came through the till" basis.
//
// For the Lightspeed period (Oct–Dec + the Sep tail) categories are derived
// from the Lightspeed SKU product-type code, mapped onto the original 21
// Goodtill categories so the full year reads on one taxonomy. Spirit / cocktail
// sub-splits in that period are best-effort from item names.
//
// `monthly` is a 12-element array aligned to `months` (Jan … Dec).
export const BOROUGH_2025_TILL_SALES = {
  "totalRevenue": 390479,
  "totalTxns": 20821,
  "lastDate": "2025-12-31",
  "months": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  "monthlyTotals": [25205, 32038, 32700, 29273, 31618, 27653, 31056, 38852, 29922, 38047, 34562, 39552],
  "categories": [
    {
      "name": "BEER - DRAUGHT",
      "total": 97264,
      "qty": 18394,
      "monthly": [6124, 8102, 7256, 6723, 6770, 6850, 6504, 7136, 7525, 10563, 9103, 14609]
    },
    {
      "name": "OTHER - GOLF",
      "total": 84181,
      "qty": 7549,
      "monthly": [4812, 5208, 6390, 5496, 6833, 6389, 8194, 12064, 7234, 9453, 7047, 5061]
    },
    {
      "name": "COCKTAILS - HOUSE",
      "total": 46337,
      "qty": 3936,
      "monthly": [2247, 5274, 4542, 3795, 4187, 3334, 3575, 5732, 4413, 4643, 3851, 744]
    },
    {
      "name": "OTHER - GOLF & GAMES",
      "total": 32305,
      "qty": 4040,
      "monthly": [2721, 3716, 3929, 4120, 4716, 2053, 2688, 2176, 1452, 1976, 1639, 1118]
    },
    {
      "name": "BEER & CIDER - BOTTLED",
      "total": 30982,
      "qty": 7628,
      "monthly": [2115, 2475, 2269, 2122, 2118, 2290, 2385, 3033, 2701, 2193, 2883, 4400]
    },
    {
      "name": "COCKTAILS - CLASSIC",
      "total": 20176,
      "qty": 1733,
      "monthly": [1572, 1064, 1862, 1416, 1700, 2178, 2030, 2375, 1721, 1629, 2040, 590]
    },
    {
      "name": "SPIRITS - GIN & VODKA",
      "total": 19613,
      "qty": 3855,
      "monthly": [1627, 1948, 1652, 1386, 1306, 1213, 1595, 1644, 1110, 1561, 1807, 2765]
    },
    {
      "name": "WINE & PROSECCO",
      "total": 19229,
      "qty": 3322,
      "monthly": [1538, 1488, 1825, 1505, 1341, 942, 1191, 976, 1363, 1553, 1813, 3694]
    },
    {
      "name": "SOFT DRINKS",
      "total": 12087,
      "qty": 6259,
      "monthly": [761, 764, 697, 691, 767, 818, 882, 1212, 1066, 1364, 1438, 1628]
    },
    {
      "name": "SPIRITS - RUM & BRANDY",
      "total": 7924,
      "qty": 1651,
      "monthly": [345, 487, 320, 546, 602, 380, 477, 1008, 391, 677, 1180, 1510]
    },
    {
      "name": "SPIRITS - TEQUILA & SHOTS",
      "total": 6841,
      "qty": 1301,
      "monthly": [334, 453, 601, 377, 571, 339, 502, 427, 331, 814, 460, 1631]
    },
    {
      "name": "SPIRITS - WHISKEY & BOURBON",
      "total": 4602,
      "qty": 921,
      "monthly": [165, 344, 260, 434, 171, 143, 254, 322, 195, 264, 573, 1477]
    },
    {
      "name": "OTHER - MISC",
      "total": 2486,
      "qty": 219,
      "monthly": [178, 18, 193, 238, 250, 100, 84, 360, 20, 773, 273, 0]
    },
    {
      "name": "COCKTAILS - MOCKTAILS",
      "total": 2414,
      "qty": 424,
      "monthly": [396, 384, 552, 120, 137, 84, 156, 174, 128, 152, 100, 31]
    },
    {
      "name": "OTHER - BAR SNACKS",
      "total": 1177,
      "qty": 743,
      "monthly": [92, 171, 74, 87, 54, 58, 56, 54, 119, 140, 148, 123]
    },
    {
      "name": "SOFT DRINKS - JUICE",
      "total": 1070,
      "qty": 398,
      "monthly": [45, 95, 81, 66, 73, 75, 33, 99, 92, 148, 115, 148]
    },
    {
      "name": "SPIRITS - LIQUEURS & APERITIFS",
      "total": 985,
      "qty": 247,
      "monthly": [119, 47, 160, 76, 24, 80, 97, 59, 61, 145, 93, 25]
    },
    {
      "name": "Pizza",
      "total": 576,
      "qty": 57,
      "monthly": [0, 0, 0, 0, 0, 253, 323, 0, 0, 0, 0, 0]
    },
    {
      "name": "FOOD - HOT DOGS",
      "total": 169,
      "qty": 23,
      "monthly": [0, 0, 0, 63, 0, 75, 31, 0, 0, 0, 0, 0]
    },
    {
      "name": "COCKTAIL INGREDIENTS",
      "total": 48,
      "qty": 4,
      "monthly": [12, 0, 36, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    },
    {
      "name": "SPIRITS - PREMIXED",
      "total": 12,
      "qty": 2,
      "monthly": [0, 0, 0, 12, 0, 0, 0, 0, 0, 0, 0, 0]
    },
  ]
}

// Borough's discount picture is dramatically lighter than Hackney's — 1.14%
// of gross vs Hackney 6.24%, and 3.0% of orders touched a discount vs Hackney
// 6.2%. The user confirmed the venue did not run formal happy-hour / 2-for-1
// programmes — what little discounting exists is a mix of named comp/event
// rings (Tuesday-night events, named-staff comps) and ad-hoc free pours.
export const BOROUGH_2025_DISCOUNTS = {
  "totalGross": 263588,
  "totalDiscount": 3017.9,
  "discountRate": 1.14,
  "totalOrders": 14091,
  "discountedOrders": 425,
  "discountedOrderPct": 3.0,
  "avgDiscountPerDiscountedOrder": 7.1,
  "monthly": [
    {
      "month": "Jan",
      "gross": 25205,
      "discount": 183.54,
      "rate": 0.73
    },
    {
      "month": "Feb",
      "gross": 32038,
      "discount": 233.13,
      "rate": 0.73
    },
    {
      "month": "Mar",
      "gross": 32700,
      "discount": 302.33,
      "rate": 0.92
    },
    {
      "month": "Apr",
      "gross": 29273,
      "discount": 391.85,
      "rate": 1.34
    },
    {
      "month": "May",
      "gross": 31618,
      "discount": 955.83,
      "rate": 3.02
    },
    {
      "month": "Jun",
      "gross": 27653,
      "discount": 424.42,
      "rate": 1.53
    },
    {
      "month": "Jul",
      "gross": 31056,
      "discount": 297.48,
      "rate": 0.96
    },
    {
      "month": "Aug",
      "gross": 38852,
      "discount": 186.34,
      "rate": 0.48
    },
    {
      "month": "Sep",
      "gross": 15193,
      "discount": 42.98,
      "rate": 0.28
    }
  ],
  "categories": [
    {
      "name": "OTHER - GOLF",
      "gross": 59266,
      "discount": 167.27,
      "rate": 0.28
    },
    {
      "name": "BEER - DRAUGHT",
      "gross": 59356,
      "discount": 107.17,
      "rate": 0.18
    },
    {
      "name": "COCKTAILS - HOUSE",
      "gross": 34654,
      "discount": 94.45,
      "rate": 0.27
    },
    {
      "name": "SPIRITS - GIN & VODKA",
      "gross": 12880,
      "discount": 65.12,
      "rate": 0.51
    },
    {
      "name": "OTHER - GOLF & GAMES",
      "gross": 26918,
      "discount": 43.35,
      "rate": 0.16
    },
    {
      "name": "BEER & CIDER - BOTTLED",
      "gross": 20167,
      "discount": 36.15,
      "rate": 0.18
    },
    {
      "name": "COCKTAILS - CLASSIC",
      "gross": 15275,
      "discount": 35.56,
      "rate": 0.23
    },
    {
      "name": "WINE & PROSECCO",
      "gross": 11444,
      "discount": 32.48,
      "rate": 0.28
    },
    {
      "name": "SPIRITS - TEQUILA & SHOTS",
      "gross": 3755,
      "discount": 13.92,
      "rate": 0.37
    },
    {
      "name": "SPIRITS - RUM & BRANDY",
      "gross": 4316,
      "discount": 10.95,
      "rate": 0.25
    },
    {
      "name": "SOFT DRINKS",
      "gross": 7097,
      "discount": 7.5,
      "rate": 0.11
    },
    {
      "name": "SPIRITS - WHISKEY & BOURBON",
      "gross": 2191,
      "discount": 6.22,
      "rate": 0.28
    },
    {
      "name": "SPIRITS - LIQUEURS & APERITIFS",
      "gross": 669,
      "discount": 5.72,
      "rate": 0.85
    },
    {
      "name": "OTHER - MISC",
      "gross": 1440,
      "discount": 4.0,
      "rate": 0.28
    },
    {
      "name": "Pizza",
      "gross": 576,
      "discount": 4.0,
      "rate": 0.69
    },
    {
      "name": "OTHER - BAR SNACKS",
      "gross": 673,
      "discount": 2.04,
      "rate": 0.3
    },
    {
      "name": "COCKTAILS - MOCKTAILS",
      "gross": 2081,
      "discount": 1.28,
      "rate": 0.06
    },
    {
      "name": "SOFT DRINKS - JUICE",
      "gross": 600,
      "discount": 1.21,
      "rate": 0.2
    },
    {
      "name": "FOOD - HOT DOGS",
      "gross": 169,
      "discount": 1.21,
      "rate": 0.71
    },
    {
      "name": "COCKTAIL INGREDIENTS",
      "gross": 48,
      "discount": 0.0,
      "rate": 0.0
    },
    {
      "name": "SPIRITS - PREMIXED",
      "gross": 12,
      "discount": 0.0,
      "rate": 0.0
    }
  ]
}

// Borough-specific addition: `namedEvents` lists till lines where staff rang
// in a named tag (an event night, a person's name) instead of a real product.
// Per the user this is how Borough's comp / event behaviour shows up — these
// aren't promo codes per se, but they're the dominant discount-shaped pattern
// here since formal 2-for-1 deals barely exist.
export const BOROUGH_2025_DISCOUNT_CODES = {
  "note": "Goodtill records the £ amount of each discount and a free-text staff note — it does NOT store a named campaign / promo code. Borough used very few 2-for-1 or happy-hour deals; the dominant pattern is named comp / event entries (Tuesday-night events, named-staff comps).",
  "promotionColumn": [],
  "freeMixers": [
    {
      "name": "Corona Extra",
      "rows": 156,
      "units": 226
    },
    {
      "name": "Camden Hells Pnt",
      "rows": 106,
      "units": 119
    },
    {
      "name": "Lucky Buddha",
      "rows": 87,
      "units": 155
    },
    {
      "name": "Beefeater London Dry Gin - Single",
      "rows": 63,
      "units": 85
    },
    {
      "name": "Budweiser",
      "rows": 53,
      "units": 61
    },
    {
      "name": "Corona Cero",
      "rows": 51,
      "units": 56
    },
    {
      "name": "Absolute Blue - Single",
      "rows": 39,
      "units": 56
    },
    {
      "name": "Diet Coke - Half Pint",
      "rows": 38,
      "units": 185
    },
    {
      "name": "Coke - Half Pint",
      "rows": 33,
      "units": 53
    },
    {
      "name": "Stella Unfiltered",
      "rows": 33,
      "units": 37
    }
  ],
  "onePoundMixers": [
    {
      "name": "Soda & Lime",
      "rows": 67,
      "units": 69
    },
    {
      "name": "MISC",
      "rows": 3,
      "units": 3
    },
    {
      "name": "Garlic Mayo",
      "rows": 1,
      "units": 3
    }
  ],
  "magnitudeBuckets": [
    {
      "bucket": "< 25%",
      "rows": 25,
      "value": 26.23
    },
    {
      "bucket": "25–50%",
      "rows": 2,
      "value": 4.0
    },
    {
      "bucket": "50–100% (BOGOF / 2-for-1)",
      "rows": 3,
      "value": 46.89
    }
  ],
  "namedEvents": [
    {
      "name": "Tuesday",
      "rows": 4,
      "units": 7,
      "total": 84.0
    },
    {
      "name": "Cero",
      "rows": 1,
      "units": 1,
      "total": 5.0
    },
    {
      "name": "Julie",
      "rows": 1,
      "units": 1,
      "total": 145.0
    }
  ]
}
