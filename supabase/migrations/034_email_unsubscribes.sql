-- Newsletter unsubscribes — a real, working one-click unsubscribe.
--
-- Recipients come from three different source tables (email_subscribers,
-- canva_waitlist, founders' own signup emails), so unsubscribing needs its
-- own table keyed by email rather than a flag on any one of them — checked
-- by send-campaign against every list at send time, regardless of which
-- list an address originally came from.
--
-- Inserts go through the unsubscribe-email Edge Function using the service
-- role (same reason canva_waitlist/pcm_leads work that way — direct anon
-- inserts get rejected at Supabase's API gateway in production), so there's
-- no public INSERT policy here; only Village admins can read.

CREATE TABLE IF NOT EXISTS email_unsubscribes (
  email             TEXT        PRIMARY KEY,
  unsubscribed_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE email_unsubscribes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "email_unsubscribes_admin_read" ON email_unsubscribes;
CREATE POLICY "email_unsubscribes_admin_read" ON email_unsubscribes
  FOR SELECT USING (is_village_admin());
