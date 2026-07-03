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
}

export const CHECKLIST_ORDER = ['opening', 'during', 'closing']
export const checklistItems = (key) => (CHECKLISTS[key]?.sections || []).flatMap(s => s.items)
export const checklistCount = (key) => checklistItems(key).length
// How many of a submission's items are ticked (ignores stale keys not in the template).
export const doneCount = (key, items) => checklistItems(key).filter(t => items && items[t]).length
