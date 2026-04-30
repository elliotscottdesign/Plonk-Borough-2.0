# Brief — Borough 2025 Goodtill Till Sales Categorisation

> Self-contained brief for a fresh Claude Code session. The previous Claude
> session ran this exact process for **Hackney 2025** and shipped it; the
> output is `data/hackney_2025_till_sales.csv` in this repo with the React
> tab at `nodice.bar/hackney → Business Explorer → 2025 Till Sales`. This
> brief asks you to do the same job for **Borough 2025**.

---

## 1 · The job in one paragraph

You will be given a Goodtill `Sales Items` export for No Dice Borough (2025
calendar year, 1 Jan onwards). The Category column is partially blank. Your
job is to (a) recategorise every blank row that has a usable signal, (b)
emit a cleaned CSV with an explicit audit column tracking the provenance of
each Category value, (c) build a small `src/data/borough2025TillSales.js`
data file with monthly totals + per-category totals + discount aggregates,
and (d) wire a new "2025 Till Sales" tab into the **Borough** Business
Explorer (`src/tabs/BusinessExplorer.jsx`) — NOT the Hackney one. The same
visual language as the Hackney version: amber "till ≠ financial figures"
callout, donut hero, collapsible category long tail, collapsible Discounts
section with the same six sub-blocks (KPIs, monthly rate strip, per-category
heat-mapped table, findings note, discount-codes inferred from Item Notes,
reconciliation panel against the Borough P&L).

---

## 2 · Inputs the user will give you

1. A Google Sheets URL OR a CSV upload of the Borough Goodtill `Sales Items`
   export covering **1 Jan 2025 → present** (or whenever Borough's till
   coverage ends — Borough is on Lightspeed in 2026 but check the actual
   cutoff date in the data).
2. A list of category corrections / mapping decisions for any product names
   the user wants categorised differently from your first-pass guess. Do
   **not** ship without showing the user a "simplified breakdown" of
   ambiguous products and getting `y` confirmation. The Hackney run
   surfaced nine corrections this way.

---

## 3 · Source data shape (Goodtill export)

23 columns. The ones you actually use:

| Col | Name | Notes |
|---|---|---|
| 0 | `Sale ID` | Order identifier — same value repeats across all line items in one order |
| 1 | `Sale Date` | `YYYY-MM-DD` |
| 2 | `Sale Time` | `HH:MM:SS` |
| 3 | `Order Status` | Filter to `COMPLETED` for revenue analysis. `VOIDED` rows kept but excluded from sums. |
| 4 | `Register` | Single-venue export — only `Register`, `Second Register`, `till 2`. Don't try to use this as a venue filter; the export is single-venue by virtue of being a single till instance. |
| 6 | `Product Name` | Free-text — variants exist (`camden hells lager - Pint` vs `camden hells  Lager - Pint (Copy)`); normalise lowercase + collapsed whitespace before mapping |
| 7 | `Category` | The column you're filling in |
| 9 | `Quantity` | |
| 11 | `Line Discount` | Single-item discount £ |
| 12 | `Sale Discount` | Whole-order discount £ — pro-rated across order lines |
| 16 | `Total` | Line total **inc-VAT, post-discount** |
| 18 | `Item Notes` | Free-text staff annotations — this is where 2-for-1 / free-mixer behaviour leaks out. Mine this for discount-code analysis. |
| 19 | `Promotion` | Goodtill records the £ amount of the promo here, not a campaign name. Almost unused (~87 rows of 89,521 in Hackney). |

Drop these three columns when emitting the cleaned CSV — all empty / redundant:
- `Product ID`
- `VAT Description`
- `Account Code`

So the cleaned CSV ends up with **21 columns** (20 retained + the new `Category Source` audit column you append).

---

## 4 · Output spec — the cleaned CSV

`data/borough_2025_till_sales.csv` in this repo. Structure:

- **Rows 1–9** are a note block (NOT data). Use commas to put the value in
  column B so `File → Import → CSV → Insert new sheet` reads them cleanly:
  ```
  BOROUGH 2025 TILL SALES — Goodtill cleaned export
  Venue,"No Dice Borough · Borough Market SE1 (only venue on this Goodtill instance)"
  Source,"Goodtill 'Sales Items' export, <date range>"
  Rows,"<n> total · <n_completed> COMPLETED"
  Gross revenue (COMPLETED),"£<total>"
  Categorisation,"<n> previously-uncategorised COMPLETED+VOIDED rows filled per cleanup playbook"
  Generated,<timestamp>
  ⚠ DATA GAP,"<note about till migration date — Borough went to Lightspeed at <date>>"
  ""
  ```
- **Row 10** is the header: `Sale ID, Sale Date, Sale Time, Order Status, Register, Staff, Product Name, Category, Item Type, Quantity, Unit Price, Line Discount, Sale Discount, VAT Rate, Net, VAT, Total, Eat-in/Takeaway, Item Notes, Promotion, Category Source`
- **Rows 11+** are data.

The `Category Source` column values:
- `original` — value already in source (kept verbatim)
- `auto · product lookup` — filled from the Product Name → Category map
- `auto · MISC by order context` — filled by inferring dominant category of the order
- *blank* — non-COMPLETED-non-VOIDED row left untouched

---

## 5 · Categorisation method — two-tier

### Tier 1 · Product Name → Category lookup (covers ~90% of blanks)

Build a Python dictionary keyed on the lowercased + whitespace-normalised
product name, value = canonical category. The Hackney run had ~78 unique
products needing mapping. Borough will be similar size.

The canonical category list (use these exactly, don't invent new ones unless
genuinely needed):

```
WINE & PROSECCO
SOFT DRINKS
SOFT DRINKS - JUICE
OTHER - TEA & COFFEE
BEER & CIDER - BOTTLED
BEER - DRAUGHT
BEER CANS
SPIRITS - GIN & VODKA
SPIRITS - RUM & BRANDY
SPIRITS - WHISKEY & BOURBON
SPIRITS - TEQUILA & SHOTS
SPIRITS - LIQUEURS & APERITIFS
SPIRITS - PREMIXED
COCKTAILS - HOUSE
COCKTAILS - CLASSIC
COCKTAILS - MOCKTAILS
COCKTAILS - PRIVATE HIRE
COCKTAIL INGREDIENTS
FOOD TACOS
FOOD SIDES
FOOD - HOT DOGS
Pizza
OTHER - BAR SNACKS
OTHER - GOLF
OTHER - GOLF & GAMES
OTHER - MISC          ← catch-all (filters slim, short papers, founder one-off rings)
OTHER - ID CHECK
SPEED PAGE             ← Goodtill till promo page (PROMO_MULTI, PROMO_BOGOF, 2-4-£12 etc)
```

For Borough specifically: the venue runs Plonk Mini Golf as a major income
line. Watch for golf SKUs and route them to `OTHER - GOLF` (golf entry / round
fees) vs `OTHER - GOLF & GAMES` (golf + drink bundles, pool, arcade tokens
sold standalone).

### Tier 2 · MISC line items by order context (covers the rest)

Goodtill exports often have a literal product called `MISC` that staff use
for one-off rings (tap repair, comp, manual price). For each `Sale ID`
containing a MISC line:

```python
misc_cat_by_sid = {}
for sid, items in orders_by_sid.items():
    misc_lines = [r for r in items if r['Product Name'].strip().upper() == 'MISC']
    if not misc_lines: continue
    other_lines = [r for r in items if r['Product Name'].strip().upper() != 'MISC']
    if other_lines:
        cat_revenue = defaultdict(float)
        for r in other_lines:
            c = r['Category'].strip()
            if c: cat_revenue[c] += float(r['Total'])
        # dominant category by revenue
        cat = max(cat_revenue.items(), key=lambda x: x[1])[0] if cat_revenue else 'OTHER - MISC'
    else:
        cat = 'OTHER - MISC'   # solo MISC order with no signal
    misc_cat_by_sid[sid] = cat
```

Apply the per-Sale-ID category to MISC rows that ALSO have a blank Category.
Mark them `auto · MISC by order context` in the audit column.

### Important rules

- **Never overwrite** an existing non-blank Category. The original column
  wins; you only fill blanks.
- **Only fill rows where `Order Status` is `COMPLETED` or `VOIDED`**. Other
  statuses (NEW, ON_HOLD, REFUNDED) leave blank.
- **Always tag the audit column** so the user can re-derive any decision.

---

## 6 · Verification — show the user a simplified breakdown FIRST

Before generating the final CSV, send the user a markdown summary of the
mapping decisions they need to confirm. Format:

```
- Product "<name>" (X uncategorised rows, £Y revenue) → CATEGORY
- Product "<name>" (X rows, £Y) → CATEGORY  ← AMBIGUOUS, please confirm
...
```

Wait for `y` (or named corrections). The Hackney user came back with:
- vermouth → `SPIRITS - LIQUEURS & APERITIFS`
- Big Tom → `SOFT DRINKS`
- Kalimotxo → `WINE & PROSECCO` (it's wine, not a cocktail)
- Michelada → `COCKTAILS - HOUSE`
- £10 Hotdog & Drink → `FOOD - HOT DOGS` (NOT speed page)
- filters slim / short papers / MISC product → `OTHER - MISC`

Borough may have its own set of corrections — bar manager called the shots,
not you.

---

## 7 · Building the React data file

`src/data/borough2025TillSales.js` should mirror `src/data/hackney2025TillSales.js`.
Three named exports:

1. `BOROUGH_2025_TILL_SALES` — `{ totalRevenue, totalTxns, lastDate, months, monthlyTotals, categories: [{ name, total, qty, monthly: [9 numbers] }] }`
2. `BOROUGH_2025_DISCOUNTS` — `{ totalGross, totalDiscount, discountRate, totalOrders, discountedOrders, discountedOrderPct, avgDiscountPerDiscountedOrder, monthly, categories }`
3. `BOROUGH_2025_DISCOUNT_CODES` — `{ note, promotionColumn, freeMixers, onePoundMixers, magnitudeBuckets }`

Aggregate from the cleaned CSV. Look at how the Hackney equivalent was built —
the Python aggregation script lives in the conversation history but the data
file format is the source of truth: `src/data/hackney2025TillSales.js`.

---

## 8 · Wiring the React tab — Borough deck

The Borough Business Explorer is `src/tabs/BusinessExplorer.jsx` (NOT the
Hackney one at `src/hackney/tabs/BusinessExplorer.jsx`). Borough uses
i18n (en + pt-BR) — Hackney does not. So you'll need to:

1. Add `'tillsales2025'` to the `TAB_KEYS` array
2. Import `BOROUGH_2025_TILL_SALES`, `BOROUGH_2025_DISCOUNTS`, `BOROUGH_2025_DISCOUNT_CODES`
3. Build a `TabBoroughTillSales2025` component that mirrors the Hackney
   `TabTillSales2025` but using the i18n `t('explorer:tillsales2025.…')`
   convention you can copy from how `cashflow` keys are used in the same
   file
4. Add the `tillsales2025` translation block to BOTH
   `src/i18n/locales/en/explorer.json` and `src/i18n/locales/pt-BR/explorer.json`
5. Wire it into `tabComponents`

Match the visual language of the Hackney version exactly:
- Eyebrow + serif title
- Amber "till ≠ financial figures" callout
- Red "data gap" callout (if there's a till migration gap to flag)
- 4-card KPI strip
- Donut hero with top-3 callout strip beneath
- Category table with collapsible long-tail (under-1% rows)
- Discounts dropdown containing: KPI strip · monthly rate strip · per-category heat-mapped table · findings note · discount-codes section · reconciliation panel

---

## 9 · Lessons learned from Hackney — DON'T repeat these

1. **The till data is NOT the canonical revenue figure.** The Goodtill
   `Total` column is gross of VAT and post-discount but pre-refund, and
   the Borough P&L (Weekly Merge 2024-2026) restates / re-categorises
   numbers. Like-for-like Jan→Aug 2025 Hackney showed Goodtill £595k
   inc-VAT vs Monthly Summary £383k — a ~£212k gap, of which discounts
   accounted for only ~6%. Bake this into the slide as an amber callout
   up top so investors don't read till totals as P&L revenue.

2. **Goodtill doesn't store named promo codes.** The `Promotion` column
   is barely used (87 rows of 89,521 in Hackney) and only stores £
   amounts. To answer "what promo codes were used", reverse-engineer
   patterns from the `Item Notes` column (free items rung at £0, £1
   mixers rung as a deal). Build three buckets: free-mixer / 2-for-1,
   £1 mixer special, magnitude distribution.

3. **Sale Discount magnitude tells you the BOGOF story.** In Hackney,
   89% of all discount £ fell in the 50-100% bracket — which means the
   second item is rung at £0. Classic happy-hour 2-for-1. Borough may
   have a different mix (more food covers, more events) — bucket the
   same way and let the data tell its own story.

4. **Don't ship to the user via MCP file upload.** Files >10MB don't
   fit. Hackney's CSV was 15.4MB. Solution: commit to git/main and send
   the user the GitHub raw URL plus Google Sheets import instructions
   (`File → Import → Upload → Insert new sheet(s)`).

5. **Note block at top of the CSV matters.** Investors will open the
   raw CSV in Excel/Sheets and the first 9 rows are the only context
   they get. Make them count: venue, source, date range, totals,
   recategorisation summary, generation timestamp, **data gap warning**.

6. **The "data gap" warning is non-negotiable.** Whenever the till
   coverage ends mid-year (Hackney: 23 Sep 2025 migration to Lightspeed),
   call it out three times — note block, slide-level red callout,
   styled-September bar on any monthly chart. Investors mistake the
   September dip for a revenue drop otherwise.

7. **`Eat In` is not a discount.** When mining Item Notes for free-rung
   items, filter out service-mode tags like "Eat In" and "Takeaway" —
   they show up as "1 x Eat In - £0.00" and look like discounts.

8. **Product name normalisation is real work.** Goodtill has variants
   like `camden hells lager - Pint`, `camden hells  Lager - Pint`
   (double space), `camden hells lager - Pint (Copy)` and `CAMDEN
   HELLS Pint`. Lowercase, collapse whitespace, and use `startswith`
   matching where possible. Build the map iteratively — first run reveals
   the variants you missed.

9. **Don't separate the `data/` CSV from the `src/data/` JS file.**
   The CSV is the human-readable artefact for the workbook; the JS file
   is what the React deck imports. Both are committed; the JS aggregates
   are derived from the CSV. If the CSV changes, regenerate the JS.

10. **Idempotency in the recategorisation script.** Run it twice and
    you should get the same output. Never use a non-deterministic tie-
    breaker (e.g. `dict.items()` ordering pre-3.7 — use Python 3.7+ or
    sort keys explicitly).

---

## 10 · Verification checklist (before declaring done)

1. Cleaned CSV opens cleanly in Google Sheets — note block in rows 1-9,
   header in row 10, data from row 11.
2. Spot-check 5 random rows — Category matches what a human would say,
   Category Source column reflects the right provenance.
3. Sum the cleaned CSV's `Total` column for COMPLETED rows — match it
   against the Goodtill source's own COMPLETED total. The numbers should
   tie to the penny.
4. Open the React `2025 Till Sales` tab in the Borough deck — verify all
   sections render: KPI strip, donut, category table, Discounts dropdown,
   reconciliation note.
5. Run `npm run build` (or whatever the project uses) — no JSX/JSON
   syntax errors. Both i18n locales load without missing-key warnings.
6. Hard-refresh the deployed site — the new tab is visible at
   `nodice.bar/ → Business Explorer → 2025 Till Sales`. No Hackney
   numbers leak into Borough or vice versa.

---

## 11 · The actual workflow (copy-paste-able for the new Claude)

```
1. User shares Borough Goodtill Sales Items CSV / Sheets URL.
2. You pull the data, count blanks, list distinct uncategorised products.
3. You propose a mapping table. Send to user as a markdown summary
   ("Product → Category, X rows, £Y" lines). Flag ambiguous ones.
4. User confirms with "y" or returns named corrections.
5. You build the cleaned CSV with the audit column, write to
   data/borough_2025_till_sales.csv, commit + push.
6. Send user the GitHub raw URL + Sheets import instructions.
7. Aggregate the CSV into src/data/borough2025TillSales.js
   (BOROUGH_2025_TILL_SALES + BOROUGH_2025_DISCOUNTS + _DISCOUNT_CODES).
8. Build TabBoroughTillSales2025 in src/tabs/BusinessExplorer.jsx
   mirroring the Hackney TabTillSales2025 visual language.
9. Add i18n keys to both en/explorer.json and pt-BR/explorer.json.
10. Wire 'tillsales2025' into TAB_KEYS + tabComponents.
11. Commit + push. Deploy completes in ~2 min.
12. User refreshes nodice.bar (Borough deck) and sees the tab.
```

---

## 12 · One sentence summary

**Categorise blanks via a Product Name → Category dictionary plus per-order
dominant-category fallback for MISC; emit a 21-column CSV with an audit
column; aggregate to a JS data file; render a tab in the Borough Business
Explorer that mirrors the Hackney one — and call out the till-vs-P&L gap
in amber so nobody mistakes the till total for revenue.**
