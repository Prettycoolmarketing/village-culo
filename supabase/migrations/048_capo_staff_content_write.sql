-- CULO Village — CAPO staff can now manage a founder's content directly
-- (Culo Members → "Manage content"). founders/stories/imported_content only
-- ever had owner-only (auth.uid() = user_id) write policies — is_village_
-- admin() already gates ~90 READ policies for CAPO roles (admin/editor/
-- moderator/owner) but no WRITE policy existed for these three tables, so a
-- staff member acting on another founder's record (not their own user_id)
-- was silently rejected by RLS no matter what the app showed — exactly why
-- Lydia's earlier fixes needed a direct SQL patch instead of the app's own
-- update path. This closes that gap for the specific tables the new
-- "Manage content" staff flow needs: editing a founder's profile fields,
-- editing/rewriting/publishing their stories, and changing/relinking their
-- imported content.

CREATE POLICY "founders_admin_write" ON founders
  FOR UPDATE USING (is_village_admin());

CREATE POLICY "stories_admin_write" ON stories
  FOR INSERT WITH CHECK (is_village_admin());
CREATE POLICY "stories_admin_update" ON stories
  FOR UPDATE USING (is_village_admin());

CREATE POLICY "imported_content_admin_write" ON imported_content
  FOR INSERT WITH CHECK (is_village_admin());
CREATE POLICY "imported_content_admin_update" ON imported_content
  FOR UPDATE USING (is_village_admin());
