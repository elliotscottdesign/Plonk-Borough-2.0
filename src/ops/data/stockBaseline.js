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

// Spirits — 700ml bottles/week (direct measures + cocktail allowance folded in).
export const SPIRITS = [
  { key: 'tequila',  label: 'Tequila / Mezcal',           bottlesPerWeek: 5,   note: 'Top seller — Cazcabel + Madre Mezcal, margarita-led menu' },
  { key: 'vodka',    label: 'Vodka',                       bottlesPerWeek: 2,   note: 'Absolut Blue' },
  { key: 'gin',      label: 'Gin',                         bottlesPerWeek: 1.5, note: 'Beefeater + negronis / spritzes' },
  { key: 'rum',      label: 'Rum',                         bottlesPerWeek: 1.5, note: 'Mojitos, daiquiris, coladas' },
  { key: 'whiskey',  label: 'Whiskey / Bourbon',           bottlesPerWeek: 1,   note: 'Sours, old fashioneds' },
  { key: 'liqueurs', label: 'Liqueurs / aperitifs / brandy', bottlesPerWeek: 2, note: 'Aperol, Campari, vermouth, Cointreau, Courvoisier' },
]

// Soft drinks. Mixed order-units, so each carries its own guidance.
export const SOFTS = [
  { key: 'postmix', label: 'Post-mix / fountain', detail: 'Coke, Coke Zero, lemonade, tonic — from the gun', perWeek: 55, unit: 'servings', order: '1 BIB syrup box per line lasts well over a week — just keep Coke + tonic topped up before the weekend' },
  { key: 'cans',    label: 'Cans / bottles',      detail: 'Ting, Fanta, Red Bull, ginger beer, Cherry Coke', perWeek: 19, unit: 'units', order: '~1 mixed case (24) per week' },
  { key: 'juice',   label: 'Juices',              detail: 'Apple, pineapple, cranberry, orange', perWeek: 14, unit: 'units', order: '1–2 cartons of each per week' },
]

// Scaling presets — multiplier vs the average Feb week.
export const PRESETS = [
  { key: 'quiet',   label: 'Quiet week',      mult: 0.8 },
  { key: 'avg',     label: 'Average (Feb)',   mult: 1.0 },
  { key: 'busy',    label: 'Busy Feb week',   mult: 1.2 },
  { key: 'june',    label: 'Going into June', mult: 1.35 },
]
