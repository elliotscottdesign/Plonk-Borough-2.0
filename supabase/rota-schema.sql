-- ─── No Dice Rota / staff system schema ──────────────────────────────────────
-- One paste in the Supabase SQL editor turns the whole rota on. Safe to re-run
-- (idempotent). Backs the `rota` edge function + the /ops "Rota" admin and the
-- staff portal. Mirrors the DJ system: staff (profiles) + staff_shifts (released
-- dates staff claim) + staff_availability (what days/times each person is free).

-- 1) Staff — one row per team member. Profile + login + training + skills + rules.
create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,                         -- login id + contact
  phone text,
  address text,
  emergency_name text,                -- next of kin
  emergency_phone text,
  emergency_relation text,
  role text,                          -- 'Bar Staff' | 'Supervisor' | 'Asst. Manager' | 'Manager'
  skills text[] default '{}',         -- tasks/stations they're signed off to run
  training_status text,               -- e.g. 'In training' | 'Signed off'
  training_notes text,                -- free-text progress log (Slice 5 enriches)
  feedback_notes text,                -- free-text feedback log  (Slice 5 enriches)
  work_rules text,                    -- founder's rules: days/times they can't work
  password text,                      -- staff portal login (speed-bump, like DJ tokens)
  token text unique default replace(gen_random_uuid()::text, '-', ''),  -- personal-link fallback
  active boolean default true,
  created_at timestamptz default now()
);
-- Back-fill columns if the table already existed from an earlier paste.
alter table public.staff add column if not exists email text;
alter table public.staff add column if not exists phone text;
alter table public.staff add column if not exists address text;
alter table public.staff add column if not exists emergency_name text;
alter table public.staff add column if not exists emergency_phone text;
alter table public.staff add column if not exists emergency_relation text;
alter table public.staff add column if not exists role text;
alter table public.staff add column if not exists skills text[] default '{}';
alter table public.staff add column if not exists training_status text;
alter table public.staff add column if not exists training_notes text;
alter table public.staff add column if not exists feedback_notes text;
alter table public.staff add column if not exists work_rules text;
alter table public.staff add column if not exists password text;
alter table public.staff add column if not exists active boolean default true;

-- 2) Released shifts — the founder opens specific shift patterns on a date; staff
--    claim the ones they can work. Strict patterns: staff pick whether, not what.
create table if not exists public.staff_shifts (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  shift_key text not null,            -- 'sr_open' | 'bar_open' | 'bar_close' | 'sr_close' | 'admin'
  position text,                      -- 'Bar Opener', 'Sr Close', …
  role text,                          -- role/tier the shift needs
  start_h numeric,                    -- 11.5  (11:30)
  end_h numeric,                      -- 23.5  (23:30)
  status text default 'open',         -- 'open' | 'claimed'
  staff_id uuid references public.staff(id) on delete set null,
  note text,
  created_at timestamptz default now(),
  unique (date, shift_key)
);
create index if not exists staff_shifts_date_idx on public.staff_shifts (date);

-- 3) Monthly availability — one row per (staff, month). `data` is a map of
--    'YYYY-MM-DD' → { from, to } for the days that person can work that month.
create table if not exists public.staff_availability (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff(id) on delete cascade,
  month text not null,                -- '2026-07'
  data jsonb default '{}'::jsonb,     -- { "2026-07-04": {"from":"11:00","to":"23:30"}, … }
  updated_at timestamptz default now(),
  unique (staff_id, month)
);

-- Server-only: the `rota` edge function uses the service-role key. Lock the
-- tables to that (no anon access — staff/founder go through the function).
alter table public.staff enable row level security;
alter table public.staff_shifts enable row level security;
alter table public.staff_availability enable row level security;
