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
alter table public.staff add column if not exists abilities text[] default '{}';   -- 'bar' | 'kitchen' | 'foh' | 'golf' (what training lets them work)
-- Onboarding / payroll / right-to-work (must be complete before the calendar opens).
alter table public.staff add column if not exists dob date;
alter table public.staff add column if not exists ni_number text;
alter table public.staff add column if not exists bank_name text;
alter table public.staff add column if not exists bank_sort text;
alter table public.staff add column if not exists bank_account text;
alter table public.staff add column if not exists soi_signed_at timestamptz;   -- statement of intent
alter table public.staff add column if not exists soi_signature text;          -- typed full name
alter table public.staff add column if not exists soi_version text;            -- which version they signed
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
alter table public.staff_shifts add column if not exists ability text default 'bar';    -- required ability to work it
alter table public.staff_shifts add column if not exists min_rank integer default 1;    -- 1 Bar Staff .. 4 Manager (higher may cover lower)

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

-- 4) Checklist submissions — one row per (date, checklist) that the shift team
--    fills on their phone. `items` maps each task text → true when ticked.
create table if not exists public.checklist_submissions (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  checklist_key text not null,        -- 'opening' | 'during' | 'closing' | …
  staff_id uuid references public.staff(id) on delete set null,   -- who last saved
  items jsonb default '{}'::jsonb,     -- { "Switch on all lights": true, … }
  note text,
  submitted boolean default false,
  submitted_at timestamptz,
  updated_at timestamptz default now(),
  unique (date, checklist_key)
);
create index if not exists checklist_submissions_date_idx on public.checklist_submissions (date);
alter table public.checklist_submissions enable row level security;

-- A shift checklist is ONE shared sheet the team fills together. Toggle a single
-- task atomically (jsonb merge under the row lock) so two phones ticking at once
-- never overwrite each other.
create or replace function public.checklist_toggle(p_date date, p_key text, p_staff uuid, p_item text, p_on boolean)
returns void as $$
begin
  insert into public.checklist_submissions (date, checklist_key, staff_id, items, updated_at)
    values (p_date, p_key, p_staff, case when p_on then jsonb_build_object(p_item, true) else '{}'::jsonb end, now())
  on conflict (date, checklist_key) do update set
    items = case when p_on then checklist_submissions.items || jsonb_build_object(p_item, true)
                 else checklist_submissions.items - p_item end,
    staff_id = p_staff, updated_at = now();
end; $$ language plpgsql;

-- Note + submit flag. `submitted` is STICKY (a later tick can never un-submit it),
-- and the submit time is stamped once, on the first false→true transition.
create or replace function public.checklist_meta(p_date date, p_key text, p_staff uuid, p_note text, p_submit boolean)
returns void as $$
begin
  insert into public.checklist_submissions (date, checklist_key, staff_id, note, submitted, submitted_at, updated_at)
    values (p_date, p_key, p_staff, p_note, p_submit, case when p_submit then now() else null end, now())
  on conflict (date, checklist_key) do update set
    note = p_note,
    submitted = checklist_submissions.submitted or p_submit,
    submitted_at = case when checklist_submissions.submitted_at is not null then checklist_submissions.submitted_at
                        when p_submit then now() else null end,
    staff_id = p_staff, updated_at = now();
end; $$ language plpgsql;

-- 5) Training completions — one row per (staff, item). item_key is a training
--    module ('fire-safety') OR a cocktail ('cocktail:espresso-martini'), so the
--    same table tracks module sign-offs and per-cocktail training.
create table if not exists public.training_completions (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff(id) on delete cascade,
  item_key text not null,
  completed_at timestamptz default now(),
  unique (staff_id, item_key)
);
create index if not exists training_completions_staff_idx on public.training_completions (staff_id);
alter table public.training_completions enable row level security;

-- 6) Training doc overrides — the founder's edits to a training module. The built-in
--    seed (src/rota/training.js) is the default; a row here overrides it. content =
--    { intro, sections:[{heading, body, image?}], keyPoints:[] } (images = data URLs).
create table if not exists public.training_docs (
  module_key text primary key,
  content jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);
alter table public.training_docs enable row level security;

-- 7) Menus — the founder uploads the week's menus (PDF or image); staff view +
--    print them from their portal. `data` is a base64 data URL.
create table if not exists public.menus (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  kind text default 'pdf',        -- 'pdf' | 'image'
  data text,                      -- base64 data URL
  active boolean default true,
  created_at timestamptz default now()
);
create index if not exists menus_created_idx on public.menus (created_at desc);
alter table public.menus enable row level security;

-- 8) Staff documents — passport copy + right-to-work proof (base64 data URLs).
--    Kept out of the main staff load; the founder fetches one on demand to review.
create table if not exists public.staff_documents (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff(id) on delete cascade,
  kind text not null,             -- 'passport' | 'rtw'
  data text,                      -- base64 data URL
  uploaded_at timestamptz default now(),
  unique (staff_id, kind)
);
create index if not exists staff_documents_staff_idx on public.staff_documents (staff_id);
alter table public.staff_documents enable row level security;

-- Server-only: the `rota` edge function uses the service-role key. Lock the
-- tables to that (no anon access — staff/founder go through the function).
alter table public.staff enable row level security;
alter table public.staff_shifts enable row level security;
alter table public.staff_shift_claims enable row level security;
alter table public.staff_availability enable row level security;
