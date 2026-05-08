# Data exports

Cleaned datasets used by the Borough + Hackney decks.

## `goodtill_2025_categorised.csv`

Goodtill `Sales Items` export with the Category column re-cleaned.

| | |
|---|---|
| Source | Goodtill "Sales Items" export — 1 Jan 2025 → 23 Sep 2025 |
| Rows | 89,521 |
| Columns | 21 *(dropped: Product ID, VAT Description, Account Code — all empty or redundant)* |
| Re-categorised | 5,469 previously-blank rows in COMPLETED + VOIDED status |
| New category | `OTHER - MISC` — 357 rows of founder catch-all till entries |

### ⚠ Data gap

**No till data is available from 24 Sep 2025 onwards** — Plonk migrated from Goodtill to a new till system (Lightspeed). For Q4 2025 figures cross-reference the new till's reports.

### Recategorisation method

1. **78 unique products** — straight Product Name → Category lookup (e.g. all Top Cuvee SKUs → `WINE & PROSECCO`, soda-gun pours → `SOFT DRINKS`, tea variants → `OTHER - TEA & COFFEE`)
2. **563 MISC line items** — categorised by the dominant category of the rest of the order they appeared on (mixed orders) or `OTHER - MISC` (solo orders with no context to infer from)
3. The original Category column is preserved when non-blank; only blanks are filled

### Importing into the master Plonk workbook

`File → Import → Upload → goodtill_2025_categorised.csv → Insert new sheet(s) → Import data`

The first 9 rows are notes; data starts at row 10.

### Auditing

Column 21 (`Category Source`) records the provenance of each row's Category:
- `original` — value was already in the source (kept verbatim)
- `auto · product lookup` — filled from the Product Name → Category mapping
- `auto · MISC by order context` — filled by inferring the dominant category of the rest of the order
- (blank) — non-COMPLETED-non-VOIDED row left untouched

## `hackney_2025_till_sales.csv`

Hackney-labelled copy of the same cleaned dataset, packaged for import as a new tab in the **Hackney** workbook.

| | |
|---|---|
| Venue | No Dice Hackney · London Fields, E8 (only venue on Goodtill) |
| Source | Goodtill `Sales Items` export — 1 Jan 2025 → 23 Sep 2025 |
| Rows | 89,521 total · 86,822 COMPLETED |
| Gross revenue (COMPLETED) | £628,227.04 |
| Recategorised | 5,469 rows (per the cleanup playbook above) |

Identical schema and contents to `goodtill_2025_categorised.csv`; the only difference is the note block at the top (rows 1–9) which labels the file as Hackney-specific and flags the **24 Sep 2025 → onwards data gap** (till migration to Lightspeed). Headers in row 10, data from row 11.

⚠ **This is the RAW export.** It contains a substantial duplicate-line problem (~26.7% of all rows are exact clones of an earlier row). The React deck and downstream aggregates are NOT built from this file directly — see the cleaned dataset below. The raw file is preserved untouched for audit.

## `hackney_2025_till_sales_clean.csv` ⭐ canonical for the deck

Deduplicated copy of `hackney_2025_till_sales.csv`. **This is the dataset that feeds the React deck constants** (`HACKNEY_2025_TILL_SALES`, `HACKNEY_2025_DISCOUNTS`, `HACKNEY_GOLF_TILL_SKUS_2025` and the related grand / monthly roll-ups).

| | |
|---|---|
| Source | Derived from `hackney_2025_till_sales.csv` (raw Goodtill export) |
| Rows | 70,933 total · 69,164 COMPLETED |
| Lines removed | 25,796 (~26.7% of raw export) |
| Revenue impact | £628,227 → **£513,686** COMPLETED revenue (−18.2%) |
| Distinct Sale IDs | 43,784 (unchanged — same sales, fewer line items per sale) |

### Dedup logic

A row is a duplicate when **every one** of these 10 identity-bearing fields matches an earlier row exactly:

`Sale ID + Sale Time + Order Status + Product Name + Quantity + Unit Price + Sale Discount + Total + Eat-in/Takeaway + Item Notes`

The first occurrence is kept; later identical rows are dropped. Header rows 1–10 are preserved verbatim with a provenance note at the top of the file documenting the cleanup.

### Why dedup was needed

The raw Goodtill export contained tight clusters of identical lines: same Sale ID, same Sale Time **to the second**, same Product Name, same Unit Price, same Quantity, same discount fields, same takeaway flag — written 2× / 3× / 4× and in extreme cases up to 65× per cluster. Genuine 2-unit purchases would appear in Goodtill as a single `qty=2` line; repeated `qty=1` clones at the same instant on the same Sale ID are not legitimate distinct purchases — they are duplicate writes by the till or the export pipeline. The duplication rate varied by category:

| Category | Raw rev | Clean rev | Drop |
|---|---:|---:|---:|
| OTHER - GOLF | £59,266 | £36,522 | −38.4% |
| OTHER - GOLF & GAMES | £76,772 | £58,839 | −23.4% |
| BEER - DRAUGHT | £191,599 | £152,980 | −20.2% |
| SPIRITS - TEQUILA & SHOTS | £13,714 | £11,012 | −19.7% |
| BEER & CIDER - BOTTLED | £46,378 | £38,771 | −16.4% |
| COCKTAILS - CLASSIC | £49,579 | £42,542 | −14.2% |
| COCKTAILS - HOUSE | £65,913 | £56,839 | −13.8% |
| (all 27 categories) | £628,227 | £513,686 | **−18.2%** |

### Workbook import

`File → Import → Upload → hackney_2025_till_sales_clean.csv → Insert new sheet(s)` — name the new sheet `Goodtill 2025 (clean)` to distinguish it from the existing raw import. The header block (rows 1–10) explains the cleanup; data starts at row 11.
