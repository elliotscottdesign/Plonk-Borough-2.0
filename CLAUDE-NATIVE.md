# NATIVE lane — app-store apps, offline-first

**Branch:** `section/native` · **Worktree:** `../team-sessions/native` · Created 15 Sep 2026.

> "I'm sick and tired of this being a web app… Things are taking too long to load. Things
> have got to be offline and occasionally updated on the internet, not relying on the
> internet. Let's start a new lane to get all of team.nodice.bar and the On A Roll apps
> all onto the app store as native apps, not web apps. I've had enough."

---

## Read this before planning anything

**1. The staff app can never be a searchable App Store listing.** Apple Guideline 3.2.2(v)
rejects "apps designed for a specific business or organization, including its partners,
clients or employees." A reviewer opening a staff login wall triggers it immediately. This
is not luck or grey area.

**2. The sanctioned route is Apple *Unlisted App Distribution*** — a genuine App Store app,
installed from a link you text people, invisible in search, works on staff-owned phones
with no device management. Apple's own page names "part-time employees… employee resources"
as the use case. £79/year Developer Program. It still has to pass App Review on its merits.

**3. Apple Developer Enterprise is disqualified** — it requires **100+ employees**. Don't
spend an hour on it. **TestFlight is fatal as a permanent home** — builds expire after 90
days and staff would find the app dead mid-shift roughly every three months.

**4. Guideline 4.2 is the real hurdle.** "If your app is not particularly useful, unique, or
'app-like', it doesn't belong on the App Store." A thin wrapper around the existing site
gets rejected. The offline layer is what makes it pass — which is the same work that makes
it fast. Do the substance first, the wrapper last.

**5. Going native fixes almost none of the slowness the founder is angry about.** See below.

---

## Why it is actually slow (measured, not guessed)

| | Measured |
|---|---|
| Main JS bundle | **3.42–3.58 MB**, one file |
| `React.lazy` / dynamic imports in 237 files | **zero** |
| Eager imports in `src/App.jsx` | 42 (10 of them investor decks) |
| Network calls before RotaPortal renders | **18** |
| Local data caching anywhere in `src/` | **none** |

A bartender checking Friday's shift downloads the Hackney investor deck, the Borough deck,
10 investor slides, Recharts and every /ops section first. Roughly three-quarters of what
their phone chews through is for the founder and investors.

**What native fixes:** the download (screens live on the phone), and a permanent place to
store data that the browser can't evict.
**What native does NOT fix:** the 3.5 MB parse on every launch, and the 18 network calls.
Nothing caches the rota, menus or checklists today — somebody has to write that layer, and
it is the same work whether the end result is native or web.

---

## The order of work

1. **Week 1 — split the code (~1 day).** `src/App.jsx` + `src/ops/OpsApp.jsx`. A bartender's
   phone loads a bartender's screens. No app store, no money, reversible. *This is where the
   speed complaint actually gets solved.*
2. **Week 2 — fix the two live bugs below** before offline work makes them worse.
3. **Weeks 3–5 — reference data on the phone.** Menus, cocktail specs, allergen matrix,
   suppliers, till guide, this week's rota, checklist definitions.
4. **Weeks 6–10 — the outbox.** Checklist ticks, clock-ins, temperature logs and
   availability save locally with no signal and send when there is one.
5. **Weeks 10–12 — enrol** as No Dice Hackney Ltd. Apple £79/yr, Google Play $25 one-off.
   A D-U-N-S number can take a fortnight — start early, run it in parallel.
6. **Month 4 — wrap with Capacitor**, submit the staff hub as an Apple **Unlisted** app.
7. **Later, only if still wanted** — On A Roll as a public customer app (separate repo).

**Do NOT rewrite in React Native.** ~15 months and £60–100k at contract rates, rewriting
9,187 styling blocks by hand, and it leaves two codebases to maintain forever.

---

## ⚠️ Two live bugs found during this research — VERIFIED

**(a) Kitchen checklists can destroy a food-safety record. Confirmed, live.**
`supabase/functions/kitchen/index.ts:155` saves the whole run in one go:
```ts
sb.from("kitchen_checklist_runs").upsert(row, { onConflict: "run_date,cadence" })
```
`row.entries` is the entire checklist. If two phones have the same day's checks open and the
wifi wobbles, the second to reconnect **silently overwrites the first** — including a
recorded temperature failure and its corrective action.

The bar checklists already do this correctly, one tick at a time
(`supabase/rota-schema.sql:187` — `items || jsonb_build_object(p_item, true)`). The kitchen
needs the same merge treatment.

**Live exposure:** 47 kitchen runs recorded, **11 carrying failures**. This gets worse the
moment anything goes offline, because offline guarantees two devices hold divergent copies.

**(b)** `supabase/functions/bar/index.ts:106` — flagged by the same review; verify before acting.

---

## Android's own trap

Google Play has no equivalent of Apple's 3.2.2(v) — a login-gated business app can be listed
publicly. But the *private* route (managed Google Play) requires staff to accept a **managed
work profile on their personal phones**. That is an HR conversation, and some will refuse.
Public-but-obscure listing is likely the better Android answer.

## Money

Under **£1,000/year** if the work is done through these sessions: £79/yr Apple, $25 once for
Google, optionally £15–40/month for hosted over-the-air updates (which let urgent fixes skip
App Review — worth it, given a bar fixes things mid-service).
