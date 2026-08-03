-- Toilet-hygiene reminder poll (bar lane). Runs every 30 minutes and POSTs to the
-- toilet-check edge function, which decides whether a reminder is actually due:
-- it only pushes when staff are clocked in AND the current 2-hour window hasn't
-- been ticked off, and it throttles to ~one nudge per 40 min (max 4 per window).
-- So the founder's "every two hours" cadence is enforced server-side; the frequent
-- poll just makes it robust to a single missed tick (same style as leisure-watch).
--
-- Replace <SEND_SECRET> with the value from src/marketing/data/backend.js before running.
-- cron.schedule with the same job name REPLACES the existing job, so re-running is safe.
select cron.schedule('toilet-hygiene-poll', '*/30 * * * *', $job$
  select net.http_post(
    url:='https://rntcujcpsozvuxvmlejv.supabase.co/functions/v1/toilet-check',
    headers:='{"Content-Type":"application/json"}'::jsonb,
    body:='{"action":"cron","secret":"<SEND_SECRET>"}',
    timeout_milliseconds:=10000
  );
$job$);

-- To remove it later:  select cron.unschedule('toilet-hygiene-poll');
