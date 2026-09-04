-- Lightspeed daily reports, delivered without anyone touching a file.
--
-- The reports land in elliot@nodice.bar at 06:30 every day. Reading them has
-- meant either the founder dragging CSVs into a chat or my Gmail connector
-- being alive — and that connector has dropped four times in three weeks.
--
-- So the Apps Script, which reads Gmail natively inside the founder's own
-- Google account, puts them here instead. Then they can be read with the
-- service key, and nothing depends on a connector that keeps failing.

create table if not exists till_reports (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),

  report_kind  text not null,      -- payments | transactions | product | cashdrawer | unknown
  covers_date  date,               -- the trading day it reports on, if it can be told
  file_name    text not null,
  storage_path text not null,
  bytes        integer,
  gmail_id     text unique,        -- so a re-run cannot file the same email twice
  processed_at timestamptz         -- set once its figures have been folded in
);

create index if not exists till_reports_kind_idx on till_reports (report_kind, covers_date desc);
create index if not exists till_reports_todo_idx on till_reports (created_at) where processed_at is null;

alter table till_reports enable row level security;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('till-reports','till-reports', false, 26214400,
        array['text/csv','application/vnd.ms-excel','text/plain',
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/octet-stream'])
on conflict (id) do nothing;
