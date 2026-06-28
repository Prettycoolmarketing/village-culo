-- CULO Village — Initial Schema
-- Run this in Supabase SQL Editor or via Supabase CLI: supabase db push
-- All collections use JSONB (full TypeScript objects) with indexed metadata columns for RLS + filtering.

-- ─── Stories ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS stories (
  id          TEXT        PRIMARY KEY,
  user_id     UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  founder_id  TEXT,
  status      TEXT        NOT NULL DEFAULT 'draft',
  featured    BOOLEAN     NOT NULL DEFAULT false,
  data        JSONB       NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS stories_user_id_idx    ON stories (user_id);
CREATE INDEX IF NOT EXISTS stories_founder_id_idx ON stories (founder_id);
CREATE INDEX IF NOT EXISTS stories_status_idx     ON stories (status);
CREATE INDEX IF NOT EXISTS stories_featured_idx   ON stories (featured) WHERE featured = true;

ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

-- Public can read published + featured stories
CREATE POLICY "stories_public_read" ON stories
  FOR SELECT USING (status IN ('published', 'featured'));

-- Authenticated users can read their own stories (any status)
CREATE POLICY "stories_auth_read_own" ON stories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "stories_auth_insert" ON stories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "stories_auth_update" ON stories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "stories_auth_delete" ON stories
  FOR DELETE USING (auth.uid() = user_id);

-- ─── Founders ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS founders (
  id          TEXT        PRIMARY KEY,
  user_id     UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  status      TEXT        NOT NULL DEFAULT 'draft',
  featured    BOOLEAN     NOT NULL DEFAULT false,
  data        JSONB       NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS founders_user_id_idx ON founders (user_id);
CREATE INDEX IF NOT EXISTS founders_status_idx  ON founders (status);

ALTER TABLE founders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "founders_public_read" ON founders
  FOR SELECT USING (status IN ('published', 'featured'));

CREATE POLICY "founders_auth_read_own" ON founders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "founders_auth_insert" ON founders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "founders_auth_update" ON founders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "founders_auth_delete" ON founders
  FOR DELETE USING (auth.uid() = user_id);

-- ─── Businesses ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS businesses (
  id          TEXT        PRIMARY KEY,
  user_id     UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  founder_id  TEXT,
  status      TEXT        NOT NULL DEFAULT 'draft',
  featured    BOOLEAN     NOT NULL DEFAULT false,
  data        JSONB       NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS businesses_user_id_idx    ON businesses (user_id);
CREATE INDEX IF NOT EXISTS businesses_founder_id_idx ON businesses (founder_id);
CREATE INDEX IF NOT EXISTS businesses_status_idx     ON businesses (status);

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "businesses_public_read" ON businesses
  FOR SELECT USING (status IN ('published', 'featured'));

CREATE POLICY "businesses_auth_read_own" ON businesses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "businesses_auth_insert" ON businesses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "businesses_auth_update" ON businesses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "businesses_auth_delete" ON businesses
  FOR DELETE USING (auth.uid() = user_id);

-- ─── Library Items ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS library_items (
  id          TEXT        PRIMARY KEY,
  user_id     UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  founder_id  TEXT,
  status      TEXT        NOT NULL DEFAULT 'available',
  featured    BOOLEAN     NOT NULL DEFAULT false,
  data        JSONB       NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS library_items_user_id_idx    ON library_items (user_id);
CREATE INDEX IF NOT EXISTS library_items_founder_id_idx ON library_items (founder_id);

ALTER TABLE library_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "library_public_read" ON library_items
  FOR SELECT USING (status != 'archived');

CREATE POLICY "library_auth_read_own" ON library_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "library_auth_insert" ON library_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "library_auth_update" ON library_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "library_auth_delete" ON library_items
  FOR DELETE USING (auth.uid() = user_id);

-- ─── Services ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS services (
  id          TEXT        PRIMARY KEY,
  user_id     UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  founder_id  TEXT,
  business_id TEXT,
  data        JSONB       NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS services_user_id_idx    ON services (user_id);
CREATE INDEX IF NOT EXISTS services_founder_id_idx ON services (founder_id);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "services_public_read" ON services
  FOR SELECT USING (true);

CREATE POLICY "services_auth_insert" ON services
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "services_auth_update" ON services
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "services_auth_delete" ON services
  FOR DELETE USING (auth.uid() = user_id);

-- ─── Media Uploads ────────────────────────────────────────────────────────────
-- Tracks files uploaded to Supabase Storage. Referenced by story/founder/business records.

CREATE TABLE IF NOT EXISTS media_uploads (
  id           TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  founder_id   TEXT,
  storage_path TEXT        NOT NULL,
  public_url   TEXT        NOT NULL,
  bucket       TEXT        NOT NULL DEFAULT 'media',
  media_type   TEXT        NOT NULL,  -- 'image' | 'video' | 'audio' | 'document'
  file_name    TEXT        NOT NULL,
  file_size    INTEGER,
  mime_type    TEXT,
  alt_text     TEXT,
  caption      TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS media_uploads_user_id_idx ON media_uploads (user_id);

ALTER TABLE media_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "media_uploads_auth_read_own" ON media_uploads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "media_uploads_auth_insert" ON media_uploads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "media_uploads_auth_delete" ON media_uploads
  FOR DELETE USING (auth.uid() = user_id);

-- ─── updated_at trigger ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER stories_updated_at
  BEFORE UPDATE ON stories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER founders_updated_at
  BEFORE UPDATE ON founders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER businesses_updated_at
  BEFORE UPDATE ON businesses
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Storage Buckets ──────────────────────────────────────────────────────────
-- Buckets cannot be created via SQL — they require the Supabase Storage API.
-- STEP 1: Go to Supabase Dashboard → Storage → New bucket for each:
--   bucket name: media      public: true
--   bucket name: videos     public: true
--   bucket name: audio      public: true
--   bucket name: documents  public: false
--
-- STEP 2: After creating ALL four buckets, run the RLS policies below in SQL Editor.
-- Files are stored as {user_id}/{filename} so foldername[1] matches auth.uid().

CREATE POLICY "media public read"   ON storage.objects FOR SELECT USING (bucket_id = 'media');
CREATE POLICY "media auth write"    ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'media' AND auth.uid() IS NOT NULL);
CREATE POLICY "media auth delete"   ON storage.objects FOR DELETE USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "videos public read"  ON storage.objects FOR SELECT USING (bucket_id = 'videos');
CREATE POLICY "videos auth write"   ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'videos' AND auth.uid() IS NOT NULL);
CREATE POLICY "videos auth delete"  ON storage.objects FOR DELETE USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "audio public read"   ON storage.objects FOR SELECT USING (bucket_id = 'audio');
CREATE POLICY "audio auth write"    ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'audio' AND auth.uid() IS NOT NULL);
CREATE POLICY "audio auth delete"   ON storage.objects FOR DELETE USING (bucket_id = 'audio' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "docs auth read"      ON storage.objects FOR SELECT USING (bucket_id = 'documents' AND auth.uid() IS NOT NULL);
CREATE POLICY "docs auth write"     ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.uid() IS NOT NULL);
CREATE POLICY "docs auth delete"    ON storage.objects FOR DELETE USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
