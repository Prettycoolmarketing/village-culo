-- CULO Village — Editorial (Type 3 content, per the Village Content Principles)
--
-- Deliberately the one new entity introduced for "making the graph useful" —
-- everything else in this phase reuses existing tables. Editorial is
-- authored by Pretty Cool Marketing (or another authorised editorial team),
-- not by a founder, so it needs its own ownership model rather than being
-- bolted onto `stories` (founder-owned end to end via owns_founder()) — the
-- whole point of Type 3 is that authorship is never ambiguous.
--
-- Same public-read / admin-write shape as village_sources (migration 008),
-- since both are platform-authored, not founder-authored. Unlike
-- village_sources, read is gated to status = 'published' — a draft
-- spotlight shouldn't be publicly visible before an editor publishes it.

CREATE TABLE IF NOT EXISTS editorial_features (
  id           TEXT        PRIMARY KEY,
  slug         TEXT        NOT NULL,
  template     TEXT        NOT NULL,
  status       TEXT        NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  data         JSONB       NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS editorial_features_slug_unique_idx ON editorial_features (slug);
CREATE INDEX IF NOT EXISTS editorial_features_status_idx ON editorial_features (status);

ALTER TABLE editorial_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "editorial_features_public_read" ON editorial_features
  FOR SELECT USING (status = 'published');
CREATE POLICY "editorial_features_admin_read" ON editorial_features
  FOR SELECT USING (is_village_admin());
CREATE POLICY "editorial_features_admin_write" ON editorial_features
  FOR INSERT WITH CHECK (is_village_admin());
CREATE POLICY "editorial_features_admin_update" ON editorial_features
  FOR UPDATE USING (is_village_admin()) WITH CHECK (is_village_admin());
CREATE POLICY "editorial_features_admin_delete" ON editorial_features
  FOR DELETE USING (is_village_admin());

CREATE TRIGGER editorial_features_updated_at BEFORE UPDATE ON editorial_features
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
