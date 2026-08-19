# Till options — Square vs SumUp vs Stripe, and whether to build at all

Researched 19 Aug 2026 against current official UK pricing and developer docs, then
fact-checked by a second pass and challenged by a bar-operations review. Where something
could not be confirmed it says so.

---

## 1. The technical worry turns out to be a non-issue

**All three let our own web till drive their card machine.** No requirement to mirror the
menu into their system — we keep the whole catalogue, recipes, margins and stock in
Supabase where they already live, and use the provider purely as the card rail.

| | How our till drives it |
|---|---|
| **Square** | Terminal API — `CreateTerminalCheckout` with a plain amount in pence. Officially supported for third-party POS, platform-agnostic (works from a web app). |
| **SumUp** | Cloud API — server-to-server, wakes a paired Solo. Explicitly built for "a POS running on any platform capable of sending HTTPS requests". |
| **Stripe** | Server-driven `process_payment_intent` on a reader. Stripe *recommends* this route for a POS on a separate device. |

Card details never touch our code or Supabase in any of the three — the reader talks
straight to the processor. That materially limits our PCI exposure.

One Square gotcha: **Square *Readers* cannot be driven from a web page** (native iOS/Android
SDK only). A browser till needs a Square **Terminal**, not the £19 Reader.

## 2. The money, on our own numbers

From the real 2025 export (verified directly, not estimated): **£692,899 gross, 95,754
units, 89,521 line items, median price rung £6.60, Jan–Sep 2025.**

Modelling ~85% of takings on card (≈£589k) across ~34,000 transactions **for that
nine-month period**:

| | Cost over the period |
|---|---|
| SumUp Payments Plus (0.99% domestic + £19/mo) | **£6,059** |
| SumUp pay-as-you-go (1.69%) | £9,953 |
| Square (1.75%) | £10,307 |
| Stripe Terminal (1.4% + 10p) | £11,637 |

Annualised, the gap between SumUp Plus and Square is roughly **£5–6k a year**.

Caveats that could close that gap, and must be checked before signing:
- SumUp's 0.99% is **domestic debit/credit only**. Premium cards, Amex and international
  cards stay at 1.69%. In London Fields the tourist mix is not trivial — Square's non-UK
  card surcharge is +1.5%, so measure the real card mix before trusting any of these.
- Both publish custom pricing at volume: **Square above ~£200k/yr, SumUp above
  £10,000/month**. No Dice clears both thresholds. The list price is not the price —
  get a bespoke rate in writing from both.

**The card fee is paid whichever till we run.** Building our own saves nothing on it.
The only software saving is the Lightspeed subscription — so choosing the right *processor*
is a bigger financial lever than building the till at all.

## 3. Offline — the thing that actually decides it

**None of the three support offline card payments from a web-based till.** That is how
they are built, not something we can engineer around.

- **Stripe**: the server-driven route Stripe itself recommends explicitly "doesn't support
  collect card payments while offline".
- **SumUp**: the Cloud API route requires the reader to be online; offline is listed as
  unsupported.
- **Square**: has an offline mode, but it belongs to Square's *own* POS app, not Terminal
  API. (Fact-check flagged that Square began auto-enabling offline payments on devices from
  April 2026 — worth confirming what that means for a Terminal API device.)

So: **when the broadband drops at 21:30 on a Friday, card sales stop.** Lightspeed's own
offline handling is currently doing work nobody thinks about. Mitigation is wired Ethernet
(Square Terminal Hub, £39) plus a 4G failover, and keeping a provider's stock app on a
spare device as the break-glass.

Also flagged and unresolved: **Square's Terminal API cannot split a checkout into multiple
payments**. Split bills are routine in a bar.

## 4. Recommendation

**Square Terminal** — £149 + VAT, plus the £39 Hub so it runs on wired Ethernet rather
than venue wifi. Two to three units for a bar of this volume.

Chosen over SumUp despite SumUp being ~£5k/year cheaper, because Square has the maturest
third-party-POS story, a documented refunds path, and the better fallback position. **If
the cost gap matters more than the ecosystem, SumUp is a legitimate choice** — get bespoke
rates from both and decide on the real numbers.

Stripe is the weakest of the three here despite us already using it: the most expensive
card-present rate and the clearest "no offline" statement. Keep Stripe for online
(tournament entries, pre-orders) where it already works.

⚠️ Unconfirmed, needs a direct question to Square before buying: whether a **cash drawer**
can be kicked from a Terminal in Terminal API mode. The Hub advertises drawer ports; the
Terminal API docs say external printer connections are unsupported when paired to a
third-party POS.

## 5. The design idea worth keeping

**A till button is a SERVE of a stock product, never a product in its own right.**

Define the thing you buy once — a 30L keg, a 70cl bottle, a case of 24 — and the size you
pour it in (pint, half, 25ml, 50ml, 175ml). **Price is the only number a human types.**
Cost, GP% and stock depletion are then arithmetic, because the `bar_cost_base` view already
knows the cost of one millilitre of everything.

That single rule collapses **726 products to ~190 buttons across 14 pages** (from 29
Lightspeed categories, same names and same order so muscle memory survives), and it is why
adding a product becomes about five taps.

**Gap found in review: modifiers are missing from the model — and their absence is exactly
why Lightspeed has 726 products.** Make it a double (+£2), gin with tonic vs soda vs neat,
ice/no ice. Modifiers must be designed in from the start or the bloat rebuilds itself.

## 6. The honest challenge

The operations review came back **"stands: False"**, and its central objection deserves to
be on the record:

> "Half of this plan is excellent and should start on Monday. The other half is a business
> risk dressed up as a software project."

Its strongest points:

- **The plan never seriously evaluates keeping a commercial till and just integrating it.**
  We pay the card fee either way; the saving is only Lightspeed's subscription.
- **Everything a till is legally responsible for becomes ours** the day we leave: VAT on
  the receipt (and it is not one rate — alcohol and eat-in standard, cold takeaway
  zero-rated, discretionary service charge outside scope), HMRC digital record-keeping,
  provably append-only sales records (Electronic Sales Suppression is a real offence),
  Challenge 25 evidence, void and comp authorisation, and the Employment (Allocation of
  Tips) Act.
- **The Lightspeed→Xero digital link is currently automatic and compliant.** Replacing it
  makes us the owner of that link under Making Tax Digital.
- **Support model.** Lightspeed has a phone number at 23:00 on a Saturday. Our own till has
  "Claude, tomorrow morning", and a founder who cannot read the error.
- **Live variance will be wrong before it is right, and believed anyway.** A missing recipe
  line reads exactly like theft. Never show a variance figure without showing recipe
  coverage beside it.
- **Speed is the whole game.** If ringing a round of four takes one more tap than
  Lightspeed, the team will quietly stop using it and nobody will say so.

None of this means don't build it. It means **slice 1 must be the part with no downside.**

## 7. Suggested slices

1. **The catalogue** — read-only in /ops: the new 14-page layout, 726 → ~190, with GP on
   every line. Changes nothing operationally; immediately shows which lines lose money.
2. **The till screen, cash only, alongside Lightspeed** — real ringing, tabs, on one iPad.
   *(Review warning: do NOT double-ring card sales on two systems. Redesign this slice so
   it never asks staff to enter the same round twice.)*
3. **Square Terminal on one till point** — real card payments through our own `till` edge
   function.
4. **Money discipline** — sessions, float, expected vs counted, over/short, numbered
   Z-read, voids, refunds, append-only audit. *(Review: this must move earlier — cash is
   taken in slice 2.)*
5. **Live stock and variance, and the Xero link.**
6. **Cut over** — more Terminals, two full weeks running both systems in parallel.

## 8. Open questions before anyone writes code

- Real card mix (domestic debit vs premium vs international) — decides SumUp vs Square.
- Bespoke rates from Square **and** SumUp, in writing.
- Can a cash drawer be kicked from a Square Terminal under Terminal API?
- How do pre-paid golf bookings (17,519 units/yr, already paid via Stripe in the other
  repo) arrive at the till?
- Tabs: holding a card / pre-auth is the hardest thing on the list. Scope it properly.
- What is the break-glass when the internet dies mid-service?
