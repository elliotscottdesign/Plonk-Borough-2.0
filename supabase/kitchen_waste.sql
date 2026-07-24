-- Kitchen stock wastage log — one row per item binned (product + reason [+ qty]).
create table if not exists kitchen_waste_log (
  id          uuid primary key default gen_random_uuid(),
  log_date    date not null,
  staff_id    uuid,
  shift_id    uuid,
  product     text not null,
  reason      text,
  quantity    text,
  created_at  timestamptz not null default now()
);
create index if not exists idx_kwl_date on kitchen_waste_log (log_date);
