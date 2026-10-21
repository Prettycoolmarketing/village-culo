-- Same gap as migration 048, for the businesses table — Culo Members →
-- "Manage content" now links staff to a founder's own Businesses tab (to
-- set Target Audience for "Rewrite for My Audience"), but businesses only
-- ever had owner-only (auth.uid() = user_id) write policies, same as
-- founders/stories/imported_content were before 048. Without this, editing
-- another founder's business as staff is silently rejected by RLS.

CREATE POLICY "businesses_admin_write" ON businesses
  FOR INSERT WITH CHECK (is_village_admin());
CREATE POLICY "businesses_admin_update" ON businesses
  FOR UPDATE USING (is_village_admin());
