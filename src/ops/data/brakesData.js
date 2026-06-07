// Brakes perishables — parsed from 31 invoices (Jun 2025 – Mar 2026).
// Real fruit/veg/garnish/sundry order history. Forecast ratios derived by
// cross-referencing monthly usage with Lightspeed cocktails + drink sales:
// fruit & veg ≈ 0.77% of drink sales; limes ≈ 11 kg per 100 cocktails.
export const BRAKES = {
  "meta": {
    "span": "2025-06 \u2192 2026-03",
    "orders": 31,
    "months": 10,
    "totalSpend": 2480.74,
    "weekly": 57.29,
    "monthly": 248.07,
    "fruitVegWeekly": 42.05
  },
  "categories": [
    {
      "name": "Fruit \u00b7 citrus",
      "spend": 1272.02,
      "pct": 51.3,
      "weekly": 29.38
    },
    {
      "name": "Garnish veg",
      "spend": 413.11,
      "pct": 16.7,
      "weekly": 9.54
    },
    {
      "name": "Coffee / tea / milk",
      "spend": 207.27,
      "pct": 8.4,
      "weekly": 4.79
    },
    {
      "name": "Mixers / soft (resale)",
      "spend": 203.98,
      "pct": 8.2,
      "weekly": 4.71
    },
    {
      "name": "Sundries / seasoning",
      "spend": 180.12,
      "pct": 7.3,
      "weekly": 4.16
    },
    {
      "name": "Spirits",
      "spend": 68.76,
      "pct": 2.8,
      "weekly": 1.59
    },
    {
      "name": "Fruit \u00b7 other",
      "spend": 64.81,
      "pct": 2.6,
      "weekly": 1.5
    },
    {
      "name": "Herbs",
      "spend": 53.1,
      "pct": 2.1,
      "weekly": 1.23
    },
    {
      "name": "Fruit \u00b7 citrus (juice)",
      "spend": 17.57,
      "pct": 0.7,
      "weekly": 0.41
    }
  ],
  "monthly": [
    {
      "month": "2025-06",
      "spend": 112.99
    },
    {
      "month": "2025-07",
      "spend": 447.86
    },
    {
      "month": "2025-08",
      "spend": 336.54
    },
    {
      "month": "2025-09",
      "spend": 227.14
    },
    {
      "month": "2025-10",
      "spend": 307.53
    },
    {
      "month": "2025-11",
      "spend": 347.77
    },
    {
      "month": "2025-12",
      "spend": 287.07
    },
    {
      "month": "2026-01",
      "spend": 80.65
    },
    {
      "month": "2026-02",
      "spend": 229.75
    },
    {
      "month": "2026-03",
      "spend": 103.44
    }
  ],
  "topItems": [
    {
      "name": "Large Limes",
      "spend": 740.98,
      "qty": 89,
      "pack": "1 x 4kg",
      "orders": 21
    },
    {
      "name": "Limes",
      "spend": 309.15,
      "qty": 32,
      "pack": "1 x 4kg",
      "orders": 8
    },
    {
      "name": "Equinox Organic Fiery Ginger Kombucha *",
      "spend": 176.6,
      "qty": 15,
      "pack": "12 x 250ml",
      "orders": 10
    },
    {
      "name": "Coca-Cola Cherry 330ml Can *",
      "spend": 94.7,
      "qty": 6,
      "pack": "24 x 330ml",
      "orders": 5
    },
    {
      "name": "Absolut Blue Vodka 40% (Sweden) *",
      "spend": 68.76,
      "qty": 4,
      "pack": "1 x 70cl",
      "orders": 2
    },
    {
      "name": "Lemons",
      "spend": 68.63,
      "qty": 19,
      "pack": "1 x 20",
      "orders": 17
    },
    {
      "name": "Medium Oranges",
      "spend": 64.98,
      "qty": 23,
      "pack": "1 x 10",
      "orders": 18
    },
    {
      "name": "Cucumbers CLASS II",
      "spend": 63.63,
      "qty": 9,
      "pack": "1x5kg",
      "orders": 7
    },
    {
      "name": "MOMA Barista Professional Oat Milk",
      "spend": 61.0,
      "qty": 3,
      "pack": "12 x 1ltr",
      "orders": 3
    },
    {
      "name": "Schweppes Slimline Tonic Water 150ml Can *",
      "spend": 54.53,
      "qty": 6,
      "pack": "24 x 150ml",
      "orders": 6
    },
    {
      "name": "Minor Figures Barista Oat",
      "spend": 50.41,
      "qty": 5,
      "pack": "6 x 1ltr",
      "orders": 5
    },
    {
      "name": "eGreen Red Paper Barber Straw *",
      "spend": 45.22,
      "qty": 14,
      "pack": "1 x 250",
      "orders": 6
    },
    {
      "name": "Amoy Coconut Milk 400ml",
      "spend": 44.2,
      "qty": 2,
      "pack": "12 x 400ml",
      "orders": 2
    },
    {
      "name": "Maldon Sea Salt Flakes 570g",
      "spend": 39.25,
      "qty": 7,
      "pack": "1 x 570g",
      "orders": 5
    }
  ],
  "forecast": {
    "fruitVegPctOfDrinkSales": 0.0077,
    "limesKgPer100Cocktails": 11.0,
    "limeGrams": 67
  }
}
