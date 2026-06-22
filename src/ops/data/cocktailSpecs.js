// ─── Cocktail Specs — bar-side build reference sheet ──────────────────
// Verbatim transcription of "Cocktail Specs Update DEC 2025.pdf" used by
// the bar team. Groups follow the same headings as the source PDF:
// SHAKE, BUILD, JUGS, MOCKTAILS, SHRUBS. Renders 1-to-1 to the
// CocktailSpecs.jsx print view and the on-screen sub-tool, so the team
// can print to PDF or to paper for behind-the-bar laminated copies.
// Garnish and special notes live on the recipe; "batchNote" carries the
// CAN BATCH BOTTLES — NO X / NO Y guidance from the source.
// ──────────────────────────────────────────────────────────────────────

export const SPEC_SECTIONS = [
  { key: 'shake',     label: 'Shake' },
  { key: 'build',     label: 'Build / Stir' },
  { key: 'jugs',      label: 'Jugs' },
  { key: 'mocktails', label: 'Mocktails' },
  { key: 'shrubs',    label: 'Homemade Soda Shrubs' },
]

export const GLASSWARE = ['Coupe', 'Rock Glass', 'Highball', 'Wine Glass', 'Large Wine Glass', '250ml Wine Glass', 'Pitcher']

export const SPECS = [
  // ─── SHAKE ───────────────────────────────────────────────────────
  {
    id: 'espresso-martini', section: 'shake', name: 'Espresso Martini', method: 'Shake', glass: 'Coupe',
    ingredients: [
      'Vodka — 30 ml',
      'Kahlua — 25 ml',
      'Coffee extract — 30 ml',
      'Sugar — 7 ml',
    ],
    garnish: 'Coffee beans (no cocoa powder)',
    build: 'All ingredients into shaker, double shake (remove ice and dry shake), double strain.',
    batchNote: 'CAN BATCH BOTTLES — NO COFFEE',
  },
  {
    id: 'classic-margarita', section: 'shake', name: 'Classic Margarita', method: 'Shake', glass: 'Coupe',
    ingredients: [
      'Silver tequila — 50 ml',
      'Triple sec — 20 ml',
      'Lime juice — 25 ml',
    ],
    garnish: 'Salt on the rim',
    build: 'Chill coupe glass. Shake all together. Serve in coupe — no ice, no straw, salt on a rim.',
  },
  {
    id: 'tommys-margarita', section: 'shake', name: "Tommy's Margarita", method: 'Shake', glass: 'Rock Glass',
    ingredients: [
      'Reposado tequila — 50 ml',
      'Lime juice — 40 ml',
      'Agave — 15 ml',
    ],
    garnish: 'None',
    build: 'Shake all together. Serve in rock glass on cubes to top — no straw, no salt.',
  },
  {
    id: 'spicy-cucumber-margarita', section: 'shake', name: 'Spicy Cucumber Margarita', method: 'Shake', glass: 'Rock Glass',
    ingredients: [
      'Reposado tequila — 50 ml',
      'Lime juice — 25 ml',
      'Agave — 7 ml',
      '2 slices chilli',
      '2 cm cucumber',
    ],
    garnish: 'Tajín rim for spicy',
    build: 'Crush 2 chilli slices + 2 cm cucumber in shaker. Add all ingredients. Shake. Serve in rock glass on cubes to top — no straw.',
  },
  {
    id: 'mezcal-margarita', section: 'shake', name: 'Mezcal Margarita', method: 'Shake', glass: 'Rock Glass',
    ingredients: [
      'Vida Mezcal — 35 ml',
      'Triple sec — 15 ml',
      'Lime juice — 25 ml',
    ],
    garnish: 'No rim salt or Tajín',
    build: 'Shake all together. Serve in rock glass on cubes to top — no straw.',
  },
  {
    id: 'sage-smash', section: 'shake', name: 'Sage Smash', method: 'Shake', glass: 'Rock Glass',
    ingredients: [
      'Four Roses bourbon — 40 ml',
      'Yellow Chartreuse — 10 ml',
      'Honey syrup — 15 ml',
      'Lemon — 25 ml',
      '6 sage leaves',
    ],
    garnish: 'Sage sprig',
    build: 'Dump sage leaves in shaker, pour in all ingredients. Shake well. Single strain into glass full of ice. Place garnish. Serve.',
    batchNote: 'CAN BATCH BOTTLES — NO HONEY',
  },
  {
    id: 'penicillin-2', section: 'shake', name: 'Penicillin 2.0', method: 'Shake', glass: 'Rock Glass',
    ingredients: [
      'Vida Mezcal — 35 ml',
      "King's Ginger — 25 ml",
      'Lemon juice — 25 ml',
      'Honey — 15 ml',
      'Amaro Montenegro — float',
    ],
    garnish: 'No garnish',
    build: 'Pour all ingredients but the Amaro into shaker. Shake well. Single strain into a rocks glass full of ice. Now float the Amaro. Serve.',
    batchNote: 'CAN BATCH BOTTLES — NO HONEY OR LEMON',
  },
  {
    id: 'golfstar-martini', section: 'shake', name: 'Golfstar Martini', method: 'Shake', glass: 'Coupe',
    ingredients: [
      'Vanilla vodka — 30 ml',
      'Passion fruit liqueur — 20 ml',
      'Passion fruit puree — 30 ml',
      'Vanilla syrup — 10 ml',
      'Lime juice — 7–10 ml',
      'Prosecco — float',
    ],
    garnish: '2 cherries on a cocktail pick',
    build: 'Shake to create foam, double strain. Add a little prosecco. Serve in coupe glass. Open mini bottles of prosecco for the float.',
    batchNote: 'CAN BATCH BOTTLES — NO PUREE OR LIME',
  },
  {
    id: 'paloma', section: 'shake', name: 'Paloma', method: 'Shake', glass: 'Highball',
    ingredients: [
      'Silver tequila — 50 ml',
      'Lime — 10 ml',
      'Agave — 10 ml',
      'Grapefruit juice — 60 ml',
      'Ting soda — splash',
    ],
    garnish: 'Slice of grapefruit, salt on the rim',
    build: 'Salt the rim. Splash of Ting in the glass. Rest of ingredients into shaker. Serve on cubes.',
  },
  {
    id: 'whiskey-sour', section: 'shake', name: 'Whiskey Sour', method: 'Shake', glass: 'Rock Glass',
    ingredients: [
      'House bourbon — 50 ml',
      'Lemon juice — 30 ml',
      'Sugar — 10 ml',
      'Angostura — 1 dash',
      'Miraculous foam — 2 dashes',
    ],
    garnish: 'Angostura line on top',
    build: 'Pour ingredients into shaker. Shake. Empty ice, dry shake. Double strain into rocks glass topped with ice. Do a line with angostura.',
  },
  {
    id: 'amaretto-sour', section: 'shake', name: 'Amaretto Sour', method: 'Shake', glass: 'Coupe',
    ingredients: [
      'Amaretto liqueur — 75 ml',
      'Lemon juice — 30 ml',
      'Angostura — 1 dash',
      'Miraculous foam — 2 dashes',
    ],
    garnish: 'Angostura line on top',
    build: 'Pour ingredients into shaker. Shake. Empty ice, dry shake. Double strain into coupe glass. Do a line with angostura.',
  },
  {
    id: 'solero-colada', section: 'shake', name: 'Solero Colada', method: 'Shake', glass: 'Highball',
    ingredients: [
      'Pineapple — 50 ml',
      'Coconut — 40 ml',
      'Spiced rum — 50 ml',
      'Passion fruit syrup — 15 ml',
    ],
    garnish: 'Splash of passion fruit puree and pineapple leaf',
    build: 'Put into shaker, shake, serve on crushed ice.',
  },

  // ─── BUILD / STIR ────────────────────────────────────────────────
  {
    id: 'royal-flush', section: 'build', name: 'Royal Flush', method: 'Build', glass: 'Highball',
    ingredients: [
      'Havana Especial — 25 ml (1 shot)',
      'Triple sec — 12.5 ml (½ shot)',
      'Wray & Nephew — 12.5 ml (½ shot)',
      'Pineapple juice — 150 ml',
      'Grenadine — poured over',
    ],
    garnish: 'Pineapple slice',
    build: 'Build in highball on cubes, top with 150ml pineapple, grenadine poured over. Use the premixed juice.',
  },
  {
    id: 'negroni', section: 'build', name: 'Negroni', method: 'Build / Stir', glass: 'Rock Glass',
    ingredients: [
      'House gin — 25 ml',
      'Campari — 25 ml',
      'Cocchi vermouth — 25 ml',
    ],
    garnish: 'Orange peel',
    build: 'Pour into rock glass, fill with cubes, stir for 20 sec, top with ice and garnish. No straw. (For multiples use bigger part of shaker.)',
  },
  {
    id: 'bloody-mary', section: 'build', name: 'Bloody Mary', method: 'Build', glass: 'Highball',
    ingredients: [
      'Vodka — 50 ml',
      'Tomato juice — 75 ml',
      'Lemon juice — 20 ml',
      'Worcestershire + Tabasco — 4 dashes',
      'Salt + pepper — pinch',
    ],
    garnish: 'Celery stick + lemon wedge, salt-and-pepper rim',
    build: 'Pour all into shaker, throw 8 times between shakers, serve on cubes to top in highball.',
  },
  {
    id: 'fields', section: 'build', name: 'Fields', method: 'Stir', glass: 'Rock Glass',
    ingredients: [
      'Umeshu plum sake — 75 ml',
      'Sweet vermouth — 10 ml',
      'Lemon bitters — 2 dashes',
    ],
    garnish: 'Lemon peel + zest',
    build: 'Pour into rocks glass, stir 15 sec, zest lemon peel on top + express around glass rim. Serve ice to top.',
  },
  {
    id: 'cola-soda-spritzer', section: 'build', name: 'Cola Soda / Spritzer', method: 'Build', glass: 'Large Wine Glass',
    ingredients: [
      'Kraken — 15 ml',
      'Falernum — 25 ml',
      'Amaro — 30 ml',
      'Prosecco — 75 ml',
      'Sparkling water — top',
    ],
    garnish: 'Slice of orange',
    build: 'In large wine glass, pour in the ingredients. Top with ice. Garnish with orange slice.',
  },
  {
    id: 'mango-mojito', section: 'build', name: 'Mango Mojito', method: 'Build', glass: 'Highball',
    ingredients: [
      'Havana 3yr — 50 ml',
      'Mango puree — 40 ml',
      'Mint leaves — 7',
      'Passion fruit puree — 5 ml',
      'Lime wedges — 2',
      'Soda — splash',
    ],
    garnish: 'Mint top, or fan of 3 mint leaves',
    build: 'Squeeze limes, add all ingredients, add crushed ice, stir to break mint, add soda splash, top with crushed ice.',
    batchNote: 'Classic Mojito: skip mango, add 25 ml lime juice instead.',
  },
  {
    id: 'lagerita', section: 'build', name: 'Lagerita', method: 'Build', glass: 'Highball',
    ingredients: [
      'Silver tequila — 25 ml',
      'Lime juice — 25 ml',
      'Lager — top',
    ],
    garnish: 'Slice of lime, Tajín rim',
    build: 'Tajín rim of tall glass. Add lime, tequila and beer into glass over ice.',
  },
  {
    id: 'michelada-full', section: 'build', name: 'Michelada (Full)', method: 'Build', glass: 'Highball',
    ingredients: [
      'Silver tequila — 25 ml',
      'Lime juice — 25 ml',
      'Big Tom juice — 50 ml',
      'Valentina Hot Sauce — 12.5 ml',
      'Worcestershire — 12.5 ml',
      'Lager — top',
    ],
    garnish: 'Slice of lime',
    build: 'Tajín rim. Add all ingredients to glass, ice to top, top with beer.',
  },
  {
    id: 'aperol-spritz-single', section: 'build', name: 'Aperol / Campari / Amaro Spritz', method: 'Build', glass: 'Wine Glass',
    ingredients: [
      'Aperol — 50 ml',
      'Prosecco — 75 ml',
      'Soda — splash',
    ],
    garnish: 'Slice of orange',
    build: 'Add aperol, soda, cubed ice. Top with prosecco. Do not stir.',
  },
  {
    id: 'lillet-spritz', section: 'build', name: 'Lillet Spritz', method: 'Build', glass: 'Wine Glass',
    ingredients: [
      'Lillet — 70 ml',
      'Lemon juice — 5 ml',
      'Soda + lemonade — top',
    ],
    garnish: 'Lemon slice',
    build: 'Same method as other spritzers. Garnish with lemon.',
  },
  {
    id: 'white-wine-spritzer', section: 'build', name: 'White Wine Spritzer', method: 'Build', glass: 'Wine Glass',
    ingredients: [
      'White wine — 100 ml',
      'Lemonade or soda — top',
    ],
    garnish: 'Lemon slice',
    build: 'Build in a wine glass. Ask if customer wants soda or lemonade.',
  },
  {
    id: 'kalamotxo', section: 'build', name: 'Kalamotxo', method: 'Build', glass: 'Highball',
    ingredients: [
      'House red wine — 125 ml',
      'Coke — top',
    ],
    garnish: 'None',
    build: 'Add wine to glass, top with ice, fill up with coke.',
  },
  {
    id: 'michelada-sol', section: 'build', name: 'Michelada (Sol)', method: 'Build', glass: 'Highball',
    ingredients: [
      'Tomato juice — 50 ml',
      'Lime juice — 15 ml',
      'Tabasco — 4 dashes',
      'Worcestershire — 2 dashes',
      'Soy sauce — dash',
      'Sol — to top + extra',
    ],
    garnish: 'Tajín rim',
    build: 'Pour everything except Sol on cubes. Stir. Top with Sol. Serve rest of Sol with cocktail.',
  },
  {
    id: 'old-fashioned', section: 'build', name: 'Old Fashioned', method: 'Build / Stir', glass: 'Rock Glass',
    ingredients: [
      'House bourbon — 50 ml',
      'Sugar — 2 bar spoons',
      'Angostura — 4 dashes',
    ],
    garnish: 'Orange peel (expressed)',
    build: 'Pour into stirring glass, ice to top, stir for 12 sec, strain into rocks glass with ice to top. Express orange peel around the rim and drop in.',
  },
  {
    id: 'caipirinha', section: 'build', name: 'Caipirinha', method: 'Build', glass: 'Rock Glass',
    ingredients: [
      'Cachaça Velho Barreiro — 50 ml',
      'Sugar syrup — 20 ml',
      '6 lime wedges',
    ],
    garnish: 'None',
    build: 'Muddle wedges in rocks glass, add all ingredients, light stir, top with crushed ice. Serve with 2 small straws.',
  },

  // ─── JUGS ────────────────────────────────────────────────────────
  {
    id: 'jug-dark-and-stormy', section: 'jugs', name: 'Dark & Stormy', method: 'Build', glass: 'Highball jug',
    ingredients: [
      'Havana 7 — 150 ml',
      'Lime juice — 45 ml',
      'Ginger beer — top',
      'Angostura — generous splash',
    ],
    garnish: 'Lime wedges',
    build: 'Fill jug with cubes, pour rum and lime juice, top with ginger beer, splash generously with angostura. Mix before serving.',
  },
  {
    id: 'jug-aperol-spritz', section: 'jugs', name: 'Aperol Spritz', method: 'Build', glass: '250ml Wine Glass',
    ingredients: [
      'Aperol — 150 ml',
      'Prosecco — top',
      'Soda — top',
    ],
    garnish: 'Orange slices',
    build: 'Pour Aperol, fill with cubes, pour soda and prosecco, stir.',
  },
  {
    id: 'jug-pimms', section: 'jugs', name: "Pimm's", method: 'Build', glass: 'Highball jug',
    ingredients: [
      "Pimm's — 150 ml",
      'Lemonade — top',
    ],
    garnish: 'Lemon, orange, mint, strawberries',
    build: 'Fill jug with cubes, pour in Pimm\'s, top with lemonade, stir before serving.',
  },
  {
    id: 'jug-royal-flush', section: 'jugs', name: 'Royal Flush (Jug)', method: 'Build', glass: 'Rock glass jug',
    ingredients: [
      'Havana Especial — 120 ml',
      'Triple sec — 60 ml',
      'Pineapple — 100 ml',
      'Orange — 100 ml',
      'Grenadine — top',
    ],
    garnish: 'Orange slices',
    build: 'Fill jug with cubes, pour rum and triple sec, fill with juices, finish with grenadine. Mix before serving. Use premixed juices.',
  },

  // ─── MOCKTAILS ───────────────────────────────────────────────────
  {
    id: 'mock-mojito', section: 'mocktails', name: 'Mocktail Mojito', method: 'Build', glass: 'Highball',
    ingredients: [
      'Lime juice — 50 ml',
      'Sugar — 10 ml',
      'Mint leaves — 7',
      'Lime wedges — 2',
      'Soda — dash',
    ],
    garnish: 'Mint top, or fan of 3 mint leaves',
    build: 'Squeeze lime wedges, add all ingredients, add crushed ice, stir to break mint, top with crushed ice.',
  },
  {
    id: 'mock-banana-colada', section: 'mocktails', name: 'Mocktail Banana Colada', method: 'Shake', glass: 'Highball',
    ingredients: [
      'Pineapple — 100 ml',
      'Coconut — 40 ml',
      'Banana syrup — 12 ml',
    ],
    garnish: 'Cherry on the ice',
    build: 'Shake and pour over crushed ice.',
  },
  {
    id: 'mock-royal-flush', section: 'mocktails', name: 'Mocktail Royal Flush', method: 'Build', glass: 'Highball',
    ingredients: [
      'Orange + pineapple — equal parts',
      'Grenadine — top',
    ],
    garnish: 'Orange wedge',
    build: 'Highball glass filled with cubes, pour equal amounts of pineapple and orange to the top, top with grenadine to create gradient. Use the juice premix.',
  },

  // ─── SHRUBS ──────────────────────────────────────────────────────
  {
    id: 'shrub-apple-ginger-rosemary', section: 'shrubs', name: 'Apple, Ginger & Rosemary',
    method: 'Cold infusion', glass: 'Highball (50 ml topped with soda)',
    ingredients: [
      '3 cups apples chopped in cubes',
      '3 × 10 cm pieces of ginger (peeled, chopped)',
      'Bunch of rosemary',
      '2 cups water',
      '2 cups sugar',
      '0.5 cup apple cider vinegar',
    ],
    garnish: '',
    build: 'Put all raw ingredients in a jug. Fridge for 3–6 days, fruit must be covered with liquid. Taste from day 3, ready by day 6. Strain + store in fridge.',
  },
  {
    id: 'shrub-pineapple-chili', section: 'shrubs', name: 'Pineapple & Chilli',
    method: 'Cold infusion', glass: 'Highball (50 ml topped with soda)',
    ingredients: [
      '3 cups pineapple',
      '4 chillies',
      '2 cups water',
      '2 cups sugar',
      '0.5 cup apple cider vinegar',
    ],
    garnish: '',
    build: 'Put all raw ingredients in a jug. Fridge for 3–6 days, fruit must be covered. Strain + store in fridge.',
  },
  {
    id: 'shrub-strawberry-basil', section: 'shrubs', name: 'Strawberry & Basil',
    method: 'Cold infusion', glass: 'Highball (50 ml topped with soda)',
    ingredients: [
      '3 cups strawberries',
      'Bunch of basil',
      '2 cups water',
      '2 cups sugar',
      '0.5 cup apple cider vinegar',
    ],
    garnish: '',
    build: 'Put all raw ingredients in a jug. Fridge for 3–6 days, fruit must be covered. Strain + store in fridge.',
  },
]
