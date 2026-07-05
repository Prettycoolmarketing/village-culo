-- CULO Village — Media Upload Foundation
-- Extends the media_uploads table (already created in migration 001, already
-- backed by real Supabase Storage buckets) into the reusable tracking layer
-- every upload — profile photo, cover image, business logo, story hero, MP4,
-- audio, document — goes through from now on.
--
-- This is deliberately NOT the same table as the curated `media` entity
-- (services/media.ts / DashboardMediaPage). That one was explicitly deferred
-- in migration 003 because it has no single-owner column (relatedFounderIds/
-- relatedBusinessIds are many-to-many arrays) — a real data-model question,
-- out of scope here. media_uploads already has a clean single owner
-- (user_id), so it doesn't have that problem and can be extended safely.
--
-- No new storage buckets required — media/videos/audio/documents already
-- exist per migration 001's manual setup steps. If you never completed that
-- setup, do it now (Supabase Dashboard → Storage → New bucket, one per name
-- above, then re-run migration 001's storage.objects policies).

ALTER TABLE media_uploads ADD COLUMN IF NOT EXISTS business_id TEXT;
ALTER TABLE media_uploads ADD COLUMN IF NOT EXISTS usage_type TEXT;
ALTER TABLE media_uploads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
-- `data JSONB` brings this table in line with every other entity table's sync
-- convention (see migration 002) — the app's generic pullVisibleRows/writeEntity
-- helpers read/write the full object through this column; the real columns
-- above stay as denormalized copies for indexing and RLS only.
ALTER TABLE media_uploads ADD COLUMN IF NOT EXISTS data JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS media_uploads_business_id_idx ON media_uploads (business_id);
CREATE INDEX IF NOT EXISTS media_uploads_founder_id_idx  ON media_uploads (founder_id);

DROP TRIGGER IF EXISTS media_uploads_updated_at ON media_uploads;
CREATE TRIGGER media_uploads_updated_at BEFORE UPDATE ON media_uploads
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- CAPO needs to see/manage every founder's uploads (requirement: "CAPO can
-- view/manage all media"); the existing owner-only policies from migration
-- 001 stay exactly as they are — RLS policies within the same command are
-- OR'd together, so this only adds admin access, it can't narrow anyone
-- else's existing access.
DROP POLICY IF EXISTS "media_uploads_admin_read_all" ON media_uploads;
CREATE POLICY "media_uploads_admin_read_all" ON media_uploads
  FOR SELECT USING (is_village_admin());

DROP POLICY IF EXISTS "media_uploads_admin_delete_all" ON media_uploads;
CREATE POLICY "media_uploads_admin_delete_all" ON media_uploads
  FOR DELETE USING (is_village_admin());

DROP POLICY IF EXISTS "media_uploads_owner_update" ON media_uploads;
CREATE POLICY "media_uploads_owner_update" ON media_uploads
  FOR UPDATE USING (auth.uid() = user_id OR is_village_admin())
  WITH CHECK (auth.uid() = user_id OR is_village_admin());
