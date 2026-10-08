-- Lead Sources (Founder Management -> Lead Sources) was pure, ephemeral
-- per-search state — every commenter pulled from an Instagram URL lived
-- only in that page's local component state, gone the moment you searched
-- a new URL or navigated away. Staff need to actually keep the ones worth
-- following up on. Admin-only (same is_village_admin() pattern as
-- pcm_clients/account_feedback), not founder-scoped.

CREATE TABLE IF NOT EXISTS sourced_leads (
  id          TEXT        PRIMARY KEY,
  -- Instagram handle, not an id Instagram exposes to us — the natural,
  -- stable de-dupe key for "have we already saved this person."
  handle      TEXT        NOT NULL,
  data        JSONB       NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS sourced_leads_handle_idx ON sourced_leads (handle);

ALTER TABLE sourced_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sourced_leads_admin_all" ON sourced_leads;
CREATE POLICY "sourced_leads_admin_all" ON sourced_leads
  FOR ALL USING (is_village_admin()) WITH CHECK (is_village_admin());
