# Supplier pricing checklist — Stock Costing margin sheet

**Owner:** founder + nodice.bar Claude session
**For:** the /ops Costing tool at team.nodice.bar/operations?tool=costing
**Status:** Drinks Club ✅ done (29 May 2026 / Drinks Club 26-27 sheet). Everyone else outstanding.

The Costing tool computes live margins from `src/ops/data/costing.js`. Every ingredient has a `defaultCost` (ex-VAT) + a `supplier` tag + (when known) a `supplierProduct` field showing the exact line on the supplier portal so a number on screen can be matched back to an invoice. The sheet is only as accurate as the cost data behind it — the table below tracks who supplies what so the founder can chase the right list per supplier.

## Status per supplier

| Supplier | Status | What they supply (high level) | Items in stock list | Costing sheet items affected |
|---|---|---|---|---|
| **Drinks Club** | ✅ Done | Spirits, draught beer, bottles/cans, post-mix, syrups | 149 | All spirits + most beer + most softs |
| **Top Cuvee** | ⏳ Needed | Wines (white/red/rosé/orange/chilled red), prosecco, vermouth | 28 | All wines except prosecco (Drinks Club has that) |
| **Goodwine Good People** | ⏳ Needed | Vermouths, aperitifs, low-intervention bottles | 7 | Cocchi, El Bandarra, Lillet, sweet vermouth |
| **SNACK** | ⏳ Needed | Bar snacks — crisps, nuts, olives, salami | 19 | All Snacks category (crisps, nuts, salami, olives) |
| **Brakes** | ⏳ Needed | Fresh produce, dairy, tea/coffee, juice, syrup | 31 | Limes, lemons, oranges, cucumber, chilli, mint, eggs, tea, coffee |
| **Brindisa** | ⏳ Needed | Spanish small plates — gildas, sherry, jamón | (not in list yet) | Gildas (single + 6-pack) |
| **Club Mate (direct)** | ⏳ Needed | Club Mate caffeinated bottles | 1 | Not in costing yet — add when known |
| **Umbrella Cider Co.** | ⏳ Needed | Umbrella Apple Cider keg | (not tracked separately yet) | Umbrella Cider pint / half (currently using Drinks Club Red Fin as substitute) |
| **Fine Cider Company** | ⏳ Needed | Oliver's Fine Cider 500ml | (not tracked separately yet) | Oliver's Fine Cider bottle |
| **Valimex** | ⏳ Needed | Tequila / mezcal importer (likely) | (not tracked separately yet) | Vida Mezcal, Wray & Nephew, Cachaça (may beat Drinks Club) |
| **Smokoloko** | ⏳ Need clarification | Unknown — smoked snacks? smoked salt? | (not tracked separately yet) | TBC |
| **Mega Foods** | ⏳ Need clarification | Generic food wholesaler — unknown coverage | (not tracked separately yet) | TBC |
| **BCS Cleaning Supplies** | ➖ Out of scope | Cleaning, paper, glassware, bar tools | 45 | Not cost-of-sales — operating cost. Excluded from margin sheet by design. |

## What to send me per supplier (founder action)

For each supplier, easiest format on the left wins. PDF/Excel/screenshot of the portal — any of them — and I'll do the typing-up.

| Supplier | Easiest send | Backup | Items to chase |
|---|---|---|---|
| **Top Cuvee** | PDF current price list | Email forward of the latest invoice + delivery note | Blanco Blanco · Los Conejos · Doom Juice Rouge/Rosé/Fizz · Top Cuvee House Orange · Favonius · Gueule d'Amour · Beaujolais Nouveau · Chin Chin Vinho Verde · Cueva Nueva Vermut · Vigna Rose Pet Nat |
| **Goodwine Good People** | Their latest invoice | Screenshot of portal cart | Cocchi Americano + Extra Dry · El Bandarra · Lillet Rose · Martini Rosso (alt source) |
| **SNACK** | Price list from their B2B portal | Photo of invoice | Crisps (5 flavours) · Nuts (Dry Roasted + Sweet Chilli) · Salami Snacks · Olives · Ollys Olives |
| **Brakes** | Latest weekly invoice CSV | Order summary email | Limes · Lemons · Oranges · Cucumber · Green/Red Chillies · Mint · Pineapple juice · Eggs · Earl Grey/Breakfast/Green tea · Coffee · Sugar (for syrup) |
| **Brindisa** | Order confirmation email | Photo of invoice | Gildas (per skewer cost) |
| **Club Mate** | Direct invoice from rep | Price per case | Per-bottle cost + case size |
| **Umbrella Cider Co.** | Direct invoice for last keg | Quote email | Per-keg cost + keg size (assume 50L unless told) |
| **Fine Cider Company** | Their current price list | Last invoice | Oliver's Fine Cider 500ml — per-bottle cost + case size |
| **Valimex** | Price list / sales rep email | — | Quote on: Vida Mezcal · Cachaça · Wray & Nephew · any other Mexican spirits |
| **Smokoloko** | Whatever they sent last | — | Need to know what they actually supply |
| **Mega Foods** | Latest invoice | — | Need to know what they actually supply |

## Once a supplier list lands

The nodice.bar Claude session walks the price list, updates the matching `INGREDIENTS` entries in `src/ops/data/costing.js` (`defaultCost`, `packMl` if size changed, `supplier`, `supplierProduct`), commits + pushes, and the live `/operations?tool=costing` page re-computes margins on the next load.

Items not on a given list keep their previous default and stay flagged in comments as needing a source — no risk of overwriting good data with worse data.

## Priority order (founder's call, but my recommendation)

1. **Top Cuvee** — 28 items, all wine glasses + bottles + £35+ price points = biggest revenue impact
2. **Brakes** — covers every cocktail's garnish/juice + tea/coffee, ~30+ items
3. **SNACK** — full snacks category currently 100% ballpark
4. **Brindisa** — gildas have a £2 / £10 sell price and currently ballpark cost
5. **Goodwine Good People** — 7 items, mostly vermouth lines
6. **Fine Cider Company + Umbrella Cider Co.** — 3 items but high-margin draught
7. **Valimex** — may give better prices than Drinks Club on Vida Mezcal / Cachaça / Wray
8. **Club Mate (direct)** — single line, low priority
9. **Smokoloko + Mega Foods** — need clarification first

## Out of scope for margin sheet

**BCS Cleaning Supplies** (45 items) — cleaning, paper, gloves, glassware, bar tools. These are operating costs, not cost-of-goods-sold. They sit in the StockOrder / StockList tools (already live) but don't belong in the margin computation. Leaving them where they are.
