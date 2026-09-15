-- Founder claim tokens — deliberately NOT stored on founders.data. That
-- column is publicly readable for any published/featured founder
-- (founders_public_read), so a secret placed there would be visible to
-- anyone who queried that founder's row directly with the anon key —
-- defeating the entire point of a per-founder claim secret. This table
-- has no public read policy at all; only admins can read it, and the
-- actual claim verification (real visitor typing a ?key= from an
-- outreach link) happens server-side via the verify-claim-token Edge
-- Function using the service role, which never echoes the real token
-- back — it only ever returns true/false.
CREATE TABLE IF NOT EXISTS founder_claim_tokens (
  founder_id TEXT PRIMARY KEY REFERENCES founders(id) ON DELETE CASCADE,
  token      TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE founder_claim_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "founder_claim_tokens_admin_read" ON founder_claim_tokens
  FOR SELECT USING (is_village_admin());

CREATE POLICY "founder_claim_tokens_admin_write" ON founder_claim_tokens
  FOR INSERT WITH CHECK (is_village_admin());

CREATE POLICY "founder_claim_tokens_admin_update" ON founder_claim_tokens
  FOR UPDATE USING (is_village_admin()) WITH CHECK (is_village_admin());
