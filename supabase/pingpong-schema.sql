-- No Dice — Ping Pong tournament tables (pingpong_*).
-- A faithful mirror of the pool_* tables the `tournament` edge function uses, so the
-- `pingpong` edge function behaves identically. Only difference at runtime: a game is
-- first-to-11 (pingpong_tournaments.settings.raceTo defaults to 11 in the function).
--
-- These are additive/new tables — they do NOT touch pool_* or the booking tables
-- (tournaments / tournament_entries), which the function only READS.
--
-- Cascades the app depends on:
--   • deleting a run (pingpong_tournaments) removes its participants / rounds / matches / vouchers
--   • deleting a round (pingpong_rounds) removes that round's matches  (the "undo last round" action)

-- One run per booked night: links a booking `tournaments` row to its ping pong roster.
create table if not exists pingpong_tournaments (
  id                  uuid primary key default gen_random_uuid(),
  tournament_id       uuid not null references tournaments(id) on delete cascade,
  status              text not null default 'setup',   -- setup → rounds → knockout → done
  settings            jsonb not null default '{}'::jsonb,
  discipline_override text,                             -- 'singles' | 'doubles' | null (re-classify a night)
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (tournament_id)
);

-- The roster for a run. `entry_id` links back to the paid booking (tournament_entries);
-- walk-ins have source='manual' and no entry_id.
create table if not exists pingpong_participants (
  id                     uuid primary key default gen_random_uuid(),
  pingpong_tournament_id uuid not null references pingpong_tournaments(id) on delete cascade,
  entry_id               uuid,                          -- tournament_entries.id (ticket holders); null for walk-ins
  display_name           text not null,
  source                 text not null default 'ticket',-- 'ticket' | 'manual'
  seed                   int,
  active                 boolean not null default true, -- removed ticket-holders go inactive (undoable)
  league_null            boolean not null default false,-- mid-tournament sub: original earns no league points
  replaced_at            timestamptz,
  created_at             timestamptz not null default now()
);
create index if not exists pingpong_participants_run_idx on pingpong_participants (pingpong_tournament_id);

-- Swiss rounds (ordinal 1..n) for a run.
create table if not exists pingpong_rounds (
  id                     uuid primary key default gen_random_uuid(),
  pingpong_tournament_id uuid not null references pingpong_tournaments(id) on delete cascade,
  ordinal                int not null,
  status                 text not null default 'active',
  created_at             timestamptz not null default now()
);
create index if not exists pingpong_rounds_run_idx on pingpong_rounds (pingpong_tournament_id);

-- Every match — both Swiss-round matches (round_id set) and knockout-bracket matches
-- (bracket_round set). A single row shape covers both, exactly like pool_matches.
create table if not exists pingpong_matches (
  id                     uuid primary key default gen_random_uuid(),
  pingpong_tournament_id uuid not null references pingpong_tournaments(id) on delete cascade,
  round_id               uuid references pingpong_rounds(id) on delete cascade,  -- null for bracket matches
  slot                   int,
  p1_id                  uuid,
  p2_id                  uuid,
  p1_score               int,
  p2_score               int,
  winner_id              uuid,
  is_bye                 boolean not null default false,
  status                 text not null default 'pending',  -- pending | active | done
  table_number           int,                              -- physical table 1 / 2 while in play
  bracket_round          int,                              -- knockout round (null for Swiss matches)
  bracket_slot           int,
  is_third_place         boolean not null default false,
  next_match_id          uuid,                             -- bracket: match this winner feeds into
  next_slot              int,
  games                  jsonb,                            -- best-of-3 final / 3rd-place: [{p1,p2},...]
  created_at             timestamptz not null default now()
);
create index if not exists pingpong_matches_run_idx   on pingpong_matches (pingpong_tournament_id);
create index if not exists pingpong_matches_round_idx on pingpong_matches (round_id);

-- 1st / 2nd / 3rd bar-tab vouchers (£30 / £20 / £10). One per run+place.
create table if not exists pingpong_vouchers (
  id                     uuid primary key default gen_random_uuid(),
  pingpong_tournament_id uuid not null references pingpong_tournaments(id) on delete cascade,
  participant_id         uuid,
  place                  int not null,                     -- 1 | 2 | 3
  amount_pence           int not null,
  code                   text,
  display_name           text,
  email                  text,
  emailed_at             timestamptz,
  created_at             timestamptz not null default now(),
  unique (pingpong_tournament_id, place)
);

-- The frontend never touches these directly — the edge function uses the service-role key
-- (which bypasses RLS). Enable RLS with no policies so anon/auth keys can't read/write them.
alter table pingpong_tournaments  enable row level security;
alter table pingpong_participants enable row level security;
alter table pingpong_rounds       enable row level security;
alter table pingpong_matches      enable row level security;
alter table pingpong_vouchers     enable row level security;
