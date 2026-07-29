// No Dice — allergen matrix (food truck menu). The 14 FSA allergens PLUS mushroom
// (not one of the legal 14, but a real allergy we track because our spring rolls use
// a mushroom-based sauce). Status per cell: 'contains' (●) · 'trace' = may contain /
// cross-contact (○) · 'pending' = still confirming (⧗) · absent key = no. This is the
// internal record AND the source for the customer-facing printable grid. A few cells
// are still ⧗ PENDING, driven by the outstanding label-reads in PENDING below.

export const ALLERGENS = [
  { key: 'celery', label: 'Celery' },
  { key: 'gluten', label: 'Gluten' },
  { key: 'crustaceans', label: 'Crustaceans' },
  { key: 'eggs', label: 'Eggs' },
  { key: 'fish', label: 'Fish' },
  { key: 'lupin', label: 'Lupin' },
  { key: 'milk', label: 'Milk' },
  { key: 'molluscs', label: 'Molluscs' },
  { key: 'mustard', label: 'Mustard' },
  { key: 'nuts', label: 'Nuts' },
  { key: 'peanuts', label: 'Peanuts' },
  { key: 'sesame', label: 'Sesame' },
  { key: 'soya', label: 'Soya' },
  { key: 'sulphites', label: 'Sulphites' },
  { key: 'mushroom', label: 'Mushroom' },   // extra (not a legal 14) — our spring-roll sauce
]
export const ALLERGEN_KEYS = ALLERGENS.map(a => a.key)
export const allergenLabel = (k) => (ALLERGENS.find(a => a.key === k) || {}).label || k

export const STATUS_META = {
  contains: { symbol: '●', label: 'Contains', color: '#DA1B33' },
  trace:    { symbol: '○', label: 'May contain / cross-contact', color: '#F59E0B' },
  pending:  { symbol: '⧗', label: 'Checking', color: '#93C5FD' },
  no:       { symbol: '',  label: 'No', color: 'rgba(255,255,255,0.25)' },
}
export const STATUS_ORDER = ['no', 'trace', 'pending', 'contains']
export const statusOf = (cell) => (cell && STATUS_META[cell]) ? cell : 'no'

// Default matrix — the record so far. `allergens` holds only non-"no" cells.
export const DEFAULT_MATRIX = [
  { dish: 'Cheeseburger & chips', allergens: { celery: 'trace', gluten: 'contains', eggs: 'contains', milk: 'contains', mushroom: 'trace', mustard: 'contains', soya: 'pending', sulphites: 'contains' } },
  { dish: 'Bella Mortadella & chips', allergens: { celery: 'trace', gluten: 'contains', eggs: 'contains', milk: 'contains', mushroom: 'trace', mustard: 'contains', nuts: 'pending', soya: 'pending' } },
  { dish: 'Halloumi burger & chips', allergens: { celery: 'trace', gluten: 'contains', eggs: 'contains', milk: 'contains', mushroom: 'trace', soya: 'pending', sulphites: 'contains' } },
  { dish: "Mumzy's spring rolls", allergens: { celery: 'contains', gluten: 'contains', mushroom: 'contains', nuts: 'trace', peanuts: 'trace', sesame: 'trace', soya: 'contains' } },
  { dish: 'Chips', allergens: { celery: 'trace', gluten: 'trace', mushroom: 'trace', soya: 'trace' } },
  { dish: 'Cheesy chip butty', allergens: { celery: 'trace', gluten: 'contains', eggs: 'contains', milk: 'contains', mushroom: 'trace', soya: 'pending' } },
  { dish: 'Ketchup', allergens: { celery: 'contains' } },
  { dish: 'Mayo (Hellmann’s)', allergens: { eggs: 'contains' } },
  { dish: 'Burger sauce', allergens: { eggs: 'contains', mustard: 'contains' } },
]

// Why the grid looks the way it does (from label reads) — shown under the matrix.
export const MATRIX_DRIVERS = [
  'Ketchup contains celery (Heinz — spice/herb extract). It’s in the cheeseburger & sauces.',
  'Balsamic (sulphites) is in the caramelised onions → cheeseburger + halloumi burger carry sulphites; the onions also contain butter (milk).',
  'The spring-roll sauce is MUSHROOM "oyster" sauce (vegetarian — NOT real oyster/mollusc), so the spring rolls contain mushroom and there are NO molluscs anywhere on the menu.',
  'Shared fryer (chips + spring rolls) → chips are NOT gluten-free and carry soya/celery/mushroom as cross-contact; every "& chips" dish inherits this.',
  'Confirmed contains: burger sauce = mustard + egg; Hellmann’s mayo = egg (label says gluten-free); Dijon = mustard; halloumi/cheese/butter = milk; brioche buns = gluten + egg (milk/soya to confirm); spring rolls = celery (fresh) + gluten (flour) + soya (soy sauce) + mushroom (mushroom oyster sauce).',
  'Confirmed no allergens: Opies gherkins, Le Phare harissa, corn oil, olive oil, Maldon/Himalayan salt, sugar, sweet chilli (recipe clean; label "may contain sesame/peanut/nut").',
]

// Still outstanding before the matrix is legally final (§7) — surfaced to the manager.
export const PENDING = [
  'Mortadella allergen sheet/label — pistachio (nuts)? soya? milk? (deli-counter, no readable panel yet). Highest priority.',
  'Soy sauce label — confirms soya + (usually) wheat/gluten (drives the spring rolls’ soya/gluten).',
  'Skin-on fries back-of-pack + kaiser roll packaging + full brioche bun panel (confirm milk/soya).',
]
