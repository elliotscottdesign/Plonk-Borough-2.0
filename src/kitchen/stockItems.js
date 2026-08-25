// On A Roll — kitchen stock list, run down at CLOSE of every shift so the next
// day's kitchen person knows what to grab on the way in + what to prep.
// Grouped by how you get it: `buy` (purchase) vs `prep` (make in the kitchen).
// Menu facts baked in (founder, Aug 2026): brioche buns, patties, condiments,
// chips (bags) and spring rolls (frozen) are all PURCHASED. Only caramelised
// onions and sliced tomato are made in-house.

export const STOCK_GROUPS = [
  { key: 'proteins', label: '🥩 Proteins & dairy', kind: 'buy', items: [
    'Beef patties (Wagyu)', 'Halloumi', 'American cheese slices', 'Mozzarella', 'Mortadella',
  ] },
  { key: 'bread', label: '🍞 Bread & frozen', kind: 'buy', items: [
    'Brioche buns / rolls', 'Skin-on fries (bags)', 'Frozen spring rolls',
  ] },
  { key: 'produce', label: '🥬 Fresh produce', kind: 'buy', items: [
    'Brown onions', 'Tomatoes', 'Green peppers', 'Padron peppers', 'Cucumber', 'Gherkins / cornichons',
  ] },
  { key: 'sauces', label: '🧂 Condiments & sauces', kind: 'buy', items: [
    'Burger sauce', 'Harissa mayo', 'Mustard mayo / Dijon', 'Mayonnaise', 'Ketchup', 'Sweet chilli sauce', 'Balsamic',
  ] },
  { key: 'dry', label: '🧴 Dry & other', kind: 'buy', items: [
    'Cooking oil (fryer)', 'Salt', 'Butter', 'Sugar',
  ] },
  { key: 'packaging', label: '📦 Packaging', kind: 'buy', items: [
    'Burger boxes', 'Chip cups', 'Napkins', 'Sauce pots', 'Forks',
  ] },
  { key: 'prep', label: '🔪 Made in-house (prep)', kind: 'prep', items: [
    'Caramelised onions', 'Sliced tomato',
  ] },
]

// Who can be @-messaged the "grab on the way in" list (matched to staff by first
// name in the rota shift-note system). Edit here if the closing team changes.
export const STOCK_RECIPIENTS = ['Elliott', 'Leonie', 'Jude']

export const STOCK_ITEMS = STOCK_GROUPS.flatMap(g => g.items.map(name => ({ name, group: g.key, kind: g.kind })))
