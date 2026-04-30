// Borough 2025 till sales — aggregated from data/borough_2025_till_sales.csv
// (Goodtill export, COMPLETED orders only, 3 Jan 2025 → 14 Sep 2025).
//
// ⚠ DATA GAP: No till data from 15 Sep 2025 onwards. Borough migrated off
// Goodtill to Lightspeed shortly after this date — Q4 2025 figures live in
// Lightspeed reports, not in this dataset.
//
// Categories are sorted descending by total revenue. `monthly` is a 9-element
// array aligned to `months` (Jan … Sep). The Sep figure is partial — only
// 14 days, hence the visual 'data ends here' treatment in the chart.
//
// Source CSV: 32,156 rows · 31,617 COMPLETED · £263,588 inc-VAT · 14,091
// transactions (unique Sale IDs). 141 previously-blank Category cells were
// filled per the cleanup playbook (38 by Product Name → Category lookup, 103
// by MISC-by-order-context fallback).
export const BOROUGH_2025_TILL_SALES = {
  "totalRevenue": 263588,
  "totalTxns": 14091,
  "lastDate": "2025-09-14",
  "months": [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep"
  ],
  "monthlyTotals": [
    25205,
    32038,
    32700,
    29273,
    31618,
    27653,
    31056,
    38852,
    15193
  ],
  "categories": [
    {
      "name": "BEER - DRAUGHT",
      "total": 59356,
      "qty": 8466,
      "monthly": [
        6124,
        8102,
        7256,
        6723,
        6770,
        6850,
        6504,
        7136,
        3892
      ]
    },
    {
      "name": "OTHER - GOLF",
      "total": 59266,
      "qty": 5324,
      "monthly": [
        4812,
        5208,
        6390,
        5496,
        6833,
        6389,
        8194,
        12064,
        3879
      ]
    },
    {
      "name": "COCKTAILS - HOUSE",
      "total": 34654,
      "qty": 2925,
      "monthly": [
        2247,
        5274,
        4542,
        3795,
        4187,
        3334,
        3575,
        5732,
        1968
      ]
    },
    {
      "name": "OTHER - GOLF & GAMES",
      "total": 26918,
      "qty": 3122,
      "monthly": [
        2721,
        3716,
        3929,
        4120,
        4716,
        2053,
        2688,
        2176,
        799
      ]
    },
    {
      "name": "BEER & CIDER - BOTTLED",
      "total": 20167,
      "qty": 4414,
      "monthly": [
        2115,
        2475,
        2269,
        2122,
        2118,
        2290,
        2385,
        3033,
        1362
      ]
    },
    {
      "name": "COCKTAILS - CLASSIC",
      "total": 15275,
      "qty": 1326,
      "monthly": [
        1572,
        1064,
        1862,
        1416,
        1700,
        2178,
        2030,
        2375,
        1079
      ]
    },
    {
      "name": "SPIRITS - GIN & VODKA",
      "total": 12880,
      "qty": 1682,
      "monthly": [
        1627,
        1948,
        1652,
        1386,
        1306,
        1213,
        1595,
        1644,
        509
      ]
    },
    {
      "name": "WINE & PROSECCO",
      "total": 11444,
      "qty": 1233,
      "monthly": [
        1538,
        1488,
        1825,
        1505,
        1341,
        942,
        1191,
        976,
        638
      ]
    },
    {
      "name": "SOFT DRINKS",
      "total": 7097,
      "qty": 3196,
      "monthly": [
        761,
        764,
        697,
        691,
        767,
        818,
        882,
        1212,
        505
      ]
    },
    {
      "name": "SPIRITS - RUM & BRANDY",
      "total": 4316,
      "qty": 530,
      "monthly": [
        345,
        487,
        320,
        546,
        602,
        380,
        477,
        1008,
        150
      ]
    },
    {
      "name": "SPIRITS - TEQUILA & SHOTS",
      "total": 3755,
      "qty": 693,
      "monthly": [
        334,
        453,
        601,
        377,
        571,
        339,
        502,
        427,
        150
      ]
    },
    {
      "name": "SPIRITS - WHISKEY & BOURBON",
      "total": 2191,
      "qty": 263,
      "monthly": [
        165,
        344,
        260,
        434,
        171,
        143,
        254,
        322,
        97
      ]
    },
    {
      "name": "COCKTAILS - MOCKTAILS",
      "total": 2081,
      "qty": 363,
      "monthly": [
        396,
        384,
        552,
        120,
        137,
        84,
        156,
        174,
        78
      ]
    },
    {
      "name": "OTHER - MISC",
      "total": 1440,
      "qty": 104,
      "monthly": [
        178,
        18,
        193,
        238,
        250,
        100,
        84,
        360,
        20
      ]
    },
    {
      "name": "OTHER - BAR SNACKS",
      "total": 673,
      "qty": 359,
      "monthly": [
        92,
        171,
        74,
        87,
        54,
        58,
        56,
        54,
        26
      ]
    },
    {
      "name": "SPIRITS - LIQUEURS & APERITIFS",
      "total": 669,
      "qty": 107,
      "monthly": [
        119,
        47,
        160,
        76,
        24,
        80,
        97,
        59,
        7
      ]
    },
    {
      "name": "SOFT DRINKS - JUICE",
      "total": 600,
      "qty": 225,
      "monthly": [
        45,
        95,
        81,
        66,
        73,
        75,
        33,
        99,
        33
      ]
    },
    {
      "name": "Pizza",
      "total": 576,
      "qty": 57,
      "monthly": [
        0,
        0,
        0,
        0,
        0,
        253,
        323,
        0,
        0
      ]
    },
    {
      "name": "FOOD - HOT DOGS",
      "total": 169,
      "qty": 23,
      "monthly": [
        0,
        0,
        0,
        63,
        0,
        75,
        31,
        0,
        0
      ]
    },
    {
      "name": "COCKTAIL INGREDIENTS",
      "total": 48,
      "qty": 4,
      "monthly": [
        12,
        0,
        36,
        0,
        0,
        0,
        0,
        0,
        0
      ]
    },
    {
      "name": "SPIRITS - PREMIXED",
      "total": 12,
      "qty": 2,
      "monthly": [
        0,
        0,
        0,
        12,
        0,
        0,
        0,
        0,
        0
      ]
    }
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
