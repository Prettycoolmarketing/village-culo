-- CULO Village — Partnerships Program
--
-- A Partner is a CULO-negotiated affiliate deal: either sourced from a
-- business on the platform requesting partner status (self-serve — starts
-- 'pending' until PCM staff actually sign up for the real affiliate program
-- and approve it), or added directly by CAPO staff for a brand that isn't a
-- Village business at all. Founders browse active partners and write about
-- them from Opportunities; Village's own affiliate link is what actually
-- earns commission, split with the founder per
-- founder_revenue_share_percent (a % of whatever commission is earned, not
-- a % of sale price — the underlying program's rate is set by the brand and
-- isn't something this system controls).

CREATE TABLE IF NOT EXISTS partners (
  id                             TEXT        PRIMARY KEY,
  user_id                        UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  business_id                    TEXT        REFERENCES businesses(id) ON DELETE SET NULL,
  status                         TEXT        NOT NULL DEFAULT 'pending', -- pending | active | inactive | declined
  source                         TEXT        NOT NULL DEFAULT 'capo-added', -- business-request | capo-added
  founder_revenue_share_percent  NUMERIC     NOT NULL DEFAULT 50,
  sponsored                      BOOLEAN     NOT NULL DEFAULT false,
  data                           JSONB       NOT NULL,
  created_at                     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS partners_status_idx ON partners (status);
CREATE INDEX IF NOT EXISTS partners_business_id_idx ON partners (business_id);

ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "partners_public_read" ON partners
  FOR SELECT USING (status = 'active');
CREATE POLICY "partners_admin_read" ON partners
  FOR SELECT USING (is_village_admin());
CREATE POLICY "partners_owner_read" ON partners
  FOR SELECT USING (business_id IS NOT NULL AND owns_business(business_id));
-- A business owner can only ever create their own request, and only in the
-- 'pending' state — approving (status -> active) is admin-only via the
-- separate update policy below, so a founder can never self-approve.
CREATE POLICY "partners_owner_request" ON partners
  FOR INSERT WITH CHECK (
    is_village_admin() OR (business_id IS NOT NULL AND owns_business(business_id) AND status = 'pending')
  );
CREATE POLICY "partners_admin_write" ON partners
  FOR UPDATE USING (is_village_admin()) WITH CHECK (is_village_admin());
CREATE POLICY "partners_admin_delete" ON partners
  FOR DELETE USING (is_village_admin());

CREATE TRIGGER partners_updated_at BEFORE UPDATE ON partners
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── partner_flags ───────────────────────────────────────────────────────────
-- Auto-detected, possibly-negative mentions of a Partner in a founder's
-- published story. Keyword-based (same technique as recommendation
-- detection), so false positives are expected — this never blocks
-- publishing, it only queues the story for a PCM staff member to look at.

CREATE TABLE IF NOT EXISTS partner_flags (
  id          TEXT        PRIMARY KEY,
  user_id     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  partner_id  TEXT        NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  story_id    TEXT        REFERENCES stories(id) ON DELETE CASCADE,
  founder_id  TEXT        REFERENCES founders(id) ON DELETE SET NULL,
  status      TEXT        NOT NULL DEFAULT 'pending', -- pending | reviewed | dismissed
  data        JSONB       NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS partner_flags_status_idx ON partner_flags (status);

ALTER TABLE partner_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "partner_flags_admin_all" ON partner_flags
  FOR SELECT USING (is_village_admin());
CREATE POLICY "partner_flags_admin_write" ON partner_flags
  FOR UPDATE USING (is_village_admin()) WITH CHECK (is_village_admin());
CREATE POLICY "partner_flags_admin_delete" ON partner_flags
  FOR DELETE USING (is_village_admin());
-- Created automatically client-side during a founder's own publish flow —
-- only for their own story, never on someone else's behalf.
CREATE POLICY "partner_flags_founder_insert" ON partner_flags
  FOR INSERT WITH CHECK (founder_id IS NULL OR owns_founder(founder_id) OR is_village_admin());

CREATE TRIGGER partner_flags_updated_at BEFORE UPDATE ON partner_flags
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
