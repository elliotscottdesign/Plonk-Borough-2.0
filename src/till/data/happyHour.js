// Happy Hour — founder's spec, 21 Aug 2026. The most-used deals get their own
// page, FIRST on the till:
//   £5 all pints · £5 wines 125ml · £6 doubles · £3 house shots (the £3 SHOT 💉
//   button in Lightspeed) · £7 cocktails: Rhys's Peaches, Lagerita, Turbo
//   Michelada, Beericano, all aperitifs, long drinks, Lillet Spritz, Daiquiri,
//   Martini, Negroni.
// "2 for £12" is DEAD, and the old scattered HH buttons fold into this page.
//
// Every priced button still names the real drink (picker where there's a
// choice) — a happy-hour pint that doesn't say WHICH pint can't deplete a keg.
import liveTill from './liveTill.json'

export const HH_PAGE = 'Happy Hour ⭐'

// Old buttons replaced by this page (removed from the Deals grid).
const REMOVED = /2 FOR £12|HAPPY HOUR COCKTAIL|HAPPY HOUR SPIRITS|RHYS'S PEACHES HH/i

const productsOf = (name) => (liveTill.pages.find(pg => pg.name === name)?.products) || []
const spiritsProducts = () => liveTill.pages.filter(pg => pg.name.startsWith('Spirits — ')).flatMap(pg => pg.products)

// Lightspeed's OWN list for a combo (mined from the export's combo→group→member
// graph by scripts/tillLiveMenu.py) — the till never guesses what a deal
// allows. `not` filters out helper groups (mixers) that aren't the drink list.
const comboOpts = (comboName, not) => {
  const c = liveTill.combos?.[comboName]
  if (!c) return null
  const groups = c.choices.filter(ch => !not || !not.test(ch.name))
  const opts = groups.flatMap(ch => ch.options)
  return opts.length ? opts : null
}

function buildHH() {
  // Every list below comes from the live till's own happy-hour buttons; the
  // expressions after || are fallbacks in case a combo is renamed in Lightspeed.
  const pints = comboOpts('HAPPY HOUR PINTTT')
    || productsOf('Beer & Cider').filter(p => p.serves.some(s => s.label === 'Pint')).map(p => p.name)
  const wines125 = comboOpts('HAPPY HOUR WINE')
    || productsOf('Wines & Prosecco').filter(p => p.serves.some(s => s.label === '125ml')).map(p => p.name)
  const houseSpirits = comboOpts('HAPPY HOUR SPIRITS £6 DBL 🥃', /mixer/i)
    || spiritsProducts().filter(p => p.serves.some(s => s.label === 'Single' && s.price === 6.0)).map(p => p.name)
  const shots = comboOpts('£3 SHOT 💉')
    || productsOf('Shots').filter(p => p.serves.some(s => s.label === 'Each') && !/FOR|TRAY/i.test(p.name)).map(p => p.name)
  const longDrinks = comboOpts('Tall Seltz')
    || ['Amaro', 'Campari', 'Cocchi', 'Cynar', 'El Bandaderra', 'Limoncello']
  const aperitifs = productsOf('Spirits — Aperitif & Vermouth').map(p => p.name)

  let n = 0
  const item = (name, price, hh, recipe) => ({
    sku: 'HH.' + (++n), name, recipe: recipe || name,
    serves: [{ label: 'HH', price }],
    ...(hh ? { hh } : {}),
  })

  return {
    name: HH_PAGE,
    blurb: 'Happy hour — every sale still names the actual drink.',
    products: [
      item('£5 Pint', 5.0, { title: 'Which pint?', opts: pints }),
      item('£5 Wine 125ml', 5.0, { title: 'Which wine?', opts: wines125 }),
      item('£6 Double', 6.0, { title: 'Which house spirit?', opts: houseSpirits, mixer: 'paid' }),
      // "Long drinks" = the Tall Seltz section on the live till (normally £8):
      // an aperitif served long with soda. List mined from the till itself.
      item('£7 Long Drink', 7.0, { title: 'Which long drink? (Tall Seltz)', opts: longDrinks }),
      item('£3 House Shot', 3.0, { title: 'Which shot?', opts: shots }),
      item('£7 Aperitif', 7.0, { title: 'Which aperitif?', opts: aperitifs }),
      item("Rhys's Peaches", 7.0),
      item('Lagerita', 7.0),
      item('Turbo Michelada', 7.0),
      item('Beericano', 7.0),
      item('Lillet Spritz', 7.0),
      item('Daiquiri', 7.0),
      item('Martini', 7.0),
      item('Negroni', 7.0),
    ],
  }
}

// The till's pages: Happy Hour first, then the live K Series pages with the
// superseded deal buttons removed.
export const PAGES = [
  buildHH(),
  ...liveTill.pages
    .map(pg => ({ ...pg, products: pg.products.filter(p => !REMOVED.test(p.name)) }))
    .filter(pg => pg.products.length > 0),
]
