-- Opportunities tracker — external dates that drive footfall/sales: festivals
-- (Victoria Park & East London), school half-terms, fireworks, bank holidays,
-- drink/food days, cultural & sport moments. Seeded by us; founder can add more.
create table if not exists venue_events (
  id          uuid primary key default gen_random_uuid(),
  start_date  date not null,
  end_date    date,                 -- for multi-day (half-terms, festivals)
  title       text not null,
  category    text not null default 'other',   -- festival|holiday|half_term|fireworks|bank_holiday|drink_day|cultural|sport|local|other
  location    text,                 -- e.g. Victoria Park, London Fields, '' = national
  angle       text,                 -- the party/deal/footfall idea
  source      text not null default 'manual',  -- seed | manual
  created_at  timestamptz not null default now()
);
create index if not exists idx_ve_start on venue_events (start_date);
