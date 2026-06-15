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
  // Founder confirmed Cazcabel is the working bottle for the well — both silver
  // and reposado used across cocktails. Cheaper than Olmeca Altos by ~£2-4/btl.
  'tequila-silver':       { name: 'Silver Tequila (Cazcabel)',   packMl: 700, defaultCost: 23.09, supplier: 'Drinks Club', supplierProduct: 'Cazcabel Blanco 700ml (SPT7CAZBL)' },
  'tequila-reposado':     { name: 'Tequila Reposado (Cazcabel)', packMl: 700, defaultCost: 24.51, supplier: 'Drinks Club', supplierProduct: 'Cazcabel Reposado 700ml (SPT7CAZRE)' },
  'mezcal-vida':          { name: 'Vida Mezcal',         packMl: 700, defaultCost: 33.50, supplier: 'Drinks Club', supplierProduct: 'Del Maguey Mezcal Vida 700ml 42% (SPM7DEMVI)' },
  'mezcal-house':         { name: 'House Mezcal',        packMl: 700, defaultCost: 40.11, supplier: 'Drinks Club', supplierProduct: 'Madre Mezcal Espadin 700ml (SPM7MADES)' },
  'cachaca':              { name: 'Cachaça',             packMl: 700, defaultCost: 16.43, supplier: 'Drinks Club', supplierProduct: 'Velho Barreiro Cachaca 700ml (SPC7VEBCA)' },
  'rum-havana-especial':  { name: 'Havana Especial',     packMl: 700, defaultCost: 15.65, supplier: 'Drinks Club', supplierProduct: 'Havana Club Anejo Especial 700ml (SPR7HACAE)' },
  'rum-wray-nephew':      { name: 'Wray & Nephew',       packMl: 700, defaultCost: 25.05, supplier: 'Drinks Club', supplierProduct: 'Wray & Nephew White Overproof 700ml (SPR7WRNWO)' },
  'bourbon':              { name: 'Bourbon',             packMl: 700, defaultCost: 19.74, supplier: 'Drinks Club', supplierProduct: 'Four Roses Yellow Label 700ml (SPW7FORYL)' },
  'whiskey-house':        { name: 'House Whiskey',       packMl: 700, defaultCost: 19.76, supplier: 'Drinks Club', supplierProduct: 'Jameson 700ml (SPW7JAM)' },

  // ─── Independent spirit suppliers ─────────────────────────────────
  // Hanbury — buy direct from True Brew Co Ltd (the entity behind the
  // Hanbury Distillery in Islington). Both stored at the 2.1L refill
  // rate (the working pack the team pours from); display bottle prices
  // captured in supplierProduct for reference.
  //   • London Dry 2.1L refill HD011 £64 ex VAT → £0.0305/ml (£21.33/700ml)
  //   • Spiced Cranberry 2.1L refill £65 ex VAT → £0.0310/ml (£21.67/700ml)
  'gin-hanbury-london-dry': { name: 'Hanbury London Dry Gin',     packMl: 2100, defaultCost: 64.00, supplier: 'True Brew Co Ltd (Hanbury Distillery)', supplierProduct: 'Hanbury London Dry Gin Refill 2.1L (HD011) @ £64 ex VAT — INV-0395' },
  'gin-hanbury-cranberry':  { name: 'Hanbury Spiced Cranberry Gin', packMl: 2100, defaultCost: 65.00, supplier: 'True Brew Co Ltd (Hanbury Distillery)', supplierProduct: 'Hanbury Spiced Cranberry Refill 2.1L @ £65 ex VAT — 70cl bottle HD016 @ £25 (INV-0473)' },

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
  // Ms Better's Miraculous Foamer — vegan egg-white replacement, used a
  // few drops at a time in sours. 120ml pipette bottle @ £18.90 ex VAT
  // from Drinks Club (OTB1MSBMF). ~1ml per cocktail = ~120 serves/bottle.
  'foamer':               { name: "Ms Better's Miraculous Foamer", packMl: 120, defaultCost: 18.90, supplier: 'Drinks Club', supplierProduct: "Ms Better's Miraculous Foamer 120ml (OTB1MSBMF)" },

  // Devil's Botany — buy direct from the distillery (Leyton). Invoice
  // INV-0534 (29 Apr 2025): Chocolate Absinthe 70cl at 18.63 ex VAT,
  // London Absinthe 70cl at 25.30, Absinthe Regalis 70cl at 36.63.
  'absinthe-chocolate':   { name: 'Chocolate Absinthe',  packMl: 700, defaultCost: 18.63, supplier: "Devil's Botany", supplierProduct: "Devil's Botany Chocolate Absinthe 24% 70cl @ £18.63 ex VAT" },
  'absinthe-london':      { name: 'London Absinthe',     packMl: 700, defaultCost: 25.30, supplier: "Devil's Botany", supplierProduct: "Devil's Botany London Absinthe 45% 70cl @ £25.30 ex VAT" },
  'absinthe-regalis':     { name: 'Absinthe Regalis',    packMl: 700, defaultCost: 36.63, supplier: "Devil's Botany", supplierProduct: "Devil's Botany Absinthe Regalis 63% 70cl @ £36.63 ex VAT (premium)" },
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
  // Olivers replaces Aspalls as the cider line. Bottle is 330ml (not 500ml
  // as previously assumed). £1.94 ex VAT per bottle — case of 24 at £55.83
  // ex VAT, free shipping on this round. Two SKUs share the same per-bottle
  // price: Pomona Rolling Blend 2023 and Gold Rush #11.
  'btl-olivers-cider':    { name: "Oliver's Fine Cider",    packMl: 330, defaultCost: 1.94, supplier: 'Fine Cider Company', supplierProduct: "Oliver's Pomona Rolling Blend 2023 / Gold Rush #11 — 330ml × 24 @ £55.83/case ex VAT" },

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
  // Prosecco is bought through Top Cuvee like the rest of the wine. The
  // Drinks Club Jun-26 sheet lists Amore della Vita at £6.75 ex VAT as a
  // comparison price (lower than typical Top Cuvee) — kept as the
  // ballpark until the Top Cuvee invoice lands.
  'wine-prosecco':        { name: 'Prosecco',                packMl: 750, defaultCost: 8.00, supplier: 'Top Cuvee' },
  'wine-mini-prosecco':   { name: 'Mini Prosecco 20cl',      packMl: 200, defaultCost: 2.50, supplier: 'Top Cuvee' },

  // House cheap red — only used for Kalimoxto (mixed with Coke), NOT
  // pour-by-the-glass. Founder confirmed this is intentionally a cheaper
  // bottle than the Top Cuvee selection. Drinks Club Domaine de La Motte
  // Merlot at £6 / 750ml fits the brief.
  'wine-house-red':       { name: 'House cheap red (Kalimoxto)', packMl: 750, defaultCost: 6.00, supplier: 'Drinks Club', supplierProduct: 'Domaine de La Motte Merlot 750ml (RE7LMOME)' },

  // ─── Soft drinks ─ Drinks Club case prices ÷ 24 (or per BIB for post-mix) ──
  // Kombucha not on the Drinks Club Jun-26 list — ballpark kept.
  'soft-kombucha':        { name: 'Kombucha',             packMl: 275, defaultCost: 1.50, supplier: 'Drinks Club' },
  'soft-ting':            { name: 'Ting Grapefruit',      packMl: 330, defaultCost: 0.48, supplier: 'Drinks Club', supplierProduct: 'Ting Grapefruit Can 330ml × 24 @ £11.52 (SO3TINGGRCA)' },
  'soft-redbull':         { name: 'Red Bull',             packMl: 250, defaultCost: 0.97, supplier: 'Drinks Club', supplierProduct: 'Red Bull 250ml × 24 @ £23.28 (SO2REB)' },
  'soft-ginger-beer':     { name: 'Old Jamaican Ginger Beer', packMl: 330, defaultCost: 0.48, supplier: 'Drinks Club', supplierProduct: 'Old Jamaican Ginger Beer Can 330ml × 24 @ £11.52 (SO3OLJGBC)' },
  'soft-fanta':           { name: 'Fanta',                packMl: 330, defaultCost: 0.60, supplier: 'Drinks Club', supplierProduct: 'Fanta Can 330ml × 24 @ £14.40 (SO3FANC)' },
  'soft-coke':            { name: 'Coca-Cola (bottle)',   packMl: 200, defaultCost: 0.50, supplier: 'Drinks Club' },
  'soft-juice':           { name: 'Juice (assorted)',     packMl: 1000, defaultCost: 2.50, supplier: 'Brakes' },
  // Post-mix coke: Drinks Club 7L SYRUP BIB at £79.30 ex VAT. The
  // gun mixes syrup ~1:5 with carbonated water on the line, so 7L of
  // syrup yields ~42L of pourable Coke. packMl stored as the FINISHED
  // volume (42L) so the per-ml cost reflects what actually leaves the
  // tap = £79.30/42000ml ≈ £0.0019/ml ≈ £0.38 per 200ml serve.
  'postmix-coke':         { name: 'Post-mix Coke (finished)', packMl: 42000, defaultCost: 79.30, supplier: 'Drinks Club', supplierProduct: 'Coca Cola BIB 7L (SO7COCBIB) — 1:5 syrup to soda water = 42L finished' },
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

  // ─── Snacks ─ Snack! (UK Bar Snacks Ltd) INV-38604 Aug 2025 ─────
  // Brown Bag crisps: £11.25 / case of 20 × 40g = £0.5625/bag
  // Salty Dog nuts Dry Roasted: £9.75 / case of 24 × 45g = £0.4063/pack
  // Salty Dog nuts Chilli Peanuts: £11.25 / case of 24 × 45g = £0.4688/pack
  // Olly's Olives Garlic & Basil: £13.25 / case of 12 × 50g = £1.1042/pot (zero VAT)
  // Serious Pig Snackalami Classic: £32.50 / case of 24 × 30g = £1.3542/snack (zero VAT)
  'snack-gilda':          { name: 'Gilda (per skewer)',   packMl: 1, defaultCost: 0.55, supplier: 'Brindisa' },
  'snack-crisps':         { name: 'Brown Bag Crisps 40g', packMl: 1, defaultCost: 0.56, supplier: 'Snack! (UK Bar Snacks Ltd)', supplierProduct: 'Brown Bag — 5 flavours, case of 20 × 40g @ £11.25 ex VAT (£0.56/bag)' },
  'snack-nuts':           { name: 'Salty Dog Nuts 45g',   packMl: 1, defaultCost: 0.41, supplier: 'Snack! (UK Bar Snacks Ltd)', supplierProduct: 'Salty Dog Dry Roasted, case of 24 × 45g @ £9.75 ex VAT (£0.41/pack). Chilli Peanuts £11.25/case (£0.47/pack).' },
  'snack-salami':         { name: 'Serious Pig Snackalami 30g', packMl: 1, defaultCost: 1.35, supplier: 'Snack! (UK Bar Snacks Ltd)', supplierProduct: 'Serious Pig Snackalami Classic, case of 24 × 30g @ £32.50 (zero VAT) = £1.35/snack' },
  'snack-olives':         { name: "Olly's Olives 50g",    packMl: 1, defaultCost: 1.10, supplier: 'Snack! (UK Bar Snacks Ltd)', supplierProduct: "Olly's Olives Garlic & Basil, case of 12 × 50g @ £13.25 (zero VAT) = £1.10/pot" },

  // ─── Additional ingredients for Dec 2025 spec sheet ──────────────
  // Added when the founder shared the full Cocktail Specs Update —
  // these are everything needed by the ~25 cocktails that the
  // previous costing data didn't yet reference.

  // ─── Extra spirits / liqueurs ─ Drinks Club prices verified ─────
  'vodka':                  { name: 'Vodka (well)',          packMl: 700, defaultCost: 14.53, supplier: 'Drinks Club', supplierProduct: 'Absolut Vodka Blue 700ml (SPV7ABSBL)' },
  'vodka-vanilla':          { name: 'Vanilla Vodka',         packMl: 700, defaultCost: 16.86, supplier: 'Drinks Club', supplierProduct: 'Absolut Vodka Vanilla 700ml (SPV7ABSVA)' },
  'gin-house':              { name: 'House Gin (Hanbury LD)', packMl: 2100, defaultCost: 64.00, supplier: 'True Brew Co Ltd (Hanbury Distillery)', supplierProduct: 'Hanbury London Dry Refill 2.1L (HD011)' },
  'rum-spiced':             { name: 'Spiced Rum (Cut)',      packMl: 700, defaultCost: 20.76, supplier: 'Drinks Club', supplierProduct: 'Cut Spiced Rum 700ml (SPR7CUTSR)' },
  'rum-kraken':             { name: 'Kraken Black Spiced',   packMl: 700, defaultCost: 21.90, supplier: 'Drinks Club', supplierProduct: 'Kraken Black Spiced Rum 700ml (SPR7KRABS)' },
  'rum-havana-7':           { name: 'Havana Club 7yr',       packMl: 700, defaultCost: 20.96, supplier: 'Drinks Club', supplierProduct: 'Havana Club 7 Year Old 700ml (SPR7HAC7)' },
  'amaretto':               { name: 'Disaronno Amaretto',    packMl: 700, defaultCost: 16.26, supplier: 'Drinks Club', supplierProduct: 'Disaronno Amaretto 700ml (LI7DISAM)' },
  'chartreuse-yellow':      { name: 'Yellow Chartreuse',     packMl: 700, defaultCost: 35.29, supplier: 'Drinks Club', supplierProduct: 'Chartreuse Yellow Liqueur 700ml 43% (LI7CHAYE)' },
  'kings-ginger':           { name: "King's Ginger Liqueur", packMl: 500, defaultCost: 19.86, supplier: 'Drinks Club', supplierProduct: 'Kings Ginger Liqueur 500ml (LI5KGL)' },
  'passion-fruit-liqueur':  { name: 'Passion Fruit Liqueur', packMl: 700, defaultCost: 9.45, supplier: 'Drinks Club', supplierProduct: 'Blend Passion Fruit Liqueur 700ml (LI7BLEPF)' },
  'falernum':               { name: "Velvet Falernum",       packMl: 700, defaultCost: 13.20, supplier: 'Drinks Club', supplierProduct: "Taylor's Velvet Falernum 700ml (LI7TAYVFL)" },
  'aperol':                 { name: 'Aperol Aperitivo',      packMl: 700, defaultCost: 11.25, supplier: 'Drinks Club', supplierProduct: 'Aperol Aperitivo 700ml (LI7APA)' },
  'pimms':                  { name: "Pimm's No.1",           packMl: 700, defaultCost: 13.00, supplier: 'Drinks Club', supplierProduct: "Pimm's No.1 700ml (VE7PIMN1)" },
  'vermouth-cocchi':        { name: 'Cocchi Americano',      packMl: 750, defaultCost: 19.43, supplier: 'Drinks Club', supplierProduct: 'Cocchi Americano 750ml (AP7COCAM)' },
  'lillet':                 { name: 'Lillet Rose',           packMl: 750, defaultCost: 13.32, supplier: 'Drinks Club', supplierProduct: 'Lillet Rose 750ml (AP7LILROS)' },
  'umeshu-plum-sake':       { name: 'Akashi-Tai Plum Sake',  packMl: 500, defaultCost: 17.10, supplier: 'Drinks Club', supplierProduct: 'Akashi-Tai Shiraume Ginjo Umeshu 500ml (SA5AKTSGUP)' },

  // ─── Bitters & syrups ────────────────────────────────────────────
  'angostura':              { name: 'Angostura Bitters',     packMl: 200, defaultCost: 9.75, supplier: 'Drinks Club', supplierProduct: 'Angostura Bitters 200ml (OTB2ANGBI)' },
  'lemon-bitters':          { name: 'Fee Brothers Lemon Bitters', packMl: 150, defaultCost: 14.98, supplier: 'Drinks Club', supplierProduct: 'Fee Brothers Lemon Bitters 150ml (OTB1FEBLE)' },
  'honey-syrup':            { name: 'Honey syrup (house)',   packMl: 1000, defaultCost: 8.00, supplier: 'Brakes' },
  'vanilla-syrup':          { name: 'Monin Vanilla syrup',   packMl: 700, defaultCost: 6.99, supplier: 'Drinks Club', supplierProduct: 'Monin Vanilla 700ml (OTS7MONVA)' },
  'banana-syrup':           { name: 'Banana syrup',          packMl: 700, defaultCost: 7.00, supplier: 'Brakes' },

  // ─── Purees & juices ─────────────────────────────────────────────
  'mango-puree':            { name: 'Funkin Mango Puree',    packMl: 1000, defaultCost: 47.60, supplier: 'Drinks Club', supplierProduct: 'Funkin Mango Puree 1kg (OTP1FUNMP)' },
  'passion-fruit-puree':    { name: 'Funkin Passion Fruit Puree', packMl: 1000, defaultCost: 48.80, supplier: 'Drinks Club', supplierProduct: 'Funkin Passion Fruit Puree 1kg (OTP1FUNPFP)' },
  'tomato-juice':           { name: 'Big Tom / Eager Tomato', packMl: 1000, defaultCost: 16.64, supplier: 'Drinks Club', supplierProduct: 'Eager Tomato Juice 1000ml (SO1EAGTO)' },
  'grapefruit-juice':       { name: 'Eager Pink Grapefruit', packMl: 1000, defaultCost: 19.28, supplier: 'Drinks Club', supplierProduct: 'Eager Pink Grapefruit 1000ml (SO1EAGPG)' },
  'orange-juice':           { name: 'Eager Orange (smooth)', packMl: 1000, defaultCost: 18.56, supplier: 'Drinks Club', supplierProduct: 'Eager Orange Smooth 1000ml (SO1EAGOS)' },
  'coconut-cream':          { name: 'Coconut cream',         packMl: 1000, defaultCost: 8.00, supplier: 'Brakes' },
  'coffee-extract':         { name: 'Coffee extract (cold brew)', packMl: 1000, defaultCost: 25.00, supplier: 'Drinks Club' },

  // ─── Hot sauces + savoury condiments ─────────────────────────────
  'worcestershire':         { name: 'Worcestershire sauce',  packMl: 300, defaultCost: 4.00, supplier: 'Brakes' },
  'tabasco':                { name: 'Tabasco hot sauce',     packMl: 60, defaultCost: 4.00, supplier: 'Brakes' },
  'valentina-hot-sauce':    { name: 'Valentina Hot Sauce',   packMl: 950, defaultCost: 6.00, supplier: 'Brakes' },
  'soy-sauce':              { name: 'Soy sauce',             packMl: 250, defaultCost: 2.00, supplier: 'Brakes' },

  // ─── Soda lines ─ post-mix BIB lemonade ─────────────────────────
  // Schweppes Lemonade 7L BIB @ £69.60 ex VAT; 1:5 syrup-to-water gives
  // ~42L finished drink so per-ml cost ≈ £0.00166.
  'postmix-lemonade':       { name: 'Post-mix Lemonade (finished)', packMl: 42000, defaultCost: 69.60, supplier: 'Drinks Club', supplierProduct: 'Schweppes Lemonade BIB 7L (SO7SCHLEBIB) — 1:5 syrup to soda = 42L finished' },

  // ─── Beer (Sol) ─ Mexican lager for Michelada Sol ───────────────
  'btl-sol':                { name: 'Sol Mexican Lager 330ml', packMl: 330, defaultCost: 1.20, supplier: 'Drinks Club' },

  // ─── Garnishes & herbs ──────────────────────────────────────────
  'mint-leaf':              { name: 'Mint leaf (each)',      packMl: 1, defaultCost: 0.04, supplier: 'Brakes' },
  'sage-leaf':              { name: 'Sage leaf (each)',      packMl: 1, defaultCost: 0.05, supplier: 'Brakes' },
  'pineapple-leaf':         { name: 'Pineapple leaf',        packMl: 1, defaultCost: 0.10, supplier: 'Brakes' },
  'cherry-cocktail':        { name: 'Cocktail cherry',       packMl: 1, defaultCost: 0.08, supplier: 'Drinks Club', supplierProduct: 'Luxardo Maraschino Cherries 400g (OT4LUXMC)' },
  'grapefruit-slice':       { name: 'Grapefruit slice',      packMl: 1, defaultCost: 0.12, supplier: 'Brakes' },
  'lime-slice':             { name: 'Lime slice',            packMl: 1, defaultCost: 0.07, supplier: 'Brakes' },
  'orange-peel':            { name: 'Orange peel',           packMl: 1, defaultCost: 0.08, supplier: 'Brakes' },
  'celery-stick':           { name: 'Celery stick',          packMl: 1, defaultCost: 0.15, supplier: 'Brakes' },
  'strawberry':             { name: 'Strawberry',            packMl: 1, defaultCost: 0.15, supplier: 'Brakes' },
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
  { key: 'jug',      label: 'Jugs',           targetGp: 0.75 },
  { key: 'mocktail', label: 'Mocktails',      targetGp: 0.78 },
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
  // Pours one full 330ml Oliver's bottle (Fine Cider Co), not the 500ml previously assumed.
  { id: 'btl-olivers',        category: 'bottle', name: "Oliver's Fine Cider", sellPrice: 6.5, ingredients: [{ id: 'btl-olivers-cider', ml: POUR.CAN_330 }] },

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
  // Founder spec (Aug 2025): 35ml Vida Mezcal, 25ml Green Chartreuse,
  // 25ml lemon, ~1ml Ms Better's Foamer (1/3 of a pipette).
  {
    id: 'cocktail-green-smoke', category: 'cocktail', name: 'Green Smoke', sellPrice: 12,
    notes: 'Shaken sour. 1/3 of a pipette of foamer (vegan egg-white sub).',
    ingredients: [
      { id: 'mezcal-vida',       ml: 35 },
      { id: 'chartreuse-green',  ml: 25 },
      { id: 'lemon-juice',       ml: 25 },
      { id: 'foamer',            ml: 1 },
      { id: 'lemon-twist',       ml: 1 },
    ],
  },
  // Founder spec (Aug 2025): 3 cucumber slices, 3 chilli slices muddled,
  // 25ml lime, double Cazcabel Reposado (50ml), 12.5ml agave syrup.
  {
    id: 'cocktail-spicy-cuc-marg', category: 'cocktail', name: 'Spicy Cucumber Margarita', sellPrice: 11,
    notes: '3 cucumber slices + 3 chilli slices muddled. Double Cazcabel Reposado. Rocks.',
    ingredients: [
      { id: 'tequila-reposado',  ml: POUR.SPIRIT_DOUBLE },
      { id: 'lime-juice',        ml: 25 },
      { id: 'agave-syrup',       ml: 12.5 },
      { id: 'cucumber-slice',    ml: 3 },
      { id: 'chilli-slice',      ml: 3 },
      { id: 'salt-rim',          ml: 1 },
    ],
  },
  // Founder spec (Aug 2025): 35ml Vida Mezcal, 25ml Amaro Montenegro,
  // ~5ml (1 bar-spoon) Martini Rosso sweet vermouth, orange slice + zest.
  {
    id: 'cocktail-mezcal-martinez', category: 'cocktail', name: 'Mezcal Martinez', sellPrice: 12,
    notes: 'Stirred. Bar-spoon of Martini Rosso, orange slice + zest.',
    ingredients: [
      { id: 'mezcal-vida',       ml: 35 },
      { id: 'amaro',             ml: 25 },
      { id: 'vermouth-sweet',    ml: 5 },
      { id: 'orange-slice',      ml: 1 },
    ],
  },
  // Founder spec (Aug 2025): 50ml Cachaça, 25ml lime juice, 25ml sugar
  // syrup, 1 lime crushed into wedges. Rotating fruity combos optional.
  {
    id: 'cocktail-caipirinha', category: 'cocktail', name: 'Caipirinha', sellPrice: 11,
    notes: 'A whole lime crushed into wedges. Rotating fruit combos on top.',
    ingredients: [
      { id: 'cachaca',           ml: 50 },
      { id: 'lime-juice',        ml: 25 },
      { id: 'sugar-syrup',       ml: 25 },
      { id: 'lime-wedge',        ml: 8 },
    ],
  },
  // Founder spec (Aug 2025): 25ml Havana Especial, 10ml Wray & Nephew
  // float, 25ml Triple Sec, top pineapple juice, grenadine float.
  {
    id: 'cocktail-royal-flush', category: 'cocktail', name: 'Royal Flush', sellPrice: 10,
    notes: 'Long, pineapple top. W&N float + grenadine float.',
    ingredients: [
      { id: 'rum-havana-especial', ml: 25 },
      { id: 'rum-wray-nephew',    ml: 10 },
      { id: 'triple-sec',         ml: 25 },
      { id: 'pineapple-juice',    ml: 100 },
      { id: 'grenadine',          ml: 10 },
    ],
  },
  // Founder spec (Aug 2025): 25ml Cazcabel Blanco, 25ml lime, topped
  // with half-pint Camden Hells. Salt + Tajín rim. Michelada variant
  // adds chilli sauce + spices (negligible cost).
  {
    id: 'cocktail-lagerita', category: 'cocktail', name: 'Lagerita / Tequila Michelada', sellPrice: 10,
    notes: 'Half pint Hells top. Add chilli sauce + spices for Michelada.',
    ingredients: [
      { id: 'tequila-silver',    ml: 25 },
      { id: 'lime-juice',        ml: 25 },
      { id: 'salt-rim',          ml: 1 },
      { id: 'tajin-rim',         ml: 1 },
      { id: 'keg-camden-hells',  ml: POUR.HALF },
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
  // Founder spec (Aug 2025): single 25ml Cazcabel Blanco, 25ml lime,
  // soda top, salt rim. Exception to the "long drinks = doubles" rule.
  {
    id: 'spritz-ranch-water', category: 'spritz', name: 'Ranch Water', sellPrice: 7,
    notes: 'Single 25ml silver tequila. Lime + soda top, salt rim.',
    ingredients: [
      { id: 'tequila-silver',   ml: 25 },
      { id: 'lime-juice',       ml: 25 },
      { id: 'postmix-soda',     ml: 150 },
      { id: 'salt-rim',         ml: 1 },
    ],
  },
  // Founder spec (Aug 2025): 125ml of the £6 house red (NOT the £35 Top
  // Cuvee Conejos), topped with ~200ml Coca Cola (small can equiv).
  {
    id: 'spritz-kalimoxto', category: 'spritz', name: 'Kalimoxto', sellPrice: 8,
    notes: 'House cheap red — Drinks Club Domaine de La Motte Merlot. NOT the £35 Top Cuvee bottle.',
    ingredients: [
      { id: 'wine-house-red',   ml: 125 },
      { id: 'postmix-coke',     ml: 200 },
    ],
  },
  // Founder spec (Aug 2025): half-pint Camden Hells, 25ml Campari, 25ml
  // El Bandarra vermut (NOT a sweet vermouth — switch to the vermut line).
  {
    id: 'spritz-beericano', category: 'spritz', name: 'Beericano', sellPrice: 10,
    notes: 'Half pint Hells + Campari + El Bandarra vermut.',
    ingredients: [
      { id: 'keg-camden-hells',  ml: POUR.HALF },
      { id: 'campari',           ml: 25 },
      { id: 'vermut',            ml: 25 },
    ],
  },
  // Founder spec (Aug 2025): 35ml St Germain, 125ml Prosecco, soda top, mint.
  {
    id: 'spritz-hugo', category: 'spritz', name: 'Hugo Spritz', sellPrice: 11,
    ingredients: [
      { id: 'st-germain',        ml: 35 },
      { id: 'wine-prosecco',     ml: 125 },
      { id: 'postmix-soda',      ml: 100 },
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

  // ─── COCKTAILS (Dec 2025 spec sheet additions) ──────────────────
  // All recipes verbatim from "Cocktail Specs Update DEC 2025.pdf".
  // Sell prices set to typical No Dice menu pricing — adjust in admin
  // once the print menu is finalised.
  {
    id: 'cocktail-espresso-martini', category: 'cocktail', name: 'Espresso Martini', sellPrice: 11,
    notes: 'Double shake (remove ice, dry shake), double strain. Coffee beans garnish.',
    ingredients: [
      { id: 'vodka',           ml: 30 },
      { id: 'kahlua',          ml: 25 },
      { id: 'coffee-extract',  ml: 30 },
      { id: 'sugar-syrup',     ml: 7 },
    ],
  },
  {
    id: 'cocktail-classic-marg', category: 'cocktail', name: 'Classic Margarita', sellPrice: 11,
    notes: 'Chill coupe. Shake. No ice, no straw. Salt rim.',
    ingredients: [
      { id: 'tequila-silver',  ml: 50 },
      { id: 'triple-sec',      ml: 20 },
      { id: 'lime-juice',      ml: 25 },
      { id: 'salt-rim',        ml: 1 },
    ],
  },
  {
    id: 'cocktail-tommys-marg', category: 'cocktail', name: "Tommy's Margarita", sellPrice: 11,
    notes: 'Shake. Serve rock glass cubes to top. No straw, no salt.',
    ingredients: [
      { id: 'tequila-reposado', ml: 50 },
      { id: 'lime-juice',       ml: 40 },
      { id: 'agave-syrup',      ml: 15 },
    ],
  },
  {
    id: 'cocktail-mezcal-marg', category: 'cocktail', name: 'Mezcal Margarita', sellPrice: 12,
    notes: 'Shake. Serve rock glass cubes to top. No rim salt or Tajín.',
    ingredients: [
      { id: 'mezcal-vida',     ml: 35 },
      { id: 'triple-sec',      ml: 15 },
      { id: 'lime-juice',      ml: 25 },
    ],
  },
  {
    id: 'cocktail-sage-smash', category: 'cocktail', name: 'Sage Smash', sellPrice: 11,
    notes: 'Dump sage leaves first. Single strain, ice to top. Sage sprig.',
    ingredients: [
      { id: 'bourbon',           ml: 40 },
      { id: 'chartreuse-yellow', ml: 10 },
      { id: 'honey-syrup',       ml: 15 },
      { id: 'lemon-juice',       ml: 25 },
      { id: 'sage-leaf',         ml: 6 },
    ],
  },
  {
    id: 'cocktail-penicillin-2', category: 'cocktail', name: 'Penicillin 2.0', sellPrice: 12,
    notes: 'Shake without Amaro. Strain into rocks + ice. FLOAT the Amaro.',
    ingredients: [
      { id: 'mezcal-vida',     ml: 35 },
      { id: 'kings-ginger',    ml: 25 },
      { id: 'lemon-juice',     ml: 25 },
      { id: 'honey-syrup',     ml: 15 },
      { id: 'amaro',           ml: 5 },
    ],
  },
  {
    id: 'cocktail-golfstar-martini', category: 'cocktail', name: 'Golfstar Martini', sellPrice: 12,
    notes: 'Shake to create foam, double strain. Open mini prosecco for the float. 2 cherries on a pick.',
    ingredients: [
      { id: 'vodka-vanilla',           ml: 30 },
      { id: 'passion-fruit-liqueur',   ml: 20 },
      { id: 'passion-fruit-puree',     ml: 30 },
      { id: 'vanilla-syrup',           ml: 10 },
      { id: 'lime-juice',              ml: 10 },
      { id: 'wine-prosecco',           ml: 20 },
      { id: 'cherry-cocktail',         ml: 2 },
    ],
  },
  {
    id: 'cocktail-paloma', category: 'cocktail', name: 'Paloma', sellPrice: 11,
    notes: 'Salt rim. Ting splash in glass first, rest in shaker. Cubes + grapefruit slice.',
    ingredients: [
      { id: 'tequila-silver',  ml: 50 },
      { id: 'lime-juice',      ml: 10 },
      { id: 'agave-syrup',     ml: 10 },
      { id: 'grapefruit-juice', ml: 60 },
      { id: 'soft-ting',       ml: 50 },
      { id: 'salt-rim',        ml: 1 },
      { id: 'grapefruit-slice', ml: 1 },
    ],
  },
  {
    id: 'cocktail-whiskey-sour', category: 'cocktail', name: 'Whiskey Sour', sellPrice: 11,
    notes: 'Shake, dry shake, double strain. Angostura line on top.',
    ingredients: [
      { id: 'bourbon',         ml: 50 },
      { id: 'lemon-juice',     ml: 30 },
      { id: 'sugar-syrup',     ml: 10 },
      { id: 'angostura',       ml: 0.5 },
      { id: 'foamer',          ml: 2 },
    ],
  },
  {
    id: 'cocktail-amaretto-sour', category: 'cocktail', name: 'Amaretto Sour', sellPrice: 11,
    notes: 'Shake, dry shake, double strain into coupe. Angostura line on top.',
    ingredients: [
      { id: 'amaretto',        ml: 75 },
      { id: 'lemon-juice',     ml: 30 },
      { id: 'angostura',       ml: 0.5 },
      { id: 'foamer',          ml: 2 },
    ],
  },
  {
    id: 'cocktail-solero-colada', category: 'cocktail', name: 'Solero Colada', sellPrice: 12,
    notes: 'Shake. Crushed ice. Splash passion fruit puree + pineapple leaf garnish.',
    ingredients: [
      { id: 'rum-spiced',          ml: 50 },
      { id: 'pineapple-juice',     ml: 50 },
      { id: 'coconut-cream',       ml: 40 },
      { id: 'passion-fruit-puree', ml: 15 },
      { id: 'pineapple-leaf',      ml: 1 },
    ],
  },
  {
    id: 'cocktail-plonkers-punch', category: 'cocktail', name: "Plonker's Punch", sellPrice: 11,
    notes: 'Build in highball, cubes to top. Premixed juice. Pineapple slice.',
    ingredients: [
      { id: 'rum-havana-especial', ml: 30 },
      { id: 'triple-sec',          ml: 20 },
      { id: 'pineapple-juice',     ml: 50 },
      { id: 'rum-wray-nephew',     ml: 10 },
      { id: 'grenadine',           ml: 10 },
    ],
  },
  {
    id: 'cocktail-negroni', category: 'cocktail', name: 'Negroni', sellPrice: 11,
    notes: 'Build over cubes, stir 20 sec, add more ice + garnish. No straw.',
    ingredients: [
      { id: 'gin-house',          ml: 25 },
      { id: 'campari',            ml: 25 },
      { id: 'vermouth-cocchi',    ml: 25 },
      { id: 'orange-peel',        ml: 1 },
    ],
  },
  {
    id: 'cocktail-bloody-mary', category: 'cocktail', name: 'Bloody Mary', sellPrice: 11,
    notes: 'Shaker throw 8 times. Cubes to top in highball. S+P rim. Celery + lemon.',
    ingredients: [
      { id: 'vodka',           ml: 50 },
      { id: 'tomato-juice',    ml: 75 },
      { id: 'lemon-juice',     ml: 20 },
      { id: 'worcestershire',  ml: 2 },
      { id: 'tabasco',         ml: 2 },
      { id: 'celery-stick',    ml: 1 },
      { id: 'salt-rim',        ml: 1 },
    ],
  },
  {
    id: 'cocktail-fields', category: 'cocktail', name: 'Fields', sellPrice: 12,
    notes: 'Stir 15 sec in rocks. Zest lemon on top + express round rim. Ice to top.',
    ingredients: [
      { id: 'umeshu-plum-sake', ml: 75 },
      { id: 'vermouth-sweet',   ml: 10 },
      { id: 'lemon-bitters',    ml: 1 },
      { id: 'lemon-twist',      ml: 1 },
    ],
  },
  {
    id: 'cocktail-cola-soda', category: 'cocktail', name: 'Cola Soda / Spritzer', sellPrice: 11,
    notes: 'Large wine glass. Pour in, top with ice. Orange slice.',
    ingredients: [
      { id: 'rum-kraken',      ml: 15 },
      { id: 'falernum',        ml: 25 },
      { id: 'amaro',           ml: 30 },
      { id: 'wine-prosecco',   ml: 75 },
      { id: 'postmix-soda',    ml: 100 },
      { id: 'orange-slice',    ml: 1 },
    ],
  },
  {
    id: 'cocktail-mango-mojito', category: 'cocktail', name: 'Mango Mojito', sellPrice: 11,
    notes: 'Squeeze limes, add all, crushed ice, stir to break mint, soda splash + crushed top.',
    ingredients: [
      { id: 'rum-havana-especial', ml: 50 },
      { id: 'mango-puree',         ml: 40 },
      { id: 'passion-fruit-puree', ml: 5 },
      { id: 'mint-leaf',           ml: 7 },
      { id: 'lime-wedge',          ml: 2 },
      { id: 'postmix-soda',        ml: 50 },
    ],
  },
  {
    id: 'cocktail-classic-mojito', category: 'cocktail', name: 'Classic Mojito', sellPrice: 11,
    notes: 'Like Mango Mojito but skip mango, add 25ml lime juice instead.',
    ingredients: [
      { id: 'rum-havana-especial', ml: 50 },
      { id: 'lime-juice',          ml: 25 },
      { id: 'sugar-syrup',         ml: 10 },
      { id: 'mint-leaf',           ml: 7 },
      { id: 'lime-wedge',          ml: 2 },
      { id: 'postmix-soda',        ml: 50 },
    ],
  },
  {
    id: 'cocktail-michelada-full', category: 'cocktail', name: 'Michelada (Full)', sellPrice: 10,
    notes: 'Tajín rim. All into highball on cubes, top with lager. Lime slice.',
    ingredients: [
      { id: 'tequila-silver',       ml: 25 },
      { id: 'lime-juice',           ml: 25 },
      { id: 'tomato-juice',         ml: 50 },
      { id: 'valentina-hot-sauce',  ml: 12.5 },
      { id: 'worcestershire',       ml: 12.5 },
      { id: 'keg-camden-hells',     ml: 200 },
      { id: 'tajin-rim',            ml: 1 },
      { id: 'lime-slice',           ml: 1 },
    ],
  },
  {
    id: 'cocktail-old-fashioned', category: 'cocktail', name: 'Old Fashioned', sellPrice: 11,
    notes: 'Stir 12 sec, strain into rocks ice to top. Orange peel expressed + dropped in.',
    ingredients: [
      { id: 'bourbon',         ml: 50 },
      { id: 'sugar-syrup',     ml: 10 },
      { id: 'angostura',       ml: 1 },
      { id: 'orange-peel',     ml: 1 },
    ],
  },

  // ─── LONG DRINKS (Dec 2025 spec sheet additions) ────────────────
  {
    id: 'spritz-aperol-single', category: 'spritz', name: 'Aperol Spritz (single)', sellPrice: 9,
    notes: 'Aperol + soda + cubed ice. Top with prosecco. Don\'t stir. Orange slice.',
    ingredients: [
      { id: 'aperol',          ml: 50 },
      { id: 'wine-prosecco',   ml: 75 },
      { id: 'postmix-soda',    ml: 50 },
      { id: 'orange-slice',    ml: 1 },
    ],
  },
  {
    id: 'spritz-lillet', category: 'spritz', name: 'Lillet Spritz', sellPrice: 9,
    notes: 'Same method as other spritzers. Lemon garnish.',
    ingredients: [
      { id: 'lillet',           ml: 70 },
      { id: 'lemon-juice',      ml: 5 },
      { id: 'postmix-soda',     ml: 75 },
      { id: 'postmix-lemonade', ml: 50 },
      { id: 'lemon-twist',      ml: 1 },
    ],
  },
  {
    id: 'spritz-white-wine', category: 'spritz', name: 'White Wine Spritzer', sellPrice: 8,
    notes: 'Wine glass build. Ask soda or lemonade.',
    ingredients: [
      { id: 'wine-blanco-blanco', ml: 100 },
      { id: 'postmix-lemonade',   ml: 100 },
    ],
  },
  {
    id: 'spritz-michelada-sol', category: 'spritz', name: 'Michelada (Sol)', sellPrice: 9,
    notes: 'Tajín rim. Pour everything except Sol on cubes. Stir. Top with Sol + serve rest alongside.',
    ingredients: [
      { id: 'tomato-juice',     ml: 50 },
      { id: 'lime-juice',       ml: 15 },
      { id: 'tabasco',          ml: 2 },
      { id: 'worcestershire',   ml: 1 },
      { id: 'soy-sauce',        ml: 1 },
      { id: 'btl-sol',          ml: 330 },
      { id: 'tajin-rim',        ml: 1 },
    ],
  },

  // ─── JUGS — sold by the jug, lower margin target (75%) ──────────
  {
    id: 'jug-dark-stormy', category: 'jug', name: 'Dark & Stormy (Jug)', sellPrice: 28,
    notes: 'Fill jug with cubes, rum + lime, top ginger beer, splash angostura, mix.',
    ingredients: [
      { id: 'rum-havana-7',      ml: 150 },
      { id: 'lime-juice',        ml: 45 },
      { id: 'soft-ginger-beer',  ml: 500 },
      { id: 'angostura',         ml: 3 },
      { id: 'lime-wedge',        ml: 4 },
    ],
  },
  {
    id: 'jug-aperol-spritz', category: 'jug', name: 'Aperol Spritz (Jug)', sellPrice: 30,
    notes: 'Aperol + cubes + soda + prosecco, stir. Orange slices.',
    ingredients: [
      { id: 'aperol',          ml: 150 },
      { id: 'wine-prosecco',   ml: 500 },
      { id: 'postmix-soda',    ml: 150 },
      { id: 'orange-slice',    ml: 3 },
    ],
  },
  {
    id: 'jug-pimms', category: 'jug', name: "Pimm's (Jug)", sellPrice: 28,
    notes: 'Jug + cubes + Pimm\'s + lemonade top. Mixed fruit garnish.',
    ingredients: [
      { id: 'pimms',            ml: 150 },
      { id: 'postmix-lemonade', ml: 500 },
      { id: 'lemon-twist',      ml: 2 },
      { id: 'orange-slice',     ml: 2 },
      { id: 'strawberry',       ml: 3 },
      { id: 'mint-leaf',        ml: 6 },
    ],
  },
  {
    id: 'jug-plonkers-punch', category: 'jug', name: "Plonker's Punch (Jug)", sellPrice: 32,
    notes: 'Cubes + rum + triple sec + juices + grenadine finish. Premixed juices.',
    ingredients: [
      { id: 'rum-havana-especial', ml: 120 },
      { id: 'triple-sec',          ml: 60 },
      { id: 'pineapple-juice',     ml: 100 },
      { id: 'orange-juice',        ml: 100 },
      { id: 'grenadine',           ml: 30 },
      { id: 'orange-slice',        ml: 3 },
    ],
  },

  // ─── MOCKTAILS — no-ABV, target 78% ─────────────────────────────
  {
    id: 'mock-mojito', category: 'mocktail', name: 'Mocktail Mojito', sellPrice: 6,
    notes: 'Squeeze wedges, add all, crushed ice, stir to break mint, crushed ice top.',
    ingredients: [
      { id: 'lime-juice',     ml: 50 },
      { id: 'sugar-syrup',    ml: 10 },
      { id: 'mint-leaf',      ml: 7 },
      { id: 'lime-wedge',     ml: 2 },
      { id: 'postmix-soda',   ml: 50 },
    ],
  },
  {
    id: 'mock-banana-colada', category: 'mocktail', name: 'Mocktail Banana Colada', sellPrice: 6,
    notes: 'Shake, pour over crushed ice. Cherry on the ice.',
    ingredients: [
      { id: 'pineapple-juice',  ml: 100 },
      { id: 'coconut-cream',    ml: 40 },
      { id: 'banana-syrup',     ml: 12 },
      { id: 'cherry-cocktail',  ml: 1 },
    ],
  },
  {
    id: 'mock-plonkers-punch', category: 'mocktail', name: "Mocktail Plonker's Punch", sellPrice: 6,
    notes: 'Highball + cubes + equal pineapple/orange + grenadine top (gradient).',
    ingredients: [
      { id: 'pineapple-juice', ml: 100 },
      { id: 'orange-juice',    ml: 100 },
      { id: 'grenadine',       ml: 15 },
    ],
  },
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
