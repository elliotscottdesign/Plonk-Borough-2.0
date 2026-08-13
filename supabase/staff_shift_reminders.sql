-- WhatsApp shift reminders (rota lane) — see docs/whatsapp-staff-reminders.md.
-- STATUS: staged, NOT yet applied (all Supabase PATs were revoked 11 Aug; apply
-- with a fresh token). Additive only.

-- 1) @-mentions on shift notes: which staff a note is addressed to.
alter table shift_notes add column if not exists mentions uuid[] not null default '{}';

-- 2) Idempotence marker: one row = "this person was reminded about this shift".
--    The reminder action inserts FIRST (ignoreDuplicates) and only sends when the
--    insert created a row — overlapping cron runs can never double-message.
create table if not exists shift_reminder_sent (
  shift_id  uuid not null,
  staff_id  uuid not null,
  sent_at   timestamptz not null default now(),
  primary key (shift_id, staff_id)
);

-- 3) Cron: every 10 minutes, ask the rota fn to message anyone whose shift starts
--    in ~2 hours. Replace <CRON_SECRET> with the value of the CRON_SECRET project
--    secret (set it first: supabase secrets set CRON_SECRET=<random-long-string>).
--    Re-running cron.schedule with the same name REPLACES the job (safe).
select cron.schedule('staff-shift-reminders', '*/10 * * * *', $job$
  select net.http_post(
    url:='https://rntcujcpsozvuxvmlejv.supabase.co/functions/v1/rota',
    headers:='{"Content-Type":"application/json"}'::jsonb,
    body:='{"action":"sendShiftReminders","cronSecret":"<CRON_SECRET>"}',
    timeout_milliseconds:=8000
  );
$job$);
