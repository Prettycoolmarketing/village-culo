-- Schedules send-nudges to run once a day, same pattern as
-- 030_email_sequences_cron.sql. Deployed --no-verify-jwt, so this call
-- needs no Authorization header/service-role key.
--
-- pg_cron/pg_net are already enabled (030 turned them on) — this file is
-- still a copy/paste to run once in the Supabase dashboard's SQL Editor,
-- same reason as 030: enabling cron.schedule requires more privilege than
-- a normal migration run has.
--
-- Supersedes the earlier notify-stuck-onboarding-daily job (now
-- unscheduled) — send-nudges covers that same "ready to confirm" check
-- plus three more drop-off conditions in one run. See send-nudges'
-- function header for exactly what each one checks and when it fires.

select cron.schedule(
  'send-nudges-daily',
  '30 21 * * *', -- 9:30pm UTC = 7:30am Brisbane, just after send-sequence-emails' 9pm run
  $$
  select net.http_post(
    url := 'https://vptbswxntuycbgqnduab.supabase.co/functions/v1/send-nudges',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
