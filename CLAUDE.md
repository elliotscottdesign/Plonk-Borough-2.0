# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Working-style rules (founder-set, treat as load-bearing)

- **Apps Script changes: always send the FULL file.** The founder is not a coder and will not hunt for line numbers, find-and-replace blocks, or count braces. Whenever an `infra/*.gs` file needs to change, deliver the complete new file as one paste-and-replace block ("select all → delete → paste → save → deploy new version"). Never ship diffs, snippets, or "find this block and change it" instructions for Apps Script.
- **"Commit" = ship in ONE step — via your section branch (see "## Parallel sessions" below).** The founder is non-technical and wants shipping to be one instruction. When they say "commit" / "ship it" / "go live", YOU do the whole git dance without making them think about branches: stage & commit to your section branch → `git fetch origin` → merge `origin/main` into your branch (resolve any conflict) → merge your branch into `main` → `git push origin main` → then deploy only the edge function(s) your lane owns. If the push is rejected (another session pushed first), re-fetch/merge and retry. Never leave finished work sitting only on a branch when they've said commit/ship. (Solo exception: if you are demonstrably the only session and already on `main`, a direct commit+push is fine.) ([memory: feedback_commit_push.md])
- **The "No Dice" site is Hackney, not Borough.** Going forward, every new mention of "No Dice" as a site / venue / location / brand must reference **Hackney (London Fields, 407 Mentmore Terrace, E8 3PH)** — not Borough Market. This applies to: page titles, hero kickers, footer addresses, marketing copy, new public-facing pages, council / licensing references (Hackney Council, not Southwark), and any structured data. **Legal entity for the Hackney venue is `No Dice Hackney Ltd`** (the operating company, a wholly-owned subsidiary of No Dice Bars Ltd, trading from London Fields, E8) — use it for any new legal / financial / contract reference to the Hackney site. The legal entity "No Dice Borough Ltd" is unchanged where it already appears in legal / financial / Borough-investor-deck context (the gated `/borough` deck, the Borough 2025 till-sales tab, legal templates, i18n translations of that copy) — those surfaces specifically reflect the original Borough entity and should stay. Default ALL new copy to Hackney unless the founder says otherwise.
- **Workbook links: always send a fresh URL** when mentioning a workbook (don't assume a previous link is still in context).
- **Be specific in deploy steps.** "Save → Deploy → Manage deployments → ✏️ pencil → Version: New version → Deploy" — never assume the founder remembers the path.

## Parallel sessions — stay in your lane (READ FIRST, every session)

The founder runs **several Claude sessions at once**, one per area of the app. To stop sessions corrupting each other, each works in its **own git worktree + branch** and **only touches the files its lane owns**. Worktrees live in `../team-sessions/<section>` (siblings of this repo) on branch `section/<section>`. The plain-English "which folder is which" guide for the founder is [SESSIONS.md](SESSIONS.md).

**On startup, know your lane.** Run `git branch --show-current`. If it's `section/<x>`, you are the **<x>** session — work only within that lane's files below. If you're on `main` (the integration checkout) treat yourself as the integration/solo session: fine for cross-cutting infra, but if the founder names a section ("work on the DJs"), move to that section's worktree/branch first rather than editing section files on `main`.

**Ownership map** — each lane owns these; do **not** edit another lane's files without the founder explicitly reassigning you:

| Lane (`section/…`) | Frontend it owns | Back-end (`supabase/functions/…`) it owns |
|---|---|---|
| `dj` | `src/dj/**`, `src/ops/sections/DJRoster.jsx`, `DJBookings.jsx`, `DJMedia.jsx`, `DJMessages.jsx` | `dj-portal`, `dj-admin`, `dj-caption`, `dj-holds-cron` |
| `rota` | `src/rota/**`, `src/ops/sections/StaffRota.jsx`, `AiRota.jsx`, `AvailabilityOverview.jsx`, `DayRosterGrid.jsx`, `RotaCalendar.jsx`, `RotaRulesEditor.jsx`, `TrainingMatrix.jsx`, `VenueClockSettings.jsx` | `rota` |
| `tournament` | `src/tournament/**`, `src/ops/sections/Tournament.jsx` | `tournament` |
| `ops` | `src/ops/OpsApp.jsx` + shell, `Reports.jsx`, `Documentation.jsx`, `KeyDates.jsx`, `src/ops/keydates/**`, `HelpOut.jsx`, `HelpCalendar.jsx`, `WorldCup.jsx` | `events-feed`, `help-out`, `keydates` |
| `marketing` | `src/marketing/**`, `src/slides/**`, `src/borough/**` | `send-campaign`, `send-newsletter`, `confirm-optin`, `unsubscribe`, `import-subscribers` |
| `kitchen` | `src/kitchen/**`, `src/ops/sections/Kitchen.jsx`, `ChecklistLog.jsx` | `kitchen` |
| `bar` | `src/ops/sections/StockOrder.jsx`, `StockCheck.jsx`, `StockList.jsx`, `Suppliers.jsx`, `Consumables.jsx`, `Perishables.jsx`, `Costing.jsx`, `GlassBreakage.jsx`, `TillGuide.jsx`, `Operations.jsx`, `CocktailSpecs.jsx`, `MenuAdmin.jsx`, `src/ops/data/**`, `src/toilets/**`, `src/ops/sections/ToiletLog.jsx` | `toilet-check` |

**Shared files — no single lane owns these; coordinate before editing** (announce in [COORDINATION.md](COORDINATION.md) first, keep the edit minimal, and `git fetch && merge origin/main` right before): `src/App.jsx`, `src/main.jsx`, `src/ops/OpsApp.jsx` (the tab registry — adding a tab touches it), `src/index.css`, `src/data.js`, `src/marketing/data/backend.js` (API URL + secret — effectively frozen), `index.html`, `vite.config.js`, `tailwind.config.js`, `.github/workflows/**`, `package.json`, `CLAUDE.md`, `SESSIONS.md`, `COORDINATION.md`.

**✅ The `rota` edge function was split (31 Jul 2026) into `rota` / `kitchen` / `keydates`** — each lane now owns its own back-end file (`supabase/functions/{rota,kitchen,keydates}/index.ts`) and they no longer share one. `src/kitchen/api.js` → `kitchen`; `src/ops/keydates/events.js` → `keydates`; the nightly missed-checklist cron → `kitchen`. All three read the same tables as before (no schema change). Deploy any edge function with `--no-verify-jwt` (the clients send no auth header) — see [[reference_supabase_deploy]].

**Per-session protocol:**
1. **Sync first:** `git fetch origin && git merge origin/main` into your branch before starting, so you build on everyone's latest.
2. **Work only in your lane's files.** Need a shared file? Claim it in COORDINATION.md, sync, edit minimally, then clear the claim.
3. **Ship in one step when the founder says commit/ship** (see the working-style rule above): commit to your branch → sync `origin/main` → merge to `main` → push → deploy only YOUR edge function(s).
4. **Deploys & DB are global** (one Supabase project `rntcujcpsozvuxvmlejv`): only deploy the function(s) your lane owns, from the latest merged `main`; coordinate any schema DDL in COORDINATION.md; never run destructive/test writes on real data ([memory: feedback_no_live_data_test_writes.md]).
5. **Build before you ship:** `npm run build` must pass.

## Project

Single-page React app deployed at **nodice.bar** (custom domain via [public/CNAME](public/CNAME)). Vite + React 18 + Tailwind 3 + Recharts + lucide-react.

**Venue / brand:** "No Dice" is the operating venue at **Hackney — London Fields, 407 Mentmore Terrace, E8 3PH**, owned by **No Dice Hackney Ltd** (operating subsidiary of No Dice Bars Ltd). All customer-facing surfaces (the Landing page, the public World Cup bookings page at `/worldcup`, anything new) reference Hackney / London Fields. The legal entity "No Dice Borough Ltd" is retained inside the gated `/borough` investor deck and adjacent financial / legal artefacts that specifically pitch the original Borough entity — see the working-style rule above.

**Group structure:** `No Dice Bars Ltd` (parent / holding co) → wholly-owns `No Dice Borough Ltd` (the original Borough venue subsidiary; appears in the `/borough` deck) and `No Dice Hackney Ltd` (the current operating venue subsidiary; appears throughout `src/hackney/`, the IP-licence template, etc.).

## Commands

```bash
npm install
npm run dev      # Vite dev server
npm run build    # production build to dist/
npm run preview  # serve built dist/
```

No test runner, linter, or typechecker is configured — don't assume `npm test`/`npm run lint` exists.

## Architecture

### Entry & shell
- [src/main.jsx](src/main.jsx) mounts `<App />`.
- [src/App.jsx](src/App.jsx) is the shell: four top-level tabs (`Investor Deck`, `Venue Info`, `Business Explorer`, `Plonk`) and, for the deck, a static `SLIDES` array that drives the slide nav. All tab/slide state is local `useState` — there's no router.
- The **Plonk** top-tab is the Plonk Golf / IP dev area — contains the `IP & Licensing` and `Marketing Engine` views as sub-tabs. Marketing Engine used to live in the deck; it was moved here when the new Plonk × Venue licensing model took shape (Plonk Golf now owns all ad/SEO spend via the IP & Licensing agreement).

### Adding content
- **New deck slide**: create a component in `src/slides/`, import it in [src/App.jsx](src/App.jsx), add an entry to the `SLIDES` array (order = display order, `id` is just a key).
- **New Business Explorer tab**: add a label to the `TABS` array and a matching entry in `tabComponents` in [src/tabs/BusinessExplorer.jsx](src/tabs/BusinessExplorer.jsx).
- **New Venue Info tab**: same pattern in [src/tabs/VenueInfo.jsx](src/tabs/VenueInfo.jsx). Images live in `public/` and are referenced by absolute path (e.g. `/venue_gallery_1.jpg`).
- **New Plonk sub-tab**: same pattern in [src/tabs/Plonk.jsx](src/tabs/Plonk.jsx).

### Styling
- **Inline styles with CSS custom properties are the primary styling pattern**, not Tailwind utility classes. Tailwind is wired up via [tailwind.config.js](tailwind.config.js) / [postcss.config.js](postcss.config.js) but components overwhelmingly use `style={{ ... }}`. Match the surrounding code — don't mix in Tailwind classes unless you're converting a component fully.
- Design tokens are declared in `:root` in [src/index.css](src/index.css): `--ink` / `--ink-2` / `--ink-3` (backgrounds), `--gold` / `--gold-light` / `--gold-dim` (accent), `--cream` / `--cream-dim` (text), `--teal` (positive highlight), plus `--red-cost` / `--blue-income` for chart categories.
- Typography: `DM Serif Display` (headings, via `.serif` class) and `DM Sans` (body) — loaded from Google Fonts in [index.html](index.html).
- Utility classes defined in [src/index.css](src/index.css): `.serif`, `.gold-rule`, `.stat-number`, `.card`, `.card-highlight`. Reuse these instead of reinventing.

### Data
- [src/data.js](src/data.js) is the authoritative source of financial/deal figures (DEAL, ACTUALS_2025, FORECAST, INCOME_SOURCES, COST_CATEGORIES, monthly arrays, WATERFALL, GOVERNANCE, USE_OF_FUNDS). Deck slides read from it via named imports.
- **Divergence gotcha**: [src/tabs/BusinessExplorer.jsx](src/tabs/BusinessExplorer.jsx) and [src/slides/FinancialPerformance.jsx](src/slides/FinancialPerformance.jsx) hard-code their own local copies of revenue/cost/monthly arrays instead of importing from `data.js`. When a number changes, update both the `data.js` constants **and** any hard-coded copies in those files — grep for the figure to be sure.

### Access gate
[src/PasswordGate.jsx](src/PasswordGate.jsx) wraps the app in [src/App.jsx](src/App.jsx). Two client-side passwords:
- `TEST1` — unlocks the standard investor view (Investor Deck · Venue Info · Business Explorer).
- `888999` — unlocks the same plus the **Plonk** top-tab (franchise / IP & Licensing dev view).

Both are plain constants in the component — trivially bypassable by viewing source; treat as a speed bump, not security. Unlock state persists in `sessionStorage` under `ndb_unlocked` (any unlock) and `ndb_plonk` (Plonk-tier flag). Both clear when the tab closes.

### Lockable funding & forecast state
[src/components/LockedDeckContext.jsx](src/components/LockedDeckContext.jsx) hosts both lockable surfaces — the funding / use-of-funds slider state (driven by `<FundingSlider />` on Cover and the Use of Funds slide) and the 2026 Performance forecast snapshot. Two backward-compatible hooks: `useLockedFunding()` and `useLockedForecast()`. `LockedDeckProvider` mounted once in [src/App.jsx](src/App.jsx). The two earlier files [src/components/LockedFundingContext.jsx](src/components/LockedFundingContext.jsx) and [src/components/LockedForecastContext.jsx](src/components/LockedForecastContext.jsx) are kept as compatibility shims — they re-export from `LockedDeckContext.jsx`. Funding lock persists to `localStorage` (`ndb_funding_locked_v1`); forecast lock persists to `localStorage` AND optionally posts to `LOCK_SYNC_URL` for cross-device sync.

## Deploy

- [.github/workflows/deploy.yml](.github/workflows/deploy.yml) builds and publishes to GitHub Pages on every push to `main`. No staging environment.
- The workflow also supports a `workflow_dispatch` trigger with `file_path` + base64 `file_content` inputs — it decodes, commits, pushes, and then builds. This is an external "remote edit" path; be aware it exists before modifying the workflow, and note it requires a `GH_PAT` secret because the default `GITHUB_TOKEN` can't push back to the branch.
- `vite.config.js` sets `base: '/'` — the custom domain expects root-relative paths. Don't change `base` without also updating the CNAME setup.
