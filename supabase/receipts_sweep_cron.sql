-- Attach receipts to their bank payments, hourly (finance lane).
--
-- I built the sweep on 20 Aug and never scheduled it, so it only ran when I
-- called it by hand. A receipt filed on the phone sat waiting indefinitely.
--
-- Hourly rather than daily because the sweep is cheap and a receipt can only
-- attach AFTER its payment has been reconciled in Xero — so it needs to keep
-- checking rather than get one chance a day.
select cron.schedule(
  'receipts-attach-hourly',
  '20 * * * *',
  $$
  select net.http_post(
    url     := 'https://rntcujcpsozvuxvmlejv.supabase.co/functions/v1/finance',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body    := '{"action":"xeroSweep","secret":"33394275513216b85489a6f16f61fb6646ace49365b12f74","dryRun":false,"limit":40}'::jsonb
  );
  $$
);
