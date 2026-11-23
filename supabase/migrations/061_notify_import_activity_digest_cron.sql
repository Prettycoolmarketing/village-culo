-- Schedules notify-import-activity-digest every 30 minutes, same pattern as
-- 030/045. Deployed --no-verify-jwt, so this call needs no Authorization
-- header/service-role key.
--
-- pg_cron/pg_net are already enabled (030 turned them on) — this file is
-- still a copy/paste to run once in the Supabase dashboard's SQL Editor,
-- same reason as 030/045: enabling cron.schedule requires more privilege
-- than a normal migration run has.
--
-- Supersedes notify-first-import (deleted — see
-- src/services/importedContent.ts and this function's own header for the
-- race-condition duplicate-email bug this replaces: 10 emails for one
-- founder's first import instead of one).

select cron.schedule(
  'notify-import-activity-digest',
  '*/30 * * * *', -- every 30 minutes
  $$
  select net.http_post(
    url := 'https://vptbswxntuycbgqnduab.supabase.co/functions/v1/notify-import-activity-digest',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
