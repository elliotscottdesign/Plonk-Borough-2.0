-- No Dice — "Help us open" volunteer sign-ups (the /help-out portal).
-- Run ONCE: Supabase dashboard → SQL Editor → New query → paste all of this → Run.
-- That's the only setup step. After it runs, sign-ups from the shared link land
-- in this table and you read them in the Table Editor (no code, no deploy).
--
-- Security model mirrors `subscribers`: the public anon key can ONLY insert a
-- sign-up — it can never read the list back. Phone numbers / emails stay private;
-- you view them signed in to Supabase.

create extension if not exists pgcrypto;

create table if not exists public.bar_helpers (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  phone        text,
  email        text,
  categories   jsonb default '[]'::jsonb,   -- ["carpentry","handyman",…] keys from src/help/data.js
  days         jsonb default '[]'::jsonb,    -- ["2026-06-11", …] the dates they can come
  time_blocks  jsonb default '[]'::jsonb,    -- ["morning","evening","anytime"]
  note         text,
  created_at   timestamptz default now()
);
alter table public.bar_helpers enable row level security;

-- anon can ONLY insert (sign up) — never read the list with the public key.
create policy "anon can volunteer" on public.bar_helpers
  for insert to anon with check (true);
