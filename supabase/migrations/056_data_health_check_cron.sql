-- Schedules data-health-check to run once a week, same pattern as
-- 045_send_nudges_cron.sql. Deployed --no-verify-jwt, so this call needs
-- no Authorization header/service-role key.
--
-- pg_cron/pg_net are already enabled (030 turned them on) — this file is
-- still a copy/paste to run once in the Supabase dashboard's SQL Editor,
-- same reason as 030 and 045: enabling cron.schedule requires more
-- privilege than a normal migration run has.
--
-- Written after a manual audit (2026-10-31) found several real but
-- silent problems that had been accumulating unnoticed: an orphaned
-- profiles.founder_id, dangling founderId references on real business
-- records, a published story with a completely empty body live on the
-- public site. This is the ongoing version of that audit, so the next
-- one of these gets caught automatically instead of waiting for someone
-- to go looking again.

select cron.schedule(
  'data-health-check-weekly',
  '0 22 * * 0', -- 10pm UTC Sunday = 8am Monday Brisbane
  $$
  select net.http_post(
    url := 'https://vptbswxntuycbgqnduab.supabase.co/functions/v1/data-health-check',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
