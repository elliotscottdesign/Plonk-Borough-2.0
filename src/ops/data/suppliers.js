// ─── No Dice Suppliers ─────────────────────────────────────────────────
// Master directory of every active supplier No Dice buys from. Powers
// the Suppliers tool at /operations?tool=suppliers — every field is
// editable in the UI and persists to localStorage so the founder can
// drop in new phone numbers, rep names, or portal URLs as they come.
//
// `tradePortal` is the 1-click trade-portal login link. Where I had a
// known/verified URL it's filled in; where I'm guessing it's left
// blank with a hint in `tradePortalNote` so the founder can paste the
// real link. Don't link to a wrong URL — leave it blank and let the
// founder fill in.
// ───────────────────────────────────────────────────────────────────────

export const CATEGORIES_SUPPLIED = [
  'Spirits',
  'Liqueurs',
  'Wine',
  'Vermouth',
  'Beer (keg)',
  'Beer (bottle/can)',
  'Cider',
  'Soft drinks',
  'Mixers / syrups',
  'Bitters',
  'Snacks',
  'Fresh produce',
  'Cleaning supplies',
  'Bar tools / glassware',
  'Gas',
]

// Each supplier: id (slug, stable), name (display), then everything
// else is whatever info we have. Empty strings render as "—" with a
// pencil icon so the founder can edit inline.
export const SUPPLIERS = [
  // ─── Drinks Club ─ main liquor + soft drinks ─────────────────────
  {
    id: 'drinks-club',
    name: 'Drinks Club',
    categories: ['Spirits', 'Liqueurs', 'Beer (keg)', 'Beer (bottle/can)', 'Wine', 'Soft drinks', 'Mixers / syrups', 'Vermouth'],
    address: '',
    phone: '',
    email: '',
    repName: '',
    website: 'https://www.thedrinksclub.co.uk',
    tradePortal: 'https://www.thedrinksclub.co.uk/login',
    tradePortalNote: '',
    paymentTerms: '',
    notes: 'Primary wholesale supplier — most spirits, draught beer, cans, and post-mix Coke BIB. Pricing matched to the Drinks Club 26-27 sheet.',
    priority: 'primary',
  },

  // ─── Top Cuvee ─ all wines ──────────────────────────────────────
  {
    id: 'top-cuvee',
    name: 'Top Cuvee',
    categories: ['Wine'],
    address: '177 Blackstock Road, London N5 2LL',
    phone: '',
    email: 'orders@topcuvee.com',
    repName: '',
    website: 'https://topcuvee.com',
    tradePortal: '',
    tradePortalNote: 'Top Cuvee historically take orders by email — paste the trade-portal URL here if/when they launch one.',
    paymentTerms: '',
    notes: 'All wines (white, red, rosé, orange, chilled red, prosecco). Also stocks vermut and the house orange. London-based natural-wine importer.',
    priority: 'primary',
  },

  // ─── Goodwine Good People ─ vermouth + aperitifs ────────────────
  {
    id: 'goodwine-good-people',
    name: 'Goodwine Good People',
    categories: ['Wine', 'Vermouth', 'Liqueurs'],
    address: '',
    phone: '',
    email: '',
    repName: '',
    website: '',
    tradePortal: '',
    tradePortalNote: 'Paste their website + trade portal here.',
    paymentTerms: '',
    notes: 'Vermouths + aperitifs (Cocchi Americano, El Bandarra, Lillet, Nectarine Aperitif).',
    priority: 'secondary',
  },

  // ─── True Brew Co Ltd (Hanbury Distillery) ──────────────────────
  {
    id: 'true-brew-hanbury',
    name: 'True Brew Co Ltd (Hanbury Distillery)',
    categories: ['Spirits'],
    address: 'The Hanbury, 33 Linton Street, Islington, London N1 7DU',
    phone: '',
    email: '',
    repName: '',
    website: 'https://thehanbury.london',
    tradePortal: '',
    tradePortalNote: 'Independent distillery — orders likely via direct email.',
    paymentTerms: 'BACS to HSBC 40-02-26 A/C 63856801',
    notes: 'Hanbury London Dry Gin (HD011) refill 2.1L £64 ex VAT — INV-0395. Hanbury Spiced Cranberry refill 2.1L £65 — INV-0473. VAT GB365465571. Company Reg 12079877.',
    priority: 'primary',
  },

  // ─── Devil's Botany ─────────────────────────────────────────────
  {
    id: 'devils-botany',
    name: "Devil's Botany",
    categories: ['Spirits', 'Liqueurs'],
    address: '16a Heybridge Way, London E10 7NQ',
    phone: '',
    email: 'info@devilsbotany.com',
    repName: '',
    website: 'https://www.devilsbotany.com',
    tradePortal: '',
    tradePortalNote: "Direct from the Leyton distillery — orders by email to info@devilsbotany.com.",
    paymentTerms: 'BACS to Starling Bank 60-83-71 A/C 68915463',
    notes: 'INV-0534 (29 Apr 2025): Chocolate Absinthe 24% 70cl £18.63, London Absinthe 45% 70cl £25.30, Absinthe Regalis 63% 70cl £36.63 — all ex VAT. VAT GB 263022147. Company Reg 10330594. AWRS XHAW00000115101.',
    priority: 'primary',
  },

  // ─── Fine Cider Company ─ Oliver's cider ────────────────────────
  {
    id: 'fine-cider-co',
    name: 'Fine Cider Company',
    categories: ['Cider'],
    address: '',
    phone: '',
    email: '',
    repName: '',
    website: 'https://thefinecidercompany.com',
    tradePortal: 'https://thefinecidercompany.com/account/login',
    tradePortalNote: '',
    paymentTerms: 'Free shipping on the trade order shown',
    notes: "Oliver's Fine Cider 330ml bottles — Pomona Rolling Blend 2023 + Gold Rush #11 — case of 24 @ £55.83 ex VAT (£1.94/btl). Replaces Aspalls.",
    priority: 'secondary',
  },

  // ─── Umbrella Cider Co. ─────────────────────────────────────────
  {
    id: 'umbrella-cider',
    name: 'Umbrella Cider Co.',
    categories: ['Cider', 'Beer (keg)'],
    address: '',
    phone: '',
    email: '',
    repName: '',
    website: '',
    tradePortal: '',
    tradePortalNote: 'Find direct cider rep — Umbrella Apple Cider keg is the draught line.',
    paymentTerms: '',
    notes: 'Umbrella Apple Cider keg — direct supplier for the draught fruit cider line.',
    priority: 'secondary',
  },

  // ─── BCS Supplies ─ cleaning + consumables ──────────────────────
  {
    id: 'bcs-supplies',
    name: 'BCS Supplies Ltd',
    categories: ['Cleaning supplies', 'Bar tools / glassware'],
    address: 'Unit 3, Link 23, Haywards Heath, West Sussex RH17 5JS',
    phone: '',
    email: '',
    repName: '',
    website: 'https://www.bcssupplies.com',
    tradePortal: 'https://www.bcssupplies.com/login',
    tradePortalNote: '',
    paymentTerms: '',
    notes: '14-month spend tracked at £1,704 across 48 SKUs — see /operations?tool=consumables. Paper, cleaning chemicals, glassware, bar tools.',
    priority: 'primary',
  },

  // ─── Brakes ─ fresh produce ─────────────────────────────────────
  {
    id: 'brakes',
    name: 'Brakes',
    categories: ['Fresh produce', 'Mixers / syrups'],
    address: 'Enterprise House, Eureka Business Park, Ashford, Kent TN25 4AG',
    phone: '0345 606 9090',
    email: '',
    repName: '',
    website: 'https://www.brake.co.uk',
    tradePortal: 'https://www.brake.co.uk/account/login',
    tradePortalNote: '',
    paymentTerms: '',
    notes: 'All fresh — limes, lemons, oranges, cucumber, chillis, mint, eggs, tea, coffee. Garnish-side of every cocktail recipe.',
    priority: 'primary',
  },

  // ─── SNACK ──────────────────────────────────────────────────────
  {
    id: 'snack',
    name: 'SNACK',
    categories: ['Snacks'],
    address: '',
    phone: '',
    email: '',
    repName: '',
    website: '',
    tradePortal: '',
    tradePortalNote: 'Crisps, nuts, salami, olives — chase B2B portal URL.',
    paymentTerms: '',
    notes: 'Crisps × 5 flavours, nuts × 2, salami, olives, Ollys Olives. Full snacks category currently 100% ballpark cost — chase price list.',
    priority: 'secondary',
  },

  // ─── Brindisa ─ Spanish small plates ────────────────────────────
  {
    id: 'brindisa',
    name: 'Brindisa',
    categories: ['Snacks'],
    address: 'Brindisa Spanish Foods, 32 Bury Walk, London SW3 6QA',
    phone: '0208 772 1600',
    email: 'sales@brindisa.com',
    repName: '',
    website: 'https://www.brindisa.com',
    tradePortal: 'https://www.brindisa.com/account/login',
    tradePortalNote: 'Wholesale orders via Brindisa Wholesale — confirm exact login URL.',
    paymentTerms: '',
    notes: 'Gildas, jamón, Spanish sherry. Per-skewer cost for gildas currently ballpark.',
    priority: 'secondary',
  },

  // ─── Valimex ─ tequila/mezcal importer ──────────────────────────
  {
    id: 'valimex',
    name: 'Valimex',
    categories: ['Spirits'],
    address: '',
    phone: '',
    email: '',
    repName: '',
    website: '',
    tradePortal: '',
    tradePortalNote: 'Mexican spirits importer — confirm full name + URL.',
    paymentTerms: '',
    notes: 'Tequila + mezcal importer. May beat Drinks Club on Vida Mezcal, Cachaça, Wray & Nephew. Chase quote.',
    priority: 'secondary',
  },

  // ─── Club Mate (direct) ─────────────────────────────────────────
  {
    id: 'club-mate',
    name: 'Club Mate (direct)',
    categories: ['Soft drinks'],
    address: '',
    phone: '',
    email: '',
    repName: '',
    website: 'https://club-mate.uk',
    tradePortal: '',
    tradePortalNote: 'Club Mate UK distributor — confirm trade rep + portal.',
    paymentTerms: '',
    notes: 'Club Mate caffeinated bottles — direct from the UK distributor.',
    priority: 'secondary',
  },

  // ─── BOC ─ gas ──────────────────────────────────────────────────
  {
    id: 'boc',
    name: 'BOC',
    categories: ['Gas'],
    address: 'BOC Limited, Customer Service Centre, Priestley Road, Worsley, Manchester M28 2UT',
    phone: '0800 111 333',
    email: '',
    repName: '',
    website: 'https://www.boconline.co.uk',
    tradePortal: 'https://www.boconline.co.uk/en/login',
    tradePortalNote: '',
    paymentTerms: '',
    notes: '70/30 mixed gas (stout), 60/40 mixed gas (lager & IPA), CO2 for post-mix.',
    priority: 'primary',
  },
]

// ────────────────────────────────────────────────────────────────────
// localStorage — overrides everything in the SUPPLIERS array per id.
// Lets the founder fill in addresses / portal URLs as they come in
// without us needing to push code.
// ────────────────────────────────────────────────────────────────────
export const STORE_KEY = 'ndb_ops_suppliers_v1'

export function loadOverrides() {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) || {}
  } catch { return {} }
}

export function saveOverrides(state) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)) } catch {}
}

// Merge seed + overrides for display.
export function effective(supplier, overrides) {
  const o = overrides[supplier.id] || {}
  return { ...supplier, ...o }
}
