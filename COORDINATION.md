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
| dj | `dj_receipts` (NEW table) — DJ expense receipts (taxi/drinks/other) for the portal Payments section. Additive only, no impact to other lanes. SQL in `supabase/dj_receipts.sql`. | applied 2026-08-02 | 2026-08-02 |
| tournament | Added `pingpong_{tournaments,participants,rounds,matches,vouchers}` (new — mirror of `pool_*`, ping-pong trial). No change to existing tables. | ✅ done | 3 Aug 2026 |
| tournament | `tournaments.tournament_type` CHECK widened to allow `'teams'` (was singles/doubles/special — additive, existing rows untouched). +10 new rows: "Team Ping Pong Tournament", Sundays 18:00 (9 Aug – 11 Oct), `bookable=false`/`registration_open=false` so they stay OFF the public pool booking flow. Ping pong fn lists ONLY teams rows; pool fn now excludes them. | ✅ done | 3 Aug 2026 |
| bar | `push_subscriptions` + `toilet_checks` (NEW tables) — web-push opt-ins + 2-hourly toilet-hygiene check log. Additive only, no impact to other lanes. SQL in `supabase/toilet_hygiene.sql`; cron `toilet-hygiene-poll` `*/30 * * * *`. New `toilet-check` edge fn (deployed `--no-verify-jwt`) + VAPID_* secrets. | ✅ applied + deployed | 3 Aug 2026 |
| bar | `checklist_templates` (NEW table) — founder-editable overrides for kitchen + shift checklists (one JSONB def per checklist_key; empty = code default). Additive, no impact to other lanes. SQL `supabase/checklist_templates.sql`. New `checklists` edge fn (list/save/reset). | pending ship | 3 Aug 2026 |

## Global deploy notes
Edge-function deploys are global (last deploy wins). Only deploy the function(s)
your lane owns, and always from the latest merged `main`. If you deploy, jot it here
so others know the live backend moved.

- **`pingpong`** edge function deployed (`--no-verify-jwt`) — 3 Aug 2026, tournament lane. New function, owned by the tournament lane alongside `tournament`.
