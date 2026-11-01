-- Narrow carve-out from 055_deletion_safety_gates.sql's admin/owner-only
-- delete gate — scoped to exactly imported_content, nothing else. This is
-- the research/source article row Capo staff clean up when research
-- couldn't verify a real identity match (junk cleanup), not a real
-- founder/member's actual content or account. Founders, businesses,
-- stories, connected_sources, services, library_items and series all
-- stay on can_delete_capo_data() (admin/owner only) — this migration does
-- not touch them.

CREATE OR REPLACE FUNCTION can_delete_articles()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('editor', 'admin', 'owner')
  );
$$;

DROP POLICY IF EXISTS imported_content_admin_delete ON imported_content;
CREATE POLICY imported_content_capo_delete ON imported_content
  FOR DELETE USING (can_delete_articles());
