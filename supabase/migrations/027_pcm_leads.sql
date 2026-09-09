-- Pretty Cool Marketing — lead capture from the /marketing funnel.
--
-- Anonymous visitors on culovillage.com/marketing fill in a short form
-- (name, email, phone, website) before they're shown pricing. Inserts go
-- through the submit-pcm-lead Edge Function using the service role — same
-- reason canva_waitlist works that way (direct anon inserts get rejected at
-- Supabase's API gateway in production) — so there's no public INSERT
-- policy here; only Village admins can read or delete.

CREATE TABLE IF NOT EXISTS pcm_leads (
  id          TEXT        PRIMARY KEY,
  email       TEXT        NOT NULL,
  data        JSONB       NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pcm_leads_email_idx ON pcm_leads (email);

ALTER TABLE pcm_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pcm_leads_admin_read" ON pcm_leads;
CREATE POLICY "pcm_leads_admin_read" ON pcm_leads
  FOR SELECT USING (is_village_admin());

DROP POLICY IF EXISTS "pcm_leads_admin_delete" ON pcm_leads;
CREATE POLICY "pcm_leads_admin_delete" ON pcm_leads
  FOR DELETE USING (is_village_admin());
