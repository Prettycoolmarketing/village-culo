-- 055_deletion_safety_gates.sql added a BEFORE DELETE trigger on founders/
-- businesses/stories/imported_content/connected_sources that logs every
-- delete to deletion_audit_log, with a comment claiming it "runs as the
-- table owner ... so logging itself can never be blocked by RLS." That was
-- never actually true: log_deletion() was created LANGUAGE plpgsql with no
-- SECURITY DEFINER, so it runs as the calling (authenticated) role, not the
-- table owner — and deletion_audit_log has RLS enabled with only a SELECT
-- policy (admin-only read), no INSERT policy at all.
--
-- Net effect: every single DELETE on any of those five tables has been
-- failing for everyone except the Postgres superuser, because the trigger's
-- own audit-log INSERT gets rejected by RLS and the whole DELETE rolls back
-- with it. That Postgres RLS error happens to match the same
-- "row-level security policy" wording the client maps to "Your session may
-- have expired" (see friendlyWriteError in entityStore.ts) — which is why
-- this looked like a session/token bug (and why refresh-and-retry fixes
-- earlier tonight never touched it) when it was actually this.
--
-- Fix: make log_deletion() SECURITY DEFINER, as the original comment always
-- intended, so its own internal insert bypasses deletion_audit_log's RLS
-- regardless of who triggered the delete. The DELETE itself is still fully
-- gated by each table's own DELETE policies (can_delete_articles(),
-- can_delete_capo_data(), owns_founder(), etc.) — this only unblocks the
-- logging side-effect, not who's allowed to delete what.
CREATE OR REPLACE FUNCTION log_deletion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO deletion_audit_log (table_name, row_id, deleted_by, row_snapshot)
  VALUES (TG_TABLE_NAME, OLD.id, auth.uid(), to_jsonb(OLD));
  RETURN OLD;
END;
$$;
