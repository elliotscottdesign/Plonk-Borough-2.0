-- Make dj_notes two-way so the founder can COMMENT ON AN EVENT and it lands as a
-- message on that DJ's portal (and the DJ's reply comes back). Additive + idempotent.
--
--   from_admin  — true = No Dice → DJ (a comment on their night); false = DJ → No Dice (existing).
--   dj_read_at  — when the DJ read an admin message (mirrors read_at, which stays
--                 "when the admin read the DJ's note"). Kept separate so the two
--                 unread counters never interfere.
--   date/slot   — the night the comment is about (null for a general note), so the
--                 message can show "re: Sun 4 Oct" and thread under that event.
alter table public.dj_notes add column if not exists from_admin boolean not null default false;
alter table public.dj_notes add column if not exists dj_read_at timestamptz;
alter table public.dj_notes add column if not exists date date;
alter table public.dj_notes add column if not exists slot text;

create index if not exists dj_notes_dj_idx on public.dj_notes (dj_id, created_at desc);
create index if not exists dj_notes_event_idx on public.dj_notes (date, slot);
