-- The real `status` column on founders (not the JSONB data.status) is what
-- founders_public_read's RLS policy actually checks — an anonymous visitor
-- can't even see the row at all if this column says 'draft', regardless of
-- what data.status says. The app's own updateFounder()/writeEntity path
-- always keeps both in sync correctly, but anything that writes to this
-- table outside that path (a manual SQL fix, a dashboard edit) can silently
-- desync them — confirmed real: lydia@nomii.com.au had data.status
-- 'published' with 10 live articles, but the real status column still said
-- 'draft', so RLS blocked her public page from ever loading for anyone.
--
-- This trigger makes that drift structurally impossible going forward,
-- regardless of how a row gets written — the real column is derived from
-- data.status on every insert/update, not just when the app remembers to.

CREATE OR REPLACE FUNCTION sync_founder_status_column()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.data ? 'status' THEN
    NEW.status := NEW.data->>'status';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS founders_sync_status ON founders;
CREATE TRIGGER founders_sync_status
  BEFORE INSERT OR UPDATE ON founders
  FOR EACH ROW EXECUTE FUNCTION sync_founder_status_column();

-- One-time backfill, in case any other row besides lydia's (already fixed
-- directly) has the same drift sitting in it right now.
UPDATE founders SET status = data->>'status' WHERE data ? 'status' AND status IS DISTINCT FROM data->>'status';
