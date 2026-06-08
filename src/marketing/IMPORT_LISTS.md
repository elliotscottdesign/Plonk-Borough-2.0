# Where our newsletter emails come from — and how to import old lists

One database (Supabase `subscribers`), many doors. Every email lands in the same
list, tagged with a `source` so we know where it came from, deduped by email,
with consent tracked. Only rows with `consent = true` AND `unsubscribed = false`
ever get emailed (enforced by `supabase/functions/send-newsletter`).

## The doors (sources)

| Source | `source` tag | How it feeds the list |
|---|---|---|
| Website pop-up banner | `landing-popup` | Live — writes to Supabase on signup (`src/components/NewsletterPopup.jsx`) |
| Landing hero sign-up box | `landing` | Live — writes to Supabase + the Google Sheet notifier (`src/Landing.jsx`) |
| Marketing page sign-up | `marketing` | Live — `src/marketing/sections/SignupForm.jsx` |
| World Cup bookings (if revived) | `worldcup-*` | Wire its forms to `insertSubscriber()` |
| Plonk Golf bookings | `plonk-golf` | Separate Supabase repo — share the table, or export → import |
| Design My Night (legacy) | `designmynight` | Export CSV → import (below) |
| Events / guest lists | `events` / `eventbrite` | Export CSV → import (below) |
| Old Plonk Mailchimp | `mailchimp` | Download export → import (below) |

**Live doors** keep the list growing automatically. **One-off imports** (Mailchimp,
Design My Night, old events) are a historic dump loaded once.

## Compliance rule (UK GDPR / PECR) — do not skip
You may only **email** people who genuinely opted in. On import:
- Mailchimp **Subscribed** → `consent = true`, `unsubscribed = false` (emailable)
- Mailchimp **Unsubscribed** → import with `unsubscribed = true` (suppressed forever)
- Mailchimp **Cleaned** (bounced) / **Non-subscribed** → `consent = false` (stored, never emailed)
- Booking/event lists with **no marketing opt-in column** → `consent = false`
- Keep the original export file as your consent audit trail.

## Founder steps — download the Mailchimp export (no code)
1. Log in to **mailchimp.com**.
2. Top menu → **Audience** → **All contacts**.
3. (Tidy option) Use the status filter and choose **Subscribed**.
4. Click **Export Audience** (top-right) → wait → **Download** the file (a `.zip` or `.csv`).
5. If it's a `.zip`, unzip it. You may see `subscribed.csv`, `unsubscribed.csv`, `cleaned.csv`.
   `subscribed.csv` is the emailable list. Keep the others (they tell us who to suppress).
6. Don't open-and-resave in Excel — hand over the original download.
7. Send the file(s) to the developer with one line: *"Tag as `mailchimp`. Only the Subscribed people are emailable."*

Booking systems (Design My Night, Plonk Golf, Eventbrite) are the same idea:
log in → Customers/Bookings → **Export / Download CSV** → use a "marketing opt-in"
filter if there is one → hand over with a source tag.

## Developer — run an import
Bulk import goes through the `import-subscribers` edge function (service role),
which dedupes on email and **never resurrects an unsubscriber**. Auth = `SEND_SECRET`.
This is a one-off run from a trusted machine, NOT the public website.

```bash
# rows = [{ email, source?, consent?, unsubscribed? }]
# consent defaults to true; unsubscribed defaults to false.
curl -s -X POST \
  https://rntcujcpsozvuxvmlejv.supabase.co/functions/v1/import-subscribers \
  -H 'Content-Type: application/json' \
  -d '{"secret":"<SEND_SECRET>","rows":[
        {"email":"a@b.com","source":"mailchimp","consent":true},
        {"email":"c@d.com","source":"mailchimp","unsubscribed":true}
      ]}'
# → {"inserted":N,"skipped":M,"total":N+M}
```

Practical flow for a CSV:
1. Read the CSV, take the **email** column (+ status column for Mailchimp).
2. Lowercase + trim + dedupe emails; map status → `consent` / `unsubscribed` per the rule above.
3. Build the `rows` array; POST in batches of ~500 per request.
4. Re-running is safe — existing emails are skipped, never overwritten.

Deploy line (already done once): `supabase functions deploy import-subscribers --no-verify-jwt`.
No new secret — reuses `SEND_SECRET` + the auto-injected service role.
