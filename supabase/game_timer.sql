-- Game-length timer (19 Aug 2026) — additive, nothing else touched.
-- Stamped the moment a match is given a physical table, so the tournament
-- screen can show how long that pair have been on it. Cleared when the table
-- is taken away; kept when the match finishes so the final length still reads.
alter table pool_matches     add column if not exists table_assigned_at timestamptz;
alter table pingpong_matches add column if not exists table_assigned_at timestamptz;

-- 20 Aug 2026: completed_at stamped when a score is saved — with
-- table_assigned_at this gives per-game length, shown as an AVERAGE under
-- the standings (per-match ticking clocks were removed the same day).
alter table pool_matches     add column if not exists completed_at timestamptz;
alter table pingpong_matches add column if not exists completed_at timestamptz;
