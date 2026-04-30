# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Single-page React investor presentation for **No Dice Borough Ltd** (Borough Market experience venue). Vite + React 18 + Tailwind 3 + Recharts + lucide-react. Deployed as a static site to GitHub Pages at `nodice.bar` (custom domain via [public/CNAME](public/CNAME)).

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
