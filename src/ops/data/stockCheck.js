// ─── No Dice — Weekly Stock Check sheet ────────────────────────────────
// The full wet-stock count, digitised from the Hackney wet-stock sheet
// (Jun 2026). Walk the bar, type what you HAVE, set a PAR once, and
// "To order" = Par − In stock (never below 0, ✓ when at par). Grouped so
// each supplier order is one block.
//
// Supplier routing (founder, Jun 2026):
//   • Back-bar soft drinks ......... Drinks Club
//   • Wine ......................... Top Cuvée (Cueva/Lentsch = GWGP, Chin Chin = Noble Rot)
//   • Prosecco (mini + large) ...... Drinks Club
//   • Bottled cider ................ The Fine Cider Company
//   • Keg cider .................... Umbrella
//   • Draught ...................... Five Points (XPA, Pils) + Drinks Club (Camden)
//   • Cocktail syrups / sugar ...... Drinks Club or Amazon (cheapest)
//   • Sugar for house sugar-syrup .. Brakes (with the fruit order)
//
// Built off the old stock sheet — sanity-check & prune any lines you no
// longer stock, and tell me what's missing.
// ───────────────────────────────────────────────────────────────────────

export const STOCK_CHECK_KEY = 'ndb_ops_stockcheck_v1'

export const STOCK_CHECK = {
  note: "Weekly count. Write in what you have; set a Par once and 'To order' fills itself (Par − In stock).",
  groups: [
    {
      key: 'draught', label: 'Draught — kegs', supplier: 'Five Points · Drinks Club',
      items: [
        { key: 'sc-xpa',   name: 'Five Points XPA',  unit: '30L keg', supplier: 'Five Points' },
        { key: 'sc-pils',  name: 'Five Points Pils', unit: '30L keg', supplier: 'Five Points' },
        { key: 'sc-hells', name: 'Camden Hells',     unit: '50L keg', supplier: 'Drinks Club' },
        { key: 'sc-stout', name: 'Camden Stout',     unit: '30L keg', supplier: 'Drinks Club' },
      ],
    },
    {
      key: 'cider', label: 'Cider', supplier: 'Fine Cider Co · Umbrella',
      items: [
        { key: 'sc-olivers', name: "Oliver's Fine Cider (bottle)", unit: 'case (24 × 330ml)', supplier: 'Fine Cider Co' },
        { key: 'sc-umbrella', name: 'Umbrella Apple Cider (keg)',  unit: 'keg', supplier: 'Umbrella' },
      ],
    },
    {
      key: 'beer', label: 'Beer — bottles & cans', supplier: 'Drinks Club',
      items: [
        { key: 'sc-corona',     name: 'Corona',                 unit: 'case (×24)' },
        { key: 'sc-corona0',    name: 'Corona 0%',              unit: 'case (×24)' },
        { key: 'sc-budweiser',  name: 'Budweiser',              unit: 'case (×24)' },
        { key: 'sc-asahi',      name: 'Asahi',                  unit: 'case (×24)' },
        { key: 'sc-luckysaint', name: 'Lucky Saint 0.5%',       unit: 'case (×24)' },
        { key: 'sc-bigdrop',    name: 'Big Drop Citra IPA 0.5%', unit: 'case' },
        { key: 'sc-piccadilly', name: 'Piccadilly Pilsner GF',  unit: 'case' },
        { key: 'sc-cherrysour', name: 'Cherry Sour',            unit: 'case' },
        { key: 'sc-freshaf',    name: 'Fresh Non-Alc',          unit: 'case' },
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
        { key: 'sc-w-kalimotxo',  name: 'House red (Kalimotxo)',  unit: 'bottle' },
      ],
    },
    {
      key: 'wine-other', label: 'Wine — other suppliers', supplier: 'GWGP · Noble Rot',
      items: [
        { key: 'sc-w-cueva',    name: 'Cueva Nueva Vermut (500ml)', unit: 'bottle', supplier: 'GWGP' },
        { key: 'sc-w-lentsch',  name: 'Lentsch Grüner Veltliner',   unit: 'bottle', supplier: 'GWGP' },
        { key: 'sc-w-chinchin', name: 'Chin Chin Vinho Verde',      unit: 'bottle', supplier: 'Noble Rot' },
      ],
    },
    {
      key: 'prosecco', label: 'Prosecco', supplier: 'Drinks Club',
      items: [
        { key: 'sc-prosecco-big',   name: 'Prosecco 750ml (NV Via Vai)', unit: 'bottle' },
        { key: 'sc-prosecco-small', name: 'Mini Prosecco 20cl',          unit: 'bottle' },
        { key: 'sc-prosecco-af',    name: 'Prosecco alc-free',           unit: 'bottle' },
      ],
    },
    {
      key: 'softs', label: 'Soft drinks — cans & bottles', supplier: 'Drinks Club',
      items: [
        { key: 'sc-fanta',     name: 'Fanta',                 unit: 'case (×24)' },
        { key: 'sc-ting',      name: 'Ting',                  unit: 'case (×24)' },
        { key: 'sc-pinkting',  name: 'Pink Ting',             unit: 'case (×24)' },
        { key: 'sc-gingerbeer', name: 'Old Jamaica Ginger Beer', unit: 'case (×24)' },
        { key: 'sc-redbull',   name: 'Red Bull',              unit: 'case (×24)' },
        { key: 'sc-kombucha',  name: 'Kombucha',              unit: 'case' },
        { key: 'sc-sparkling', name: 'Kingsdown Sparkling Water', unit: 'case (×24)' },
        { key: 'sc-still',     name: 'Kingsdown Still Water', unit: 'case (×24)' },
        { key: 'sc-cherrycoke', name: 'Cherry Coke',          unit: 'case (×24)' },
        { key: 'sc-slimtonic', name: 'Slimline Tonic',        unit: 'case (×36)' },
      ],
    },
    {
      key: 'postmix', label: 'Post-mix (BIB)', supplier: 'Drinks Club · CO₂ from BOC',
      items: [
        { key: 'sc-pm-coke',     name: 'Coke',            unit: '7L BIB' },
        { key: 'sc-pm-cokezero', name: 'Coke Zero',       unit: '7L BIB' },
        { key: 'sc-pm-lemonade', name: 'Lemonade',        unit: '7L BIB' },
        { key: 'sc-pm-tonic',    name: 'Schweppes Tonic', unit: '7L BIB' },
      ],
    },
    {
      key: 'juices', label: 'Juices', supplier: 'Eager (Brakes / Drinks Club)',
      items: [
        { key: 'sc-j-grapefruit', name: 'Eager Grapefruit',   unit: 'case (8 × 1L)' },
        { key: 'sc-j-pineapple',  name: 'Eager Pineapple',    unit: 'case' },
        { key: 'sc-j-apple',      name: 'Eager Cloudy Apple', unit: 'case' },
        { key: 'sc-j-cranberry',  name: 'Eager Cranberry',    unit: 'case' },
        { key: 'sc-j-orange',     name: 'Eager Orange',       unit: 'case' },
      ],
    },
    {
      key: 'produce', label: 'Fruit & perishables (incl. syrup sugar)', supplier: 'Brakes',
      items: [
        { key: 'sc-lime',       name: 'Limes',                   unit: 'case (×60)' },
        { key: 'sc-lemon',      name: 'Lemons',                  unit: 'case' },
        { key: 'sc-grapefruit', name: 'Grapefruit',              unit: 'each' },
        { key: 'sc-orange',     name: 'Oranges',                 unit: 'each' },
        { key: 'sc-mint',       name: 'Mint',                    unit: '100g bunch' },
        { key: 'sc-cucumber',   name: 'Cucumber',                unit: 'each' },
        { key: 'sc-jalapeno',   name: 'Jalapeños',               unit: 'kg' },
        { key: 'sc-watermelon', name: 'Watermelon',              unit: '20kg case' },
        { key: 'sc-sugar',      name: 'Sugar (for house syrup)', unit: 'kg bag' },
      ],
    },
    {
      key: 'cocktail', label: 'Cocktail — syrups, cordials, bitters, purées', supplier: 'Drinks Club / Amazon',
      items: [
        { key: 'sc-c-limecordial',  name: 'Lime cordial',           unit: 'bottle' },
        { key: 'sc-c-blackcurrant', name: 'Blackcurrant cordial',   unit: 'bottle' },
        { key: 'sc-c-elderflower',  name: 'Belvoir Elderflower cordial', unit: 'bottle' },
        { key: 'sc-c-agave',        name: 'Agave syrup',            unit: 'bottle' },
        { key: 'sc-c-gomme',        name: 'Monin Gomme',            unit: 'bottle' },
        { key: 'sc-c-grenadine',    name: 'Monin Grenadine',        unit: 'bottle' },
        { key: 'sc-c-vanilla',      name: 'Monin Vanilla',          unit: 'bottle' },
        { key: 'sc-c-passion',      name: 'Monin Passion Fruit',    unit: 'bottle' },
        { key: 'sc-c-ginger',       name: 'Monin Ginger',           unit: 'bottle' },
        { key: 'sc-c-honey',        name: 'Monin Honey',            unit: 'bottle' },
        { key: 'sc-c-funkin-pf',    name: 'Funkin Passion Fruit purée', unit: '1kg pouch' },
        { key: 'sc-c-funkin-mango', name: 'Funkin Mango purée',     unit: '1kg pouch' },
        { key: 'sc-c-foamer',       name: "Ms Better's Foamer",     unit: '120ml' },
        { key: 'sc-c-coffee',       name: 'Coffee extract',         unit: 'bottle' },
        { key: 'sc-c-lemonbitters', name: 'Lemon bitters',          unit: 'bottle' },
        { key: 'sc-c-grapefruitb',  name: 'Grapefruit bitters',     unit: 'bottle' },
        { key: 'sc-c-angostura',    name: 'Angostura bitters',      unit: 'bottle' },
        { key: 'sc-c-cherries',     name: 'Cocktail cherries',      unit: 'jar' },
        { key: 'sc-c-coconut',      name: 'Coconut milk / cream',   unit: 'carton' },
      ],
    },

    // ─── Backbar spirits — by type (count shelf by shelf) ──────────────
    {
      key: 'sp-gin', label: 'Spirits — Gin', supplier: 'Drinks Club · Hanbury',
      items: [
        { key: 'sp-hanbury-ld',   name: 'Hanbury London Dry (house)',  unit: '2.1L refill', supplier: 'Hanbury' },
        { key: 'sp-hanbury-cran', name: 'Hanbury Spiced Cranberry',    unit: '2.1L refill', supplier: 'Hanbury' },
        { key: 'sp-beefeater',    name: 'Beefeater London Dry',  unit: '700ml' },
        { key: 'sp-beef-peach',   name: 'Beefeater Peach',       unit: '700ml' },
        { key: 'sp-beef-orange',  name: 'Beefeater Orange',      unit: '700ml' },
        { key: 'sp-beef-pink',    name: 'Beefeater Pink',        unit: '700ml' },
        { key: 'sp-monkey47',     name: 'Monkey 47',             unit: '500ml' },
        { key: 'sp-monkey-sloe',  name: 'Monkey 47 Sloe',        unit: '500ml' },
        { key: 'sp-malfy-rosa',   name: 'Malfy Gin Rosa',        unit: '700ml' },
        { key: 'sp-malfy-limone', name: 'Malfy Limone',          unit: '700ml' },
        { key: 'sp-malfy-arancia', name: 'Malfy Arancia',        unit: '700ml' },
      ],
    },
    {
      key: 'sp-vodka', label: 'Spirits — Vodka', supplier: 'Drinks Club',
      items: [
        { key: 'sp-absolut',         name: 'Absolut Blue',     unit: '700ml' },
        { key: 'sp-absolut-vanilla', name: 'Absolut Vanilla',  unit: '700ml' },
        { key: 'sp-greygoose',       name: 'Grey Goose',       unit: '700ml' },
      ],
    },
    {
      key: 'sp-agave', label: 'Spirits — Tequila & Mezcal', supplier: 'Drinks Club',
      items: [
        { key: 'sp-caz-blanco',   name: 'Cazcabel Blanco',        unit: '700ml' },
        { key: 'sp-caz-reposado', name: 'Cazcabel Reposado',      unit: '700ml' },
        { key: 'sp-caz-coffee',   name: 'Cazcabel Coffee',        unit: '700ml' },
        { key: 'sp-caz-honey',    name: 'Cazcabel Honey',         unit: '700ml' },
        { key: 'sp-caz-coconut',  name: 'Cazcabel Coconut',       unit: '700ml' },
        { key: 'sp-olmeca-blanco', name: 'Olmeca Altos Blanco',   unit: '700ml' },
        { key: 'sp-olmeca-repo',  name: 'Olmeca Altos Reposado',  unit: '700ml' },
        { key: 'sp-mezcal-vida',  name: 'Vida Mezcal',            unit: '700ml' },
        { key: 'sp-mezcal-madre', name: 'Madre Mezcal',           unit: '700ml' },
        { key: 'sp-mezcal-pensador', name: 'Pensador Mezcal',     unit: '500ml' },
      ],
    },
    {
      key: 'sp-rum', label: 'Spirits — Rum & Cachaça', supplier: 'Drinks Club',
      items: [
        { key: 'sp-havana-3',   name: 'Havana Club 3yr',         unit: '700ml' },
        { key: 'sp-havana-esp', name: 'Havana Especial',         unit: '700ml' },
        { key: 'sp-havana-7',   name: 'Havana Club 7yr',         unit: '700ml' },
        { key: 'sp-havana-spiced', name: 'Havana Spiced',        unit: '700ml' },
        { key: 'sp-cut-spiced', name: 'Cut Spiced Rum',          unit: '700ml' },
        { key: 'sp-kraken',     name: 'Kraken Black Spiced',     unit: '700ml' },
        { key: 'sp-diplomatico', name: 'Diplomático',            unit: '700ml' },
        { key: 'sp-wray',       name: 'Wray & Nephew Overproof', unit: '700ml' },
        { key: 'sp-cachaca',    name: 'Velho Barreiro Cachaça',  unit: '700ml' },
      ],
    },
    {
      key: 'sp-whisky', label: 'Spirits — Whisky, Bourbon & Brandy', supplier: 'Drinks Club',
      items: [
        { key: 'sp-jameson',     name: 'Jameson',          unit: '700ml' },
        { key: 'sp-jameson-black', name: 'Jameson Black',  unit: '700ml' },
        { key: 'sp-jameson-orange', name: 'Jameson Orange', unit: '700ml' },
        { key: 'sp-chivas',      name: 'Chivas Regal',     unit: '700ml' },
        { key: 'sp-monkeyshoulder', name: 'Monkey Shoulder', unit: '700ml' },
        { key: 'sp-nikka',       name: 'Nikka From The Barrel', unit: '500ml' },
        { key: 'sp-laphroaig',   name: 'Laphroaig',        unit: '700ml' },
        { key: 'sp-jackdaniels', name: "Jack Daniel's",    unit: '700ml' },
        { key: 'sp-fourroses',   name: 'Four Roses Bourbon', unit: '700ml' },
        { key: 'sp-woodford',    name: 'Woodford Reserve', unit: '700ml' },
        { key: 'sp-bulleit',     name: 'Bulleit Bourbon',  unit: '700ml' },
        { key: 'sp-courvoisier', name: 'Courvoisier Brandy', unit: '700ml' },
        { key: 'sp-hennessy',    name: 'Hennessy Brandy',  unit: '700ml' },
      ],
    },
    {
      key: 'sp-liqueurs', label: 'Spirits — Liqueurs', supplier: 'Drinks Club',
      items: [
        { key: 'sp-triple-sec',   name: 'Triple Sec',            unit: '700ml' },
        { key: 'sp-cointreau',    name: 'Cointreau',             unit: '700ml' },
        { key: 'sp-kahlua',       name: 'Kahlúa',                unit: '700ml' },
        { key: 'sp-baileys',      name: 'Baileys',               unit: '700ml' },
        { key: 'sp-st-germain',   name: 'St Germain',            unit: '700ml' },
        { key: 'sp-chartreuse',   name: 'Yellow Chartreuse',     unit: '700ml' },
        { key: 'sp-limoncello',   name: 'Limoncello',            unit: '700ml' },
        { key: 'sp-amaretto',     name: 'Disaronno Amaretto',    unit: '700ml' },
        { key: 'sp-kings-ginger', name: "King's Ginger Liqueur", unit: '500ml' },
        { key: 'sp-passionfruit', name: 'Passion Fruit Liqueur', unit: '700ml' },
        { key: 'sp-falernum',     name: 'Velvet Falernum',       unit: '700ml' },
        { key: 'sp-sambuca',      name: 'Antica Sambuca',        unit: '700ml' },
        { key: 'sp-jager',        name: 'Jägermeister',          unit: '700ml' },
        { key: 'sp-fernet',       name: 'Fernet Branca',         unit: '700ml' },
        { key: 'sp-archers',      name: 'Archers Schnapps',      unit: '700ml' },
        { key: 'sp-sourz-rasp',   name: 'Sourz Raspberry',       unit: '700ml' },
        { key: 'sp-sourz-apple',  name: 'Sourz Apple',           unit: '700ml' },
        { key: 'sp-tequila-rose', name: 'Tequila Rose',          unit: '700ml' },
        { key: 'sp-umeshu',       name: 'Umeshu Plum Sake',      unit: '500ml' },
      ],
    },
    {
      key: 'sp-aperitivo', label: 'Spirits — Aperitivo & Vermouth', supplier: 'Drinks Club · Top Cuvée',
      items: [
        { key: 'sp-campari',    name: 'Campari',                unit: '700ml' },
        { key: 'sp-aperol',     name: 'Aperol',                 unit: '700ml' },
        { key: 'sp-amaro',      name: 'Amaro Montenegro',       unit: '700ml' },
        { key: 'sp-cynar',      name: 'Cynar',                  unit: '700ml' },
        { key: 'sp-pimms',      name: "Pimm's",                 unit: '700ml' },
        { key: 'sp-vermut-tc',  name: 'Top Cuvée Sweet Vermouth', unit: 'bottle', supplier: 'Top Cuvée' },
        { key: 'sp-vermut',     name: 'El Bandarra Vermut',     unit: '1L' },
        { key: 'sp-verm-rosso', name: 'Martini Rosso',          unit: '750ml' },
        { key: 'sp-verm-dry',   name: 'Martini Dry',            unit: '750ml' },
        { key: 'sp-cocchi',     name: 'Cocchi Americano',       unit: '750ml' },
        { key: 'sp-lillet',     name: 'Lillet Rosé',            unit: '750ml' },
        { key: 'sp-byrrh',      name: 'Byrrh',                  unit: '750ml' },
      ],
    },
    {
      key: 'sp-absinthe', label: 'Spirits — Absinthe', supplier: "Devil's Botany",
      items: [
        { key: 'sp-abs-choc',    name: 'Devil\'s Botany Chocolate 24%', unit: '700ml' },
        { key: 'sp-abs-london',  name: 'Devil\'s Botany London 40%',    unit: '700ml' },
        { key: 'sp-abs-regalis', name: 'Devil\'s Botany Regalis 60%',   unit: '700ml' },
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
    {
      key: 'gas', label: 'Gas (CO₂ / mixed)', supplier: 'BOC',
      items: [
        { key: 'sc-gas-co2',   name: 'CO₂ (purple collar)',   unit: 'cylinder' },
        { key: 'sc-gas-co2b',  name: 'CO₂ (blue collar)',     unit: 'cylinder' },
        { key: 'sc-gas-7030',  name: '70/30 mixed gas',       unit: 'cylinder' },
        { key: 'sc-gas-6040',  name: '60/40 mixed gas',       unit: 'cylinder' },
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
