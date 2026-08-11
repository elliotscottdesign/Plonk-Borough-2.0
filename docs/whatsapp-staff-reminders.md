# HANDOVER — WhatsApp shift reminders for staff (rota lane)

> **STATUS (actioned 11 Aug 2026, integration session): CODE COMPLETE — waiting on two
> founder tokens to go live.** Everything below §1 is built and committed:
> `sendShiftReminders` action in the rota fn (CRON_SECRET-gated, London-time 2h window,
> insert-first idempotence, e164, template send w/ mentions digest); `@`-mention parsing
> in `addShiftNote` (+ "@ mentions you" badge and composer tip in the portal Notes tab);
> DDL + cron staged in `supabase/staff_shift_reminders.sql`. Parser + window maths
> unit-tested. **Blocked on:** (1) fresh Supabase PAT (all revoked 11 Aug — needed for
> secrets/DDL/deploy), (2) the NEW Twilio auth token (§2). Once both arrive:
> set `TWILIO_AUTH_TOKEN` + new `CRON_SECRET` → apply the SQL → deploy `rota` (+
> `tournament`/`pingpong` to revive their pings) → create + approve the
> `staff_shift_reminder` template (§6) → set `TWILIO_CONTENT_SID_SHIFT_REMINDER` →
> install the cron → live test on the founder's phone.

**Founder brief (11 Aug 2026):** every staff member gets a WhatsApp **2 hours before
their shift starts** reminding them, and the message must include any **@-mentions
addressed to them** in that day's shift notes. This doc gives the rota lane everything
needed — infrastructure state, reference code, data-model facts, and the one blocker.

---

## 1. What already exists (built by the tournament lane, 11 Aug 2026)

**WhatsApp is LIVE.** The hard part — Twilio + Meta onboarding — is done and proven
(a test message was delivered + read on the founder's phone).

- **Sender:** `whatsapp:+15554345294` — Meta-issued number, display name **"No Dice"**,
  registered via Twilio embedded signup ("display name only" — no phone verification).
  Status ONLINE. Customers/staff see "No Dice", not the number.
- **Twilio account:** SID starts `AC32…` — read it from the Supabase secret
  `TWILIO_ACCOUNT_SID` or the Twilio Console home. Upgraded (Full), compliance
  (Trust Hub "No Dice") approved. ~£19 credit loaded. No monthly costs (the paid US number
  was released; the Meta-issued sender is free). Cost ≈ 2–4p per delivered message.
- **Supabase secrets** (project-wide, all edge fns can read):
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` ⚠️, `TWILIO_WA_FROM=whatsapp:+15554345294`,
  `TWILIO_CONTENT_SID_UP_NEXT` (tournament template).
- **Reference implementation to copy** — in BOTH `supabase/functions/tournament/index.ts`
  and `supabase/functions/pingpong/index.ts` (search `sendWhatsApp`):
  - `e164(ukPhone)` — UK-aware phone normalisation (07… → +447…); returns null when
    unsure (skip, never misfire).
  - `sendWhatsApp(to, vars)` — POSTs to the Twilio Messages API; uses a ContentSid
    template when the env var is set, else a plain-text Body (works only inside a
    24h customer-service window — fine for testing, NOT for production reminders).
  - `notifyMatchReady(...)` — the fire-and-forget pattern: **messaging failures must
    never break the main flow** (everything wrapped, best-effort). Copy this stance.

## 2. ⚠️ THE BLOCKER — fix first

The Twilio auth token was **rotated** on 11 Aug (the old one leaked into a chat) but the
NEW token never reached Supabase. So **`TWILIO_AUTH_TOKEN` currently holds a DEAD token —
every send will 401** until fixed:

1. Founder reads the new token: Twilio Console → Account settings → **API keys & auth
   tokens** → "Primary auth token" → click the **eye 👁** → copy.
   (NB: the founder twice pasted the *Account SID* (`AC…`) when asked — the auth token is
   the OTHER box, 32 hex chars, no `AC` prefix. Be gentle; this flow exhausted them.)
2. `supabase secrets set TWILIO_AUTH_TOKEN=<new> --project-ref rntcujcpsozvuxvmlejv`
3. Redeploy any fn that sends (at minimum your `rota`; ideally also `tournament` +
   `pingpong` so tournament pings revive).
4. All Supabase PATs were revoked on 11 Aug — ask the founder for a fresh one
   (supabase.com/dashboard/account/tokens) for the deploy, revoke after.
5. Also check: the `tournament_up_next` content template (SID in the Supabase secret
   `TWILIO_CONTENT_SID_UP_NEXT`) was **pending** Meta approval when this doc was written —
   query `GET content.twilio.com/v1/Content/<that SID>/ApprovalRequests`. If approved,
   send the founder their promised test ping (recipient: the founder's mobile, see
   memory `project_whatsapp_api.md`; vars {"1":"Elliot","2":"1","3":"The Test Team"}).

## 3. Data-model facts (verified 11 Aug 2026)

- **`staff`** — has `phone` (free-text, staff-entered in the portal profile; normalise
  with `e164()`, skip nulls). Also `name`, `email`.
- **`staff_shifts`** — `date` (ISO), `start_min` / `end_min` (**minutes from midnight**,
  integers — e.g. 1080 = 18:00), `label`, `ability`, `min_rank`. Staff↔shift assignment
  is via the rota lane's own mechanism (you own it — signups/assignments).
- **`shift_notes`** — `date`, `staff_id` (author), `author_name`, `body` (plain text,
  ≤1000 chars), `kind='handover'`. Written via the portal's `addShiftNote` action; every
  note is also emailed to the founder.
- **@ tagging does NOT exist yet** — notes are plain text; no mentions column, no
  parsing, no UI. See §5.

## 4. The 2-hour reminder — suggested design

- **Trigger:** `pg_cron` every 10 minutes (precedent: `supabase/kitchen_cron.sql` —
  `cron.schedule` + `net.http_post` to the edge fn; same pattern, e.g. job
  `staff-shift-reminders` → your `rota` fn with a cron-secret body).
- **In the fn** (new action, e.g. `sendShiftReminders`, gated by a CRON_SECRET — do NOT
  hang it on SEND_SECRET alone; see the "Known architecture debt" note in
  COORDINATION.md):
  1. `today = Europe/London date` and `nowMin = minutes from midnight London time`
     (mind DST — the server runs UTC; convert deliberately).
  2. Find `staff_shifts` where `date = today` and `start_min` between `nowMin+110` and
     `nowMin+130` (a 20-min window swallows cron jitter without double-sends…)
  3. …but ALSO keep an idempotence marker so a re-run can't double-message: new table
     `shift_reminder_sent (shift_id, staff_id, sent_at, unique(shift_id, staff_id))` —
     insert-first, send-second.
  4. For each assigned staff member: phone from `staff.phone` → `e164()`; skip null.
  5. Gather their @-mentions (§5) for `date = today` → digest string, e.g.
     `"Rhys: don't cash up before the delivery arrives"` joined with `" · "`, or
     `"No messages for you today."`
  6. Send via the template (§6). Log sends; failures must never abort the loop.
- **Message copy** (founder's intent, template-ready):
  > ⏰ Hi {{1}}, reminder — your No Dice shift starts at {{2}} (in about 2 hours).
  > {{3}}
  > See you there!
  where `{{3}}` is the mentions digest (or the no-messages line).

## 5. @ tagging — must be built (it's part of this brief)

Founder asked "check @ tagging is working on notes" — **it is not; nothing exists.**
Simplest robust build:

- **Write path:** in `addShiftNote`, parse the body for `@` tokens and match against
  active staff names (case-insensitive; match on first name AND full name; ignore
  non-matches). Store as a new column `mentions uuid[]` on `shift_notes` (additive DDL —
  announce in COORDINATION.md).
- **Portal UI (nice-to-have):** an `@` picker in the note composer (the rota portal is
  `src/rota/RotaPortal.jsx`, notes section) listing active staff; even without the
  picker, plain-text `@Rhys` parsing works.
- **Read path for reminders:** notes for `date = today` where `mentions @> [staff_id]`.
- Consider also surfacing "notes that mention me" in the portal itself — free win.

## 6. The WhatsApp template (needed before production sends)

Business-initiated messages REQUIRE an approved template. Freeform `Body` only works
inside a 24h window after the staff member messages the sender — fine for dev tests
(message the sender from your phone first), useless for scheduled reminders.

1. Create via Content API (see the drafted catalogue in `docs/whatsapp-templates.md`,
   entry `staff_shift_reminder` — adapt to include the mentions var):
   `POST content.twilio.com/v1/Content` with `twilio/text` body per §4 copy,
   variables `{"1":"name","2":"time","3":"mentions digest"}`.
2. Submit for approval: `POST content.twilio.com/v1/Content/<HX…>/ApprovalRequests/whatsapp`
   `{"name":"staff_shift_reminder","category":"UTILITY"}` — approval took minutes-to-hours
   for us; poll `GET …/ApprovalRequests` for `whatsapp.status == "approved"`.
3. Store the SID as a new secret, e.g. `TWILIO_CONTENT_SID_SHIFT_REMINDER`.

## 7. Gotchas learned the hard way (don't rediscover these)

- Twilio's "**Try out WhatsApp**" console page is a dead end for API use — ignore it.
- Meta **silently never delivers** SMS verification to VoIP numbers — never route
  through any flow that wants to text a Twilio number a code.
- Trial accounts can't create Content templates (error 20003) — account is upgraded now.
- A sandbox sender object (`whatsapp:+14155238886`) may linger with status OFFLINE —
  ignore it; the real sender is `whatsapp:+15554345294` (ONLINE).
- Error 63016 = template not approved yet (send downgraded + dropped outside a session).
- Error 63007 = bad `From` — you're not using the registered sender above.
- Test recipient that works: the founder — but for repeated dev tests have THEM message
  "No Dice" first to open a 24h window, then freeform Body works without template sends.
- GitHub push protection blocks commits containing the full Twilio Account SID — refer
  to it indirectly (that's why this doc doesn't print it).

## 8. Ownership + coordination

- `rota` fn + rota UI = **rota lane** (this work is yours). Tournament/pingpong fns =
  tournament lane — copy the helpers, don't edit those files.
- Twilio secrets are project-wide/shared — changing `TWILIO_AUTH_TOKEN` affects the
  tournament pings too (that's fine/needed — see §2). Note secret changes + the
  `shift_notes.mentions` / `shift_reminder_sent` DDL in COORDINATION.md.
- Memory files with full context: `project_whatsapp_api.md`, `project_staff_rota.md`.
