# Handoff — DJ event-image feature

**Status:** Not built. Started in the wrong Claude session, fully reverted.
**Date:** 10 June 2026
**Owner going forward:** parallel Claude session working on `src/marketing/` + `src/ops/`

## The task (founder's wording)

> Make it so that DJs can upload an image for the specific event that they are planning. This image will then auto take over from their profile image for that event only. If they haven't uploaded an image, the profile image will lead. That image will then filter through to the events tabs and anywhere else the image is relevant for bookings and for the event, including on any back end registries of the event or anything that the founder sees before confirming the event.

## What was started in the nodice.bar repo (now reverted)

The other (nodice.bar) Claude session got a head-start on this before realising it was misrouted. **All of it was reverted** in commit `a27791d` on `main` of `elliotscottdesign/nodice.bar`. The original commit (`9a82d44`) is in git history if anyone wants to cherry-pick patterns.

Specifically, the reverted commit included:

- A `djs` table migration (id, name, bio, profile_image_url, instagram_handle) with RLS — `supabase/migrations/20260610000003_djs.sql`
- A `lib/db/djs.ts` helper with CRUD + a `resolveEventImage(event, dj)` fallback helper
- An `events.dj_id` nullable FK column
- An `/admin/djs` admin page with create/edit modal + MediaPicker for the profile image
- A DJ-picker dropdown inside the `/admin/events` create form (visible only when category is `dj_night`)
- The same DJ picker in the edit modal
- A nested join on `lib/db/calendarEvents.ts` to pull the DJ's `profile_image_url` so the public `/events` calendar got the fallback automatically
- A new "DJs" link in the admin sidebar

Roughly **~700 lines added**. None of it shipped.

## Founder's clarifying answers (asked during the misrouted session)

These are still on record from the founder's responses so the next session doesn't have to re-ask:

1. **Profile entity yes/no** — YES. DJ profiles with name, bio, profile image. So a recurring resident doesn't re-upload artwork every gig.
2. **Public DJ pages** — NO, internal only at launch. (Public `/djs/[name]` pages can come post-launch.)
3. **Who actually clicks "upload"** — *Unresolved.* Founder said *"this happens on the DJ event builder - they upload - i can still edit in the event backend."* The nodice.bar session built this as "founder uploads on the DJ's behalf via /admin/events" but flagged that the wording could also mean "DJ logs in themselves" or "DJ uses a magic link." Founder dismissed the disambiguation question before sending this task to the right place — **please confirm with the founder before building.**

## Where this lives going forward

This feature touches **the customer site (nodice.bar)** — events, admin, public calendar — NOT the investor deck / team hub (Plonk-Borough-2.0). So when the parallel session picks this up, the work belongs in the nodice.bar repo at `elliotscottdesign/nodice.bar`, not here.

This file lives at the root of Plonk-Borough-2.0 purely as a visible flag for the parallel session to spot. Delete this file once the work is underway or scheduled.
