# Handoff — Pending / Unvetted DJ roster

**Status:** Spec for you to build. Not started.
**From:** nodice.bar Claude session (10 June 2026)
**For:** the session that owns `src/dj/`, `src/ops/sections/DJ*.jsx`, `src/ops/data/djRoster.js`, `supabase/dj-*`.

## The ask (founder's wording)

> *"Now that we have the core DJ roster done, please look back to the rest of the DJ contacts and make a … pending DJs or, like, uh, unvetted DJs area and delve deeper into our Instagram feed and into our CSV uploaded with DJ details to populate an extended list."*

## What's already in place (you built this)

- `src/ops/data/djRoster.js` — `DJ_ROSTER_SEED` constant with ~30 DJs auto-generated from `/Users/elliotscott/Desktop/DJ DETAILS - VETTED DJS.csv`. Each entry has `id, djName, realName, genres, genresText, instagram, format, phone, email, labels, bioLink, notes, image, source: "import"`. Persisted to `localStorage` under key `ndb_dj_roster_v1` (via `loadRoster` / `saveRoster`).
- `src/ops/sections/DJRoster.jsx` — admin UI: `<DJRoster djs={…} reload={…} />`.
- `src/ops/sections/DJBookings.jsx` — bookings admin.
- `src/dj/DJPortal.jsx` + `src/dj/DJRules.jsx` — DJ-facing portal.
- `supabase/dj-schema.sql` + `supabase/functions/dj-portal` + `dj-admin` + `dj-holds-cron`.

So the "core roster" the founder refers to = the 30 vetted DJs from the CSV that already populate `DJ_ROSTER_SEED`.

## What the founder wants added

A **second list — "Pending DJs" / "Unvetted DJs"** — that sits alongside the vetted roster. Concretely:

1. **A field on each DJ** discriminating vetted vs pending. Recommend a new `status: "vetted" | "pending"` (default all existing rows to `"vetted"` — they came from a sheet called *VETTED DJS*).
2. **A separate area in the admin UI** (tab inside `DJRoster.jsx`, or sibling section) titled "Pending DJs" that lists status='pending' entries with the same edit affordances as the main roster, plus a clear **"Approve → move to vetted"** action that flips status.
3. **A source / origin tag** so each pending DJ shows where it came from — `source: "instagram"`, `source: "manual"`, `source: "csv-extended"`, etc. Useful when the founder is triaging.
4. **Bulk-add / import** flow so the founder (or you) can paste / drop a list and have them land as pending without typing each one.

## Data sources to populate "Pending DJs"

### A. Instagram research

**The founder will handle Instagram themselves in your session ("ill bring it up there no worries").** Don't try to start an Instagram trawl from a cold context — wait for them to bring it up.

When they do, the rough shape of what they'll want is profiles, hashtags, or follower lists turned into DJ candidate rows. Treat each one as `status: "pending", source: "instagram"`.

### B. CSV — already absorbed

`/Users/elliotscott/Desktop/DJ DETAILS - VETTED DJS.csv` was your source for `DJ_ROSTER_SEED`. **All 30 rows are already in.** Nothing new to pull from that file unless the founder updates it.

If they hand you a second CSV (e.g. an "unvetted contacts" sheet), import it with the same generator script you used the first time — just tag `status: "pending", source: "csv-extended"` on every row.

## Recommended schema change (minimal)

In `src/ops/data/djRoster.js`, extend the row shape:

```js
{
  id, djName, realName,
  genres, genresText,
  instagram, format,
  phone, email,
  labels, bioLink, notes, image,
  source: "import" | "instagram" | "manual" | "csv-extended",
  status: "vetted" | "pending",      // NEW — default "vetted" for the 30 existing rows
  vettedAt: null | ISO-string,       // NEW — set when status flips to "vetted"
}
```

Run a one-off backfill so every existing row in localStorage gets `status: "vetted"` on next load — wrap it in `loadRoster()` so it's idempotent and only runs once.

## Recommended UI

Inside `DJRoster.jsx`, two tabs at the top:

```
┌─────────────────────────────────────────┐
│  [ VETTED (30) ]  [ PENDING (12) ]      │
└─────────────────────────────────────────┘
```

- **Vetted tab** = current UI, unchanged.
- **Pending tab** = same row layout but each row has:
  - A `source` chip (Instagram, CSV, Manual)
  - An **Approve** button → flips `status: "vetted"` + sets `vettedAt`
  - The existing **Edit / Delete** affordances

Plus a **"+ Add pending DJ"** button that opens the same edit form but pre-sets `status: "pending"`.

## What I deliberately did NOT do

I did **not** touch `src/ops/` or `src/dj/` per the project's no-modify rule. I also didn't run Instagram queries (no Instagram MCP available in my session anyway, and the founder said they'd surface those for you directly).

The whole task is yours when you're ready. Delete both `HANDOFF_DJ_FEATURE.md` and this file once the work lands.
