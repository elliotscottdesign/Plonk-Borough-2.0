-- No Dice — Kitchen food-safety hub. Two tables, no RLS (accessed only via the
-- `rota` edge function with the service key, same as the other /ops tables).

-- One shared run per (date, cadence) — e.g. today's "opening" sheet.
create table if not exists kitchen_checklist_runs (
  id           uuid primary key default gen_random_uuid(),
  run_date     date not null,
  cadence      text not null check (cadence in ('opening','service','closing','weekly','prep')),
  staff_id     uuid,            -- who last saved it
  shift_id     uuid,            -- their kitchen shift that day (nullable)
  entries      jsonb not null default '[]'::jsonb, -- [{key, checked, value_numeric, value_text, is_fail, corrective_action}]
  has_failure  boolean not null default false,
  status       text not null default 'in_progress' check (status in ('in_progress','completed')),
  completed_at timestamptz,
  -- manager review
  reviewed_by  uuid,
  reviewed_at  timestamptz,
  review_note  text,
  created_at   timestamptz not null default now(),
  unique (run_date, cadence)
);
create index if not exists idx_kcr_date on kitchen_checklist_runs (run_date);
create index if not exists idx_kcr_failure on kitchen_checklist_runs (has_failure) where has_failure;

-- Allergen matrix (one row per dish; editable, versioned by updated_at).
create table if not exists kitchen_allergen_matrix (
  id          uuid primary key default gen_random_uuid(),
  dish        text not null unique,
  allergens   jsonb not null default '{}'::jsonb,  -- { celery:'contains'|'trace'|'pending', ... }
  notes       text,
  updated_by  uuid,
  updated_at  timestamptz not null default now()
);
