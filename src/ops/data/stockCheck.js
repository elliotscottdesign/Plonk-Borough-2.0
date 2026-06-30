// ─── No Dice — Weekly Stock Check sheet ────────────────────────────────
// A simple count-and-order sheet for the regular weekly buys (draught,
// cider, post-mix, fresh produce, wine, prosecco, snacks). Walk the bar,
// write in what you HAVE, set a PAR once, and "To order" = par − in stock.
// Backbar spirits aren't here (they're a slower, separate order) — add a
// group below if you want them.
//
// Grouped by supplier so an order is one section at a time. Items + units
// mirror the current range in costing.js (Jun 2026): Five Points on tap,
// Oliver's cider, Top Cuvée + GWGP + Noble Rot wines, Drinks Club prosecco.
// ───────────────────────────────────────────────────────────────────────

export const STOCK_CHECK_KEY = 'ndb_ops_stockcheck_v1'

export const STOCK_CHECK = {
  note: "Weekly count. Write in what you have; set a Par once and 'To order' fills itself (Par − In stock).",
  groups: [
    {
      key: 'draught', label: 'Draught — kegs', supplier: 'Five Points',
      items: [
        { key: 'sc-xpa',  name: 'Five Points XPA',  unit: '30L keg' },
        { key: 'sc-pils', name: 'Five Points Pils', unit: '30L keg' },
      ],
    },
    {
      key: 'cider', label: 'Cider', supplier: 'The Fine Cider Company',
      items: [
        { key: 'sc-olivers', name: "Oliver's Fine Cider", unit: 'case (24 × 330ml)' },
      ],
    },
    {
      key: 'postmix', label: 'Post-mix (BIB)', supplier: 'Drinks Club · soda/CO₂ from BOC',
      items: [
        { key: 'sc-pm-coke',     name: 'Coke',      unit: '7L BIB' },
        { key: 'sc-pm-diet',     name: 'Diet Coke', unit: '7L BIB' },
        { key: 'sc-pm-lemonade', name: 'Lemonade',  unit: '7L BIB' },
        { key: 'sc-pm-tonic',    name: 'Tonic',     unit: 'BIB / bottles' },
      ],
    },
    {
      key: 'sugar', label: 'Sugar & syrups', supplier: 'Brakes',
      items: [
        { key: 'sc-sugar',  name: 'Sugar (for syrup)',         unit: 'kg bag' },
        { key: 'sc-syrup',  name: 'Sugar syrup (made / bought)', unit: 'litre' },
      ],
    },
    {
      key: 'produce', label: 'Fruit & perishables', supplier: 'Brakes',
      items: [
        { key: 'sc-lime',       name: 'Limes',      unit: 'case (×60)' },
        { key: 'sc-lemon',      name: 'Lemons',     unit: 'case' },
        { key: 'sc-grapefruit', name: 'Grapefruit', unit: 'each' },
        { key: 'sc-orange',     name: 'Oranges',    unit: 'each' },
        { key: 'sc-mint',       name: 'Mint',       unit: '100g bunch' },
        { key: 'sc-cucumber',   name: 'Cucumber',   unit: 'each' },
        { key: 'sc-jalapeno',   name: 'Jalapeños',  unit: 'kg' },
        { key: 'sc-watermelon', name: 'Watermelon', unit: '20kg case' },
      ],
    },
    {
      key: 'wine-tc', label: 'Wine — Top Cuvée', supplier: 'Top Cuvée',
      items: [
        { key: 'sc-w-blanco',     name: 'Blanco Blanco (white)',  unit: 'bottle' },
        { key: 'sc-w-conejos',    name: 'Los Conejos Tinto (red)', unit: 'bottle' },
        { key: 'sc-w-doomrose',   name: 'Doom Juice Rosé',        unit: 'bottle' },
        { key: 'sc-w-doomrouge',  name: 'Doom Juice Rouge',       unit: 'bottle' },
        { key: 'sc-w-orange',     name: 'Top Cuvée House Orange', unit: 'bottle' },
        { key: 'sc-w-petard',     name: 'Rouge Petard',           unit: 'bottle' },
        { key: 'sc-w-beaujolais', name: 'Beaujolais Nouveau',     unit: 'bottle' },
        { key: 'sc-w-favonius',   name: 'Favonius Orange',        unit: 'bottle' },
      ],
    },
    {
      key: 'wine-other', label: 'Wine — other suppliers', supplier: 'GWGP · Noble Rot',
      items: [
        { key: 'sc-w-cueva',   name: 'Cueva Nueva Vermut (500ml)', unit: 'bottle', supplier: 'GWGP' },
        { key: 'sc-w-lentsch', name: 'Lentsch Grüner Veltliner',   unit: 'bottle', supplier: 'GWGP' },
        { key: 'sc-w-chinchin', name: 'Chin Chin Vinho Verde',     unit: 'bottle', supplier: 'Noble Rot' },
      ],
    },
    {
      key: 'prosecco', label: 'Prosecco', supplier: 'Drinks Club',
      items: [
        { key: 'sc-prosecco-big',   name: 'Prosecco 750ml (big)',  unit: 'bottle' },
        { key: 'sc-prosecco-small', name: 'Mini Prosecco 20cl (small)', unit: 'bottle' },
      ],
    },
    {
      key: 'snacks', label: 'Snacks', supplier: 'Snack!',
      items: [
        { key: 'sc-gilda',  name: 'Gilda',         unit: 'tub / box' },
        { key: 'sc-crisps', name: 'Crisps',        unit: 'box' },
        { key: 'sc-nuts',   name: 'Nuts',          unit: 'box' },
        { key: 'sc-salami', name: 'Salami snacks', unit: 'box' },
        { key: 'sc-olives', name: 'Olives',        unit: 'tub' },
      ],
    },

    // ─── Backbar spirits — grouped by type (count shelf by shelf) ──────
    {
      key: 'sp-gin', label: 'Backbar — Gin', supplier: 'Hanbury (True Brew Co)',
      items: [
        { key: 'sp-gin-house',     name: 'House Gin — Hanbury London Dry', unit: '2.1L refill' },
        { key: 'sp-gin-cranberry', name: 'Hanbury Spiced Cranberry Gin',   unit: '2.1L refill' },
      ],
    },
    {
      key: 'sp-vodka', label: 'Backbar — Vodka', supplier: 'Drinks Club',
      items: [
        { key: 'sp-vodka', name: 'Vodka (Absolut Blue)', unit: '700ml' },
      ],
    },
    {
      key: 'sp-agave', label: 'Backbar — Tequila & Mezcal', supplier: 'Drinks Club',
      items: [
        { key: 'sp-teq-silver',   name: 'Cazcabel Blanco (silver)', unit: '700ml' },
        { key: 'sp-teq-reposado', name: 'Cazcabel Reposado',        unit: '700ml' },
        { key: 'sp-mezcal-vida',  name: 'Vida Mezcal',              unit: '700ml' },
        { key: 'sp-mezcal-house', name: 'Madre Mezcal (house)',     unit: '700ml' },
      ],
    },
    {
      key: 'sp-rum', label: 'Backbar — Rum & Cachaça', supplier: 'Drinks Club',
      items: [
        { key: 'sp-cachaca',    name: 'Cachaça (Velho Barreiro)', unit: '700ml' },
        { key: 'sp-havana-esp', name: 'Havana Especial',          unit: '700ml' },
        { key: 'sp-havana-3',   name: 'Havana Club 3yr',          unit: '700ml' },
        { key: 'sp-havana-7',   name: 'Havana Club 7yr',          unit: '700ml' },
        { key: 'sp-wray',       name: 'Wray & Nephew Overproof',  unit: '700ml' },
        { key: 'sp-kraken',     name: 'Kraken Black Spiced',      unit: '700ml' },
      ],
    },
    {
      key: 'sp-whisky', label: 'Backbar — Whisky & Bourbon', supplier: 'Drinks Club',
      items: [
        { key: 'sp-bourbon', name: 'Four Roses Bourbon',      unit: '700ml' },
        { key: 'sp-whiskey', name: 'Jameson (house whiskey)',  unit: '700ml' },
      ],
    },
    {
      key: 'sp-liqueurs', label: 'Backbar — Liqueurs', supplier: 'Drinks Club',
      items: [
        { key: 'sp-triple-sec',   name: 'Triple Sec',             unit: '700ml' },
        { key: 'sp-kahlua',       name: 'Kahlúa',                 unit: '700ml' },
        { key: 'sp-baileys',      name: 'Baileys',                unit: '700ml' },
        { key: 'sp-st-germain',   name: 'St Germain',             unit: '700ml' },
        { key: 'sp-chartreuse',   name: 'Green Chartreuse',       unit: '700ml' },
        { key: 'sp-limoncello',   name: 'Limoncello (Luxardo)',   unit: '700ml' },
        { key: 'sp-amaretto',     name: 'Disaronno Amaretto',     unit: '700ml' },
        { key: 'sp-kings-ginger', name: "King's Ginger Liqueur",  unit: '500ml' },
        { key: 'sp-passionfruit', name: 'Passion Fruit Liqueur',  unit: '700ml' },
        { key: 'sp-falernum',     name: 'Velvet Falernum',        unit: '700ml' },
        { key: 'sp-sambuca',      name: 'Sambuca (Antica)',       unit: '700ml' },
      ],
    },
    {
      key: 'sp-aperitivo', label: 'Backbar — Aperitivo & Vermouth', supplier: 'Drinks Club',
      items: [
        { key: 'sp-campari',    name: 'Campari',                unit: '700ml' },
        { key: 'sp-aperol',     name: 'Aperol',                 unit: '700ml' },
        { key: 'sp-amaro',      name: 'Amaro Montenegro',       unit: '700ml' },
        { key: 'sp-cynar',      name: 'Cynar',                  unit: '700ml' },
        { key: 'sp-vermut',     name: 'Vermut (El Bandarra)',   unit: '1L' },
        { key: 'sp-verm-sweet', name: 'Sweet Vermouth (Martini Rosso)',  unit: '750ml' },
        { key: 'sp-verm-dry',   name: 'Dry Vermouth (Martini Extra Dry)', unit: '750ml' },
        { key: 'sp-cocchi',     name: 'Cocchi Americano',       unit: '750ml' },
      ],
    },
    {
      key: 'sp-other', label: 'Backbar — Absinthe & other', supplier: 'Drinks Club',
      items: [
        { key: 'sp-abs-choc',    name: 'Chocolate Absinthe', unit: '700ml', supplier: "Devil's Botany" },
        { key: 'sp-abs-london',  name: 'London Absinthe',    unit: '700ml', supplier: "Devil's Botany" },
        { key: 'sp-abs-regalis', name: 'Absinthe Regalis',   unit: '700ml', supplier: "Devil's Botany" },
        { key: 'sp-umeshu',      name: 'Akashi-Tai Plum Sake', unit: '500ml' },
        { key: 'sp-foamer',      name: "Ms Better's Foamer", unit: '120ml' },
      ],
    },
  ],
}

export function loadStockCheck() {
  try {
    const raw = localStorage.getItem(STOCK_CHECK_KEY)
    return raw ? JSON.parse(raw) : { stock: {}, par: {} }
  } catch {
    return { stock: {}, par: {} }
  }
}

export function saveStockCheck(state) {
  try { localStorage.setItem(STOCK_CHECK_KEY, JSON.stringify(state)) } catch {}
}
