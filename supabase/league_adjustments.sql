-- League point adjustments (26 Aug 2026) — additive, nothing else touched.
-- For founder rulings the merge tool can't express: HALF a night's points
-- moving to another listing (e.g. a one-off pairing where each player's
-- regular team gets half). Signed pts per league key; computeLeague applies
-- them at read time, resolving keys through league_merges first. Deleting a
-- row undoes the ruling exactly. No UI — founder-directed via Claude.
create table if not exists league_adjustments (
  id uuid primary key default gen_random_uuid(),
  sport text not null default 'pool',
  discipline text not null,
  key text not null,
  display_name text,          -- names a row that doesn't otherwise exist
  pts numeric not null,       -- signed: negative on the source, positive on targets
  note text,
  created_at timestamptz default now()
);
alter table league_adjustments enable row level security;
