-- CULO Village — Village Graph Foundation (Sprint A)
-- The generic connection layer every future feature (Editorial, Related widgets,
-- Search, Authority) plugs into. Two tables:
--
--   village_sources — a lightweight, un-owned canonical reference point
--   (Pretty Cool Marketing, Techpresso, YouTube, Canva). Same tier as Topic/
--   Industry/Location: nobody owns it, nobody has permissions on it. CAPO-only
--   write, because Sources represent editorial recognition (see Sprint: Editorial
--   & Sources), not self-declared identity — that's what SocialLinks are for.
--
--   relationships — generic edges between Founder/Business/Story/Idea/Source.
--   Explicit rule carried over from planning: structural ownership (Business →
--   Founder via founders_id, Story → Founder via founder_id) stays exactly as
--   the existing foreign key on the owning table and never becomes a row here.
--   This table only holds what a foreign key can't express: mentions, editorial
--   recognition, cross-founder connections. Derived relationships (similar-topic,
--   similar-founder) are never stored as rows — they're computed on read from
--   village_content_intelligence, the same previewIdeaImpact()-style pattern
--   used by Idea matching. If it's in this table, it's a fact, not a guess.
--
-- The graph stores discoverability. Operational systems (Partnership Operating
-- System, CAPO) remain the source of truth for their own domains and are
-- referenced by the graph, not duplicated into it — e.g. a Founder "promotes" a
-- Business through the existing recommendations/enrollment tables, not through
-- a `relationships` row, because that relationship carries real commission/
-- disclosure data a generic edge shouldn't flatten.

-- ─── village_sources ────────────────────────────────────────────────────────────

-- `data JSONB` carries the full serialized VillageSource object — required by
-- the app's generic sync path (lib/entityStore.ts pullVisibleRows/writeEntity,
-- see migration 002's convention note); slug/name/kind/url are denormalized
-- copies used for indexing and RLS, not a second source of truth.
CREATE TABLE IF NOT EXISTS village_sources (
  id         TEXT        PRIMARY KEY,
  slug       TEXT,
  name       TEXT        NOT NULL,
  kind       TEXT        NOT NULL CHECK (kind IN ('publication', 'platform', 'community', 'person', 'brand')),
  url        TEXT,
  data       JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS village_sources_slug_unique_idx ON village_sources (slug) WHERE slug IS NOT NULL;

ALTER TABLE village_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "village_sources_public_read" ON village_sources
  FOR SELECT USING (true);
CREATE POLICY "village_sources_admin_write" ON village_sources
  FOR INSERT WITH CHECK (is_village_admin());
CREATE POLICY "village_sources_admin_update" ON village_sources
  FOR UPDATE USING (is_village_admin()) WITH CHECK (is_village_admin());
CREATE POLICY "village_sources_admin_delete" ON village_sources
  FOR DELETE USING (is_village_admin());

-- ─── owns_entity() ──────────────────────────────────────────────────────────────
-- Generic ownership dispatcher so `relationships` doesn't need a bespoke policy
-- per fromType. Reuses the existing owns_founder()/owns_business() helpers
-- (migration 002) and stories.founder_id/ideas.founder_id (migrations 002/006).
-- 'source' always returns false — a founder can never assert ownership of a
-- Source; only CAPO can create Source-pointing edges (enforced at the app layer
-- for the specific relationship types that require it, e.g. featured_in).

CREATE OR REPLACE FUNCTION owns_entity(etype TEXT, eid TEXT)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  IF etype = 'founder' THEN
    RETURN owns_founder(eid);
  ELSIF etype = 'business' THEN
    RETURN owns_business(eid);
  ELSIF etype = 'story' THEN
    RETURN EXISTS (SELECT 1 FROM stories WHERE id = eid AND owns_founder(founder_id));
  ELSIF etype = 'idea' THEN
    RETURN EXISTS (SELECT 1 FROM ideas WHERE id = eid AND owns_founder(founder_id));
  ELSE
    RETURN false;
  END IF;
END;
$$;

-- ─── relationships ──────────────────────────────────────────────────────────────

-- Same convention: `data JSONB` holds the full serialized Relationship object
-- for the generic sync path; every other column is a denormalized, queryable
-- copy used for indexing and RLS ownership checks.
CREATE TABLE IF NOT EXISTS relationships (
  id                TEXT        PRIMARY KEY,
  from_type         TEXT        NOT NULL CHECK (from_type IN ('founder', 'business', 'story', 'idea', 'source')),
  from_id           TEXT        NOT NULL,
  to_type           TEXT        NOT NULL CHECK (to_type IN ('founder', 'business', 'story', 'idea', 'source')),
  to_id             TEXT        NOT NULL,
  relationship_type TEXT        NOT NULL CHECK (relationship_type IN
                       ('owned_by', 'written_by', 'mentions', 'featured_in', 'imported_from', 'created_with', 'works_with')),
  why               TEXT,
  confidence        NUMERIC     NOT NULL DEFAULT 1.0 CHECK (confidence >= 0 AND confidence <= 1),
  origin            TEXT        NOT NULL CHECK (origin IN ('founder', 'capo', 'import', 'village_intelligence', 'migration')),
  metadata          JSONB       NOT NULL DEFAULT '{}'::jsonb,
  data              JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Prevents accidental duplicate edges on re-run/re-sync (e.g. re-publishing a
-- story shouldn't create a second identical "mentions" edge to the same business).
CREATE UNIQUE INDEX IF NOT EXISTS relationships_unique_edge_idx
  ON relationships (from_type, from_id, to_type, to_id, relationship_type);

CREATE INDEX IF NOT EXISTS relationships_from_idx ON relationships (from_type, from_id);
CREATE INDEX IF NOT EXISTS relationships_to_idx   ON relationships (to_type, to_id);
CREATE INDEX IF NOT EXISTS relationships_type_idx ON relationships (relationship_type);

ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;

-- Public read: relationships power "Related Founders/Businesses/Stories" and
-- "Featured In" on public profile pages — same rationale as
-- village_content_intelligence being public-read (migration 002).
CREATE POLICY "relationships_public_read" ON relationships
  FOR SELECT USING (true);

CREATE POLICY "relationships_owner_write" ON relationships
  FOR INSERT WITH CHECK (owns_entity(from_type, from_id) OR is_village_admin());
CREATE POLICY "relationships_owner_update" ON relationships
  FOR UPDATE USING (owns_entity(from_type, from_id) OR is_village_admin())
  WITH CHECK (owns_entity(from_type, from_id) OR is_village_admin());
CREATE POLICY "relationships_owner_delete" ON relationships
  FOR DELETE USING (owns_entity(from_type, from_id) OR is_village_admin());
