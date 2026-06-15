// ─── No Dice Stock Costing — live margin sheet ─────────────────────────
// Seeded from the No Dice Menu (June 26 2026) + the Lightspeed till
// categories. Two data layers:
//
//   1. INGREDIENTS — every raw thing the bar buys (spirits, kegs, cans,
//      wine bottles, soft drinks, mixers, garnishes). Each has a pack
//      size and a default ex-VAT cost. The default is an industry
//      ballpark so the founder can see margins computing immediately;
//      every cost is overridable in the UI and saved to localStorage.
//
//   2. RECIPES — every line on the menu. Each lists its ingredients and
//      the volume in ml (or count for garnish-y items). Margin engine
//      walks the recipe, multiplies by cost-per-ml, sums.
//
// All prices/margins shown in the UI are computed live from these two
// layers + any overrides. To add an item: append to INGREDIENTS, then
// add a RECIPE that points at the ingredient id.
//
// VAT: menu prices are INC-VAT (20% standard). Margin is computed on
// the NET sell price so the comparison vs cost (also ex-VAT) is honest.
//
// SOURCE OF DEFAULTS: where an ingredient row has a `supplierProduct`
// field it is priced off the Drinks Club 26-27 wholesale list (live
// per-unit invoice price ex-VAT). Items without a supplierProduct
// keep an industry-ballpark default — those are the ones to chase
// invoices for first. Case-pack items (Corona / Asahi / Bud / Lucky
// Saint / Ting / Red Bull / Fanta etc.) are stored as per-bottle cost
// = case price ÷ 24, so the cost-per-serve maths stays per-ml.
// ───────────────────────────────────────────────────────────────────────

export const VAT_RATE = 0.20

// Standard UK measures used by the recipes below.
export const POUR = {
  SPIRIT_SINGLE: 25,    // ml
  SPIRIT_DOUBLE: 50,
  LIQUEUR: 20,
  VERMOUTH: 25,
  WINE_125: 125,
  WINE_175: 175,
  WINE_250: 250,
  PINT: 568,
  HALF: 284,
  CAN_330: 330,
  CAN_440: 440,
  CAN_500: 500,
  SODA_SPLASH: 100,
}

// ───────────────────────────────────────────────────────────────────────
// INGREDIENTS — id, display name, pack size in ml (or 1 if "each"),
// default ex-VAT cost in £, and the supplier hint for ordering.
// Costs are 2026 wholesale ballparks; override per row in the UI.
// ───────────────────────────────────────────────────────────────────────
export const INGREDIENTS = {
  // ─── Spirits — bottles 700ml unless noted ──────────────────────────
  // ─── Spirits ─ Drinks Club 26-27 price list ────────────────────────
  'tequila-silver':       { name: 'Silver Tequila',      packMl: 700, defaultCost: 25.27, supplier: 'Drinks Club', supplierProduct: 'Olmeca Altos Plata 700ml (SPT5OLAPL)' },
  'tequila-reposado':     { name: 'Tequila Reposado',    packMl: 700, defaultCost: 28.87, supplier: 'Drinks Club', supplierProduct: 'Olmeca Altos Reposado 700ml (SPT5OLAPE)' },
  'mezcal-vida':          { name: 'Vida Mezcal',         packMl: 700, defaultCost: 33.50, supplier: 'Drinks Club', supplierProduct: 'Del Maguey Mezcal Vida 700ml 42% (SPM7DEMVI)' },
  'mezcal-house':         { name: 'House Mezcal',        packMl: 700, defaultCost: 40.11, supplier: 'Drinks Club', supplierProduct: 'Madre Mezcal Espadin 700ml (SPM7MADES)' },
  'cachaca':              { name: 'Cachaça',             packMl: 700, defaultCost: 16.43, supplier: 'Drinks Club', supplierProduct: 'Velho Barreiro Cachaca 700ml (SPC7VEBCA)' },
  'rum-havana-especial':  { name: 'Havana Especial',     packMl: 700, defaultCost: 15.65, supplier: 'Drinks Club', supplierProduct: 'Havana Club Anejo Especial 700ml (SPR7HACAE)' },
  'rum-wray-nephew':      { name: 'Wray & Nephew',       packMl: 700, defaultCost: 25.05, supplier: 'Drinks Club', supplierProduct: 'Wray & Nephew White Overproof 700ml (SPR7WRNWO)' },
  'bourbon':              { name: 'Bourbon',             packMl: 700, defaultCost: 19.74, supplier: 'Drinks Club', supplierProduct: 'Four Roses Yellow Label 700ml (SPW7FORYL)' },
  'whiskey-house':        { name: 'House Whiskey',       packMl: 700, defaultCost: 19.76, supplier: 'Drinks Club', supplierProduct: 'Jameson 700ml (SPW7JAM)' },

  // ─── Liqueurs / aperitifs ─────────────────────────────────────────
  // ─── Liqueurs / aperitifs ─ Drinks Club 26-27 ─────────────────────
  'triple-sec':           { name: 'Triple Sec',          packMl: 700, defaultCost: 10.26, supplier: 'Drinks Club', supplierProduct: 'Blend Triple Sec 700ml (LI7BLETS)' },
  'kahlua':               { name: 'Kahlúa',              packMl: 700, defaultCost: 12.13, supplier: 'Drinks Club', supplierProduct: 'Kahlua Coffee Liqueur 700ml (LI7KAHCL)' },
  'baileys':              { name: 'Baileys',             packMl: 700, defaultCost: 12.54, supplier: 'Drinks Club', supplierProduct: 'Baileys Original Irish Cream 700ml (LI7BAIOR)' },
  // St Germain on the Drinks Club list is 700ml (not 500ml as previously assumed).
  'st-germain':           { name: 'St Germain',          packMl: 700, defaultCost: 24.80, supplier: 'Drinks Club', supplierProduct: 'St Germain 700ml (LI7STG)' },
  // Green Chartreuse not on the Drinks Club Jun-26 list — keep ballpark default.
  'chartreuse-green':     { name: 'Green Chartreuse',    packMl: 700, defaultCost: 48.00, supplier: 'Drinks Club' },
  'campari':              { name: 'Campari',             packMl: 700, defaultCost: 14.47, supplier: 'Drinks Club', supplierProduct: 'Campari 700ml (LI7CAM)' },
  'amaro':                { name: 'Amaro',               packMl: 700, defaultCost: 16.33, supplier: 'Drinks Club', supplierProduct: 'Amaro Montenegro 700ml (VA7AMMLI)' },
  'cynar':                { name: 'Cynar',               packMl: 700, defaultCost: 13.39, supplier: 'Drinks Club', supplierProduct: 'Cynar Liqueur 700ml (LI7CYN)' },
  'limoncello':           { name: 'Limoncello',          packMl: 700, defaultCost: 14.79, supplier: 'Drinks Club', supplierProduct: 'Luxardo Limoncello 700ml (LI7LUXLI)' },
  // Devil's Botany Chocolate Absinthe listed on Drinks Club but no price — keep ballpark.
  'absinthe-chocolate':   { name: 'Chocolate Absinthe',  packMl: 700, defaultCost: 35.00, supplier: 'Drinks Club', supplierProduct: "Devil's Botany Chocolate Absinthe 700ml — price TBC" },
  // Vermut now sized to the 1L El Bandarra bottle (was 750ml).
  'vermut':               { name: 'Vermut',              packMl: 1000, defaultCost: 15.82, supplier: 'Drinks Club', supplierProduct: 'El Bandarra Al Fresco 1000ml (VA7ELBAF)' },
  'vermouth-sweet':       { name: 'Sweet Vermouth',      packMl: 750, defaultCost: 9.43, supplier: 'Drinks Club', supplierProduct: 'Martini Rosso 750ml (VE7MARRO)' },
  'vermouth-dry':         { name: 'Dry Vermouth',        packMl: 750, defaultCost: 9.87, supplier: 'Drinks Club', supplierProduct: 'Martini Extra Dry 750ml (VE7MARED)' },

  // ─── Draught kegs ─ Drinks Club 26-27 (Camden Ink keg is 30L) ────
  'keg-camden-hells':     { name: 'Camden Hells (keg)',    packMl: 50000, defaultCost: 142.28, supplier: 'Drinks Club', supplierProduct: 'Camden Hells Lager Keg 50L (BR50CAMHLKE)' },
  'keg-camden-stout':     { name: 'Camden Stout (keg)',    packMl: 30000, defaultCost:  84.42, supplier: 'Drinks Club', supplierProduct: 'Camden Ink Stout Keg 30L (BR30CAMINKE)' },
  // SoCal IPA not on the Drinks Club Jun-26 sheet — ballpark default kept.
  'keg-socal-ipa':        { name: 'SoCal IPA (keg)',       packMl: 50000, defaultCost: 180.00, supplier: 'Drinks Club' },
  // Umbrella Cider not specifically listed; Red Fin Fresh Apple is the closest comparable.
  'keg-umbrella-cider':   { name: 'Umbrella Cider (keg)',  packMl: 50000, defaultCost: 118.04, supplier: 'Drinks Club', supplierProduct: 'Red Fin Fresh Apple Keg 50L (BR50REFFAKEG) — used as comparable' },

  // ─── Bottles / cans ─ Drinks Club prices are per CASE OF 24, divided here to per-unit ──
  'btl-corona':           { name: 'Corona 330ml',           packMl: 330, defaultCost: 1.13, supplier: 'Drinks Club', supplierProduct: 'Corona Extra Glass 330ml × 24 @ £27.12 (BR3COEGL)' },
  'btl-asahi':            { name: 'Asahi 330ml',            packMl: 330, defaultCost: 1.04, supplier: 'Drinks Club', supplierProduct: 'Asahi Super Dry Glass 330ml × 24 @ £24.96 (BR3ASASDGL)' },
  'btl-budweiser':        { name: 'Budweiser 330ml',        packMl: 330, defaultCost: 0.98, supplier: 'Drinks Club', supplierProduct: 'Budweiser Glass 330ml × 24 @ £23.52 (BR3BUDGL)' },
  // Lowrise not on the Drinks Club Jun-26 list — ballpark kept.
  'btl-lowrise-lager':    { name: 'Lowrise Lager GF',       packMl: 330, defaultCost: 1.25, supplier: 'Drinks Club' },
  'btl-lowrise-ipa':      { name: 'Lowrise IPA GF',         packMl: 330, defaultCost: 1.25, supplier: 'Drinks Club' },
  'btl-corona-0':         { name: 'Corona 0%',              packMl: 330, defaultCost: 0.75, supplier: 'Drinks Club', supplierProduct: 'Corona Cero 0.0% Glass 330ml × 24 @ £18.00 (BR3COC00GL)' },
  // Big Drop not on the Drinks Club Jun-26 list — ballpark kept.
  'btl-bigdrop-citra':    { name: 'Big Drop Citra IPA 0.5%', packMl: 330, defaultCost: 1.80, supplier: 'Drinks Club' },
  'btl-lucky-saint':      { name: 'Lucky Saint 0.5%',       packMl: 330, defaultCost: 1.18, supplier: 'Drinks Club', supplierProduct: 'Lucky Saint Unfiltered Lager 0.5% Glass 330ml × 24 @ £28.20 (BR3LUSUFGL)' },
  // Cloudwater specials sit outside Drinks Club's core list — ballpark kept.
  'btl-cloudwater-ipa':   { name: 'Cloudwater Fresh AF IPA', packMl: 440, defaultCost: 2.50, supplier: 'Drinks Club' },
  'btl-strawb-lime-0':    { name: 'Strawberry & Lime 0%',   packMl: 500, defaultCost: 1.90, supplier: 'Drinks Club' },
  // Rekorderlig not on the Drinks Club Jun-26 list — Kopparberg Strawb&Lime used as substitute.
  'btl-rekorderlig':      { name: 'Rekorderlig Strawb&Lime', packMl: 500, defaultCost: 1.22, supplier: 'Drinks Club', supplierProduct: 'Kopparberg Strawberry & Lime Glass 500ml × 24 @ £29.25 (BR5KOPSLGL) — substitute' },
  'btl-olivers-cider':    { name: "Oliver's Fine Cider",    packMl: 500, defaultCost: 2.40, supplier: 'Top Cuvee' },

  // ─── Craft cans (£7 selection on page 2) ────────────────────────
  'craft-cheery-breeze':  { name: 'Cloudwater Cheery Breeze Sour', packMl: 440, defaultCost: 2.80, supplier: 'Drinks Club' },
  'craft-piccadilly-pils':{ name: 'Piccadilly Pilsner',     packMl: 440, defaultCost: 2.50, supplier: 'Drinks Club' },
  'craft-fuzzy-hazy':     { name: 'Fuzzy Hazy Pale',        packMl: 440, defaultCost: 2.50, supplier: 'Drinks Club' },
  'craft-happy-easy':     { name: 'Happy! Easy Pale',       packMl: 440, defaultCost: 2.40, supplier: 'Drinks Club' },
  'craft-piccadilly-port':{ name: 'Piccadilly Porter',      packMl: 440, defaultCost: 2.60, supplier: 'Drinks Club' },
  'craft-bigdrop-paradiso':{ name: 'Big Drop Paradiso Citra IPA 0.5%', packMl: 440, defaultCost: 2.00, supplier: 'Drinks Club' },

  // ─── Wine — 750ml bottles ────────────────────────────────────────
  'wine-blanco-blanco':   { name: 'Blanco Blanco (white)',    packMl: 750, defaultCost: 7.50, supplier: 'Top Cuvee' },
  'wine-conejos-malditos':{ name: 'Los Conejos Malditos (red)', packMl: 750, defaultCost: 7.50, supplier: 'Top Cuvee' },
  'wine-doom-rose':       { name: 'Doom Juice Rosé',         packMl: 750, defaultCost: 8.00, supplier: 'Top Cuvee' },
  'wine-topcuvee-orange': { name: 'Top Cuvee House Orange',  packMl: 750, defaultCost: 8.00, supplier: 'Top Cuvee' },
  'wine-favonius-orange': { name: 'Favonius Orange',         packMl: 750, defaultCost: 12.00, supplier: 'Top Cuvee' },
  'wine-doom-rouge':      { name: 'Doom Juice Rouge (chilled)', packMl: 750, defaultCost: 11.00, supplier: 'Top Cuvee' },
  'wine-gueule-damour':   { name: "Gueule d'Amour Cab Franc", packMl: 750, defaultCost: 13.00, supplier: 'Top Cuvee' },
  'wine-beaujolais':      { name: 'Beaujolais Nouveau',      packMl: 750, defaultCost: 12.00, supplier: 'Top Cuvee' },
  'wine-chinchin-verde':  { name: 'Chin Chin Vinho Verde',   packMl: 750, defaultCost: 9.00, supplier: 'Top Cuvee' },
  'wine-cueva-vermut':    { name: 'Cueva Nueva Vermut',      packMl: 750, defaultCost: 14.00, supplier: 'Top Cuvee' },
  'wine-doom-fizz':       { name: 'Doom Juice Fizz',         packMl: 750, defaultCost: 11.00, supplier: 'Top Cuvee' },
  'wine-vigna-petnat':    { name: 'Vigna Rose Pet Nat',      packMl: 750, defaultCost: 13.00, supplier: 'Top Cuvee' },
  'wine-prosecco':        { name: 'Prosecco',                packMl: 750, defaultCost: 6.75, supplier: 'Drinks Club', supplierProduct: 'Amore della Vita Prosecco Extra Dry 750ml (SP7ADVED)' },
  'wine-mini-prosecco':   { name: 'Mini Prosecco 20cl',      packMl: 200, defaultCost: 2.50, supplier: 'Drinks Club' },

  // ─── Soft drinks ─ Drinks Club case prices ÷ 24 (or per BIB for post-mix) ──
  // Kombucha not on the Drinks Club Jun-26 list — ballpark kept.
  'soft-kombucha':        { name: 'Kombucha',             packMl: 275, defaultCost: 1.50, supplier: 'Drinks Club' },
  'soft-ting':            { name: 'Ting Grapefruit',      packMl: 330, defaultCost: 0.48, supplier: 'Drinks Club', supplierProduct: 'Ting Grapefruit Can 330ml × 24 @ £11.52 (SO3TINGGRCA)' },
  'soft-redbull':         { name: 'Red Bull',             packMl: 250, defaultCost: 0.97, supplier: 'Drinks Club', supplierProduct: 'Red Bull 250ml × 24 @ £23.28 (SO2REB)' },
  'soft-ginger-beer':     { name: 'Old Jamaican Ginger Beer', packMl: 330, defaultCost: 0.48, supplier: 'Drinks Club', supplierProduct: 'Old Jamaican Ginger Beer Can 330ml × 24 @ £11.52 (SO3OLJGBC)' },
  'soft-fanta':           { name: 'Fanta',                packMl: 330, defaultCost: 0.60, supplier: 'Drinks Club', supplierProduct: 'Fanta Can 330ml × 24 @ £14.40 (SO3FANC)' },
  'soft-coke':            { name: 'Coca-Cola (bottle)',   packMl: 200, defaultCost: 0.50, supplier: 'Drinks Club' },
  'soft-juice':           { name: 'Juice (assorted)',     packMl: 1000, defaultCost: 2.50, supplier: 'Brakes' },
  // Post-mix coke now sized to the Drinks Club 7L BIB (was 100L tap-line estimate).
  'postmix-coke':         { name: 'Post-mix Coke (BIB)',  packMl: 7000, defaultCost: 79.30, supplier: 'Drinks Club', supplierProduct: 'Coca Cola BIB 7L (SO7COCBIB)' },
  'postmix-soda':         { name: 'Post-mix Soda',        packMl: 100000, defaultCost: 5.00, supplier: 'BOC' },

  // ─── Homemade sodas (syrup + soda mix) ──────────────────────────
  'syrup-house':          { name: 'House syrup batch',    packMl: 1000, defaultCost: 4.00, supplier: 'Brakes' },

  // ─── Mixers & garnishes ─────────────────────────────────────────
  'lime-juice':           { name: 'Lime juice (fresh)',   packMl: 1000, defaultCost: 8.00, supplier: 'Brakes' },
  'lemon-juice':          { name: 'Lemon juice (fresh)',  packMl: 1000, defaultCost: 7.00, supplier: 'Brakes' },
  'pineapple-juice':      { name: 'Pineapple juice',      packMl: 1000, defaultCost: 2.50, supplier: 'Brakes' },
  'grenadine':            { name: 'Grenadine',            packMl: 700, defaultCost: 4.93, supplier: 'Drinks Club', supplierProduct: 'Monin Grenadine 700ml (OTS7MONGR)' },
  'sugar-syrup':          { name: 'Sugar syrup 1:1',      packMl: 1000, defaultCost: 2.50, supplier: 'Brakes' },
  'agave-syrup':          { name: 'Agave syrup',          packMl: 1000, defaultCost: 17.92, supplier: 'Drinks Club', supplierProduct: 'Giffard Sirop Agave 1000ml (OTS7GIFSIAG)' },
  'sugar-cube':           { name: 'Sugar cube',           packMl: 1,   defaultCost: 0.02, supplier: 'Brakes' },
  'lime-wedge':           { name: 'Lime wedge',           packMl: 1,   defaultCost: 0.08, supplier: 'Brakes' },
  'lemon-twist':          { name: 'Lemon twist',          packMl: 1,   defaultCost: 0.06, supplier: 'Brakes' },
  'orange-slice':         { name: 'Orange slice',         packMl: 1,   defaultCost: 0.10, supplier: 'Brakes' },
  'cucumber-slice':       { name: 'Cucumber slice',       packMl: 1,   defaultCost: 0.04, supplier: 'Brakes' },
  'chilli-slice':         { name: 'Fresh chilli slice',   packMl: 1,   defaultCost: 0.03, supplier: 'Brakes' },
  'mint-sprig':           { name: 'Mint sprig',           packMl: 1,   defaultCost: 0.05, supplier: 'Brakes' },
  'salt-rim':             { name: 'Salt rim',             packMl: 1,   defaultCost: 0.02, supplier: 'Brakes' },
  'tajin-rim':            { name: 'Tajín rim',            packMl: 1,   defaultCost: 0.06, supplier: 'Brakes' },
  'pickle-juice':         { name: 'Pickle juice (chaser)',packMl: 1000, defaultCost: 4.00, supplier: 'Brakes' },
  'egg-white':            { name: 'Egg white',            packMl: 1,   defaultCost: 0.15, supplier: 'Brakes' },

  // ─── Snacks ─────────────────────────────────────────────────────
  'snack-gilda':          { name: 'Gilda (per skewer)',   packMl: 1, defaultCost: 0.55, supplier: 'Brakes' },
  'snack-crisps':         { name: 'Crisps (per bag)',     packMl: 1, defaultCost: 0.55, supplier: 'SNACK' },
  'snack-nuts':           { name: 'Nuts (per pack)',      packMl: 1, defaultCost: 0.45, supplier: 'SNACK' },
  'snack-salami':         { name: 'Salami snacks',        packMl: 1, defaultCost: 1.30, supplier: 'SNACK' },
  'snack-olives':         { name: 'Olives (per pot)',     packMl: 1, defaultCost: 1.20, supplier: 'SNACK' },
}

// ───────────────────────────────────────────────────────────────────────
// Recipe categories — drive the top-level tabs in the UI and the target
// gross margin for the colour-coded flag.
// ───────────────────────────────────────────────────────────────────────
export const CATEGORIES = [
  { key: 'draught',  label: 'Draught',        targetGp: 0.75 },
  { key: 'bottle',   label: 'Bottles / Cans', targetGp: 0.70 },
  { key: 'craft',    label: 'Craft Beer',     targetGp: 0.65 },
  { key: 'wine',     label: 'Wine',           targetGp: 0.70 },
  { key: 'cocktail', label: 'Cocktails',      targetGp: 0.80 },
  { key: 'spritz',   label: 'Long Drinks',    targetGp: 0.78 },
  { key: 'shot',     label: 'Shooters',       targetGp: 0.85 },
  { key: 'soft',     label: 'Softs / Hot',    targetGp: 0.80 },
  { key: 'snack',    label: 'Snacks',         targetGp: 0.55 },
]

// ───────────────────────────────────────────────────────────────────────
// RECIPES — every menu line. Each ingredient line is { id, ml } where ml
// is the volume poured (or 1 for count-based items like a lime wedge).
// sellPrice is the menu price INC VAT.
// ───────────────────────────────────────────────────────────────────────
export const RECIPES = [
  // ─── DRAUGHT ─── pint = 568ml from 50L keg
  { id: 'draught-camden-hells-pt',  category: 'draught', name: 'Camden Hells — Pint',  sellPrice: 7,    ingredients: [{ id: 'keg-camden-hells',  ml: POUR.PINT }] },
  { id: 'draught-camden-hells-hf',  category: 'draught', name: 'Camden Hells — Half',  sellPrice: 3.6,  ingredients: [{ id: 'keg-camden-hells',  ml: POUR.HALF }] },
  { id: 'draught-camden-hells-jug', category: 'draught', name: 'Camden Hells — Jug',   sellPrice: 27,   ingredients: [{ id: 'keg-camden-hells',  ml: POUR.PINT * 4 }] },
  { id: 'draught-camden-stout-pt',  category: 'draught', name: 'Camden Stout — Pint',  sellPrice: 7,    ingredients: [{ id: 'keg-camden-stout',  ml: POUR.PINT }] },
  { id: 'draught-camden-stout-hf',  category: 'draught', name: 'Camden Stout — Half',  sellPrice: 3.6,  ingredients: [{ id: 'keg-camden-stout',  ml: POUR.HALF }] },
  { id: 'draught-socal-pt',         category: 'draught', name: 'SoCal IPA — Pint',     sellPrice: 7,    ingredients: [{ id: 'keg-socal-ipa',     ml: POUR.PINT }] },
  { id: 'draught-socal-hf',         category: 'draught', name: 'SoCal IPA — Half',     sellPrice: 3.6,  ingredients: [{ id: 'keg-socal-ipa',     ml: POUR.HALF }] },
  { id: 'draught-umbrella-pt',      category: 'draught', name: 'Umbrella Cider — Pint', sellPrice: 7,   ingredients: [{ id: 'keg-umbrella-cider', ml: POUR.PINT }] },
  { id: 'draught-umbrella-hf',      category: 'draught', name: 'Umbrella Cider — Half', sellPrice: 3.6, ingredients: [{ id: 'keg-umbrella-cider', ml: POUR.HALF }] },

  // ─── BOTTLES / CANS ──
  { id: 'btl-corona',         category: 'bottle', name: 'Corona',          sellPrice: 4.8, ingredients: [{ id: 'btl-corona',        ml: POUR.CAN_330 }] },
  { id: 'btl-asahi',          category: 'bottle', name: 'Asahi',           sellPrice: 4.8, ingredients: [{ id: 'btl-asahi',         ml: POUR.CAN_330 }] },
  { id: 'btl-budweiser',      category: 'bottle', name: 'Budweiser',       sellPrice: 4.8, ingredients: [{ id: 'btl-budweiser',     ml: POUR.CAN_330 }] },
  { id: 'btl-lowrise-lager',  category: 'bottle', name: 'Lowrise Lager GF', sellPrice: 5.5, ingredients: [{ id: 'btl-lowrise-lager', ml: POUR.CAN_330 }] },
  { id: 'btl-lowrise-ipa',    category: 'bottle', name: 'Lowrise IPA GF',  sellPrice: 5.5, ingredients: [{ id: 'btl-lowrise-ipa',   ml: POUR.CAN_330 }] },
  { id: 'btl-corona-0',       category: 'bottle', name: 'Corona 0%',       sellPrice: 4,   ingredients: [{ id: 'btl-corona-0',      ml: POUR.CAN_330 }] },
  { id: 'btl-bigdrop-citra',  category: 'bottle', name: 'Big Drop Citra IPA 0.5%', sellPrice: 4.8, ingredients: [{ id: 'btl-bigdrop-citra', ml: POUR.CAN_330 }] },
  { id: 'btl-lucky-saint',    category: 'bottle', name: 'Lucky Saint 0.5%', sellPrice: 4.8, ingredients: [{ id: 'btl-lucky-saint',  ml: POUR.CAN_330 }] },
  { id: 'btl-cloudwater-fresh', category: 'bottle', name: 'Cloudwater Fresh AF 0.5%', sellPrice: 6, ingredients: [{ id: 'btl-cloudwater-ipa', ml: POUR.CAN_440 }] },
  { id: 'btl-strawb-lime-0',  category: 'bottle', name: 'Strawberry & Lime Cider 0%', sellPrice: 5.2, ingredients: [{ id: 'btl-strawb-lime-0', ml: POUR.CAN_500 }] },
  { id: 'btl-rekorderlig',    category: 'bottle', name: 'Rekorderlig Strawb & Lime', sellPrice: 6.5, ingredients: [{ id: 'btl-rekorderlig', ml: POUR.CAN_500 }] },
  { id: 'btl-olivers',        category: 'bottle', name: "Oliver's Fine Cider", sellPrice: 6.5, ingredients: [{ id: 'btl-olivers-cider', ml: POUR.CAN_500 }] },

  // ─── CRAFT BEER ──
  { id: 'craft-cheery-breeze',   category: 'craft', name: 'Cheery Breeze Sour 4.5%',   sellPrice: 7, ingredients: [{ id: 'craft-cheery-breeze',    ml: POUR.CAN_440 }] },
  { id: 'craft-piccadilly-pils', category: 'craft', name: 'Piccadilly Pilsner 4.2%',   sellPrice: 7, ingredients: [{ id: 'craft-piccadilly-pils',  ml: POUR.CAN_440 }] },
  { id: 'craft-fuzzy-hazy',      category: 'craft', name: 'Fuzzy Hazy Pale 4.2%',      sellPrice: 7, ingredients: [{ id: 'craft-fuzzy-hazy',       ml: POUR.CAN_440 }] },
  { id: 'craft-happy-easy',      category: 'craft', name: 'Happy! Easy Pale 3.4%',     sellPrice: 7, ingredients: [{ id: 'craft-happy-easy',       ml: POUR.CAN_440 }] },
  { id: 'craft-piccadilly-port', category: 'craft', name: 'Piccadilly Porter 4.5%',    sellPrice: 7, ingredients: [{ id: 'craft-piccadilly-port',  ml: POUR.CAN_440 }] },
  { id: 'craft-fresh-af',        category: 'craft', name: 'Fresh AF Hazy IPA 0.5%',    sellPrice: 6, ingredients: [{ id: 'btl-cloudwater-ipa',     ml: POUR.CAN_440 }] },
  { id: 'craft-lowrise',         category: 'craft', name: 'Lowrise Lager 4%',          sellPrice: 5.5, ingredients: [{ id: 'btl-lowrise-lager',    ml: POUR.CAN_440 }] },
  { id: 'craft-bigdrop-paradiso', category: 'craft', name: 'Big Drop Paradiso Citra 0.5%', sellPrice: 5.5, ingredients: [{ id: 'craft-bigdrop-paradiso', ml: POUR.CAN_440 }] },

  // ─── WINE — by glass and by bottle ──
  { id: 'wine-blanco-125', category: 'wine', name: 'Blanco Blanco — 125ml', sellPrice: 5, ingredients: [{ id: 'wine-blanco-blanco', ml: POUR.WINE_125 }] },
  { id: 'wine-blanco-175', category: 'wine', name: 'Blanco Blanco — 175ml', sellPrice: 7,    ingredients: [{ id: 'wine-blanco-blanco', ml: POUR.WINE_175 }] },
  { id: 'wine-blanco-250', category: 'wine', name: 'Blanco Blanco — 250ml', sellPrice: 9.5,  ingredients: [{ id: 'wine-blanco-blanco', ml: POUR.WINE_250 }] },
  { id: 'wine-blanco-btl', category: 'wine', name: 'Blanco Blanco — Bottle', sellPrice: 35, ingredients: [{ id: 'wine-blanco-blanco', ml: 750 }] },

  { id: 'wine-conejos-175', category: 'wine', name: 'Los Conejos Malditos — 175ml', sellPrice: 7,    ingredients: [{ id: 'wine-conejos-malditos', ml: POUR.WINE_175 }] },
  { id: 'wine-conejos-250', category: 'wine', name: 'Los Conejos Malditos — 250ml', sellPrice: 9.5,  ingredients: [{ id: 'wine-conejos-malditos', ml: POUR.WINE_250 }] },
  { id: 'wine-conejos-btl', category: 'wine', name: 'Los Conejos Malditos — Bottle', sellPrice: 35, ingredients: [{ id: 'wine-conejos-malditos', ml: 750 }] },

  { id: 'wine-doom-rose-175', category: 'wine', name: 'Doom Juice Rosé — 175ml', sellPrice: 7,    ingredients: [{ id: 'wine-doom-rose', ml: POUR.WINE_175 }] },
  { id: 'wine-doom-rose-250', category: 'wine', name: 'Doom Juice Rosé — 250ml', sellPrice: 9.5,  ingredients: [{ id: 'wine-doom-rose', ml: POUR.WINE_250 }] },
  { id: 'wine-doom-rose-btl', category: 'wine', name: 'Doom Juice Rosé — Bottle', sellPrice: 35, ingredients: [{ id: 'wine-doom-rose', ml: 750 }] },

  { id: 'wine-topcuvee-175', category: 'wine', name: 'Top Cuvee Orange — 175ml', sellPrice: 7,    ingredients: [{ id: 'wine-topcuvee-orange', ml: POUR.WINE_175 }] },
  { id: 'wine-topcuvee-250', category: 'wine', name: 'Top Cuvee Orange — 250ml', sellPrice: 9.5,  ingredients: [{ id: 'wine-topcuvee-orange', ml: POUR.WINE_250 }] },
  { id: 'wine-topcuvee-btl', category: 'wine', name: 'Top Cuvee Orange — Bottle', sellPrice: 35, ingredients: [{ id: 'wine-topcuvee-orange', ml: 750 }] },

  { id: 'wine-favonius-btl',     category: 'wine', name: 'Favonius Orange — Bottle',  sellPrice: 40, ingredients: [{ id: 'wine-favonius-orange', ml: 750 }] },
  { id: 'wine-doom-rouge-btl',   category: 'wine', name: 'Doom Juice Rouge — Bottle', sellPrice: 40, ingredients: [{ id: 'wine-doom-rouge', ml: 750 }] },
  { id: 'wine-gueule-btl',       category: 'wine', name: "Gueule d'Amour — Bottle",   sellPrice: 40, ingredients: [{ id: 'wine-gueule-damour', ml: 750 }] },
  { id: 'wine-beaujolais-btl',   category: 'wine', name: 'Beaujolais Nouveau — Bottle', sellPrice: 40, ingredients: [{ id: 'wine-beaujolais', ml: 750 }] },
  { id: 'wine-chinchin-btl',     category: 'wine', name: 'Chin Chin Vinho Verde — Bottle', sellPrice: 35, ingredients: [{ id: 'wine-chinchin-verde', ml: 750 }] },
  { id: 'wine-cueva-btl',        category: 'wine', name: 'Cueva Nueva Vermut — Bottle', sellPrice: 50, ingredients: [{ id: 'wine-cueva-vermut', ml: 750 }] },
  { id: 'wine-doom-fizz-btl',    category: 'wine', name: 'Doom Juice Fizz — Bottle',  sellPrice: 40, ingredients: [{ id: 'wine-doom-fizz', ml: 750 }] },
  { id: 'wine-vigna-btl',        category: 'wine', name: 'Vigna Rose Pet Nat — Bottle', sellPrice: 40, ingredients: [{ id: 'wine-vigna-petnat', ml: 750 }] },
  { id: 'wine-prosecco-btl',     category: 'wine', name: 'Prosecco — Bottle',         sellPrice: 35, ingredients: [{ id: 'wine-prosecco', ml: 750 }] },
  { id: 'wine-mini-prosecco',    category: 'wine', name: 'Mini Prosecco 20cl',        sellPrice: 8.5, ingredients: [{ id: 'wine-mini-prosecco', ml: 200 }] },

  // ─── COCKTAILS ──
  {
    id: 'cocktail-green-smoke', category: 'cocktail', name: 'Green Smoke', sellPrice: 12,
    notes: 'Shaken sour. Egg white optional.',
    ingredients: [
      { id: 'mezcal-house',      ml: POUR.SPIRIT_DOUBLE },
      { id: 'chartreuse-green',  ml: POUR.LIQUEUR },
      { id: 'lemon-juice',       ml: 25 },
      { id: 'sugar-syrup',       ml: 15 },
      { id: 'egg-white',         ml: 1 },
      { id: 'lemon-twist',       ml: 1 },
    ],
  },
  {
    id: 'cocktail-spicy-cuc-marg', category: 'cocktail', name: 'Spicy Cucumber Margarita', sellPrice: 11,
    notes: 'Smashed cucumber + fresh chilli, rocks.',
    ingredients: [
      { id: 'tequila-reposado',  ml: POUR.SPIRIT_DOUBLE },
      { id: 'lime-juice',        ml: 25 },
      { id: 'agave-syrup',       ml: 15 },
      { id: 'cucumber-slice',    ml: 4 }, // 4 slices
      { id: 'chilli-slice',      ml: 2 },
      { id: 'salt-rim',          ml: 1 },
    ],
  },
  {
    id: 'cocktail-mezcal-martinez', category: 'cocktail', name: 'Mezcal Martinez', sellPrice: 12,
    notes: 'Stirred. Orange twist.',
    ingredients: [
      { id: 'mezcal-vida',       ml: POUR.SPIRIT_DOUBLE },
      { id: 'amaro',             ml: 25 },
      { id: 'vermouth-dry',      ml: 25 },
      { id: 'orange-slice',      ml: 1 },
    ],
  },
  {
    id: 'cocktail-caipirinha', category: 'cocktail', name: 'Caipirinha', sellPrice: 11,
    notes: 'Rotating fruity combos — fruit added on top of base recipe.',
    ingredients: [
      { id: 'cachaca',           ml: POUR.SPIRIT_DOUBLE },
      { id: 'lime-wedge',        ml: 6 }, // half a lime, 6 wedges
      { id: 'sugar-syrup',       ml: 15 },
    ],
  },
  {
    id: 'cocktail-royal-flush', category: 'cocktail', name: 'Royal Flush', sellPrice: 10,
    notes: 'Long, pineapple-led.',
    ingredients: [
      { id: 'rum-havana-especial', ml: 25 },
      { id: 'rum-wray-nephew',    ml: 15 },
      { id: 'triple-sec',         ml: 15 },
      { id: 'pineapple-juice',    ml: 75 },
      { id: 'grenadine',          ml: 10 },
    ],
  },
  {
    id: 'cocktail-lagerita', category: 'cocktail', name: 'Lagerita / Tequila Michelada', sellPrice: 10,
    notes: 'Topped with Hells — add hot sauce + tomato juice for Turbo.',
    ingredients: [
      { id: 'tequila-silver',    ml: 35 },
      { id: 'lime-juice',        ml: 25 },
      { id: 'salt-rim',          ml: 1 },
      { id: 'tajin-rim',         ml: 1 },
      { id: 'keg-camden-hells',  ml: 200 },
    ],
  },
  {
    id: 'cocktail-classic', category: 'cocktail', name: 'Any Classic (avg)', sellPrice: 11,
    notes: 'Average build: 50ml spirit + 25ml modifier + lemon/lime juice + syrup.',
    ingredients: [
      { id: 'whiskey-house',     ml: POUR.SPIRIT_DOUBLE },
      { id: 'lemon-juice',       ml: 25 },
      { id: 'sugar-syrup',       ml: 15 },
      { id: 'orange-slice',      ml: 1 },
    ],
  },

  // ─── LONG DRINKS (Aperitif spritzes etc.) ──
  {
    id: 'spritz-vermut',  category: 'spritz', name: 'Vermut + Soda (double, tall)', sellPrice: 7,
    notes: '50ml vermut, soda, lemon slice, tall over ice.',
    ingredients: [
      { id: 'vermut',           ml: POUR.SPIRIT_DOUBLE },
      { id: 'postmix-soda',     ml: 150 },
      { id: 'lemon-twist',      ml: 1 },
    ],
  },
  {
    id: 'spritz-cynar',   category: 'spritz', name: 'Cynar + Soda',  sellPrice: 7,
    ingredients: [{ id: 'cynar', ml: POUR.SPIRIT_DOUBLE }, { id: 'postmix-soda', ml: 150 }, { id: 'orange-slice', ml: 1 }],
  },
  {
    id: 'spritz-amaro',   category: 'spritz', name: 'Amaro + Soda',  sellPrice: 7,
    ingredients: [{ id: 'amaro', ml: POUR.SPIRIT_DOUBLE }, { id: 'postmix-soda', ml: 150 }, { id: 'orange-slice', ml: 1 }],
  },
  {
    id: 'spritz-campari', category: 'spritz', name: 'Campari + Soda', sellPrice: 7,
    ingredients: [{ id: 'campari', ml: POUR.SPIRIT_DOUBLE }, { id: 'postmix-soda', ml: 150 }, { id: 'orange-slice', ml: 1 }],
  },
  {
    id: 'spritz-limoncello', category: 'spritz', name: 'Limoncello + Soda', sellPrice: 7,
    ingredients: [{ id: 'limoncello', ml: POUR.SPIRIT_DOUBLE }, { id: 'postmix-soda', ml: 150 }, { id: 'lemon-twist', ml: 1 }],
  },
  {
    id: 'spritz-ranch-water', category: 'spritz', name: 'Ranch Water', sellPrice: 7,
    ingredients: [
      { id: 'tequila-silver',   ml: POUR.SPIRIT_DOUBLE },
      { id: 'lime-juice',       ml: 15 },
      { id: 'postmix-soda',     ml: 150 },
      { id: 'salt-rim',         ml: 1 },
    ],
  },
  {
    id: 'spritz-kalimoxto', category: 'spritz', name: 'Kalimoxto', sellPrice: 8,
    ingredients: [
      { id: 'wine-conejos-malditos', ml: POUR.WINE_175 },
      { id: 'postmix-coke',          ml: 100 },
    ],
  },
  {
    id: 'spritz-beericano', category: 'spritz', name: 'Beericano', sellPrice: 10,
    ingredients: [
      { id: 'keg-camden-hells',  ml: 284 },
      { id: 'campari',           ml: 25 },
      { id: 'vermouth-sweet',    ml: 25 },
    ],
  },
  {
    id: 'spritz-hugo', category: 'spritz', name: 'Hugo Spritz', sellPrice: 11,
    ingredients: [
      { id: 'st-germain',        ml: 25 },
      { id: 'wine-prosecco',     ml: 100 },
      { id: 'postmix-soda',      ml: 50 },
      { id: 'mint-sprig',        ml: 1 },
    ],
  },

  // ─── SHOOTERS ──
  {
    id: 'shot-pickleback', category: 'shot', name: 'Pickleback', sellPrice: 6,
    ingredients: [
      { id: 'bourbon',          ml: POUR.SPIRIT_SINGLE },
      { id: 'pickle-juice',     ml: 25 },
    ],
  },
  {
    id: 'shot-devils-lobotomy', category: 'shot', name: 'Devils Lobotomy', sellPrice: 6,
    ingredients: [
      { id: 'absinthe-chocolate', ml: 12.5 },
      { id: 'keg-camden-stout',   ml: 12.5 },
    ],
  },
  {
    id: 'shot-baby-guinness', category: 'shot', name: 'Baby Guinness', sellPrice: 6,
    ingredients: [
      { id: 'kahlua',           ml: 25 },
      { id: 'baileys',          ml: 10 },
    ],
  },

  // ─── SOFTS / HOT ──
  { id: 'soft-kombucha',    category: 'soft', name: 'Kombucha',         sellPrice: 4,   ingredients: [{ id: 'soft-kombucha',  ml: 275 }] },
  { id: 'soft-ting',        category: 'soft', name: 'Ting',             sellPrice: 3.5, ingredients: [{ id: 'soft-ting',      ml: 330 }] },
  { id: 'soft-redbull',     category: 'soft', name: 'Red Bull',         sellPrice: 3.5, ingredients: [{ id: 'soft-redbull',   ml: 250 }] },
  { id: 'soft-ginger-beer', category: 'soft', name: 'Ginger Beer',      sellPrice: 3.5, ingredients: [{ id: 'soft-ginger-beer', ml: 330 }] },
  { id: 'soft-fanta',       category: 'soft', name: 'Fanta',            sellPrice: 3,   ingredients: [{ id: 'soft-fanta',     ml: 330 }] },
  { id: 'soft-juice',       category: 'soft', name: 'Juice / mixer',    sellPrice: 3,   ingredients: [{ id: 'soft-juice',     ml: 200 }] },
  { id: 'soft-soda-house',  category: 'soft', name: 'Homemade Soda',    sellPrice: 5,   ingredients: [{ id: 'syrup-house', ml: 30 }, { id: 'postmix-soda', ml: 200 }, { id: 'lime-wedge', ml: 1 }] },
  { id: 'soft-coffee',      category: 'soft', name: 'French Press Coffee', sellPrice: 3, ingredients: [{ id: 'snack-crisps', ml: 0.4 }] /* placeholder ~£0.22 */ },
  { id: 'soft-tea',         category: 'soft', name: 'Pot of Tea',       sellPrice: 3,   ingredients: [{ id: 'snack-crisps', ml: 0.2 }] /* placeholder ~£0.11 */ },
  { id: 'soft-hot-choc',    category: 'soft', name: 'Hot Chocolate',    sellPrice: 3,   ingredients: [{ id: 'snack-crisps', ml: 0.7 }] /* placeholder ~£0.38 */ },

  // ─── SNACKS ──
  { id: 'snack-gilda-1',  category: 'snack', name: 'Gilda (each)',      sellPrice: 2,   ingredients: [{ id: 'snack-gilda',  ml: 1 }] },
  { id: 'snack-gilda-6',  category: 'snack', name: 'Gilda (6 for £10)', sellPrice: 10,  ingredients: [{ id: 'snack-gilda',  ml: 6 }] },
  { id: 'snack-crisps',   category: 'snack', name: 'Crisps',            sellPrice: 1.7, ingredients: [{ id: 'snack-crisps', ml: 1 }] },
  { id: 'snack-nuts',     category: 'snack', name: 'Nuts',              sellPrice: 1.5, ingredients: [{ id: 'snack-nuts',   ml: 1 }] },
  { id: 'snack-salami',   category: 'snack', name: 'Salami Snacks',     sellPrice: 3.5, ingredients: [{ id: 'snack-salami', ml: 1 }] },
  { id: 'snack-olives',   category: 'snack', name: 'Olives',            sellPrice: 3.5, ingredients: [{ id: 'snack-olives', ml: 1 }] },
]

// ───────────────────────────────────────────────────────────────────────
// localStorage — overrides persist per ingredient + per recipe sell-
// price + per category target margin. Three small dictionaries keyed by
// id. Resetting clears all three.
// ───────────────────────────────────────────────────────────────────────
export const STORE_KEY = 'ndb_ops_costing_v1'

export function loadOverrides() {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (!raw) return { costs: {}, sells: {}, targets: {}, wastagePct: 5 }
    const parsed = JSON.parse(raw)
    return {
      costs: parsed.costs || {},
      sells: parsed.sells || {},
      targets: parsed.targets || {},
      wastagePct: typeof parsed.wastagePct === 'number' ? parsed.wastagePct : 5,
    }
  } catch {
    return { costs: {}, sells: {}, targets: {}, wastagePct: 5 }
  }
}

export function saveOverrides(state) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)) } catch {}
}

// ───────────────────────────────────────────────────────────────────────
// Math — cost-per-serve + margin from a recipe + override state.
// All money in £; ml is the unit for volume, "ml: 1" used for "each".
// ───────────────────────────────────────────────────────────────────────
export function costForRecipe(recipe, costOverrides, wastagePct) {
  let raw = 0
  for (const ing of recipe.ingredients) {
    const item = INGREDIENTS[ing.id]
    if (!item) continue
    const packCost = costOverrides[ing.id] ?? item.defaultCost ?? 0
    if (!packCost || !item.packMl) continue
    raw += (packCost / item.packMl) * ing.ml
  }
  const wastage = raw * (wastagePct / 100)
  return raw + wastage
}

export function marginForRecipe(recipe, costOverrides, sellOverride, wastagePct) {
  const cost = costForRecipe(recipe, costOverrides, wastagePct)
  const sellInc = sellOverride ?? recipe.sellPrice
  const sellNet = sellInc / (1 + VAT_RATE)
  const gp = sellNet - cost
  const gpPct = sellNet > 0 ? gp / sellNet : 0
  return { cost, sellInc, sellNet, gp, gpPct }
}

// Back out the inc-VAT sell price needed to hit the target margin.
export function priceToHitMargin(cost, targetGp) {
  if (targetGp >= 1) return Infinity
  const net = cost / (1 - targetGp)
  return net * (1 + VAT_RATE)
}
