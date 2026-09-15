-- Trials / interviewees (15 Sep 2026): people coming in for a trial or interview.
-- NOT staff — no login, no shift-claiming, no system access. Management-only:
-- schedule their trial shift, keep contact details + CV + notes/feedback in one
-- place. A ledger row per person; trial shifts reference it.
create table if not exists public.trials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  cv_data text,                        -- base64 data URL of the CV (pdf/doc/image)
  cv_name text,                        -- original filename, for display
  notes text,                          -- free-form management notes
  feedback text,                       -- post-trial feedback
  status text not null default 'trial', -- 'trial' | 'hired' | 'declined'
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create table if not exists public.trial_shifts (
  id uuid primary key default gen_random_uuid(),
  trial_id uuid not null references public.trials(id) on delete cascade,
  date date not null,
  start_min integer not null,
  end_min integer not null,
  created_at timestamptz default now()
);
create index if not exists trial_shifts_date_idx on public.trial_shifts (date);
create index if not exists trial_shifts_trial_idx on public.trial_shifts (trial_id);
