// Stock-order baseline — No Dice Hackney (London Fields).
// Derived from the FEBRUARY 2026 Lightspeed till export (the first clean full
// month after the Jan part-closure reopening). February = 28 days = exactly 4
// weeks, so every "per week" figure below is the month total ÷ 4.
//
// Consumption is gross units SOLD (incl the 316 £0 "Happy Hour" pints, which
// deplete stock, allocated across the taps in proportion to paid volume).
// Draught pints include halves (×0.5). Spirits include a cocktail allowance
// (399 cocktails/mo × ~55ml base spirit) on top of direct 25/50ml measures.
//
// ⚠ February is a QUIET baseline — the venue trades higher into summer. The
// calculator's multiplier scales this up (the "Going into June" preset adds
// ~35%). Re-baseline once a few post-reopening weeks are in.

export const PINT_LITRES = 0.568
export const SPIRIT_BOTTLE_ML = 700
export const WASTAGE = 0.05            // line cleaning / foam / sediment allowance

export const AVG_WEEK_REVENUE = 7232   // £, average full Feb week (28,927 / 4)

// Share of a week's takings by day — Feb 2026 average. Hugely weekend-loaded.
export const DOW_SHARE = [
  { day: 'Mon', share: 0.031 },
  { day: 'Tue', share: 0.041 },
  { day: 'Wed', share: 0.087 },
  { day: 'Thu', share: 0.072 },
  { day: 'Fri', share: 0.231 },
  { day: 'Sat', share: 0.420 },
  { day: 'Sun', share: 0.119 },
]
export const WEEKEND_SHARE = 0.77      // Fri + Sat + Sun

// Draught taps. pintsPerWeek already blends in the allocated Happy-Hour pints.
export const DRAUGHT = [
  { key: 'lager', label: 'Lager',  brand: 'Camden Hells', pintsPerWeek: 342, kegL: 50 },
  { key: 'ipa',   label: 'IPA / Pale', brand: 'House Pale', pintsPerWeek: 135, kegL: 30 },
  { key: 'stout', label: 'Stout',  brand: 'Camden Stout', pintsPerWeek: 39, kegL: 30 },
  { key: 'cider', label: 'Cider',  brand: 'Apple Cider',  pintsPerWeek: 38, kegL: 50 },
]

// Spirits — BY PRODUCT (700ml bottles). `bpw` = bottles/week from the Feb
// DIRECT measures (25/50ml line items). Cocktails draw additional base spirit
// that the till can't split to a brand — see COCKTAIL_BASES. Slow movers, so
// the calculator orders spirits to cover ~4 weeks (a bottle lasts).
export const SPIRITS = [
  { cat: 'Tequila / Mezcal',     name: 'Cazcabel Blanco',         bpw: 0.97 },
  { cat: 'Tequila / Mezcal',     name: 'Madre Mezcal',            bpw: 0.37 },
  { cat: 'Tequila / Mezcal',     name: 'Cazcabel Reposado',       bpw: 0.23 },
  { cat: 'Tequila / Mezcal',     name: 'Cazcabel Coffee',         bpw: 0.07 },
  { cat: 'Tequila / Mezcal',     name: 'Tequila Rose Strawberry', bpw: 0.03 },
  { cat: 'Vodka',                name: 'Absolut Blue',            bpw: 1.20 },
  { cat: 'Vodka',                name: 'Grey Goose',              bpw: 0.02 },
  { cat: 'Gin',                  name: 'Beefeater London Dry',    bpw: 0.56 },
  { cat: 'Gin',                  name: 'Beefeater Orange',        bpw: 0.04 },
  { cat: 'Rum',                  name: 'Cut Spiced Rum',          bpw: 0.22 },
  { cat: 'Rum',                  name: 'Havana Club 3yo White',   bpw: 0.15 },
  { cat: 'Rum',                  name: 'Kraken Black Spiced',     bpw: 0.04 },
  { cat: 'Rum',                  name: 'Havana Especial',         bpw: 0.04 },
  { cat: 'Rum',                  name: 'Wray & Nephew Overproof', bpw: 0.04 },
  { cat: 'Rum',                  name: 'Havana Club 7yo Dark',    bpw: 0.02 },
  { cat: 'Whiskey / Bourbon',    name: 'Jameson Irish',           bpw: 0.17 },
  { cat: 'Whiskey / Bourbon',    name: 'Bulleit Bourbon',         bpw: 0.09 },
  { cat: 'Whiskey / Bourbon',    name: 'Jack Daniels',            bpw: 0.07 },
  { cat: 'Whiskey / Bourbon',    name: 'Four Roses Bourbon',      bpw: 0.06 },
  { cat: 'Whiskey / Bourbon',    name: 'Chivas Regal',            bpw: 0.02 },
  { cat: 'Whiskey / Bourbon',    name: 'Laphroaig 10yo',          bpw: 0.02 },
  { cat: 'Liqueurs / aperitifs', name: 'Antica Classic Sambuca',  bpw: 0.08 },
  { cat: 'Liqueurs / aperitifs', name: 'Disaronno Amaretto',      bpw: 0.06 },
  { cat: 'Liqueurs / aperitifs', name: 'Baileys',                 bpw: 0.05 },
  { cat: 'Liqueurs / aperitifs', name: 'Top Cuvee Vermouth',      bpw: 0.04 },
  { cat: 'Brandy / Cognac',      name: 'Courvoisier VSOP',        bpw: 0.12 },
  { cat: 'Brandy / Cognac',      name: 'Hennessy',                bpw: 0.10 },
  { cat: 'Other',                name: 'Jägermeister',            bpw: 0.05 },
]

// Cocktails consume ~8 bottles/week of base spirit on top of the measures
// above, but the till can't attribute it to a brand — top these up by feel.
export const COCKTAIL_BASES = {
  bottlesPerWeek: 8,
  brands: 'Cazcabel Blanco & Madre Mezcal (margaritas lead), then Beefeater gin, Cut Spiced / Havana rum, Absolut vodka, plus Aperol & Campari for spritzes / negronis. Summer: push more Campari (new Beericano) — order it ahead of demand.',
}

// Soft drinks — BY PRODUCT. Post-mix lines come from BIB syrup (a box lasts
// well over a week); cans/bottles and juice cartons are real order units.
export const SOFTS = [
  { group: 'Post-mix (BIB syrup)', name: 'Coke',                    perWeek: 23.5, unit: 'servings' },
  { group: 'Post-mix (BIB syrup)', name: 'Schweppes Lemonade',      perWeek: 15.0, unit: 'servings' },
  { group: 'Post-mix (BIB syrup)', name: 'Coke Zero',               perWeek: 10.2, unit: 'servings' },
  { group: 'Post-mix (BIB syrup)', name: 'Schweppes Tonic',         perWeek:  6.0, unit: 'servings' },
  { group: 'Cans / bottles',       name: 'Ting',                    perWeek:  5.8, unit: 'cans' },
  { group: 'Cans / bottles',       name: 'Fanta',                   perWeek:  4.8, unit: 'cans' },
  { group: 'Cans / bottles',       name: 'Old Jamaica Ginger Beer', perWeek:  3.2, unit: 'cans' },
  { group: 'Cans / bottles',       name: 'Cherry Coke',             perWeek:  2.5, unit: 'cans' },
  { group: 'Cans / bottles',       name: 'Red Bull',                perWeek:  2.5, unit: 'cans' },
  { group: 'Juice (cartons)',      name: 'Apple Juice',             perWeek:  6.2, unit: 'glasses' },
  { group: 'Juice (cartons)',      name: 'Cranberry Juice',         perWeek:  2.5, unit: 'glasses' },
  { group: 'Juice (cartons)',      name: 'Orange Juice',            perWeek:  2.3, unit: 'glasses' },
  { group: 'Juice (cartons)',      name: 'Pineapple Juice',         perWeek:  1.5, unit: 'glasses' },
]

// Snacks (bar food) — Feb 2026: ~31 packs / £50 of sales per week. The stock
// tracker has no supplier cost (Cost Price column is blank), so snack SPEND is
// estimated at SNACK_COGS of sales until real costs land. Snack *ordering* is on
// the Stock List par sheet (BAR SNACKS); this is for the spend read-out.
export const SNACK_SALES_WEEK = 50
export const SNACK_PACKS_WEEK = 31
export const SNACK_COGS = 0.45            // ≈45% cost of sale — placeholder

// Fruit (garnish) — estimated from Feb drink volumes × standard garnish ratios
// (≈6 wedges/lime, 6/lemon, 5 wheels/orange). Not a till item, so it lives here.
// `unitCost` = rough wholesale £ each. Tune as the menu shifts (Beericano will
// push oranges up over summer).
export const FRUIT = [
  { name: 'Limes',      perWeek: 15, unitCost: 0.15, note: 'margaritas, mojitos, G&Ts, Coronas, soda & lime' },
  { name: 'Lemons',     perWeek:  4, unitCost: 0.20, note: 'sours, lemonade, some G&Ts' },
  { name: 'Oranges',    perWeek:  3, unitCost: 0.25, note: 'negronis, spritzes — Beericano pushes this up for summer' },
  { name: 'Grapefruit', perWeek:  1, unitCost: 0.40, note: 'palomas' },
]

// Scaling presets — multiplier vs the average Feb week.
export const PRESETS = [
  { key: 'quiet',   label: 'Quiet week',      mult: 0.8 },
  { key: 'avg',     label: 'Average (Feb)',   mult: 1.0 },
  { key: 'busy',    label: 'Busy Feb week',   mult: 1.2 },
  { key: 'june',    label: 'Going into June', mult: 1.35 },
]
