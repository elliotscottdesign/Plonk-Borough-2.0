# Old-list reactivation — "carefully + timed" plan

Wake up the warm part of the old Plonk/Mailchimp list **without torching the
brand-new nodice.bar sending domain**. Send a single re-introduction in small,
ramping batches, warmest contacts first; only people who click **"Yes, keep me
in"** become emailable (consent=true). Everyone else stays quietly held.

## The pieces (all built + deployed)
- `supabase/functions/send-campaign` — batched sender to an explicit email list (the held contacts). Paces ~2/sec. Secret-gated.
- `supabase/functions/confirm-optin` — the "Yes, keep me in" link → flips that contact to consent=true (joins the active list).
- `supabase/functions/unsubscribe` — the opt-out link (existing).
- `infra/reintro-email.html` — the email (DRAFT, founder-approved before any real send).
- `infra/reactivation_send.py` — the runner: picks the warmest slice from the local Mailchimp CSV, dry-run by default, sends only with `--go`.

## Warmth tiers (from the subscribed list, 3,647 total)
| Tier | Definition | Size |
|---|---|---|
| 1 | 4–5★ engaged | 199 |
| 2 | 3★+ | 379 |
| 3 | 3★+ **or** signed up 2024+ | 1,565 |
| 4 | everything (2★+/2022+) | 3,303 |

## Timed ramp to opening (17 June) — illustrative; adjust to real bounce data
| Day | Date | Batch | Cumulative | Who |
|---|---|---|---|---|
| 0 | Jun 8 | **1 test → founder** | — | prove the whole chain, check inbox placement |
| 1 | Jun 9 | 50 | 50 | warmest 4–5★ |
| 2 | Jun 10 | 150 | 200 | rest of 4–5★ + top 3★ |
| 3 | Jun 11 | 350 | 550 | finish 3★ + into 2024+ |
| 4 | Jun 12 | 600 | 1,150 | 2024+ signups |
| 5 | Jun 13 | ~400 | ~1,565 | finish the warm pool (Tier 3) |
| — | Jun 14 | **decision** | — | bounces <~3% & 0 complaints → continue into colder Tier 4; else STOP |
| 6–8 | Jun 14–16 | ~700/day | up to 3,647 | colder 2★/older — only if healthy |
| 🎉 | Jun 17 | — | — | re-opted-in people already on the active list + invited |

**Hard stop rule:** if hard bounces exceed ~3–4% in any batch, or any spam
complaints appear, pause and reassess (e.g. pay ~£15 to bounce-validate the
remainder before continuing). Small batches mean a bad batch can't hurt much.

## Running a batch (developer)
```bash
CSV=/path/to/subscribed_email_audience_export_*.csv   # local only — PII, never committed
# Dry run (see who):
python3 infra/reactivation_send.py --csv "$CSV" --limit 50
# Send day 1:
python3 infra/reactivation_send.py --csv "$CSV" --limit 50 --go --secret <SEND_SECRET>
# Day 2 (next 150, skipping the 50 already done):
python3 infra/reactivation_send.py --csv "$CSV" --offset 50 --limit 150 --go --secret <SEND_SECRET>
```
After each batch: **Resend dashboard → Emails → Bounces** before sending the next, larger one.

## Legal basis (UK PECR / GDPR) — plain version
- These contacts gave their details to the **same founder's** hospitality venue (Plonk) and we're contacting them about a **similar** offering (a bar) → PECR **soft opt-in** territory.
- Every email carries a **prominent one-click opt-out**, and we only keep emailing people who **actively re-confirm**. Prior unsubscribes are suppressed; dead/bounced addresses are never emailed.
- This is a reasonable, common-practice position. It is not zero-risk (the ICO dislikes naked "can we stay in touch?" mailers); the same-sector relationship + prominent opt-out + confirm-to-stay materially reduce that risk. Keep the original Mailchimp export as the consent audit trail.
