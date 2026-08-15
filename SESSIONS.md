# SESSIONS — how to run several Claude sessions at once (plain English)

You can have **one Claude session open per area of the app**, all working at the same
time, without them treading on each other. The trick: each area has its **own folder**
on your Mac. Open a Claude session **in that folder** and it automatically becomes
"the DJ session", "the kitchen session", etc. — it knows its lane and won't touch
another area's work.

## The folders — open a session in the one you want to work on

All live next to this project, in `Sites/nodice/team-sessions/`:

| To work on… | Open a session in this folder |
|-------------|-------------------------------|
| **DJs** | `Sites/nodice/team-sessions/dj` |
| **Rota / staff** | `Sites/nodice/team-sessions/rota` |
| **Tournaments / pool** | `Sites/nodice/team-sessions/tournament` |
| **Ops info** (reports, docs, key dates, help-out) | `Sites/nodice/team-sessions/ops` |
| **Marketing** | `Sites/nodice/team-sessions/marketing` |
| **Kitchen** | `Sites/nodice/team-sessions/kitchen` |
| **Bar** (stock, cocktails, till) | `Sites/nodice/team-sessions/bar` |
| **Finances** (wages, takings, costs — founder-only) | `Sites/nodice/team-sessions/finance` |
| **Lithos handover** (plonkgolf.co.uk → Lithos Digital: handover docs, DNS cutover, SEO) | `Sites/nodice/team-sessions/lithos` |

Note: the **Lithos** folder is a different codebase underneath (the Plonk Golf public
website repo, `plonkgolf-website`) — same idea though: open a session in that folder and
it knows it's the Lithos-handover session.

The original folder — `Sites/nodice/Plonk-Borough-2.0` — is the **integration** copy
(this is `main`, what's live). Use it for cross-cutting/admin work, or just leave it.

## What changed about "commit"
It's still **one instruction from you**. Say "commit" / "ship it" / "go live" and that
session saves its work, folds in everyone else's latest, publishes to the live site,
and re-deploys only its own back-end. You don't manage branches — Claude does. The only
difference from before: work-in-progress stays in that session's folder until you say
ship, so an unfinished change in one session can never leak into another.

## Adding a new area later
Just tell any session: *"set up a new session lane for X"* and it'll create the folder +
branch and add X to the ownership map in [CLAUDE.md](CLAUDE.md).

## The one thing still to tidy
Kitchen and Key-Dates currently share a back-end file with Rota. Until that's split
(a quick first task — say *"split the rota function"* to the rota or kitchen session),
those three coordinate through [COORDINATION.md](COORDINATION.md) so they don't clash.
