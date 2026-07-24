// No Dice — Kitchen food-safety checklists (FSA "Safer Food, Better Business").
// Food truck at London Fields: flat-top griddle (plancha), twin-basket fryer,
// salamander, ~2 under-counter fridges + freezer, hand-wash-only sink (fresh-water
// tank + waste tank), interior wash-up room (double sinks + glasswasher). Cook to
// order — no hot-holding. Content is founder-confirmed; render the labels verbatim.
//
// Item types: 'check' (tick), 'temp' (record °C, has a target), 'text' (free note).
// A temp item fails when it lands outside target — fridges/freezer fail if too warm,
// cook/reheat fail if too cold. A failed critical item marks the whole run FAILED and
// needs a corrective-action note before it can be submitted.

// key slugs stay stable even if labels/order change, so saved runs stay readable.
export const KITCHEN_CADENCES = ['opening', 'service', 'closing', 'weekly', 'prep']

export const KITCHEN_TEMPLATES = {
  opening: {
    id: 'opening', title: 'Opening', cadence: 'daily', icon: '🌅',
    blurb: 'Before you start serving.',
    groups: [
      {
        title: 'Fitness to work & hygiene',
        items: [
          { key: 'open.fit_apron', label: 'Clean apron & hands, hair tied back, no jewellery', type: 'check', critical: true },
          { key: 'open.fit_illness', label: 'No diarrhoea / vomiting in the last 48 hrs — if yes, do not handle food', type: 'check', critical: true },
          { key: 'open.fit_cuts', label: 'Any cuts covered with a blue plaster', type: 'check' },
        ],
      },
      {
        title: 'Handwash & water',
        items: [
          { key: 'open.fresh_tank', label: 'Fresh-water tank filled', type: 'check' },
          { key: 'open.waste_tank', label: 'Waste tank empty & clean', type: 'check' },
          { key: 'open.soap_roll', label: 'Soap + blue roll stocked at hand-wash sink', type: 'check' },
        ],
      },
      {
        title: 'Temperatures (record the number)',
        items: [
          { key: 'open.fridge1_temp', label: 'Fridge 1 temperature', type: 'temp', critical: true, target: { max: 5, unit: 'C' } },
          { key: 'open.fridge2_temp', label: 'Fridge 2 temperature', type: 'temp', critical: true, target: { max: 5, unit: 'C' } },
          { key: 'open.freezer_temp', label: 'Freezer temperature', type: 'temp', critical: true, target: { max: -18, unit: 'C' } },
          { key: 'open.probe_ok', label: 'Probe thermometer working & wiped with a sanitising probe wipe', type: 'check' },
        ],
      },
      {
        title: 'Setup & stock',
        items: [
          { key: 'open.useby', label: 'Use-by dates checked; anything out of date binned', type: 'check', critical: true },
          { key: 'open.raw_below', label: 'Raw meat stored below ready-to-eat food in the fridge', type: 'check', critical: true },
          { key: 'open.boards', label: 'Colour boards clean & correct: red = raw meat, yellow = cooked meat, green = salad/veg', type: 'check' },
          { key: 'open.fryer', label: 'Fryer oil topped up & clean; heats to ~175 °C', type: 'check' },
          { key: 'open.griddle', label: 'Griddle clean & heating', type: 'check' },
          { key: 'open.sanitiser', label: 'Sanitiser spray + blue roll on prep surfaces', type: 'check' },
          { key: 'open.firstaid', label: 'First-aid kit & fire extinguisher present', type: 'check' },
        ],
      },
    ],
  },

  service: {
    id: 'service', title: 'During service', cadence: 'daily', icon: '🔄',
    blurb: 'Keep on top of these through service.',
    groups: [
      {
        title: 'During service',
        items: [
          { key: 'svc.handwash_hourly', label: 'Hand-wash tank checked (hourly): water clean, soap stocked', type: 'check' },
          { key: 'svc.cook_beef', label: 'Cook temp — beef patties: core ≥ 75 °C', type: 'temp', critical: true, target: { min: 75, unit: 'C' } },
          { key: 'svc.reheat_mortadella', label: 'Reheat — mortadella: piping hot ≥ 75 °C', type: 'temp', critical: true, target: { min: 75, unit: 'C' } },
          { key: 'svc.springrolls', label: 'Spring rolls / chips cooked through, piping hot', type: 'check' },
          { key: 'svc.hands_raw', label: 'Hands washed after raw meat, before buns / salad', type: 'check', critical: true },
          { key: 'svc.boards_sanitised', label: 'Boards / tongs sanitised between raw meat and ready-to-eat', type: 'check', critical: true },
          { key: 'svc.allergy', label: 'Allergy order handled: matrix checked, clean utensils, customer told', type: 'check' },
        ],
      },
    ],
  },

  closing: {
    id: 'closing', title: 'Closing', cadence: 'daily', icon: '🌙',
    blurb: 'End of trade — close the trailer down.',
    groups: [
      {
        title: 'Temperatures (record the number)',
        items: [
          { key: 'close.fridge1_temp', label: 'Fridge 1 temperature', type: 'temp', critical: true, target: { max: 5, unit: 'C' } },
          { key: 'close.fridge2_temp', label: 'Fridge 2 temperature', type: 'temp', critical: true, target: { max: 5, unit: 'C' } },
          { key: 'close.freezer_temp', label: 'Freezer temperature', type: 'temp', critical: true, target: { max: -18, unit: 'C' } },
        ],
      },
      {
        title: 'Turn everything off',
        items: [
          { key: 'close.fryer_off', label: 'Fryer off; oil filtered & covered', type: 'check' },
          { key: 'close.plancha_off', label: 'Plancha / griddle off', type: 'check' },
          { key: 'close.oven_off', label: 'Oven off (if you used it)', type: 'check' },
          { key: 'close.grill_micro_off', label: 'Buffalo grill & microwave off and unplugged', type: 'check' },
        ],
      },
      {
        title: 'Food storage',
        items: [
          { key: 'close.wrap_food', label: 'All open food wrapped (cling film), stored in fridge / on shelves, labelled & dated', type: 'check' },
          { key: 'close.fridges_wiped', label: 'Fridges & freezer wiped down inside', type: 'check' },
        ],
      },
      {
        title: 'Clean down',
        items: [
          { key: 'close.griddle_degrease', label: 'Griddle / plancha scraped & degreased', type: 'check' },
          { key: 'close.degrease_surfaces', label: 'All surfaces degreased then antibac-sprayed & wiped', type: 'check' },
          { key: 'close.grease_steel', label: 'Grease / oil the bare stainless-steel surfaces — plancha, fryer, oven (below & the shelf)', type: 'check' },
          { key: 'close.walls', label: 'Walls degreased in front of the plancha & fryer', type: 'check' },
          { key: 'close.sink', label: 'Sink cleaned', type: 'check' },
          { key: 'close.equipment_potwash', label: 'All dirty equipment taken to the main pot wash, washed, dried & brought back to the truck', type: 'check' },
          { key: 'close.behind_bin', label: 'Behind the bin area cleaned, sprayed & degreased', type: 'check' },
          { key: 'close.bins', label: 'Bin sealed (blue bag tied in); emptied if full, closed for the morning if not', type: 'check' },
          { key: 'close.floor_off', label: 'Nothing left on the floor overnight — everything up off the floor', type: 'check' },
          { key: 'close.floor', label: 'Floor swept & mopped (truck + wash-up room)', type: 'check' },
          { key: 'close.step', label: 'Wooden step outside swept & mopped', type: 'check' },
        ],
      },
      {
        title: 'Water (last)',
        items: [
          { key: 'close.waste_water', label: 'Waste-water bucket / tank checked — empty & rinse if needed (not in front of customers; can wait till morning)', type: 'check' },
          { key: 'close.water_mains', label: 'LAST JOB: turn the water off at the mains', type: 'check', critical: true },
        ],
      },
      {
        title: 'Sign-off',
        items: [
          { key: 'close.signoff', label: 'Staff sign-off — you closed the trailer down (manager reviews separately)', type: 'check', critical: true },
        ],
      },
    ],
  },

  weekly: {
    id: 'weekly', title: 'Weekly deep clean', cadence: 'weekly', icon: '🧽',
    blurb: 'Once a week (rota which day).',
    groups: [
      {
        title: 'Deep clean',
        items: [
          { key: 'wk.defrost_freezer', label: 'Defrost & clean freezer', type: 'check' },
          { key: 'wk.deep_fridges', label: 'Deep clean inside fridges incl. door seals', type: 'check' },
          { key: 'wk.fryer_oil', label: 'Full fryer oil change + clean fryer tank', type: 'check' },
          { key: 'wk.salamander', label: 'Descale / clean salamander grill & extraction fan + filters', type: 'check' },
          { key: 'wk.washup', label: 'Deep clean wash-up sinks, taps & drains', type: 'check' },
          { key: 'wk.glasswasher', label: 'Descale glasswasher / dishwasher, clean filter', type: 'check' },
          { key: 'wk.shelves', label: 'Clean shelves, storage racks & all lidded containers', type: 'check' },
          { key: 'wk.tanks', label: 'Empty, clean & sanitise both water tanks (fresh + waste)', type: 'check' },
          { key: 'wk.probe_accuracy', label: 'Check probe accuracy (iced water ≈ 0 °C)', type: 'temp', target: { min: -2, max: 2, unit: 'C' } },
          { key: 'wk.pest', label: 'Pest check — any droppings / signs?', type: 'check' },
          { key: 'wk.chemicals', label: 'Restock chemicals; check first-aid & fire kit', type: 'check' },
          { key: 'wk.allergen_review', label: 'Review allergen matrix vs current stock / suppliers', type: 'check' },
        ],
      },
    ],
  },

  prep: {
    id: 'prep', title: 'Batch prep', cadence: 'weekly', icon: '🍳',
    blurb: 'Batch prep in the wash-up room, then labelled & dated.',
    groups: [
      {
        title: 'Batch prep',
        items: [
          { key: 'prep.onions', label: 'Caramelise onions — batch, cool quickly, label + date, store ≤ 5 °C', type: 'check' },
          { key: 'prep.sauce', label: 'Make burger sauce / mustard mayo — label + date', type: 'check' },
          { key: 'prep.springrolls', label: 'Make spring rolls — label + date', type: 'check' },
          { key: 'prep.portion', label: 'Portion patties & mortadella — label + date', type: 'check' },
          { key: 'prep.salad', label: 'Prep tomato / cucumber / salad on the green board', type: 'check' },
          { key: 'prep.stock', label: 'Stock check: buns, cheese, spring rolls, chips, sauces', type: 'text' },
        ],
      },
    ],
  },
}

// A temp entry fails when it's outside target: too warm for fridges/freezer (max),
// too cold for cook/reheat (min). Returns true = fail.
export function tempFails(target, value) {
  if (target == null || value === '' || value == null || Number.isNaN(Number(value))) return false
  const v = Number(value)
  if (target.max != null && v > target.max) return true
  if (target.min != null && v < target.min) return true
  return false
}

// Human target label, e.g. "0–5 °C", "≤ −18 °C", "≥ 75 °C".
export function targetLabel(target) {
  if (!target) return ''
  const { min, max } = target
  if (min != null && max != null) return `${min}–${max} °C`
  if (max != null) return `≤ ${max} °C`
  if (min != null) return `≥ ${min} °C`
  return ''
}

// Flatten a template's items (across groups) — used to score completion + validate.
export function templateItems(cadence) {
  const t = KITCHEN_TEMPLATES[cadence]
  return t ? t.groups.flatMap(g => g.items) : []
}
