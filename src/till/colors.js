// Category colours for the till — one hue per page family so a glance tells
// you what a button is before you read it. (The K Series export was checked
// first: 439 of ~580 buttons there are default BLUE, so there was no real
// scheme to inherit — this one is ours.)
const SPIRITS = '#A78BFA'   // violet — all spirits pages share it

export const PAGE_COLORS = {
  'Deals': '#C9A84C',                        // house gold
  'Beer & Cider': '#FB923C',                 // amber, like a pint
  'Cocktails & Warmers': '#EC4899',          // pink
  'Mocktails': '#86EFAC',                    // soft green
  'Shots': '#EF4444',                        // red
  'Spirits — Gin': SPIRITS,
  'Spirits — Vodka': SPIRITS,
  'Spirits — Tequila & Mezcal': SPIRITS,
  'Spirits — Rum': SPIRITS,
  'Spirits — Whisk(e)y': SPIRITS,
  'Spirits — Brandy & Cognac': SPIRITS,
  'Spirits — Liqueur': SPIRITS,
  'Spirits — Aperitif & Vermouth': SPIRITS,
  'Wines & Prosecco': '#FDA4AF',             // rosé
  'Softs & Hot Drinks': '#22D3EE',           // cyan
  'Snacks & Food': '#34D399',                // green
  'Games': '#60A5FA',                        // blue
  'More': '#9CA3AF',                         // grey — the junk drawer
}

export const pageColor = (name) => PAGE_COLORS[name] || '#9CA3AF'
// hex + alpha suffix ('14' ≈ 8%, '2E' ≈ 18%, '73' ≈ 45%)
export const tint = (hex, a) => `${hex}${a}`
