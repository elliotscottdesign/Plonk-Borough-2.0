-- League identity merges (13 Aug 2026) — additive, nothing else touched.
-- Walk-ins added at the bar have no booking email, so their league identity is
-- their typed name. When they come back (and especially when they later book
-- online, gaining an email identity) their old points would strand on a second
-- row. This table maps an old key onto the one they should accrue to; the league
-- resolves through it at read time, so nothing historic is rewritten and any
-- merge can be undone.
create table if not exists league_merges (
  id uuid primary key default gen_random_uuid(),
  sport text not null default 'pool',      -- 'pool' | 'pingpong'
  discipline text not null,                -- 'singles' | 'doubles'
  from_key text not null,                  -- the row being folded away
  to_key text not null,                    -- the row it accrues to
  note text,
  created_at timestamptz default now(),
  unique (sport, discipline, from_key)
);
alter table league_merges enable row level security;
