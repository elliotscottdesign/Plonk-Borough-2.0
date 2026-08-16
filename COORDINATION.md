# COORDINATION — shared-file board for parallel sessions

Parallel Claude sessions each work in their own lane (see the ownership map in
[CLAUDE.md](CLAUDE.md)). A handful of files are **shared** and owned by no single
lane. Before a session edits a shared file it **claims** it here so another session
doesn't edit the same file at the same time. This is a lightweight lock, not
enforced by anything — it works because every session reads it after
`git fetch && git merge origin/main`.

## How to use it (for the session)
1. `git fetch origin && git merge origin/main` (get the latest board + code).
2. Add a row to **Active claims** with your lane, the file, what you're doing, and the date.
3. Make the edit, ship it (merge to main), then **delete your row**.
4. If a shared file you need is already claimed, do something else first or ask the founder.

## Shared files (no single lane owns these)
`src/App.jsx` · `src/main.jsx` · `src/ops/OpsApp.jsx` (tab registry) · `src/index.css` ·
`src/data.js` · `src/marketing/data/backend.js` (frozen — API URL + secret) · `index.html` ·
`vite.config.js` · `tailwind.config.js` · `.github/workflows/**` · `package.json` ·
`CLAUDE.md` · `SESSIONS.md` · this file.

_(The `rota` edge function was split into `rota` / `kitchen` / `keydates` on 31 Jul 2026 — each lane owns its own back-end file now, so it's no longer a shared file.)_

## Active claims
_(none — add a row when you start editing a shared file, remove it when you've shipped)_

| Lane | Shared file | What / why | Since |
|------|-------------|-----------|-------|

## Schema (DDL) changes — announce here
One Supabase project (`rntcujcpsozvuxvmlejv`) is shared by every lane. Any
`CREATE/ALTER/DROP` affects everyone. Note planned DDL here before running it, and
never run destructive or "today"-dated test writes on real data.

| Lane | Table / change | Status | Date |
|------|----------------|--------|------|
| integration (main) | NEW table `reservation_arrivals` (arrival tick-off for bookings; additive only — no change to bar_reservations / tournament_entries / bookings) | applied | 6 Aug 2026 |
| dj | `dj_receipts` (NEW table) — DJ expense receipts (taxi/drinks/other) for the portal Payments section. Additive only, no impact to other lanes. SQL in `supabase/dj_receipts.sql`. | applied 2026-08-02 | 2026-08-02 |
| tournament | Added `pingpong_{tournaments,participants,rounds,matches,vouchers}` (new — mirror of `pool_*`, ping-pong trial). No change to existing tables. | ✅ done | 3 Aug 2026 |
| tournament | `tournaments.tournament_type` CHECK widened to allow `'teams'` (was singles/doubles/special — additive, existing rows untouched). +10 new rows: "Team Ping Pong Tournament", Sundays 18:00 (9 Aug – 11 Oct), `bookable=false`/`registration_open=false` so they stay OFF the public pool booking flow. Ping pong fn lists ONLY teams rows; pool fn now excludes them. | ✅ done | 3 Aug 2026 |
| bar | `push_subscriptions` + `toilet_checks` (NEW tables) — web-push opt-ins + 2-hourly toilet-hygiene check log. Additive only, no impact to other lanes. SQL in `supabase/toilet_hygiene.sql`; cron `toilet-hygiene-poll` `*/30 * * * *`. New `toilet-check` edge fn (deployed `--no-verify-jwt`) + VAPID_* secrets. | ✅ applied + deployed | 3 Aug 2026 |
| tournament | Doubles prize split: `tournament_entries` + `partner_name`/`partner_email` (additive); `pool_vouchers` + `pingpong_vouchers` + `recipient` col, unique(run,place) → unique(run,place,recipient). Legacy full-amount vouchers untouched. SQL in `supabase/doubles_split.sql`. | ✅ applied | 6 Aug 2026 |
| tournament | `pool_vouchers` + `pingpong_vouchers`: `redeemed_at timestamptz` + `redeemed_by text` (additive — voucher redemption tracking). SQL in `supabase/voucher_redemption.sql`. | ✅ applied | 12 Aug 2026 |
| tournament | NEW table `manager_vouchers` (goodwill vouchers managers send to customers from the staff portal 🎟 Prizes tab — same ND- code + email design + redemption flow as tournament prizes). Additive; RLS on, no policies (service-role only). SQL in `supabase/manager_vouchers.sql`. | ✅ applied | 12 Aug 2026 |
| rota | `shift_notes` + `mentions uuid[]` (additive) and NEW table `shift_reminder_sent` (WhatsApp 2h shift reminders — idempotence marker). SQL staged in `supabase/staff_shift_reminders.sql`; also a NEW `CRON_SECRET` project secret + cron `staff-shift-reminders` (*/10). | ⏳ staged — awaiting fresh PAT (all revoked 11 Aug) | 11 Aug 2026 |

## Known architecture debt (all lanes — don't make it worse)
**`SEND_SECRET` ships in the public JS bundle** (`src/marketing/data/backend.js`) — so
every "founder-gated" edge-fn action is technically world-callable, and several source
tables are anon-readable. This predates the parallel-session era and is documented as
speed-bump security in CLAUDE.md; the real fix is a server-side session for admin
actions + tighter RLS. Until then: never add actions that DELETE or mutate customer /
financial data behind the secret alone, and prefer staff-token auth where possible
(security review flag, 10 Aug 2026).

## Global deploy notes
Edge-function deploys are global (last deploy wins). Only deploy the function(s)
your lane owns, and always from the latest merged `main`. If you deploy, jot it here
so others know the live backend moved.

- **`pingpong`** edge function deployed (`--no-verify-jwt`) — 3 Aug 2026, tournament lane. New function, owned by the tournament lane alongside `tournament`.
- **`tournament` + `pingpong`** redeployed with WhatsApp up-next wiring — 11 Aug 2026, tournament lane. New project secrets: `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_WA_FROM` (sandbox sender for the trial) / `TWILIO_CONTENT_SID_UP_NEXT`. Messaging stays dormant-safe: send failures never affect tournament flow.

## 12 Aug 2026 — tournament lane touched rota files (founder-directed)
Founder asked the tournament session to give managers voucher redemption from their own
staff-portal login ("Managers need to be able to do this from their profiles - Vouchers tab").
Changes: (1) `supabase/functions/rota/index.ts` — three new **staff-token** actions
`listPrizeVouchers` / `redeemPrizeVoucher` / `unredeemPrizeVoucher`, gated `staffRank >= 3`
(Asst. Manager+), reading/writing the tournament lane's `pool_vouchers` + `pingpong_vouchers`
tables (redeemed_by auto-set to the manager's name), plus `sendCustomerVoucher` (goodwill
vouchers → NEW `manager_vouchers` table, emailed via the rota fn's existing Resend helper); (2) `src/rota/api.js` — three matching
call wrappers; (3) `src/rota/RotaPortal.jsx` — a 🎟 **Prizes** tab (after Reservations, shown
only to Asst. Manager/Manager) + `PrizesView` component at the bottom of the file. No changes
to shifts/clock/notes logic. **The `rota` edge fn was redeployed by the tournament lane for
this** — the deploy also shipped whatever was on main, including the staged CRON_SECRET-gated
staff-reminder action (inert until its secret + cron exist). Rota lane: shout if this steps on
anything mid-flight.

## 11 Aug 2026 — finance lane touched src/rota/RotaPortal.jsx (founder-directed)
Founder asked the finance session to add two cards to the staff-portal Profile view:
**💷 Tips** (per-month card tips from `src/finance/tipsData.js` — finance owns that data file)
and **🧾 Invoicing** (auto-built monthly invoice from clocked hours × rate + tips, copy button).
Changes: ProfileView gains a `clocks` prop (passed from portal state), two new components
TipsCard/InvoiceCard at the bottom of RotaPortal.jsx. No changes to rota logic, api, or shifts.
Rota lane: shout if this steps on anything you're mid-flight on.


## 12 Aug 2026 — integration session touched tournament + pingpong fns (founder-directed, urgent)
Founder's WhatsApp templates were still PENDING with Meta on tournament night, so the
"you're up next" auto-ping had no working channel. Added an **SMS fallback** to
`supabase/functions/{tournament,pingpong}/index.ts`: new `sendSMS()` using a UK
**alphanumeric sender** (`TWILIO_SMS_FROM`, default "NoDice" — no phone number to buy,
no Meta approval, one-way) and `notifyMatchReady` now sends WhatsApp when its template
is live, else SMS (and SMS on any WhatsApp failure). New project secret
`NOTIFY_PREFER_SMS=1` forces SMS — **unset it when the WhatsApp template approves** and
WhatsApp resumes automatically with SMS as the fallback. Guard relaxed (SMS doesn't need
TW_FROM). Both fns redeployed. Delivery proven live (alphanumeric SMS → founder's phone,
status=delivered). Tournament lane: this is your file — shout if it conflicts.


## 13 Aug 2026 — integration session touched src/rota/RotaPortal.jsx (founder-directed, 1-line)
Founder asked for a **Team** hotlink on the manager doors under the shift banner, to match
the new top-level Team door in /ops. Change is ONE line in the `doors` array (~line 380):
added `['👥','Team','/ops?tab=rota', …]` for the founder only (that screen holds pay rates +
staff logins, so it stays founder-gated like Office), and the Operations door's subtitle no
longer says "rota". **Rota lane: you own this file — I kept the diff to the doors array so a
merge conflict is unlikely; shout if it clashes with anything mid-flight.**

## 13 Aug 2026 — integration session: Team opened to management + Help Out closed (founder-directed)
Founder: "Remove volunteer sign up page - Rhys can have team section too".
(1) NEW middle tier: the sign-in bridge in src/App.jsx now sets `ndb_role_manager`
from the person's own STAFF RECORD (role Manager / Asst. Manager), never from the shared
NDTEAM code. src/ops/OpsApp.jsx gained a `managerOnly` gate and the Team group uses it,
so Rhys reaches the roster while ordinary staff on the shared code do not (verified both
ways in the browser, incl. a ?tab=rota deep-link as bar staff → bounced). Office stays
founder-only. NB the Team screen shows pay rates + staff login passwords — that was the
founder's explicit call.
(2) /helpout now renders a "We're open — thank you" notice instead of the sign-up form
(src/App.jsx). HelpOutPortal, the help-out edge fn and all bar_helpers sign-ups are
untouched — one line reopens it.
Rota lane: one line in RotaPortal.jsx doors array (Team door now shows for management).
