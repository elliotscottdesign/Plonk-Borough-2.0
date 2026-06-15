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

// Display groups — drives the section headers on /operations?tool=suppliers.
// Each supplier carries a `group` key that matches one of these. Order here
// = order on screen. Pick the group based on what they're PRIMARILY for, even
// if they also stock items in a sister category.
export const GROUPS = [
  { key: 'spirits',    label: 'Spirits & Liqueurs' },
  { key: 'wine',       label: 'Wine' },
  { key: 'beer-cider', label: 'Beer & Cider' },
  { key: 'soft',       label: 'Soft Drinks' },
  { key: 'produce',    label: 'Fresh Produce' },
  { key: 'snacks',     label: 'Snacks' },
  { key: 'ops',        label: 'Cleaning, Gas & Bar Tools' },
]

// Each supplier: id (slug, stable), name (display), then everything
// else is whatever info we have. Empty strings render as "—" with a
// pencil icon so the founder can edit inline.
export const SUPPLIERS = [
  // ─── Drinks Club ─ main liquor + soft drinks ─────────────────────
  {
    id: 'drinks-club',
    name: 'The Drinks Club',
    categories: ['Spirits', 'Liqueurs', 'Beer (keg)', 'Beer (bottle/can)', 'Wine', 'Soft drinks', 'Mixers / syrups', 'Vermouth'],
    address: 'Biddlesden Abbey, Northamptonshire NN13 5TR',
    phone: '0871 200 2022',
    email: '',
    repName: '',
    website: 'https://thedrinksclub.com',
    tradePortal: 'https://ontrade.thedrinksclub.com',
    tradePortalNote: '',
    paymentTerms: '',
    notes: 'Primary on-trade wholesale — most spirits, draught beer, cans, and post-mix Coke BIB. Pricing matched to the Drinks Club 26-27 sheet.',
    priority: 'primary',
    group: 'spirits',
  },

  // ─── Top Cuvee ─ all wines ──────────────────────────────────────
  {
    id: 'top-cuvee',
    name: 'Top Cuvée',
    categories: ['Wine'],
    address: '177 Blackstock Road, London N5 2LL',
    phone: '020 7704 8457',
    email: 'hello@topcuvee.com',
    repName: '',
    website: 'https://topcuvee.com',
    tradePortal: 'https://www.shopcuvee.com/pages/wholesale',
    tradePortalNote: '',
    paymentTerms: '',
    notes: 'All wines (white, red, rosé, orange, chilled red, prosecco). Also stocks vermut and the house orange. London-based natural-wine importer. Orders typically by email to hello@topcuvee.com.',
    priority: 'primary',
    group: 'wine',
  },

  // ─── Goodwine Good People ─ vermouth + aperitifs ────────────────
  {
    id: 'goodwine-good-people',
    name: 'Good Wine Good People',
    categories: ['Wine', 'Vermouth', 'Liqueurs'],
    address: '9 Bonhill Street, London EC2A 4DJ',
    phone: '',
    email: 'info@goodwinegoodpeople.com',
    repName: 'Dan Belmont (founder) — dan@goodwinegoodpeople.com',
    website: 'https://goodwinegoodpeople.com',
    tradePortal: 'https://goodwinegoodpeople.com/account/login',
    tradePortalNote: 'GWGP Trade — fast-growing import + wholesale arm. ~80 wines from 18 producers across 8 countries.',
    paymentTerms: '',
    notes: 'Vermouths + aperitifs (Cocchi Americano, El Bandarra, Lillet, Nectarine Aperitif). Founded 2020 by Dan Belmont, London-based New Yorker + wine educator.',
    priority: 'secondary',
    group: 'wine',
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
    website: 'https://www.hanburygin.co.uk',
    tradePortal: '',
    tradePortalNote: 'Independent distillery — small-batch orders direct via email / the consumer site.',
    paymentTerms: 'BACS to HSBC 40-02-26 A/C 63856801',
    notes: 'Hanbury London Dry Gin (HD011) refill 2.1L £64 ex VAT — INV-0395. Hanbury Spiced Cranberry refill 2.1L £65 — INV-0473. VAT GB365465571. Company Reg 12079877. Opened 2021, Islington.',
    priority: 'primary',
    group: 'spirits',
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
    tradePortal: 'https://devilsbotany.com',
    tradePortalNote: 'No dedicated B2B portal — order via the consumer site or email info@devilsbotany.com. UK\'s first dedicated absinthe distillery (founded 2021, Leyton).',
    paymentTerms: 'BACS to Starling Bank 60-83-71 A/C 68915463',
    notes: 'INV-0534 (29 Apr 2025): Chocolate Absinthe 24% 70cl £18.63, London Absinthe 45% 70cl £25.30, Absinthe Regalis 63% 70cl £36.63 — all ex VAT. VAT GB 263022147. Company Reg 10330594. AWRS XHAW00000115101.',
    priority: 'primary',
    group: 'spirits',
  },

  // ─── Fine Cider Company ─ Oliver's cider ────────────────────────
  {
    id: 'fine-cider-co',
    name: 'The Fine Cider Company',
    categories: ['Cider'],
    address: '',
    phone: '',
    email: '',
    repName: '',
    website: 'https://thefinecider.company',
    tradePortal: 'https://thefinecider.company/pages/wholesale',
    tradePortalNote: 'UK distributor of Oliver\'s Cider & Perry + other fine ciders. Direct delivery in central London; courier elsewhere.',
    paymentTerms: 'Free shipping on the trade order shown',
    notes: "Oliver's Fine Cider 330ml bottles — Pomona Rolling Blend 2023 + Gold Rush #11 — case of 24 @ £55.83 ex VAT (£1.94/btl). Replaces Aspalls.",
    priority: 'secondary',
    group: 'beer-cider',
  },

  // ─── Umbrella London (formerly Umbrella Brewing) ────────────────
  {
    id: 'umbrella-cider',
    name: 'Umbrella London',
    categories: ['Cider', 'Beer (keg)'],
    address: 'The Umbrella Cider House, Bethnal Green, London',
    phone: '',
    email: '',
    repName: '',
    website: 'https://umbrella-london.co.uk',
    tradePortal: 'https://www.eebriatrade.com/products/null/umbrella-brewing',
    tradePortalNote: 'Independent N London brewery — rebranded from "Umbrella Brewing" to "Umbrella London" when they launched the Sparkling Apple + Rhubarb ciders. Trade orders go via EeBria Trade (linked) or direct.',
    paymentTerms: '',
    notes: 'Umbrella Apple Cider keg (50L), 330ml × 24 cases. Apple, blackcurrant + rhubarb cider variants — British apples, direct from farmers. Production moved to Bethnal Green in Aug 2024.',
    priority: 'secondary',
    group: 'beer-cider',
  },

  // ─── BCS Supplies ─ cleaning + consumables ──────────────────────
  {
    id: 'bcs-supplies',
    name: 'BCS Supplies Ltd',
    categories: ['Cleaning supplies', 'Bar tools / glassware'],
    address: 'Unit 3, Link 23, Haywards Heath, West Sussex RH17 5JS — registered office. 20,000 sq ft warehouse near Gatwick Airport.',
    phone: '0208 686 2420 / 01273 358535',
    email: 'info@bcs.supplies',
    repName: '',
    website: 'https://bcs.supplies',
    tradePortal: 'https://bcs.direct',
    tradePortalNote: 'Brighton family-owned business — credit account on application. Free delivery + same/next day across London, Surrey, Kent.',
    paymentTerms: 'Direct debit / card / bank transfer',
    notes: '14-month spend tracked at £1,704 across 48 SKUs — see /operations?tool=consumables. Paper, cleaning chemicals, glassware, bar tools.',
    priority: 'primary',
    group: 'ops',
  },

  // ─── Brakes ─ fresh produce (Sysco GB Ltd) ──────────────────────
  {
    id: 'brakes',
    name: 'Brakes (Sysco GB)',
    categories: ['Fresh produce', 'Mixers / syrups'],
    address: 'Enterprise House, Eureka Business Park, Ashford, Kent TN25 4AG',
    phone: '0345 606 9090',
    email: '',
    repName: '',
    website: 'https://www.brake.co.uk',
    tradePortal: 'https://www.brake.co.uk',
    tradePortalNote: 'Award-winning delivered wholesaler, part of Sysco. mybrakes rewards = 10% cashback for 10 weeks on new accounts. Supplier portal also at isupply (isupply.queries@brake.co.uk).',
    paymentTerms: '',
    notes: 'All fresh — limes, lemons, oranges, cucumber, chillis, mint, eggs, tea, coffee. Garnish-side of every cocktail recipe.',
    priority: 'primary',
    group: 'produce',
  },

  // ─── SNACK ─ likely Nibblers, the premium bar-snack trade supplier ────
  {
    id: 'snack',
    name: 'SNACK — likely Nibblers',
    categories: ['Snacks'],
    address: '',
    phone: '',
    email: '',
    repName: '',
    website: 'https://www.nibblers.co.uk',
    tradePortal: 'https://www.nibblers.co.uk/account/login',
    tradePortalNote: 'Best guess: the "SNACK" entry refers to Nibblers, the leading UK B2B bar-snack distributor that bundles Snackalami (Serious Pig), Salty Dog Crisps + Olly\'s Olives. Confirm with founder + replace URL if different.',
    paymentTerms: '',
    notes: 'Crisps × 5 flavours (Salty Dog), nuts × 2, Snackalami (Serious Pig), Olly\'s Olives. All currently ballpark cost — chase real price list. The "SNACK" tag in the legacy stock list may need updating once supplier confirmed.',
    priority: 'secondary',
    group: 'snacks',
  },

  // ─── Brindisa ─ Spanish small plates ────────────────────────────
  {
    id: 'brindisa',
    name: 'Brindisa',
    categories: ['Snacks'],
    address: 'Brindisa Ltd, 9B Weir Rd, Balham, London SW12 0LT',
    phone: '020 8772 1600',
    email: 'sales@brindisa.com',
    repName: '',
    website: 'https://brindisa.com',
    tradePortal: 'https://brindisa.com/pages/trade',
    tradePortalNote: 'Brindisa App for smartphone ordering OR the trade website from PC/laptop. International orders: brindisainternational@brindisa.com.',
    paymentTerms: '',
    notes: 'Gildas, jamón, Spanish sherry, olives. Per-skewer cost for gildas currently ballpark. Warehouse hours Mon-Fri 9-5.',
    priority: 'secondary',
    group: 'snacks',
  },

  // ─── Valimex (Import & Export) Ltd ──────────────────────────────
  {
    id: 'valimex',
    name: 'Valimex (Import & Export) Ltd',
    categories: ['Fresh produce'],
    address: 'London (registered office) — Valimex Import & Export Ltd',
    phone: '',
    email: '',
    repName: '',
    website: 'https://www.valimex.co.uk',
    tradePortal: 'https://www.valimex.co.uk/contact',
    tradePortalNote: 'Companies House: 01479813. Foodservice specialist since 1980 — fresh produce + fine foods (NOT Mexican spirits as the legacy stock label suggested). Founder to confirm if this is the right Valimex or a different supplier.',
    paymentTerms: '',
    notes: 'Verified company is a UK foodservice fresh produce + fine foods distributor (London, since 1980). 5-9 employees. If you intended a Mexican spirits importer for Vida Mezcal / Cachaça / Wray & Nephew, that\'s a different supplier — clarify with the founder.',
    priority: 'secondary',
    group: 'produce',
  },

  // ─── Club Mate (direct / via Mr Lemonade) ───────────────────────
  {
    id: 'club-mate',
    name: 'Club Mate UK',
    categories: ['Soft drinks'],
    address: 'Mr. Lemonade (London distributor): Unit 18 Buzzard Creek Industrial Estate, River Road, Barking, London IG11 0EL',
    phone: '',
    email: '',
    repName: '',
    website: 'https://www.club-mate.uk',
    tradePortal: 'https://www.mrlemonade.co.uk',
    tradePortalNote: 'Club Mate UK is the official site. Mr. Lemonade is the main London-based trade distributor that carries 24-packs at trade prices.',
    paymentTerms: '',
    notes: 'Club Mate caffeinated mate-tea bottles (330ml & 500ml). UK trade typically via Mr. Lemonade.',
    priority: 'secondary',
    group: 'soft',
  },

  // ─── BOC ─ industrial gases ─────────────────────────────────────
  {
    id: 'boc',
    name: 'BOC Limited',
    categories: ['Gas'],
    address: 'BOC Limited, Customer Service Centre, Priestley Road, Worsley, Manchester M28 2UT',
    phone: '0800 111 333',
    email: '',
    repName: '',
    website: 'https://www.boconline.co.uk',
    tradePortal: 'https://www.boconline.co.uk/shop/en/uk/registration',
    tradePortalNote: 'BOC credit account required — open via the registration link, or contact LiveChat / phone. Once signed in, click "re-order" top-right for fast top-ups.',
    paymentTerms: '',
    notes: '70/30 mixed gas (stout), 60/40 mixed gas (lager & IPA), CO2 for post-mix. Companies House: 00337663.',
    priority: 'primary',
    group: 'ops',
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
