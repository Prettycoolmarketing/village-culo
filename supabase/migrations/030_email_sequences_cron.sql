-- Schedules send-sequence-emails to run once a day. send-sequence-emails is
-- deployed with --no-verify-jwt (same as submit-waitlist/submit-pcm-lead),
-- so this call needs no Authorization header/service-role key at all.
--
-- Enabling pg_cron/pg_net requires more privilege than a normal migration
-- run has, so this file is a copy/paste — run it once in the Supabase
-- dashboard's SQL Editor (Database > Extensions will show pg_cron and
-- pg_net as enabled afterwards; Database > Cron Jobs will show the job).

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'send-email-sequences-daily',
  '0 21 * * *', -- 9pm UTC = 7am Brisbane (AEST, no DST)
  $$
  select net.http_post(
    url := 'https://vptbswxntuycbgqnduab.supabase.co/functions/v1/send-sequence-emails',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
