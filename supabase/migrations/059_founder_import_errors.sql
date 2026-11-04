-- ─── founder_import_errors ───────────────────────────────────────────────────
-- Every self-serve import path (YouTube/podcast/website connect, Instagram
-- and Snapchat archive upload, mention-article import) only ever surfaced a
-- failure as an inline React error message — nothing was ever persisted
-- anywhere. Confirmed real (2026-11-04): a YouTube API key misconfiguration
-- broke the single most common import source for an unknown stretch of time,
-- and there was no way to know how many founders hit it or when, since the
-- failure happens client-side before any row would otherwise be written.
-- This table is the fix: every catch block in the founder-facing import UI
-- also writes one row here now, so staff have real visibility into import
-- failures going forward instead of flying blind.

CREATE TABLE IF NOT EXISTS founder_import_errors (
  id          TEXT        PRIMARY KEY,
  founder_id  TEXT        NOT NULL REFERENCES founders(id) ON DELETE CASCADE,
  source_type TEXT        NOT NULL, -- 'youtube' | 'podcast-rss' | 'website-rss' | 'instagram' | 'snapchat' | 'mention-article' | 'episode'
  message     TEXT        NOT NULL,
  input_value TEXT,                 -- the URL/value the founder pasted, if any — helps reproduce
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS founder_import_errors_founder_id_idx  ON founder_import_errors (founder_id);
CREATE INDEX IF NOT EXISTS founder_import_errors_created_at_idx ON founder_import_errors (created_at DESC);

ALTER TABLE founder_import_errors ENABLE ROW LEVEL SECURITY;

-- A founder can log an error against their own profile (same owns_founder()
-- check every other founder-write table in this file uses), or CAPO staff
-- can log on behalf of anyone (e.g. bulk import tooling, later).
CREATE POLICY "import_errors_owner_insert" ON founder_import_errors
  FOR INSERT WITH CHECK (owns_founder(founder_id) OR is_village_admin());
CREATE POLICY "import_errors_admin_read" ON founder_import_errors
  FOR SELECT USING (is_village_admin());
