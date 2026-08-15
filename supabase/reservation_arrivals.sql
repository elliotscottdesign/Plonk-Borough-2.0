-- Arrival tick-off for the day's reservations (applied 2026-08-06).
-- One row = "this booking has arrived", ticked by staff in the rota portal or by
-- the founder in /ops → Events → Reservations. Keyed by (kind, ref_id) where kind
-- is table|pool|golf|tournament and ref_id is the source row's id — the source
-- booking tables (bar_reservations / tournament_entries / bookings, written by
-- the nodice.bar customer site) are NEVER modified. Un-ticking deletes the row.
-- Writes go through the `rota` edge function (staff token or SEND_SECRET; service
-- role). Anon key may only SELECT (the /ops read path).
create table if not exists reservation_arrivals (
  id         uuid primary key default gen_random_uuid(),
  kind       text not null,               -- table | pool | golf | tournament
  ref_id     text not null,               -- id in the source table
  res_date   date not null,               -- the booking's date (for day queries)
  staff_name text,                        -- who ticked it
  arrived_at timestamptz not null default now(),
  unique (kind, ref_id)
);
create index if not exists idx_res_arrivals_date on reservation_arrivals (res_date);

alter table reservation_arrivals enable row level security;
-- Read-only for the anon key; all writes via the service role (edge function).
drop policy if exists "anon can read arrivals" on reservation_arrivals;
create policy "anon can read arrivals" on reservation_arrivals for select using (true);
