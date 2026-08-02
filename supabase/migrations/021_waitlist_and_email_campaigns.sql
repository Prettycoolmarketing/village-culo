-- CULO Village — Waitlist capture + a minimal email campaign system.
--
-- canva_waitlist: anonymous visitors join a waitlist (e.g. "CULO Creatives
-- in Canva — coming soon") from public pages. Inserts happen through the
-- submit-waitlist Edge Function using the service role (same reason
-- submit-founder-claim exists — direct anon inserts get rejected at
-- Supabase's API gateway in production), so no public INSERT policy is
-- needed here; only staff can read.
--
-- email_subscribers / email_campaigns / email_campaign_sends: a genuinely
-- minimal send-and-track-opens system, not a full ESP. A campaign is sent
-- once, to every subscriber, via the send-campaign Edge Function (Resend) —
-- each send gets a unique tracking pixel URL hit by the track-open Edge
-- Function to record opens.

CREATE TABLE IF NOT EXISTS canva_waitlist (
  id          TEXT        PRIMARY KEY,
  email       TEXT        NOT NULL,
  data        JSONB       NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS canva_waitlist_email_idx ON canva_waitlist (email);

ALTER TABLE canva_waitlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "canva_waitlist_admin_read" ON canva_waitlist;
CREATE POLICY "canva_waitlist_admin_read" ON canva_waitlist
  FOR SELECT USING (is_village_admin());

DROP POLICY IF EXISTS "canva_waitlist_admin_delete" ON canva_waitlist;
CREATE POLICY "canva_waitlist_admin_delete" ON canva_waitlist
  FOR DELETE USING (is_village_admin());


CREATE TABLE IF NOT EXISTS email_subscribers (
  id          TEXT        PRIMARY KEY,
  email       TEXT        NOT NULL UNIQUE,
  data        JSONB       NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS email_subscribers_email_idx ON email_subscribers (email);

ALTER TABLE email_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "email_subscribers_admin_all" ON email_subscribers;
CREATE POLICY "email_subscribers_admin_all" ON email_subscribers
  FOR ALL USING (is_village_admin()) WITH CHECK (is_village_admin());


CREATE TABLE IF NOT EXISTS email_campaigns (
  id          TEXT        PRIMARY KEY,
  status      TEXT        NOT NULL DEFAULT 'draft',
  data        JSONB       NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "email_campaigns_admin_all" ON email_campaigns;
CREATE POLICY "email_campaigns_admin_all" ON email_campaigns
  FOR ALL USING (is_village_admin()) WITH CHECK (is_village_admin());


CREATE TABLE IF NOT EXISTS email_campaign_sends (
  id            TEXT        PRIMARY KEY,
  campaign_id   TEXT        NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
  email         TEXT        NOT NULL,
  sent_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  opened_at     TIMESTAMPTZ,
  open_count    INTEGER     NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS email_campaign_sends_campaign_idx ON email_campaign_sends (campaign_id);

ALTER TABLE email_campaign_sends ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "email_campaign_sends_admin_read" ON email_campaign_sends;
CREATE POLICY "email_campaign_sends_admin_read" ON email_campaign_sends
  FOR SELECT USING (is_village_admin());
