-- Best-of-3 for the final + 3rd-place playoff.
-- One nullable jsonb column on pool_matches holds each game's frame score, e.g.
--   [{"p1":5,"p2":3},{"p1":2,"p2":5},{"p1":5,"p2":4}]
-- Single-game matches (all rounds + every knockout match except the final/3rd-place
-- when best-of-3 is on) leave this NULL and keep using p1_score/p2_score.
alter table pool_matches add column if not exists games jsonb;
