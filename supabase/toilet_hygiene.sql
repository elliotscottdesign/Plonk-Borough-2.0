-- Toilet-hygiene 2-hourly reminders — schema (bar lane).
-- ADDITIVE ONLY: two new tables, no change to any existing table. Safe to run on
-- the live DB at any time; re-running is a no-op (IF NOT EXISTS everywhere).
--
-- Model
--   push_subscriptions — one row per phone that has opted in to web-push reminders,
--     tied to the staff member (by their rota `token` → staff.id). Dataless push, but
--     we keep p256dh/auth so we can move to payload push later without a re-subscribe.
--   toilet_checks      — one row per 2-hour window of a shift day (8am-anchored, same
--     "shift day" the rota/kitchen functions use). The first person to tap "Done"
--     flips it to 'done', which stops the cron pinging everyone else for that window.
--     last_ping_at / ping_count throttle the reminders so phones aren't spammed.

create extension if not exists pgcrypto;   -- for gen_random_uuid()

-- ── Phones opted in to reminders ─────────────────────────────────────────────
create table if not exists public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  staff_id    uuid references public.staff(id) on delete cascade,
  endpoint    text not null unique,        -- the push service URL (unique per phone/browser)
  p256dh      text,                        -- kept for a future move to payload push
  auth        text,
  user_agent  text,
  created_at  timestamptz not null default now(),
  last_seen   timestamptz not null default now()
);
create index if not exists push_subscriptions_staff_idx on public.push_subscriptions(staff_id);

-- ── One check per 2-hour window per shift day ────────────────────────────────
create table if not exists public.toilet_checks (
  id            uuid primary key default gen_random_uuid(),
  shift_day     date not null,
  window_index  int  not null,             -- floor(minutes-since-midnight / 120), London time
  status        text not null default 'pending',   -- 'pending' | 'done'
  done_by       uuid references public.staff(id),
  done_by_name  text,
  done_at       timestamptz,
  last_ping_at  timestamptz,               -- reminder throttle
  ping_count    int not null default 0,
  created_at    timestamptz not null default now(),
  unique (shift_day, window_index)
);
create index if not exists toilet_checks_day_idx on public.toilet_checks(shift_day);

-- RLS: the edge function uses the service-role key (bypasses RLS). We still enable
-- RLS with no public policy so the anon key can never read/write these tables
-- directly from the browser bundle (same posture as the rota/kitchen tables).
alter table public.push_subscriptions enable row level security;
alter table public.toilet_checks     enable row level security;
