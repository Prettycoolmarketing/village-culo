-- Schedules notify-stuck-onboarding to run once a day, same pattern as
-- 030_email_sequences_cron.sql. Deployed --no-verify-jwt, so this call
-- needs no Authorization header/service-role key.
--
-- pg_cron/pg_net are already enabled (030 turned them on) — this file is
-- still a copy/paste to run once in the Supabase dashboard's SQL Editor,
-- same reason as 030: enabling cron.schedule requires more privilege than
-- a normal migration run has.

select cron.schedule(
  'notify-stuck-onboarding-daily',
  '30 21 * * *', -- 9:30pm UTC = 7:30am Brisbane, just after send-sequence-emails' 9pm run
  $$
  select net.http_post(
    url := 'https://vptbswxntuycbgqnduab.supabase.co/functions/v1/notify-stuck-onboarding',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
