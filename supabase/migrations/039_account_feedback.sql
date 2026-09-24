-- CULO Village — account-level feedback capture (cancel Creatives, delete profile).
--
-- Separate from creative_feedback (the one-time $19/mo lock-in survey,
-- migration 025) — this is a plain "why are you leaving" capture attached
-- to the Cancel Creatives and Delete Profile flows, tagged by section so
-- staff can read Culo Creatives cancellations separately from Culo Village
-- deletions instead of one mixed pile. Multiple rows per founder are fine
-- (they could cancel Creatives once, delete their whole profile later).
-- Inserts go through the submit-account-feedback Edge Function using the
-- service role, same reason creative_feedback/canva_waitlist do — direct
-- anon inserts get rejected at Supabase's API gateway in production.

CREATE TABLE IF NOT EXISTS account_feedback (
  id          TEXT        PRIMARY KEY,
  founder_id  TEXT        NOT NULL REFERENCES founders(id) ON DELETE CASCADE,
  data        JSONB       NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS account_feedback_founder_idx ON account_feedback (founder_id);

ALTER TABLE account_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "account_feedback_admin_read" ON account_feedback;
CREATE POLICY "account_feedback_admin_read" ON account_feedback
  FOR SELECT USING (is_village_admin());
