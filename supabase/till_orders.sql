-- The till's REAL order system (till lane, slice 3 — 4 Sep 2026).
-- Orders move off each iPad into shared tables: every till point sees the same
-- floor and tabs, and the day gets money discipline — sessions, opening float,
-- numbered Z-reads, and an append-only audit trail (docs/till-architecture.md §2).
-- TRAINING MODE: runs alongside Lightspeed; nothing here feeds the books yet.
-- Additive only. RLS on, no policies = service-role via the `till` fn only.

-- One trading day per till point. z_number is assigned at close, strictly
-- sequential — a gap would be visible, which is the point (HMRC).
create table if not exists till_sessions (
  id                  uuid primary key default gen_random_uuid(),
  till_point          text not null default 'Main',
  status              text not null default 'open',      -- open | closed
  opened_at           timestamptz default now(),
  opened_by           text,
  float_start_pence   int not null default 0,
  closed_at           timestamptz,
  closed_by           text,
  float_counted_pence int,
  expected_cash_pence int,
  over_short_pence    int,
  z_number            int
);

create table if not exists till_orders (
  id            uuid primary key,
  session_id    uuid references till_sessions(id),
  kind          text not null check (kind in ('table','tab','quick')),
  ref           text,
  name          text,
  status        text not null default 'open',            -- open | paid | void
  opened_at     timestamptz default now(),
  opened_by     text,
  closed_at     timestamptz,
  disc          jsonb,
  voucher       jsonb,
  total_pence   int,
  lines         jsonb not null default '[]'::jsonb,      -- working state; every
  updated_at    timestamptz default now()                -- change is ALSO an event
);

create table if not exists till_payments (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid references till_sessions(id),
  order_id    uuid references till_orders(id),
  method      text not null,                             -- cash | voucher (card later)
  amount_pence int not null,
  ref         text,                                      -- e.g. the voucher code
  taken_by    text,
  created_at  timestamptz default now()
);

-- The append-only audit trail: opens, closes, pays, voids, voucher redemptions.
-- A trigger refuses UPDATE/DELETE — the record cannot be quietly rewritten.
create table if not exists till_events (
  id         bigint generated always as identity primary key,
  at         timestamptz default now(),
  session_id uuid,
  order_id   uuid,
  kind       text not null,
  detail     jsonb,
  who        text
);
create or replace function till_events_immutable() returns trigger as $$
begin
  raise exception 'till_events is append-only';
end $$ language plpgsql;
drop trigger if exists till_events_no_rewrite on till_events;
create trigger till_events_no_rewrite
  before update or delete on till_events
  for each row execute function till_events_immutable();

alter table till_sessions enable row level security;
alter table till_orders   enable row level security;
alter table till_payments enable row level security;
alter table till_events   enable row level security;
