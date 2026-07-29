-- Leisure Watch — London Fields Lido slot watcher.
-- One-time setup: paste this whole file into the Supabase SQL editor and Run.
-- (The SEND_SECRET below is already the project's value, from
--  src/marketing/data/backend.js — no edits needed.)

-- ── Tables ───────────────────────────────────────────────────────────────────
-- Last-seen snapshot: one row per session in the current ~14-day window. The
-- cron compares each run against this to spot a slot going full → free.
create table if not exists leisure_slots (
  slot_key         text primary key,          -- "YYYY-MM-DD|Session Name|HH:MM"
  venue            text not null default 'london-fields-lido',
  activity         text not null default 'lido',
  name             text,
  date             date,
  starts_at        text,
  ends_at          text,
  spaces_remaining int  not null default 0,
  updated_at       timestamptz not null default now()
);
create index if not exists leisure_slots_date_idx on leisure_slots (date);

-- Alert history — every opening we emailed about (shown on the page).
create table if not exists leisure_alerts (
  id               bigint generated always as identity primary key,
  kind             text not null,             -- 'cancellation' | 'release'
  name             text,
  date             date,
  starts_at        text,
  spaces_remaining int,
  emailed          boolean default false,
  created_at       timestamptz not null default now()
);
create index if not exists leisure_alerts_created_idx on leisure_alerts (created_at desc);

-- Single-row config: the watcher on/off switch.
create table if not exists leisure_config (
  id         int primary key default 1,
  enabled    boolean not null default true,
  updated_at timestamptz not null default now(),
  constraint leisure_config_singleton check (id = 1)
);
insert into leisure_config (id, enabled) values (1, true) on conflict (id) do nothing;

-- The edge function uses the service-role key (bypasses RLS). Turn RLS on with
-- no policies so nothing is reachable directly by the public anon key.
alter table leisure_slots  enable row level security;
alter table leisure_alerts enable row level security;
alter table leisure_config enable row level security;

-- ── Cron heartbeat ───────────────────────────────────────────────────────────
-- Every minute, ping the `leisure` edge function to scan + email on new openings.
-- (pg_cron's floor is 1 minute; that's our gentle, human-paced cadence.)
-- Re-running this file is safe — unschedule first if it already exists:
--   select cron.unschedule('leisure-watch');
select cron.schedule('leisure-watch', '* * * * *', $job$
  select net.http_post(
    url:='https://rntcujcpsozvuxvmlejv.supabase.co/functions/v1/leisure',
    headers:='{"Content-Type":"application/json"}'::jsonb,
    body:='{"action":"poll","secret":"33394275513216b85489a6f16f61fb6646ace49365b12f74"}',
    timeout_milliseconds:=20000
  );
$job$);
