-- On A Roll order pause + customer waitlist (Aug 2026).
-- The kitchen can pause ordering (manually, or auto when there are >= N live orders).
-- While paused the customer order page shows "a few orders ahead" and lets people
-- leave their number; on reopen a per-minute cron texts them one at a time (stagger).

create table if not exists food_settings (
  id             int primary key default 1 check (id = 1),   -- single-row settings
  paused         boolean not null default false,             -- manual pause
  auto_pause     boolean not null default false,             -- auto-pause when busy
  auto_threshold int not null default 8,                     -- live orders that trips auto-pause
  updated_at     timestamptz not null default now()
);
insert into food_settings (id) values (1) on conflict (id) do nothing;
alter table food_settings enable row level security;

create table if not exists food_waitlist (
  id          uuid primary key default gen_random_uuid(),
  phone       text not null,
  name        text,
  created_at  timestamptz not null default now(),
  notified_at timestamptz                                    -- set when the "order again" text is sent
);
create index if not exists idx_food_waitlist_pending on food_waitlist (created_at) where notified_at is null;
alter table food_waitlist enable row level security;
