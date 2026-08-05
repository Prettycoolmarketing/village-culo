-- Series — groups a founder's own Stories into an ordered, binge-able run
-- (Van Life, Sydney Life...). The ordering/episode-number itself lives on
-- each Story's own `data` JSONB (seriesId/episodeNumber), same pattern as
-- every other Story relationship — this table is just the series' own
-- identity (title, cover, description), not a join table.

CREATE TABLE IF NOT EXISTS series (
  id          TEXT        PRIMARY KEY,
  user_id     UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  founder_id  TEXT,
  status      TEXT        NOT NULL DEFAULT 'draft',
  slug        TEXT,
  data        JSONB       NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS series_user_id_idx    ON series (user_id);
CREATE INDEX IF NOT EXISTS series_founder_id_idx ON series (founder_id);
CREATE UNIQUE INDEX IF NOT EXISTS series_slug_idx ON series (slug) WHERE slug IS NOT NULL AND slug != '';

ALTER TABLE series ENABLE ROW LEVEL SECURITY;

CREATE POLICY "series_public_read" ON series
  FOR SELECT USING (status = 'published');

CREATE POLICY "series_auth_read_own" ON series
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "series_auth_insert" ON series
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "series_auth_update" ON series
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "series_auth_delete" ON series
  FOR DELETE USING (auth.uid() = user_id);
