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

## 11 Aug 2026 — finance lane touched src/rota/RotaPortal.jsx (founder-directed)
Founder asked the finance session to add two cards to the staff-portal Profile view:
**💷 Tips** (per-month card tips from `src/finance/tipsData.js` — finance owns that data file)
and **🧾 Invoicing** (auto-built monthly invoice from clocked hours × rate + tips, copy button).
Changes: ProfileView gains a `clocks` prop (passed from portal state), two new components
TipsCard/InvoiceCard at the bottom of RotaPortal.jsx. No changes to rota logic, api, or shifts.
Rota lane: shout if this steps on anything you're mid-flight on.

