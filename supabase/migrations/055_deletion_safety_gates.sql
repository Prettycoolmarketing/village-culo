-- Response to a production incident: a bulk delete of founders rows
-- silently cascaded to delete all their imported_content and
-- connected_sources too, because those FKs were ON DELETE CASCADE.
-- Postgres FK-cascade deletes run with the referencing constraint's own
-- privileges and are NOT subject to the child table's own RLS DELETE
-- policy — so the cascade happened regardless of role, with zero error
-- and zero trace. There was also no database-level admin check backing
-- any of these deletes (only a client-side button render via
-- canDeleteCapoData in permissions.ts) and no audit log anywhere.
--
-- This migration closes all three gaps:
--   1. founder_id FKs on imported_content/connected_sources become
--      ON DELETE RESTRICT — deleting a founder who still has content
--      now throws an error instead of silently wiping it.
--   2. A real DB-level admin check (mirroring canDeleteCapoData: admin
--      or owner only, NOT editor) backs DELETE on every CAPO-managed
--      table, so the UI gate isn't the only thing standing between a
--      stale build / bug / direct DB access and a mass delete.
--   3. Every delete on these tables is now logged to
--      deletion_audit_log with who/when/what, so a repeat is traceable
--      within minutes instead of being discovered by a user locking
--      themselves out.

-- ── 1. Stop founders deletes from silently cascading ───────────────────
ALTER TABLE imported_content
  DROP CONSTRAINT imported_content_founder_id_fkey,
  ADD CONSTRAINT imported_content_founder_id_fkey
    FOREIGN KEY (founder_id) REFERENCES founders(id) ON DELETE RESTRICT;

ALTER TABLE connected_sources
  DROP CONSTRAINT connected_sources_founder_id_fkey,
  ADD CONSTRAINT connected_sources_founder_id_fkey
    FOREIGN KEY (founder_id) REFERENCES founders(id) ON DELETE RESTRICT;

-- ── 2. Real DB-level admin-only delete check (admin/owner, not editor) ─
-- Deliberately narrower than is_village_admin() (which also allows
-- 'editor'/'moderator') — this matches canDeleteCapoData in
-- src/utils/permissions.ts exactly, so the database enforces the same
-- boundary the UI already intends, instead of relying on the UI alone.
CREATE OR REPLACE FUNCTION can_delete_capo_data()
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')
  );
$$;

-- Additive policies (Postgres OR's multiple permissive policies for the
-- same command together) — existing ownership-based DELETE policies on
-- these tables are untouched, this only ever widens who can delete to
-- also include admin/owner, matching what canDeleteCapoData already
-- intends to allow from the UI.
CREATE POLICY founders_admin_delete ON founders
  FOR DELETE USING (can_delete_capo_data());
CREATE POLICY businesses_admin_delete ON businesses
  FOR DELETE USING (can_delete_capo_data());
CREATE POLICY stories_admin_delete ON stories
  FOR DELETE USING (can_delete_capo_data());
CREATE POLICY imported_content_admin_delete ON imported_content
  FOR DELETE USING (can_delete_capo_data());
CREATE POLICY connected_sources_admin_delete ON connected_sources
  FOR DELETE USING (can_delete_capo_data());
CREATE POLICY services_admin_delete ON services
  FOR DELETE USING (can_delete_capo_data());
CREATE POLICY library_items_admin_delete ON library_items
  FOR DELETE USING (can_delete_capo_data());
CREATE POLICY series_admin_delete ON series
  FOR DELETE USING (can_delete_capo_data());

-- ── 3. Audit log — every delete on these tables, who/when/what ────────
CREATE TABLE IF NOT EXISTS deletion_audit_log (
  id            BIGSERIAL   PRIMARY KEY,
  table_name    TEXT        NOT NULL,
  row_id        TEXT        NOT NULL,
  deleted_by    UUID,
  deleted_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  row_snapshot  JSONB       NOT NULL
);
CREATE INDEX IF NOT EXISTS deletion_audit_log_table_name_idx ON deletion_audit_log (table_name, deleted_at);

-- Runs as the table owner (SECURITY DEFINER-equivalent via table owner
-- privileges on triggers) so logging itself can never be blocked by RLS
-- on deletion_audit_log.
CREATE OR REPLACE FUNCTION log_deletion()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO deletion_audit_log (table_name, row_id, deleted_by, row_snapshot)
  VALUES (TG_TABLE_NAME, OLD.id, auth.uid(), to_jsonb(OLD));
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS founders_log_deletion ON founders;
CREATE TRIGGER founders_log_deletion BEFORE DELETE ON founders
  FOR EACH ROW EXECUTE FUNCTION log_deletion();

DROP TRIGGER IF EXISTS businesses_log_deletion ON businesses;
CREATE TRIGGER businesses_log_deletion BEFORE DELETE ON businesses
  FOR EACH ROW EXECUTE FUNCTION log_deletion();

DROP TRIGGER IF EXISTS stories_log_deletion ON stories;
CREATE TRIGGER stories_log_deletion BEFORE DELETE ON stories
  FOR EACH ROW EXECUTE FUNCTION log_deletion();

DROP TRIGGER IF EXISTS imported_content_log_deletion ON imported_content;
CREATE TRIGGER imported_content_log_deletion BEFORE DELETE ON imported_content
  FOR EACH ROW EXECUTE FUNCTION log_deletion();

DROP TRIGGER IF EXISTS connected_sources_log_deletion ON connected_sources;
CREATE TRIGGER connected_sources_log_deletion BEFORE DELETE ON connected_sources
  FOR EACH ROW EXECUTE FUNCTION log_deletion();

DROP TRIGGER IF EXISTS services_log_deletion ON services;
CREATE TRIGGER services_log_deletion BEFORE DELETE ON services
  FOR EACH ROW EXECUTE FUNCTION log_deletion();

DROP TRIGGER IF EXISTS library_items_log_deletion ON library_items;
CREATE TRIGGER library_items_log_deletion BEFORE DELETE ON library_items
  FOR EACH ROW EXECUTE FUNCTION log_deletion();

DROP TRIGGER IF EXISTS series_log_deletion ON series;
CREATE TRIGGER series_log_deletion BEFORE DELETE ON series
  FOR EACH ROW EXECUTE FUNCTION log_deletion();

-- Only CAPO staff can ever read the audit log; no founder/public access.
ALTER TABLE deletion_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY deletion_audit_log_admin_read ON deletion_audit_log
  FOR SELECT USING (is_village_admin());
