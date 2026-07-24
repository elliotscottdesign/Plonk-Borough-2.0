-- Kitchen missed-checklist sweep (already installed on the live DB 2026-07-23).
-- Runs once daily at 04:00 UTC — after the kitchen has closed — and checks the
-- operating day that just finished (kitchenCheckMissed defaults to the 8am-anchored
-- shift day, which before 8am is the previous calendar date). notify:true makes it
-- actually email management when an opening/closing run is missing on a kitchen day.
-- The /ops "Check today" button calls the same action WITHOUT notify (read-only peek).
--
-- Replace <SEND_SECRET> with the value from src/marketing/data/backend.js before running.
select cron.schedule('kitchen-missed-check-daily', '0 4 * * *', $job$
  select net.http_post(
    url:='https://rntcujcpsozvuxvmlejv.supabase.co/functions/v1/rota',
    headers:='{"Content-Type":"application/json"}'::jsonb,
    body:='{"action":"kitchenCheckMissed","notify":true,"secret":"<SEND_SECRET>"}',
    timeout_milliseconds:=5000
  );
$job$);
