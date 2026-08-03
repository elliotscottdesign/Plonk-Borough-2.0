-- DJ expense receipts (taxi / drinks / other) attached in the DJ portal's
-- Payments section. Additive only — no changes to existing tables.
create table if not exists dj_receipts (
  id           uuid primary key default gen_random_uuid(),
  dj_id        uuid not null references djs(id) on delete cascade,
  receipt_date date,
  category     text,               -- 'taxi' | 'drinks' | 'other'
  amount       numeric(10,2) default 0,
  note         text,
  image_url    text,
  created_at   timestamptz not null default now()
);
create index if not exists dj_receipts_dj_id_idx on dj_receipts (dj_id);
