-- Waitlist drain (On A Roll). Every minute, if ordering is OPEN, text the NEXT waiting
-- customer that they can order again — one per run, so a queue drains 1 message/minute
-- (the founder's "1 min delay on each message" stagger). Does nothing while paused.
-- Replace <SEND_SECRET> with the value from src/marketing/data/backend.js before running.
-- Re-running with the same job name replaces the job (safe).
select cron.schedule('food-waitlist-drain', '* * * * *', $job$
  select net.http_post(
    url:='https://rntcujcpsozvuxvmlejv.supabase.co/functions/v1/food-order',
    headers:='{"Content-Type":"application/json"}'::jsonb,
    body:='{"action":"sendDueWaitlist","secret":"<SEND_SECRET>"}',
    timeout_milliseconds:=8000
  );
$job$);
