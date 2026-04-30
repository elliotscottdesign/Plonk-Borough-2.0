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
