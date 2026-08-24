-- No Dice Hackney — big orders held back for a decision (finance lane)
--
-- Founder rule 19 Aug 2026: a tip on ANY order containing food goes 100% to
-- the kitchen team on that shift — but only for ordinary orders. Anything over
-- the threshold (£100) is held here for the founder to rule on individually,
-- rather than allocated automatically.
--
-- The rule exists because of 18 July: a £493.64 party tab — golf and cocktails
-- — carried £27 of food and a £49.36 tip. Under a blanket rule the chef took
-- the whole tip on what was overwhelmingly a drinks night, and the bar staff
-- who worked it got nothing. The threshold catches that case without punishing
-- the everyday £15–£25 food order the rule is actually for.
--
-- Nothing here is allocated until it is decided. Pending means pending.

create table if not exists tip_flags (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),

  -- the order, as it came off the till
  order_ref     text not null unique,        -- Lightspeed Account id, so re-imports update rather than duplicate
  occurred_at   timestamptz not null,
  trading_date  date not null,               -- night the order belongs to (after-midnight sales count to the night before)
  order_total   numeric(10,2) not null,
  food_total    numeric(10,2) not null default 0,
  tip_amount    numeric(10,2) not null,
  items         text,                        -- what was actually on it, so the call can be made on the facts
  till_user     text,
  kitchen_on    text,                        -- who was clocked into the kitchen that night

  -- the ruling
  decision      text not null default 'pending'
                check (decision in ('pending','kitchen','bar','split')),
  split_pct     integer check (split_pct between 0 and 100),   -- kitchen's share when decision = 'split'
  decided_at    timestamptz,
  decided_by    text,
  note          text
);

create index if not exists tip_flags_pending_idx on tip_flags (trading_date desc) where decision = 'pending';
create index if not exists tip_flags_date_idx    on tip_flags (trading_date desc);

alter table tip_flags enable row level security;
