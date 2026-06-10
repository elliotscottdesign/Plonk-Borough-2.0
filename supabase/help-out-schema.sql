-- No Dice — "Help us open" volunteer sign-ups (the /help-out portal).
-- Run ONCE: Supabase dashboard → SQL Editor → New query → paste all of this → Run.
-- Safe to re-run (idempotent). Sign-ups are written by the `help-out` edge
-- function (service role), which also auto-assigns tasks and emails each helper.
-- You read the results in the /ops → Help Out tab (or the Table Editor).

create extension if not exists pgcrypto;

create table if not exists public.bar_helpers (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  phone        text,
  email        text,
  categories   jsonb default '[]'::jsonb,   -- ["carpentry","handyman",…]
  days         jsonb default '[]'::jsonb,    -- ["2026-06-11", …]
  time_blocks  jsonb default '[]'::jsonb,    -- ["morning","evening","anytime"]
  note         text,
  assigned     jsonb default '[]'::jsonb,    -- task ids auto-assigned to this helper
  assigned_at  timestamptz,
  created_at   timestamptz default now()
);
alter table public.bar_helpers enable row level security;

-- Added after the first release (kept here so a fresh run matches live).
alter table public.bar_helpers add column if not exists assigned jsonb default '[]'::jsonb;
alter table public.bar_helpers add column if not exists assigned_at timestamptz;

-- The table is read/written ONLY by the help-out edge function (service role),
-- so no anon policies are needed — the public key can't read or write it.
