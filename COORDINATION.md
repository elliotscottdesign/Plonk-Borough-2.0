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
| bar | `src/ops/OpsApp.jsx` | +1 founder tab "Checklist Editor". One import + one TABS row. | 3 Aug 2026 |
| bar | `src/kitchen/templates.js` (kitchen-owned) | Founder-asked: DB-editable checklists. `templateItems(cadence, templates=KITCHEN_TEMPLATES)` gains an OPTIONAL source arg (backward-compatible, no behaviour change unless passed). | 3 Aug 2026 |
| bar | `src/kitchen/KitchenChecklists.jsx` (kitchen-owned) | Read live template overrides (fallback = built-in). Surgical: hook + effectiveKitchen. | 3 Aug 2026 |
| bar | `src/ops/sections/Kitchen.jsx` (kitchen-owned) | Same live-override read for the founder "The checklists" view. | 3 Aug 2026 |
| bar | `src/rota/checklists.js` (rota-owned) | `checklistSections/Items/Count/doneCount` gain OPTIONAL `source=CHECKLISTS` arg (backward-compatible). | 3 Aug 2026 |
| bar | `src/rota/RotaPortal.jsx` (rota-owned) | Read live shift-checklist overrides (fallback = built-in). | 3 Aug 2026 |
| bar | `src/ops/sections/ChecklistLog.jsx` (rota-owned) | Same live-override read for the founder log. | 3 Aug 2026 |

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
| bar | `checklist_templates` (NEW table) — founder-editable overrides for kitchen + shift checklists (one JSONB def per checklist_key; empty = code default). Additive, no impact to other lanes. SQL `supabase/checklist_templates.sql`. New `checklists` edge fn (list/save/reset). | pending ship | 3 Aug 2026 |
| tournament | Doubles prize split: `tournament_entries` + `partner_name`/`partner_email` (additive); `pool_vouchers` + `pingpong_vouchers` + `recipient` col, unique(run,place) → unique(run,place,recipient). Legacy full-amount vouchers untouched. SQL in `supabase/doubles_split.sql`. | ✅ applied | 6 Aug 2026 |
| tournament | `pool_vouchers` + `pingpong_vouchers`: `redeemed_at timestamptz` + `redeemed_by text` (additive — voucher redemption tracking). SQL in `supabase/voucher_redemption.sql`. | ✅ applied | 12 Aug 2026 |
| tournament | NEW table `manager_vouchers` (goodwill vouchers managers send to customers from the staff portal 🎟 Prizes tab — same ND- code + email design + redemption flow as tournament prizes). Additive; RLS on, no policies (service-role only). SQL in `supabase/manager_vouchers.sql`. | ✅ applied | 12 Aug 2026 |
| bar (via integration session, founder-directed) | **NEW: 15 tables + 7 views — the BAR stock/cost/margin/ordering system.** `bar_suppliers`, `bar_products`, `bar_prep_recipes`, `bar_production_log`, `bar_stocktakes`, `bar_stocktake_sheets`, `bar_stocktake_lines`, `bar_orders`, `bar_order_lines`, `bar_price_history`, `bar_menu_items`, `bar_recipe_lines`, `bar_sales_daily`, `bar_covers`, `bar_waste`; views `bar_cost_base`, `bar_margins`, `bar_on_hand`, `bar_usage_actual`, `bar_usage_theoretical`, `bar_variance`, `bar_stock_value`; trigger `bar_capture_price` on `bar_order_lines`. Additive only — `bar_reservations` and `bar_helpers` untouched. RLS on, no policies (service-role only). SQL in `supabase/bar_stock_system.sql`. Dry-run in a rolled-back txn first; verified with a rolled-back fixture (Corona case-of-24 bought / bottles counted → 113 used, correct). All tables currently EMPTY — seeding is the next slice. | ✅ applied | 17 Aug 2026 |
| rota (via integration session, founder-directed) | `staff.dj_id uuid references djs(id) on delete set null` — links a staff member who is also one of our DJs to their DJ record, so the two portals can hotlink both ways. Additive; dry-run in a rolled-back txn first. Set for Thays Alviano. | ✅ applied | 20 Aug 2026 |
| rota | `shift_notes` + `mentions uuid[]` (additive) and NEW table `shift_reminder_sent` (WhatsApp 2h shift reminders — idempotence marker). SQL staged in `supabase/staff_shift_reminders.sql`; also a NEW `CRON_SECRET` project secret + cron `staff-shift-reminders` (*/10). | ⏳ staged — awaiting fresh PAT (all revoked 11 Aug) | 11 Aug 2026 |

## 4 Sep 2026 — till lane DDL APPLIED: the REAL order system (`till_*`)
NEW tables `till_sessions` (day + float + sequential z_number), `till_orders` (shared
open orders, jsonb lines), `till_payments` (cash/voucher rows), `till_events`
(append-only audit — a trigger refuses UPDATE/DELETE). Additive; RLS on, no policies
(service-role via the `till` fn only). SQL in `supabase/till_orders.sql`. Fn v4 deployed
with dayState/openDay/saveOrder/payOrder/voidOrder/closeDay. Verified end-to-end live:
Z-READ #1 = £0.10 go-live test, drawer spot-on. Training mode beside Lightspeed.

## 21 Aug 2026 — till lane DDL STAGED: `till_settings`
NEW table `till_settings` (key text pk, value jsonb, updated_at) — till configuration,
first key 'floor' = the drawn room layout shared across till iPads. Additive, RLS on, no
policies (service-role via the `till` fn only). SQL in `supabase/till_settings.sql`.
✅ APPLIED 4 Sep 2026 (founder token, revoked after).

## 21 Aug 2026 — till lane: vouchers redeemable at the till (touches tournament-lane tables, no DDL)
The `till` edge fn gains `voucherLookup` / `voucherRedeem` / `voucherUnredeem` (SEND_SECRET-
gated): the till's ADDITION screen takes an ND- code, knocks the value off the bill, and on
PAY sets `redeemed_at`/`redeemed_by` on the SAME rows the rota-portal Prizes flow uses
(`pool_vouchers`, `pingpong_vouchers`, `manager_vouchers`). Additive behaviour only — no
schema change, same columns the rota fn writes, `redeemed_by='Till'` so the source is
visible in the portal list. ✅ fn DEPLOYED 4 Sep 2026 — voucher lookup/browse/redeem + floor sync live (NB: new sbp_v0 tokens need the Management API multipart deploy endpoint; both CLIs reject the format).
Tournament lane: shout if this crosses anything mid-flight.

## 20 Aug 2026 — till lane touched public/sw.js (de-facto shared: bar lane's toilet push lives in it)
The service worker now does SAFE offline caching (the till must survive an internet
outage): `/assets/*` + Google Fonts cache-first (Vite content-hashes them, so a cached
copy can never be stale), everything else same-origin NETWORK-FIRST with the last good
copy used only when the network fails, offline navigations fall back to the cached app
shell. **The old guarantee holds: online devices always get the newest build.** Supabase
calls untouched. Push + notificationclick handlers (toilet hygiene) preserved verbatim.
Also new: `till-manifest.webmanifest` + till icons — the Till tab swaps the manifest in
at runtime so Add-to-Home-Screen from the till installs "No Dice Till" (opens on the
register); every other page still installs the staff app exactly as before.
Bar lane: shout if push misbehaves — the handlers were not edited.

## 20 Aug 2026 — till lane touched CLAUDE.md (shared file, one line)
The "## Project" intro said the app deploys at **nodice.bar** — stale since the public
customer site (Next.js repo) took that domain; public/CNAME says **team.nodice.bar**.
Founder got a 404 from a link built off the stale line. Fixed the line + added a warning.
Claimed, edited, shipped same hour.

## 21 Aug 2026 — FEATURE REQUEST for the kitchen lane (founder-directed, logged by integration session)
**On A Roll needs a daily order cutoff timer: food orders must stop going through
automatically at 22:05 (5 past 10pm) every day.** Right now `food_settings` only has
the manual `paused` flag and the busy `auto_pause`/`auto_threshold` — nothing
time-of-day based, so ordering stays open all night unless someone remembers to pause.
Founder wants it automatic. Suggested shape (kitchen lane's call): add a daily-cutoff
setting to `food_settings` (e.g. `cutoff_enabled` + `cutoff_time` default 22:05,
Europe/London), enforce it server-side in the `food-order` fn (`createOrder` rejects,
`getStatus` reports closed so the customer page shows it), and surface an on/off +
time control in the kitchen settings UI. Mind the waitlist drain cron — it must not
text "you can order again" after cutoff. No claim on any file — this is a to-do note,
not an edit; kitchen lane picks it up and deletes this section when done.

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
- **`till`** — NEW edge function (till lane, 20 Aug 2026): read-only, founder-gated; returns bar_cost_base + bar_margins for the Till catalogue tab. ⏳ NOT yet deployed — the machine's Supabase token expired; deploy `--no-verify-jwt` pending a fresh PAT from the founder. Until then the Till tab shows the layout with "couldn't load costs".
- **`tournament` + `pingpong`** redeployed with WhatsApp up-next wiring — 11 Aug 2026, tournament lane. New project secrets: `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_WA_FROM` (sandbox sender for the trial) / `TWILIO_CONTENT_SID_UP_NEXT`. Messaging stays dormant-safe: send failures never affect tournament flow.

## 20 Aug 2026 — tournament lane touched src/ops/OpsApp.jsx (shared file)
Added a **"new version is ready — tap to update"** banner to the ops shell
(poll index.html every 2 min + on tab focus, compare bundle hash, sticky gold
bar, manual reload only). Reason: stale cached pages cost the founder three
separate fights on tournament night 19 Aug. Change is additive — one state
hook + one banner element above the header; tab registry untouched. Claimed,
edited, shipped same hour.

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

## 16 Aug 2026 — integration session touched src/ops/sections/ChecklistLog.jsx (founder-directed)
Founder: "make shift checklists a calendar array of dates - with small logo links to
checklist of that day". The flat 3-week list is now a **month calendar** — each day cell
shows one small checklist logo per submission (🌅/🔄/🌙), ringed green/amber/red by how
complete it is; tapping a logo (or the day) opens that day's cards underneath. Month
back/forward nav bounded by the 90 days the `rota` fn keeps (request widened 21 → 90 —
the fn already caps at 90, no back-end change and no deploy). Emoji logos carry
`data-keep-color` so they read correctly in the light/day theme.
**Kitchen lane: this is your file** — the change is confined to ChecklistLog.jsx; the
submission card markup is unchanged, just extracted to a `SubCard` component. Shout if
it clashes with anything mid-flight.

## 16 Aug 2026 — Help Out / volunteer sign-up REMOVED FROM THE SYSTEM (founder-directed)
Founder: "remove all volunteer and help out section - Hide / archive - remove from system".
The 13 Aug change only *hid* it; an audit found the public sign-up API was still wide
open (the `signup` action had no secret, no auth and CORS `*`, so anyone holding the old
URL could still write rows into `bar_helpers`), and the team landing page still led with a
"🙌 Help us open" volunteer card.

Removed (front end, this repo): the `/helpout` + `/help-out` routes and the closed-notice
component in `src/App.jsx`; the Help Out gateway case in `src/PasswordGate.jsx`; the
volunteer door on `src/TeamLanding.jsx`; the dead import + commented tab registry entry in
`src/ops/OpsApp.jsx`; and the files `src/help/**`, `src/ops/sections/HelpOut.jsx`,
`src/ops/sections/HelpCalendar.jsx` (deleted — recoverable from git).

Back end: `supabase/functions/help-out/index.ts` REPLACED with a stub that returns **410
Gone** for every action, and DEPLOYED (`--no-verify-jwt`) — a stub had to be deployed
because simply deleting the repo file would have left the last live version running and
still accepting sign-ups. Verified live: POST returns 410. The original 56 KB function is
archived at `supabase/archive/help-out-index.ts`; copy it back + redeploy to restore.

Data: `bar_helpers` and `help_settings` NOT touched by this change — no DDL, no deletes.
NB for the record: `bar_helpers` was already EMPTY before this work (lifetime table stats,
unreset since 22 May 2026, show 31 inserts and 31 deletes, so every sign-up had already
been removed at some earlier point — not by this change). The table, its 17 columns and its
RLS policy are intact. The project has no backups and no PITR, so those rows are not
recoverable.

Ops lane: `help-out` was yours — it is now retired; CLAUDE.md's ownership map and
SESSIONS.md have been updated to drop it.

## 17 Aug 2026 — BAR stock system: new schema applied (founder-directed)
Founder: "we need to develop a full stock management, cost, margin and ordering system.
This has to include fruit use, ice use per week, consumables like straws and tissues. The
system needs to feed from orders and stock level inputs. This will all sit on BAR page
develop with new database."

Context from the audit: there were **no bar stock tables at all**. Every stock screen wrote
to `localStorage` on one device, so a count on Rhys's phone was invisible to everyone and
had no date on it — no history, no usage, no variance. Product/cost/supplier data lived in
static JS files last touched 30 Jun 2026, and StockOrder was still scaling off a Feb 2026
baseline, ordering beers the bar no longer pours.

v1 of the schema was reviewed by four adversarial critics (data modeller, bar-ops expert,
hospitality-finance specialist, migration engineer) and came back **needs-rework** with 20
blockers. v2 (applied) fixes them. The load-bearing ones:
- **Base units.** v1 subtracted counts from deliveries with no conversion — Corona bought by
  the case and counted in bottles reported 21 used against a true 113. Every quantity is now
  stored in the product's `base_unit` (ml/g/each); order and count units convert on the way in.
- **Stocktake header + per-area sheets.** v1 compared "the two most recent counts", which
  silently compared the cellar to the back bar. Usage is now stocktake-to-stocktake.
- **Made, not bought.** Ice from the machine, house syrup, fresh lime juice and batches never
  appear on an invoice — `source='made'` + `bar_prep_recipes` + `bar_production_log`.
- **Never guess a cost.** v1 coalesced missing prices to £0, inflating GP. `bar_margins` now
  returns NULL and an `unpriced_lines` count so the UI must say "not costed".
- **Covers table** — straws/napkins scale with bodies, not drinks, so `usage_per_cover` was
  unusable without it.
- **Price history is wired** — a trigger on receipt writes history and repriced the product.
- New views actually deliver the promised numbers: `bar_usage_theoretical` (sales × recipe),
  `bar_variance` (what went missing, in £), `bar_stock_value` (for true CoGS).

Tables are EMPTY. Next: the `bar` edge function + seeding from the existing data files, then
the single BAR page. **Bar lane: these tables and `supabase/bar_stock_system.sql` are yours** —
I applied them at the founder's direction while working the /ops UX brief. Shout if this
cuts across anything you have in flight.

## finance lane — schema DDL, 17 Aug 2026

Created table `receipts` + private storage bucket `receipts` (10MB, images/PDF only, RLS on,
reached only via the future `finance` edge function using the service key — no anon access).
Backs the phone receipt-capture screen in /ops. Additive only; nothing existing was touched.
SQL kept at `supabase/receipts_capture.sql`.

## finance lane — src/ops/OpsApp.jsx, 18 Aug 2026 — RELEASED

Added one tab to the Office group: Receipts (founderOnly, like Finances).
One import line + one registry entry. Nothing else touched. Claim released.

## finance lane — CLAIM on src/rota/RotaPortal.jsx, 19 Aug 2026

TipsCard only: added the "tick to confirm you got it" button + token prop.
The card already reads finance-lane data. Nothing else in the file touched.
Released on merge.

- **16 Aug 2026 · rota lane → dj lane (FYI, done):** one-line edit in `src/dj/MonthCalendar.jsx` — the `TODAY` ring colour changed `#60A5FA` → `#FFFFFF` (founder house rule: today = white ring on ALL calendars; status colours wrap outside it). No logic touched. If the DJ session objects, revert just that constant.

## admin lane — CLAIM on CLAUDE.md + SESSIONS.md, 26 Aug 2026

New lane `admin`. Adding one row to the ownership map and one entry to SESSIONS.md.
Owns `docs/admin/**` only — no app code, so it cannot collide with any other lane.
Released on merge.

## 20 Aug 2026 — rota fn reads the DJ lane's tables (founder-directed)
Founder: "in the reservation section, make it clear to see who's DJing that day and their
contact details in case they need to get hold of them."

Added a `djToday` action to `supabase/functions/rota/index.ts` (staff-token gated, same
auth as reservationsToday) that READS `dj_slots` + `djs` — name, real name, phone, email,
instagram — for the 8am-anchored operating day, returning only booked slots (confirmed /
held / pending, non-suspended) and handling the b2b second DJ via `dj_id2`. **Read-only —
nothing in the DJ lane is written.** Rendered as a card at the top of
`src/rota/PortalReservations.jsx` with tap-to-call and tap-to-text links.

Every signed-in staff member sees it, deliberately: if the DJ hasn't arrived, whoever is on
the floor needs the phone number, not just a manager. Verified live on Sat 29 Aug — returns
the b2b pair on `main` plus the `sat_pm` early slot; an unauthenticated call gets 401.

DJ lane: `dj_slots`/`djs` are yours — shout if this read cuts across anything in flight.

## finance lane — schema/cron, 2 Sep 2026

Added pg_cron job `receipts-attach-hourly` (20 past the hour) calling the finance
function xeroSweep. No schema change. Fixes an omission: the sweep was built on
20 Aug but never scheduled, so nothing attached unless called by hand.

## 20 Aug 2026 — staff ⇄ DJ hotlink (founder-directed)
Founder: "Thays is one of our bartenders as well as being one of our DJs… add a hot link so
she can get to her DJ profile via her staff profile, and vice versa."

**Why an explicit link and not matching:** Thays is in both tables with a DIFFERENT email
(none on staff, thaysalvianodj@… on the DJ record) and a DIFFERENT phone (07832064672 vs
07551871727). Matching on contact details would have silently failed; matching on NAME would
eventually marry up two different Charlies. So a manager sets `staff.dj_id` once.

- `staff.dj_id` added (additive DDL, above) and set for Thays.
- `rota` fn `me` now returns `dj: { name, url }` when `dj_id` is set. **The DJ token is only
  ever returned to the holder of the staff token whose OWN record carries that dj_id** —
  never listed or searchable. Verified: Thays's token returns her link; Jude's returns null.
- `src/rota/RotaPortal.jsx` — "🎧 My DJ profile" card at the top of the profile.
- `src/dj/DJPortal.jsx` — "👤 My staff profile" back to /rota, shown only when a staff login
  exists on that device, so a DJ who isn't staff never sees a dead end.

DJ lane: this reads `djs` and adds a link column to `staff`; nothing in `djs` is written.

**Separately — a live crash fixed in `src/ops/sections/PingPong.jsx`:** it calls
`tournMergeLeague` / `tournUnmergeLeague` (the ping pong league's "same player, two rows"
join) but never imported them, so that feature would throw a ReferenceError the moment
anyone used it. Both helpers already exist in `src/pingpong/api.js` and both actions already
exist in the pingpong edge function — it was purely a missing import. Found by the
pre-flight checker, not by luck. Tournament lane: one-line import, no logic touched.

## finance lane — schema, 2 Sep 2026 (second)

Added table `till_reports` + private bucket `till-reports`. The Apps Script pushes
the daily Lightspeed CSVs there from Gmail so reading the till stops depending on a
connector. Additive; nothing existing touched.
