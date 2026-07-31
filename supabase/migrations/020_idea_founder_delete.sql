-- Migration 006 gave founders SELECT/INSERT/UPDATE on ideas they own, but no
-- DELETE policy — only the admin_delete policy (003) could ever remove an
-- idea row. A founder clicking "Delete this idea" (Dashboard > Ideas, or the
-- public Idea page's owner-only control) silently deleted zero rows under
-- RLS, with no error surfaced, so the idea just reappeared.

DROP POLICY IF EXISTS "ideas_founder_delete" ON ideas;
CREATE POLICY "ideas_founder_delete" ON ideas
  FOR DELETE USING (owns_founder(founder_id));
