-- Till configuration store (till lane, 21 Aug 2026) — one JSONB value per key.
-- First use: key 'floor' = the drawn room layout (tables, positions, names),
-- shared by every till iPad. Additive; RLS on with no policies = service-role
-- only (reached through the `till` edge function).
create table if not exists till_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz default now()
);
alter table till_settings enable row level security;
