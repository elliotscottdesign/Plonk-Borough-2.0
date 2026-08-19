# TILL lane — building No Dice's own EPOS

**Branch:** `section/till` · **Worktree:** `../team-sessions/till`
**Created:** 19 Aug 2026, at the founder's request.

> "I need a new lane to be generated so I can start to develop our own system. this be
> based on our current light seat [Lightspeed] system and needs to be really stripped
> back. So it's simple to auto products and simple for Claude to work out margins, cost,
> and stock. This is, of course, a massive build. I need you to copy identically the
> layouts that we hold for lightspeed and offer up some till solutions such as
> integration into Square or integration into SumUp."

---

## What this lane owns

| Owns | Path |
|---|---|
| Till front end | `src/till/**` |
| Till back end | `supabase/functions/till/**` (not yet created) |
| Till tables | `till_*` in Supabase (not yet created) |

**Does NOT own** — coordinate before touching:
- `bar_*` tables and `supabase/functions/bar` → the **bar** lane. The till *reads and
  writes* these; it must not redefine them.
- Anything in the shared-file list in [CLAUDE.md](CLAUDE.md).

Follow the standard per-session protocol in CLAUDE.md: sync from `origin/main` first,
work only in this lane's files, claim shared files in COORDINATION.md, `npm run build`
before shipping.

---

## The starting point: what Lightspeed actually holds

Extracted from the venue's own 2025 Lightspeed export (`data/hackney_2025_till_sales.csv`,
89,521 line-items) and saved as **`src/till/data/lightspeedLayout.json`** — every category,
every product, with real units sold, gross taken and the most common price actually rung.

That file *is* the "copy identically the layouts" requirement. Build the new till's pages
from it rather than retyping a menu.

**29 categories, 726 products.** By units sold:

| Page | Products | Units |
|---|---|---|
| BEER - DRAUGHT | 44 | 30,588 |
| OTHER - GOLF & GAMES | 35 | 12,166 |
| BEER & CIDER - BOTTLED | 64 | 10,310 |
| SOFT DRINKS | 47 | 7,067 |
| COCKTAILS - HOUSE | 63 | 6,104 |
| OTHER - GOLF | 11 | 5,353 |
| COCKTAILS - CLASSIC | 48 | 4,874 |
| SPIRITS - GIN & VODKA | 49 | 3,981 |
| WINE & PROSECCO | 31 | 3,655 |
| SPIRITS - TEQUILA & SHOTS | 51 | 2,620 |
| SPIRITS - RUM & BRANDY | 43 | 1,670 |
| OTHER - BAR SNACKS | 16 | 1,624 |
| BEER CANS | 16 | 1,069 |
| SPIRITS - WHISKEY & BOURBON | 39 | 908 |
| SOFT DRINKS - JUICE | 11 | 812 |
| COCKTAILS - MOCKTAILS | 9 | 728 |
| SPEED PAGE | 13 | 413 |
| SPIRITS - LIQUEURS & APERITIFS | 34 | 403 |
| OTHER - MISC | 3 | 331 |
| FOOD - HOT DOGS | 29 | 249 |
| FOOD TACOS | 7 | 203 |
| OTHER - TEA & COFFEE | 13 | 175 |
| FOOD SIDES | 10 | 170 |
| UNCATEGORISED | 17 | 128 |
| Pizza | 6 | 57 |
| COCKTAILS - PRIVATE HIRE | 11 | 46 |
| OTHER - ID CHECK | 2 | 44 |
| COCKTAIL INGREDIENTS | 2 | 4 |
| SPIRITS - PREMIXED | 2 | 2 |

**The case for "really stripped back", in one number: 249 of the 726 products — 34% —
sold five or fewer times in the whole year.** Duplicate size variants, one-off specials
("Vday Wine ❤️", "HAPPY HOUR WINE", "Cazcabel 3 for £14"), and till buttons that were
never products. Copy the *layout*; do not copy the *bloat*.

---

## The thing that makes this worth building

The stock, cost and margin engine **already exists and is live** — built 17 Aug, seeded
with 166 real products and 22 suppliers. The till does not need to reinvent any of it:

- `bar_products` — every product in one canonical unit (`base_unit` ml/g/each) with
  `order_to_base`, `count_to_base` and `yield_pct`, so a case of 24 can never be
  subtracted from a count of bottles again.
- `bar_menu_items` + `bar_recipe_lines` — what a sold item is *made of*, in base units.
- `bar_cost_base` / `bar_margins` — cost per base unit and GP, computed from the price
  **actually last paid**, and returning NULL (never zero) when an ingredient is uncosted.
- `bar_stocktakes` → `bar_usage_actual` → `bar_usage_theoretical` → `bar_variance` —
  what we used, what we should have used, and the gap in pounds.
- `bar_sales_daily` — the sales side, deliberately shaped to hold £0 comp lines.

**So the till's real job is small: ring a sale, take the money, and write a row that the
existing engine already knows how to read.** Every "simple for Claude to work out margins,
cost and stock" requirement is already satisfied the moment sales land in `bar_sales_daily`
with a `menu_item_id` attached — the views do the rest with no extra typing.

The hard part is NOT the maths. It is the join: Lightspeed's product names, the costing
recipe ids and the stock item names are three separate naming worlds that have never been
married up. Whatever the till does, it must create products in a way that keeps them
joined from day one — that is the whole design problem.

---

## Payment / hardware options

Being researched: **Square**, **SumUp**, and **Stripe Terminal** (worth assessing because
No Dice already runs Stripe for tournament entries, so the account, webhooks and
reconciliation already exist). Findings and a single recommendation go here.

---

## Rules of engagement for this lane

1. **Nothing replaces Lightspeed until it has run alongside it.** The first slices must be
   useful without switching the venue over.
2. **Never invent a price or a pack size.** The bar lane's hard-won rule: an unknown cost
   makes margin NULL and the screen says "not costed". Same discipline here.
3. **Speed of ringing a round beats every other consideration** on a Friday night.
4. A till holds money and VAT records. Refunds, voids, cash-up, tabs, split bills and
   HMRC digital record-keeping are not optional extras — scope them before writing code.
