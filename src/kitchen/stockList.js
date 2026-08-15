// No Dice — Kitchen stock checklist ("On A Roll" food truck).
// A simple order sheet: every item the kitchen carries, generated from the menu
// + the ingredient/produce list the founder shared. Walk the kitchen, type the
// quantity you need next to each line, and it saves to the device (like the bar
// stock check). `unit` is just a hint for the order — edit freely.
//
// Founder will query any mistakes — this is a first pass from the menu + labels
// (23 Jul ingredient sheet, product photos) and the current "On A Roll" menu
// (Cheeseburger, Bella Mortadella, Halloumi burger + harissa mayo, Mumzy's
// spring rolls, Chips, Cheesy chip butty, Padron peppers).

export const KITCHEN_STOCK_KEY = 'ndb_kitchen_stock_v1'

export const KITCHEN_STOCK = {
  note: 'Weekly kitchen order.',
  groups: [
    {
      key: 'proteins', label: 'Proteins & dairy',
      items: [
        { key: 'ks-patty', name: 'Wagyu beef patties (8oz)', unit: 'patty / box' },
        { key: 'ks-mortadella', name: 'Mortadella', unit: 'whole / kg' },
        { key: 'ks-halloumi', name: 'Halloumi', unit: 'block' },
        { key: 'ks-mozzarella', name: 'Mozzarella', unit: 'ball / pack' },
        { key: 'ks-cheese-slices', name: 'American cheese slices', unit: 'pack' },
        { key: 'ks-butter', name: 'Butter (unsalted)', unit: 'block' },
      ],
    },
    {
      key: 'bread', label: 'Bread',
      items: [
        { key: 'ks-brioche', name: 'Brioche buns (seeded)', unit: 'pack' },
        { key: 'ks-kaiser', name: 'Kaiser rolls', unit: 'pack' },
      ],
    },
    {
      key: 'produce', label: 'Fresh produce',
      items: [
        { key: 'ks-onions', name: 'Onions', unit: 'kg / sack' },
        { key: 'ks-shallots', name: 'Shallots', unit: 'kg' },
        { key: 'ks-tomatoes', name: 'Tomatoes', unit: 'kg / box' },
        { key: 'ks-cucumber', name: 'Cucumber', unit: 'each' },
        { key: 'ks-carrots', name: 'Carrots', unit: 'kg' },
        { key: 'ks-cabbage', name: 'Cabbage', unit: 'each' },
        { key: 'ks-celery', name: 'Celery', unit: 'head' },
        { key: 'ks-garlic', name: 'Garlic', unit: 'bulb / pack' },
        { key: 'ks-padron', name: 'Padron peppers', unit: 'pack / kg' },
        { key: 'ks-gherkins', name: 'Gherkins / cornichons', unit: 'jar' },
      ],
    },
    {
      key: 'frozen-dry', label: 'Frozen & dry',
      items: [
        { key: 'ks-chips', name: 'Skin-on fries (chips)', unit: 'case' },
        { key: 'ks-flour', name: 'Plain flour (spring roll wrappers)', unit: 'bag' },
      ],
    },
    {
      key: 'sauces', label: 'Sauces & condiments',
      items: [
        { key: 'ks-burger-sauce', name: 'Burger sauce', unit: 'bottle' },
        { key: 'ks-mayo', name: 'Mayonnaise', unit: 'tub' },
        { key: 'ks-mustard', name: 'Dijon mustard', unit: 'jar' },
        { key: 'ks-ketchup', name: 'Ketchup', unit: 'bottle' },
        { key: 'ks-harissa', name: 'Harissa (for harissa mayo)', unit: 'tube / jar' },
        { key: 'ks-sweet-chilli', name: 'Sweet chilli sauce', unit: 'bottle' },
        { key: 'ks-soy', name: 'Soy sauce', unit: 'bottle' },
        { key: 'ks-oyster', name: 'Mushroom "oyster" sauce', unit: 'bottle' },
        { key: 'ks-balsamic', name: 'Balsamic vinegar', unit: 'bottle' },
      ],
    },
    {
      key: 'oils-seasoning', label: 'Oils & seasoning',
      items: [
        { key: 'ks-corn-oil', name: 'Corn oil (frying)', unit: '5 L' },
        { key: 'ks-olive-oil', name: 'Olive oil', unit: 'bottle' },
        { key: 'ks-rock-salt', name: 'Himalayan / rock salt', unit: 'tub' },
        { key: 'ks-sea-salt', name: 'Sea salt flakes (Maldon)', unit: 'tub' },
        { key: 'ks-sugar', name: 'Caster sugar', unit: 'bag' },
        { key: 'ks-white-pepper', name: 'White pepper', unit: 'tub' },
        { key: 'ks-black-pepper', name: 'Black pepper', unit: 'tub' },
        { key: 'ks-star-anise', name: 'Star anise', unit: 'pack' },
      ],
    },
  ],
}

export function loadKitchenStock() {
  try {
    const raw = localStorage.getItem(KITCHEN_STOCK_KEY)
    if (raw) { const p = JSON.parse(raw); return { qty: p.qty || {} } }
  } catch {}
  return { qty: {} }
}

export function saveKitchenStock(state) {
  try { localStorage.setItem(KITCHEN_STOCK_KEY, JSON.stringify(state)) } catch {}
}
