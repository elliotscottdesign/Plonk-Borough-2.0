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
-- One login per email (case-insensitive) so a duplicate can't create a silent
-- auth ambiguity. Null emails are exempt (a member added before their email is set).
create unique index if not exists staff_email_lower_uniq on public.staff (lower(email)) where email is not null;

-- 2) Released shifts — the founder opens specific shift patterns on a date; staff
--    claim the ones they can work. Strict patterns: staff pick whether, not what.
create table if not exists public.staff_shifts (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  shift_key text not null,            -- 'full' (Mon–Thu open-to-close) | 'open' | 'close'
  position text,                      -- human label: 'Open–Close' | 'Open' | 'Close'
  role text,                          -- role/tier the shift needs ('bar')
  status text default 'open',         -- released row is always 'open'; fill is derived from claim count vs headcount
  note text,
  created_at timestamptz default now(),
  unique (date, shift_key)
);
create index if not exists staff_shifts_date_idx on public.staff_shifts (date);
-- Shift timing is stored as MINUTES FROM THE SHIFT DATE'S MIDNIGHT so next-day
-- ends (Fri/Sat close at 01:00 = 1500) and midnight (00:00 = 1440) are exact and
-- timezone-proof. `headcount` = how many bar staff this shift needs; who fills it
-- lives in staff_shift_claims (below), so one shift row can hold N people.
alter table public.staff_shifts add column if not exists start_min integer;   -- 840 = 14:00
alter table public.staff_shifts add column if not exists end_min integer;      -- 1440 = 00:00, 1500 = 01:00 next day
alter table public.staff_shifts add column if not exists label text;           -- 'Open' | 'Close' | 'Open–Close'
alter table public.staff_shifts add column if not exists headcount integer not null default 1;

-- 2b) Shift claims — who is on each shift. One row per (shift, staff). A shift is
--     FULL when its claim count reaches the shift's headcount. source: 'staff'
--     (self-picked in the portal) or 'admin' (founder-assigned).
create table if not exists public.staff_shift_claims (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid not null references public.staff_shifts(id) on delete cascade,
  staff_id uuid not null references public.staff(id) on delete cascade,
  status text default 'claimed',      -- 'claimed' | 'confirmed' | 'declined'
  source text default 'staff',        -- 'staff' | 'admin'
  created_at timestamptz default now(),
  unique (shift_id, staff_id)
);
create index if not exists staff_shift_claims_shift_idx on public.staff_shift_claims (shift_id);
create index if not exists staff_shift_claims_staff_idx on public.staff_shift_claims (staff_id);

-- Clean up legacy single-assignee columns from an earlier paste — assignments now
-- live in staff_shift_claims, so a stray staff_id on the shift would be a wrong JOIN.
alter table public.staff_shifts drop column if exists staff_id;
alter table public.staff_shifts drop column if exists start_h;
alter table public.staff_shifts drop column if exists end_h;

-- Capacity guard: a shift's claims can never exceed its headcount, even under
-- concurrent claims (founder assign now, staff self-pick later). Locking the
-- shift row makes the count race-safe; over-capacity inserts raise 'SHIFT_FULL'.
create or replace function public.enforce_shift_headcount() returns trigger as $$
declare need int; have int;
begin
  select headcount into need from public.staff_shifts where id = new.shift_id for update;
  if need is null then return new; end if;   -- shift gone: let the FK handle it
  select count(*) into have from public.staff_shift_claims where shift_id = new.shift_id;
  if have >= need then raise exception 'SHIFT_FULL'; end if;
  return new;
end;
$$ language plpgsql;
drop trigger if exists trg_enforce_shift_headcount on public.staff_shift_claims;
create trigger trg_enforce_shift_headcount before insert on public.staff_shift_claims
  for each row execute function public.enforce_shift_headcount();

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
alter table public.staff_shift_claims enable row level security;
alter table public.staff_availability enable row level security;
