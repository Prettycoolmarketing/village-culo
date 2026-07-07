-- CULO Village — Connected Sources (content connectors)
--
-- One row per founder-configured connector (a YouTube channel, a podcast RSS
-- feed, a website/blog RSS feed) that can be scanned to pull the founder's
-- own already-public content into imported_content as review-ready drafts.
--
-- Deliberately holds no auth tokens/secrets — every source type in this first
-- phase (YouTube Data API via a public API key, RSS/Atom feeds) only ever
-- reads content the founder has already made public. If a future OAuth-based
-- connector (Canva, Google Drive) is added, its tokens belong in a separate
-- table with a very different trust model, not bolted onto this one.
--
-- Same shape/ownership pattern as imported_content (migration 002): real
-- columns for indexing/RLS, a `data JSONB` column for the full object so the
-- app's generic pullVisibleRows/writeEntity helpers work unchanged.

CREATE TABLE IF NOT EXISTS connected_sources (
  id          TEXT        PRIMARY KEY,
  user_id     UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  founder_id  TEXT        REFERENCES founders(id) ON DELETE CASCADE,
  business_id TEXT,
  source_type TEXT        NOT NULL,
  status      TEXT        NOT NULL DEFAULT 'idle',
  data        JSONB       NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS connected_sources_founder_id_idx ON connected_sources (founder_id);
CREATE INDEX IF NOT EXISTS connected_sources_business_id_idx ON connected_sources (business_id);

ALTER TABLE connected_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "connected_sources_owner_read" ON connected_sources
  FOR SELECT USING (owns_founder(founder_id) OR is_village_admin());
CREATE POLICY "connected_sources_owner_write" ON connected_sources
  FOR INSERT WITH CHECK (owns_founder(founder_id));
CREATE POLICY "connected_sources_owner_update" ON connected_sources
  FOR UPDATE USING (owns_founder(founder_id)) WITH CHECK (owns_founder(founder_id));
CREATE POLICY "connected_sources_owner_delete" ON connected_sources
  FOR DELETE USING (owns_founder(founder_id));

CREATE TRIGGER connected_sources_updated_at BEFORE UPDATE ON connected_sources
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Lets a re-scan skip URLs already imported by this source.
ALTER TABLE imported_content ADD COLUMN IF NOT EXISTS connected_source_id TEXT REFERENCES connected_sources(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS imported_content_connected_source_id_idx ON imported_content (connected_source_id);
