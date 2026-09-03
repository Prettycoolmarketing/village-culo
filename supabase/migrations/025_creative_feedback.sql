-- CULO Village — CULO Creatives feedback capture.
--
-- creative_feedback: one row per founder, submitted once (enforced at the
-- Edge Function level, not by a DB constraint, since a founder legitimately
-- has no creative_feedback row before they submit — a UNIQUE constraint on
-- founder_id still protects against a double-submit race). Submitting this
-- is what locks a "collaborator" cohort founder into the $19/mo CULO
-- Creatives rate — see Founder.creativeSubscription in src/types/index.ts.
-- Inserts happen through the submit-creative-feedback Edge Function using
-- the service role, same reason canva_waitlist/founder_claim_requests do —
-- direct anon inserts get rejected at Supabase's API gateway in production
-- even when RLS would allow them.

CREATE TABLE IF NOT EXISTS creative_feedback (
  id          TEXT        PRIMARY KEY,
  founder_id  TEXT        NOT NULL REFERENCES founders(id) ON DELETE CASCADE,
  data        JSONB       NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS creative_feedback_founder_idx ON creative_feedback (founder_id);

ALTER TABLE creative_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "creative_feedback_admin_read" ON creative_feedback;
CREATE POLICY "creative_feedback_admin_read" ON creative_feedback
  FOR SELECT USING (is_village_admin());
