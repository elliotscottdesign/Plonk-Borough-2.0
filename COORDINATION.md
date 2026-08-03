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
| dj | `dj_receipts` (NEW table) — DJ expense receipts (taxi/drinks/other) for the portal Payments section. Additive only, no impact to other lanes. SQL in `supabase/dj_receipts.sql`. | applied 2026-08-02 | 2026-08-02 |
| tournament | Added `pingpong_{tournaments,participants,rounds,matches,vouchers}` (new — mirror of `pool_*`, ping-pong trial). No change to existing tables. | ✅ done | 3 Aug 2026 |

## Global deploy notes
Edge-function deploys are global (last deploy wins). Only deploy the function(s)
your lane owns, and always from the latest merged `main`. If you deploy, jot it here
so others know the live backend moved.

- **`pingpong`** edge function deployed (`--no-verify-jwt`) — 3 Aug 2026, tournament lane. New function, owned by the tournament lane alongside `tournament`.
