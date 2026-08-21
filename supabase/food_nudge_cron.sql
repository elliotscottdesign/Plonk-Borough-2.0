-- On A Roll auto-nudge. Every minute, ONE reminder text to any order that's been
-- sitting "ready" (uncollected) for 3+ minutes and hasn't been nudged yet. Marks
-- nudged_at so it never texts twice. Replace <SEND_SECRET> before running.
select cron.schedule('food-ready-nudge', '* * * * *', $job$
  select net.http_post(
    url:='https://rntcujcpsozvuxvmlejv.supabase.co/functions/v1/food-order',
    headers:='{"Content-Type":"application/json"}'::jsonb,
    body:='{"action":"sendDueNudges","secret":"<SEND_SECRET>"}',
    timeout_milliseconds:=8000
  );
$job$);
