// No Dice shift checklists — filled on shift (phone), saved per day, seen by the
// founder. Content taken from the venue's real daily/closing sheets, de-Plonked
// to No Dice (London Fields). Each item's text IS its key in the saved `items`
// map, so submissions stay human-readable and stable if the order changes.

export const CHECKLISTS = {
  opening: {
    key: 'opening', title: 'Opening', icon: '🌅',
    blurb: 'Run through before doors open.',
    sections: [
      {
        title: 'Venue & garden',
        items: [
          'Clock in',
          'Leave personal items (clothes & bags) in your staff locker',
          'Store gate padlocks in the correct place — put one on the back gate',
          'Switch on all lights',
          'Switch on pinball machines (kitchen socket) & the machines',
          'Switch on arcade machines & pong tables (wall plugs)',
          'Switch on golf course lighting',
          'Switch on music (Sound app)',
          'Check table / chair / stool positions',
          'Clean tables & hand sanitisers with anti-bac',
          'Put out drink & food menus',
          'Set up tables — hand sanitiser, napkins, QR codes, games (e.g. Jenga)',
          'Toilets: check clean & working, replace toilet roll, soap, sign',
          'Maintenance: check toilet door locks & lightbulbs — report if broken',
          'Check promo signs are hanging / put outside',
          'Arcade: check the foosball table — 8 balls each side',
          'Arcade: clean the machine glass (specific glass cleaner only)',
          'Check board games are neat & in the right places',
          'Golf: check the course for balls, wash if needed, return to the bucket',
          'Golf: sweep the course & front of gate, set up course, chairs, wipe tables',
          'Golf: check for broken / damaged parts — report any',
          'Golf: check supplies (balls, clubs, pencils, scorecards), top up',
          'Water the garden — give all the plants a water',
        ],
      },
      {
        title: 'Bar',
        items: [
          'Switch on iPads & payment devices — check connectivity & charging',
          'Switch on speakers (Bluetooth to iPad), play music (Soundtrack app)',
          'Check the bookings to gauge how busy the shift will be',
          'Switch on bar / fridge / back-bar lights & the slushie machine',
          'Switch on beer & post-mix gas',
          'Set up the glass washer — check it has enough detergent',
          'Set up the bar stations',
          'Garnishes: cut fruit (limes, lemons), prep mint',
          'Before a busy shift, cut extra fruit & store in labelled tubs',
          'Bar prep: check purées, coconut milk & speed rail are stocked',
          'Fill the ice wells / order ice if low',
          'Check fridges & shelves look neat, restock if needed',
          'Check citrus & juices are not off, and labelled',
          'Check bar snacks, restock (only refill the peanut jar when fully empty)',
          'Stock & tidy consumables (napkins, straws)',
          'Check the number of tokens behind the bar, restock if needed',
          'Open the front door / ensure the back fire door is unlocked before opening',
        ],
      },
    ],
  },

  during: {
    key: 'during', title: 'During shift', icon: '🔄',
    blurb: 'Keep on top of these through service.',
    sections: [
      {
        title: 'Every shift',
        items: [
          'Fridges restocked & looking tidy throughout',
          "Always follow Challenge 25 — use the till buttons when you ID people",
          'Floor tidy, glasses collected & wiped down regularly',
          'Clean golf clubs & balls regularly',
          'Sweep the golf course so it stays clear of debris',
          'Restock drinks behind the bar (juices & cans)',
          'Garden closed by 10pm',
          'Dim the lights for evening service (when dark outside)',
          'Brush up the pool tables / clean the cues',
          'Wipe down stools & tables',
          'Jenga pieces in the correct box (54 per box)',
          'Board games accessible & visible',
          'Playing card decks have 52 cards',
          'Kitchen surfaces clear & clean',
          'Check fruit stock',
          'Check both toilets clean & stocked every hour',
          'Check for rubbish out front & back',
          'Menus clean',
          'Bar top cleaned regularly',
        ],
      },
    ],
  },

  closing: {
    key: 'closing', title: 'Closing', icon: '🌙',
    blurb: 'Lock-up sequence — work top to bottom.',
    sections: [
      {
        title: 'Close down',
        items: [
          'Once all customers have left, lock the front & fire doors',
          'Clean all bar surfaces with anti-bac',
          'Consolidate & wipe all bottles, including the frequently-used back bar',
          'Pump air off wines; refill straws, napkins; all bottles with lids / pourers',
          'All barware & beer nozzles through the glass washer & put away',
          'Check toilets — taps off, no water running',
          "Gather dirty towels for washing, hang to dry (don't bag them wet)",
          'Switch off beer & post-mix gas',
          'Switch off bar / fridge / back-bar lights',
          'Close down the glass washer',
          'Golf: bring the stools inside',
          'Wipe arcade machines / tables / stools (people rest drinks on them)',
          'Arcade: clean the machine glass (specific glass cleaner only)',
          'Switch off pinball machines (kitchen socket)',
          'Switch off arcade machines (wall plugs)',
          'Switch off iPads, payment devices & speakers',
          'Sort rubbish — full bags out, wash bins; half bags fold & tie a loose knot',
          'Text the daily take & handover to the WhatsApp group',
          'Collect your personal items',
          'Clock out',
          "Switch off all lights (check the toilet lights) & lock up — you're done!",
        ],
      },
    ],
  },

  toilet: {
    key: 'toilet', title: 'Toilet checks', icon: '🚻',
    blurb: 'Check both toilets clean, stocked & working through the day.',
    sections: [
      {
        title: 'Both toilets checked — clean, stocked & working',
        items: ['12pm', '2pm', '4pm', '6pm', '8pm', '10pm'],
      },
    ],
  },

  'deep-clean': {
    key: 'deep-clean', title: 'Deep Clean', icon: '🧽',
    blurb: 'Quiet-shift deep clean (Mon–Wed). Photograph when done, then start fresh next week.',
    sections: [
      {
        title: 'Deep clean',
        items: [
          'After deep clean — fill the slushie machine with a new batch',
          'Organise the pre-mix / juice / syrup bottles, remove old labels & wash',
          'Glass washer deep clean / salting (inside & outside)',
          'Clean the shelves next to the glass washer & under the beer taps',
          'Deep clean the freezer',
          'Deep clean the golf course — balls & leaves in the deep corners',
          'Clean the bin area at the back door / mop it',
          'Refill soap in the toilets / check Febreze is stocked',
          'All glasses through the dishwasher, polished & put back',
          'Clean the shelf under the bar-back sink & restock',
          'Wipe down & hoover the golf course (do NOT hoover if the course is wet)',
          'Stools & chairs cleaned down',
          'Clean front & back windows, inside and out',
          'Clean the front signs',
          'Sweep the back-door area',
          'Check board games for parts (notes inside the box lids)',
          'Clean & organise the cages / stockroom, ready for stocktake & deliveries',
          'Empty & clean the slushie machine (record any waste on the till)',
          'Beer line clean',
          'Clean the beer couplers',
          'Dust all arcade machines & give them a proper clean',
          'Wash all bar shelves, incl. under the stations; wash the plastic grip mats',
          'Clean the bar fridges, check product dates, deep clean the small white fridge',
          'Mop & sweep under all shelves — check for mouse droppings',
          'Pour pipe cleaner down all sinks',
        ],
      },
    ],
  },

  weekly: {
    key: 'weekly', title: 'Weekly (managers)', icon: '📅',
    blurb: 'Manager weekly jobs — ordering, admin & checks.',
    sections: [
      {
        title: 'This week',
        items: [
          'Check rota / bookings / hire enquiries & plan the day / week',
          'Toilet checklist printed & put up in the toilets',
          'Tick sheets printed & on clipboards',
          "Previous week's tick sheets filed in the bar folder",
          'Check the temp check was fully completed for last week & file it',
          'Weekly fire alarm test',
          '1st Tuesday of the month: test the emergency lights',
          'Order: Enotria / Nectar',
          'Order: Five Points / other beer',
          'Order: cleaning supplies, consumables & stationery',
          'Check golf supplies (balls, clubs, pencils, scorecards) & order if low',
          'Record & update expenses on the spreadsheet',
          'Empty kegs put in the garden at end of shift',
          'Take in deliveries — report discrepancies, rotate & put away',
          'Check sell-by / opened dates on juices, softs, beers, ciders — old stock to the front',
          'Throw away any garnishes / juices that will go off',
          'Rota done',
          'Stock take done',
        ],
      },
    ],
  },

  foh: {
    key: 'foh', title: 'FOH clean', icon: '🧴',
    blurb: "Today's front-of-house cleaning — the tasks change each day.",
    byWeekday: {
      1: ['Change the sign outside (50% off games)', 'Beer lines cleaning', 'Wash golf course balls & tidy the course', 'Wipe all bar shelves & bottles (top spirits + above the padlock boxes)', 'Clean up the games shelf (Jenga equal in each basket)', 'Check food containers / bottles — remove any stickers', 'Clean the bar fridges (dry shelves, take the door out, clean the gaps)', 'Empty ash trays & wash them', 'Water the plants'],
      2: ['Record am/pm temp', 'Cleaning products stock take', 'Sweep the garden — remove spider webs, clean & replace ashtrays', 'Clean the stockroom — empty kegs out, sweep & mop the floor', 'Clean all speed pourers — soak in warm soapy water, dry & put back', 'Refill all cleaning sprays (big refill bottles on the garden benches — read the instructions)', 'Wipe everything under the sink next to the glass washer', 'Wipe the garden tables before closing', 'Water the plants'],
      3: ['Change the sign outside', 'Check nuts & soft-drink best-before dates — put shortest shelf-life on sale', 'Snack stock take', 'Clean & wipe dry the shelf beneath the kitchen sink', 'Wash all trays & jugs, wipe the glass washer', 'Check food containers / bottles — remove any stickers', 'Empty ash trays & wash them', 'Water the plants'],
      4: ['Record am/pm temp', 'Wipe the pool balls', 'Check for broken cues — fix if needed', 'Make shrubs — buy ingredients', 'Garden maintenance — remove spider webs & weeds from the plant pots', 'Wipe the garden tables before closing', 'Water the plants'],
      5: ['Change the sign outside', 'Tidy the golf course', 'Refill soap', 'Clean the postmix shelves & machine — remove dust & sticky stains, clean the fan', 'Brush the pool tables before the tournament', 'Empty ash trays & wash them', 'Water the plants'],
      6: ['Record am/pm temp', 'Clean all windows inside & out — blue roll + glass cleaner', 'Sweep the beer garden', 'Check food containers / bottles — remove any stickers', 'Clean the floor behind the stations (back of the postmix)', 'Wipe the garden tables before closing', 'Water the plants'],
      0: ['Change the sign outside', 'Wash golf course balls & tidy the course', 'Clean the bar fridges (dry shelves, take the door out, clean the gaps)', 'Clean up the games shelf (Jenga equal in each basket)', 'Empty ash trays & wash them', 'Water the plants'],
    },
  },
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
export const CHECKLIST_ORDER = ['opening', 'during', 'closing', 'toilet', 'foh', 'deep-clean', 'weekly']

// Sections for a checklist on a given date — FOH's tasks change by weekday.
// `source` defaults to the built-in CHECKLISTS; pass a live-override map to honour
// founder edits (see src/lib/liveChecklists.js). Backward-compatible.
export function checklistSections(key, dateStr, source = CHECKLISTS) {
  const c = source[key]
  if (!c) return []
  if (c.byWeekday) {
    const wd = dateStr ? new Date(dateStr + 'T00:00:00Z').getUTCDay() : new Date().getDay()
    const items = c.byWeekday[wd] || []
    return items.length ? [{ title: `${DAY_NAMES[wd]} tasks`, items }] : []
  }
  return c.sections || []
}
export const checklistItems = (key, dateStr, source = CHECKLISTS) => checklistSections(key, dateStr, source).flatMap(s => s.items)
export const checklistCount = (key, dateStr, source = CHECKLISTS) => checklistItems(key, dateStr, source).length
// How many of a submission's items are ticked (ignores stale keys not in the template).
export const doneCount = (key, items, dateStr, source = CHECKLISTS) => checklistItems(key, dateStr, source).filter(t => items && items[t]).length
