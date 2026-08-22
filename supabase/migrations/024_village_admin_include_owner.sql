-- is_village_admin() gated ~90 RLS policies (canva_waitlist, email_subscribers,
-- email_campaigns, curated founders/businesses, imports, claims, etc.) on
-- role IN ('admin', 'editor', 'moderator') — but 007_capo_roles.sql later added
-- 'owner' as a fifth, higher tier (see permissions.ts, where every one of
-- these areas already lists 'owner' as allowed). is_village_admin() was never
-- updated, so the owner account silently failed every one of these RLS reads
-- with zero rows and no error (e.g. new waitlist signups existing in the DB
-- but never appearing in the dashboard for the owner).

CREATE OR REPLACE FUNCTION is_village_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor', 'moderator', 'owner')
  );
$$;
