-- Click tracking for email campaigns — a real, deliberate action a
-- recipient took, unlike the open pixel (which Apple Mail Privacy
-- Protection and similar now pre-fetch automatically on ~every email,
-- making "opened" read as near-100% and meaningless as a real engagement
-- signal). Every link in a sent campaign gets rewritten to route through
-- the track-click Edge Function, which logs the click then redirects to
-- the real URL.

CREATE TABLE IF NOT EXISTS email_campaign_clicks (
  id            TEXT        PRIMARY KEY,
  campaign_id   TEXT        NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
  send_id       TEXT        NOT NULL REFERENCES email_campaign_sends(id) ON DELETE CASCADE,
  url           TEXT        NOT NULL,
  clicked_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS email_campaign_clicks_campaign_idx ON email_campaign_clicks (campaign_id);
CREATE INDEX IF NOT EXISTS email_campaign_clicks_send_idx ON email_campaign_clicks (send_id);

ALTER TABLE email_campaign_clicks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "email_campaign_clicks_admin_read" ON email_campaign_clicks;
CREATE POLICY "email_campaign_clicks_admin_read" ON email_campaign_clicks
  FOR SELECT USING (is_village_admin());
