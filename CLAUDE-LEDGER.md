# CLAUDE-LEDGER.md — the `ledger` lane

Brief for a No Dice-owned bookkeeping layer. Written 15 Sep 2026, the day we
spent eight hours proving what Xero will not let software do.

## Why this exists

Not "Xero is bad". Xero is a filing package, and it files well. The problem is
that everything *upstream* of filing — reading a supplier's email, deciding
which payment it belongs to, coding it, correcting a mistake — is work Xero
expects a **human** to do in its own web interface, and it deliberately does not
open that work to software.

Measured, not assumed, on 15 Sep 2026 against our own connected app:

| We asked Xero for | Answer |
|---|---|
| `accounting.banktransactions` (read bank payments) | granted |
| `accounting.attachments` (staple a file to a payment) | granted |
| `accounting.contacts`, `files` | granted |
| `accounting.transactions` (**recode a line, fix a payee, void a bill**) | **refused** |
| `accounting.reports.read` | **refused** |
| `accounting.journals.read` | **refused** |

And two further walls that no permission fixes:

- **Unreconciled bank statement lines are not in the API at all.** Until a human
  clicks OK in the browser, software cannot see the transaction exists.
- **A reconciled transaction cannot be edited**, even with full permission:
  *"This Bank Transaction cannot be edited as it has been reconciled with a
  Bank Statement."*

So the founder ends up as the hands: 444 payments needing a document, a browser
window, and an afternoon. That is the thing to remove.

## What this is NOT

**It is not a replacement for filing, and it must never pretend to be.** VAT
returns and accounts have to be filed through HMRC-recognised software under
Making Tax Digital, records must be kept digitally, and the chain from record to
return must be a **digital link** — an automated transfer, never retyping.

So: **we own the daily grind, Xero (or FreeAgent, or whoever) stays the filing
endpoint, and once a month we hand over a complete, already-correct bundle
through the API.** One push, one digital link, no copying.

That also means if this project stalls, nothing is lost — the books still exist
in a real accounting package.

## Shape

Ownership, to be added to the table in [CLAUDE.md](CLAUDE.md) when the lane starts:

| Lane | Frontend | Back-end |
|---|---|---|
| `ledger` | `src/ledger/**`, `src/ops/sections/Ledger.jsx` (**founderOnly**, same gate as Finances — never loosen it) | `ledger` |

### Tables (Supabase, prefix `ledger_`)

- **`ledger_documents`** — one row per invoice / receipt / statement. Holds the
  extracted fields (supplier, document number, date, net, VAT, gross), the
  `kind` (`invoice` \| `receipt` \| `statement` \| `credit_note`), the file in
  storage, and — non-negotiable — **`source`**: the Gmail message id, or the
  photo upload, it came from. Every figure must be traceable back to the page it
  was read off.
- **`ledger_payments`** — one row per bank line. Monzo first (their API gives
  pending *and* settled, which Xero's does not), CSV import as the fallback.
- **`ledger_matches`** — `document_id` × `payment_id`, plus `confidence`,
  `basis` (why we think so) and `decided_by` (`auto` \| `founder`). Many-to-many
  on purpose: one statement covers thirteen payments, one payment clears four
  invoices. **This table is the whole point of the project.**
- **`ledger_accounts`** — the chart of accounts, mirrored from Xero.
- **`ledger_rules`** — learned payee → account rules, with a hit count. Every
  founder decision writes one; the next identical payment codes itself.
- **`ledger_exports`** — what was pushed to Xero, when, and the response. An
  audit trail for the digital link.

### The three jobs

**1. Capture.** Gmail (business mailbox only — see
[[project-invoice-capture-rules]]) plus phone photos. Extract server-side with a
real PDF reader, then have a model read the extracted text. **Never a regex over
an email body** — that is what produced a £5,000 credit limit as an invoice
total, three times.

**2. Match.** Propose, never assert. A match needs a stated basis: the payment
figure appears on the document *and* the supplier is named on it; or the
founder said so. Anything weaker goes in a review queue. Matching on amount
alone is the single mistake that cost the most time — it cannot work for trade
suppliers, who invoice first and get paid later in different lumps.

**3. Export.** Monthly. Bills with their attachments and codes, pushed through
the API, ready to approve. Xero's refusal of `accounting.transactions` is the
open question here — it may mean a Xero **Custom Connection** (paid, per-org,
but grants the full scope set) or moving the filing endpoint to FreeAgent, whose
API is more open. **Settle this before slice 5 is built**, not during.

## Slices

1. **Documents.** Ingest, read, store, list. No matching. Proves the reading.
2. **Payments.** Monzo feed in. Proves we can see every line including
   unreconciled ones — the thing Xero hides.
3. **Matching + review.** The screen where the founder confirms or corrects in
   one keystroke. This is the product.
4. **Coding rules.** Each correction teaches a rule. Watch the review queue
   shrink; if it does not, the idea is wrong and we stop.
5. **Monthly export.** Only after 1–4 are boring and reliable.

Ship 1 and 2 before judging any of it.

## Talking to Xero: use the client, not urllib

**Everything goes through [infra/xero_client.py](infra/xero_client.py). No
exceptions, no "just this once" script.** It exists because on 15 Sep 2026 a
matching job re-read the same 290 documents several times, spent all 5,000 of
Xero's daily calls by 1pm, and lost the founder the afternoon. The work was
small; doing it repeatedly was the whole problem.

What the client enforces, so nobody has to remember it:

- **A 3,000-call daily budget** — well under Xero's 5,000 — and it raises
  `BudgetSpent` rather than letting a loop find the real ceiling. The margin
  keeps the hourly sweep and the /ops screens alive even after a bad day.
- **File content cached forever**, keyed by file id. A document in Xero's file
  store is immutable, so downloading one twice is always a bug. Extracted text
  is cached beside it, so reading a PDF costs nothing after the first time.
- **Lists cached for 30 minutes.** `bank_transactions()` is seven calls once
  per run, not seven per pass.
- **50 calls a minute**, not 60, leaving room for whatever else is connected.
- Every session states a `reason`, and usage is attributed to it —
  `python3 infra/xero_client.py` prints today's spend and who spent it.

State lives in `~/.nodice/xero/` (`usage.json`, `cache/`, `docs/`) — outside
the repo, so it survives worktrees and sessions.

**If you hit the budget: stop calling Xero and do the rest offline.** All the
matching in this project is local computation over cached text. Only the
`associate` writes actually need the network, and they are one call each.

## Rules carried over, paid for in hours

- **Read the document; never guess the number.** A total is read off the page or
  it is not known.
- **Statements are not invoices.** Recording a statement as a bill double-counts
  every invoice on it.
- **Never create a bill for spend already coded and reconciled** — the cost
  lands twice and the bill never clears.
- **Every automated figure keeps a link to its source email.** If it cannot be
  traced, it cannot be trusted.
- **Propose, don't apply**, wherever money is involved. The founder's one
  keystroke is cheap; an unnoticed wrong attachment is not.
- **One button for the founder.** Any flow that needs him to visit three screens
  has failed.
