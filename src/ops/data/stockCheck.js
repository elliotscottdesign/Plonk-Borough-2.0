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
