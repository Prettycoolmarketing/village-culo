-- CULO Village — Sprint 19B-Fix: Ideas & Events Supabase backing
-- Closes two of the three remaining "localStorage-only" entities flagged in the
-- Sprint 19B audit. Idempotent — safe to re-run.
--
-- Media is intentionally NOT included here — see the note at the bottom of this
-- file for why, and what a future migration needs to decide before adding it.

-- ─── ideas ────────────────────────────────────────────────────────────────────
-- Ideas have no single owning founder in the data model (relatedFounderIds is a
-- many-to-many array, quoteFounderId is optional/attribution-only) and the
-- founder-facing dashboard has no idea-editing UI today (updateIdea() in
-- services/ideas.ts has zero callers as of this sprint) — so this is admin-write,
-- public-read, matching how the content is actually managed in practice.

CREATE TABLE IF NOT EXISTS ideas (
  id          TEXT        PRIMARY KEY,
  slug        TEXT,
  status      TEXT        NOT NULL DEFAULT 'draft',
  featured    BOOLEAN     NOT NULL DEFAULT false,
  data        JSONB       NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS ideas_slug_unique_idx ON ideas (slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS ideas_status_idx   ON ideas (status);
CREATE INDEX IF NOT EXISTS ideas_featured_idx ON ideas (featured) WHERE featured = true;

ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ideas_public_read" ON ideas
  FOR SELECT USING (status IN ('published', 'featured'));
CREATE POLICY "ideas_admin_read" ON ideas
  FOR SELECT USING (is_village_admin());
CREATE POLICY "ideas_admin_write" ON ideas
  FOR INSERT WITH CHECK (is_village_admin());
CREATE POLICY "ideas_admin_update" ON ideas
  FOR UPDATE USING (is_village_admin()) WITH CHECK (is_village_admin());
CREATE POLICY "ideas_admin_delete" ON ideas
  FOR DELETE USING (is_village_admin());

CREATE TRIGGER ideas_updated_at BEFORE UPDATE ON ideas
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── events ───────────────────────────────────────────────────────────────────
-- Unlike ideas, Event has a clear optional founder_id/business_id — same
-- ownership shape as stories/businesses, so this follows that exact pattern.

CREATE TABLE IF NOT EXISTS events (
  id          TEXT        PRIMARY KEY,
  user_id     UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  slug        TEXT,
  founder_id  TEXT,
  business_id TEXT,
  status      TEXT        NOT NULL DEFAULT 'draft',
  featured    BOOLEAN     NOT NULL DEFAULT false,
  data        JSONB       NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS events_slug_unique_idx ON events (slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS events_founder_id_status_idx  ON events (founder_id, status);
CREATE INDEX IF NOT EXISTS events_business_id_idx        ON events (business_id);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events_public_read" ON events
  FOR SELECT USING (status IN ('published', 'featured'));
CREATE POLICY "events_owner_read" ON events
  FOR SELECT USING (auth.uid() = user_id OR owns_founder(founder_id) OR owns_business(business_id) OR is_village_admin());
CREATE POLICY "events_owner_write" ON events
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "events_owner_update" ON events
  FOR UPDATE USING (auth.uid() = user_id OR is_village_admin()) WITH CHECK (auth.uid() = user_id OR is_village_admin());
CREATE POLICY "events_owner_delete" ON events
  FOR DELETE USING (auth.uid() = user_id OR is_village_admin());

CREATE TRIGGER events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── media: deliberately deferred ────────────────────────────────────────────
-- Why this isn't migrated yet:
--
-- 1. No single-owner column. Media.relatedFounderIds/relatedBusinessIds/etc are
--    many-to-many arrays — a piece of media can legitimately belong to multiple
--    founders' content. Every other table's RLS in this schema assumes a single
--    owning founder_id/business_id/user_id; Media doesn't fit that shape without
--    a model decision (e.g. adding an `uploaded_by_user_id` column distinct from
--    the "related to" relationships, which is a data-model change, not just a
--    migration — out of scope for a fix sprint per the brief).
-- 2. DashboardMediaPage (approval workflow) is reachable from the regular founder
--    dashboard nav ("My Content" → Media), not gated to admins — so naively
--    making media admin-write-only would break an existing founder-facing flow,
--    and naively making it owner-write via a guessed column risks granting write
--    access incorrectly.
--
-- TODO (next migration, needs a product decision first): add `uploaded_by_user_id
-- UUID REFERENCES auth.users(id)` to Media, backfill it from existing data where
-- inferable, decide whether "related" founders/businesses get read access or only
-- the uploader gets write access, then add the table + RLS following the same
-- pattern as imported_content (owns_founder() equivalent, scoped to uploader).
