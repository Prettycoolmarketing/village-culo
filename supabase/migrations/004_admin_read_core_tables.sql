-- CULO Village — Sprint 19B-Fix: admin read access on core content tables
-- Found while writing the RLS test plan (supabase/verification/rls_test_plan.md
-- §4.1): founders/businesses/stories/library_items/services only had
-- public-read (status-based) and owner-read (user_id-based) SELECT policies —
-- no admin policy at all. An admin could only see published content plus
-- whatever they personally owned, not other founders' drafts — which directly
-- contradicts the stated requirement "Admins can manage curated founders" (most
-- curated/imported founders are NOT owned by the admin's own user_id, and are
-- frequently in non-published states while being set up). Idempotent.

DROP POLICY IF EXISTS "founders_admin_read" ON founders;
CREATE POLICY "founders_admin_read" ON founders
  FOR SELECT USING (is_village_admin());

DROP POLICY IF EXISTS "businesses_admin_read" ON businesses;
CREATE POLICY "businesses_admin_read" ON businesses
  FOR SELECT USING (is_village_admin());

DROP POLICY IF EXISTS "stories_admin_read" ON stories;
CREATE POLICY "stories_admin_read" ON stories
  FOR SELECT USING (is_village_admin());

DROP POLICY IF EXISTS "library_admin_read" ON library_items;
CREATE POLICY "library_admin_read" ON library_items
  FOR SELECT USING (is_village_admin());

DROP POLICY IF EXISTS "services_admin_read" ON services;
CREATE POLICY "services_admin_read" ON services
  FOR SELECT USING (is_village_admin());
