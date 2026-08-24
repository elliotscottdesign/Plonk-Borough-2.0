# Till architecture — K Series as the reference design

Founder brief (20 Aug 2026): *"tables, tabs, orders, addition, send to receipt printer
and all details in regards to taking payments and running up orders needs to be
developed as well. Use Lightspeed K Series as the design architecture for the build."*

K Series is the venue's muscle memory, so we copy its **concepts and flow**, not its
menus. This doc is the contract every till slice builds against.

---

## 1. The K Series flow we are copying

```
OPEN DAY (float counted)
   └─ ORDER opened against ①TABLE ②TAB (named) or ③QUICK SALE
        └─ lines added (serves of products — liveTill.json)
        └─ SEND  → kitchen/production printing, order stays open
        └─ ADDITION → the bill prints (itemised, VAT, service charge)
        └─ PAYMENT → cash (drawer kicks) / card (terminal) / split
              └─ RECEIPT prints → order CLOSED, immutable
CLOSE DAY → X-read during day, numbered Z-read at close, over/short recorded
```

Everything a K Series till guarantees, ours must too: an order can never be
half-paid and lost, a closed order can never be edited (voids/refunds are NEW
entries pointing at the old one), every action is attributable to a signed-in
staff member, and the day ends with a numbered Z-read.

## 2. Data model (till_* tables — this lane's schema, DDL announced in COORDINATION.md)

| Table | What it is |
|---|---|
| `till_sessions` | one trading day per till point: opened_by, float_start, float_counted, over_short, z_number (strictly sequential), opened_at/closed_at |
| `till_tables` | the floor plan: name/number, zone, active |
| `till_orders` | one open ticket: session_id, kind (table/tab/quick), table_id or tab_name, covers, status (open→sent→billed→paid→void), opened_by |
| `till_order_lines` | sku, name, serve label, qty, unit_price, vat_rate, sent_at, course; **never deleted** — a removed line gets qty-negating entry |
| `till_payments` | order_id, method (cash/card/split part), amount, tip, terminal ref, staff |
| `till_events` | **append-only audit**: every send/void/refund/no-sale/drawer-open/price-override with who+when+why. This is the HMRC "no sales suppression" answer. |

On payment completion the till also writes the day's roll-up into the bar lane's
`bar_sales_daily` (menu_item joined) — the stock/margin engine then works with no
extra typing. The till WRITES that table; it never redefines it.

## 3. Printing — Epson ePOS, the web-till way

K Series drives Epson TM-series LAN printers. **Epson's ePOS-Print SDK lets a
browser page print straight to those printers over the venue LAN** (plain HTTP/XML
to the printer's IP, no drivers, no app). That means:

- The SAME physical printers the venue already owns for K Series can be reused at
  cutover (they are just network devices; nothing about them is Lightspeed's).
- Kitchen dockets: routing rule per category (Food → kitchen printer; everything
  else → no production print), fired on SEND.
- Bills (ADDITION) and receipts: front printer, itemised with VAT breakdown,
  order number, table/tab, server, and the legal bits (company name — No Dice
  Hackney Ltd — VAT number, address).
- **Cash drawer kicks from the receipt printer's DK port** — which neatly answers
  the open Square question (the drawer never needed the card terminal at all).

TO CONFIRM with the founder: the exact printer models at the venue (look for
"Epson TM-…" on the front). If they are TM-m30/T20/T88 family we reuse them.

## 4. Payments

- **Cash first** (slice: sessions + drawer + Z-read land together — the review was
  explicit that money discipline cannot come after cash starts).
- **Card = Square Terminal via Terminal API** (docs/till-decision.md): our till
  POSTs a checkout for the exact amount; card data never touches our code.
  Split-by-amount is OURS to implement (N checkouts against one order) since
  Terminal API won't split a single checkout.
- Tips: prompt on terminal; recorded per payment; feeds the existing tips system
  (finance lane) — Employment (Allocation of Tips) Act applies.
- Refund/void: manager PIN (staff rank ≥ Asst. Manager, same gate as vouchers),
  always a new negative entry + a till_events row with a reason.
- Offline: cards STOP (architectural — see till-decision.md §3); cash continues,
  orders queue locally (IndexedDB) and sync when back. Break-glass: Square app on
  a spare device.

## 5. Tabs & tables

- Tables: simple named grid first (the venue is not table-service-heavy); move
  order to another table/tab = one action, audited.
- Tabs: named tab, optional £X pre-auth on the Square terminal later (hardest
  item on the list — phase 2 of payments, not day one).
- One order per table/tab; merging = move lines, audited.

## 6. Build order (supersedes the slice list in CLAUDE-TILL.md from slice 2 on)

1. ✅ Catalogue + GP (shipped 20 Aug)
2. ✅ Ringing screen demo, live layout & prices (shipped 20 Aug)
3. **Orders that persist** — till_* schema; open/send/bill/pay-CASH flow on one
   iPad, sessions + float + Z-read + append-only events from day one. Runs as
   TRAINING MODE alongside Lightspeed (clearly badged; nothing counts as real).
4. **Printing** — ePOS to the venue's Epson printers: kitchen dockets on SEND,
   bills, receipts. (Needs printer models + IPs from the venue.)
5. **Square Terminal** on one till point (needs the bespoke-rate answer first).
6. **Parallel running** — two full weeks, Z-reads reconciled against Lightspeed
   daily; then cutover, more terminals.

## 7. Watching Lightspeed to shape the build (founder question, 20 Aug)

There is no literal "screen-record the till" feed, but K Series already writes
down everything that matters, receipt by receipt. The plan:

- **Back Office → Reports → transactions/receipts export** for a full week (or
  better: K Series' scheduled report emails, sent daily to elliot@nodice.bar and
  forwarded/ingested automatically).
- From one week of receipt-level data we learn exactly what the till must be good
  at: average round size and composition, table vs tab vs quick-sale mix, orders
  per hour at peak (the speed budget), **cash vs card mix (the number that decides
  Square vs SumUp pricing)**, voids/comps frequency, split-bill frequency, tips.
- That data also seeds `bar_sales_daily` so variance starts working before our
  till takes a single payment.

The right export: one that lists each RECEIPT with its lines, timestamps, table,
staff member and payment type — not the daily totals.
