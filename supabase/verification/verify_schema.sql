-- CULO Village — Schema verification script
-- Run this AFTER applying migrations 001, 002, 003 (in that order) against a
-- target database — either via `supabase db push` or by pasting each migration
-- file into the Supabase SQL Editor in order, then pasting this file in last.
--
-- This does not require the Supabase CLI — it's plain SQL you can run anywhere,
-- including the web SQL Editor. Every check returns one row; read the `status`
-- column. A clean run has zero rows with status != 'PASS'.
--
-- Usage:
--   1. Fresh database: run 001 → 002 → 003 → this file. Expect all PASS.
--   2. Existing database that already had 001 applied: run 002 → 003 → this file.
--      Expect all PASS (migrations 002/003 are idempotent — IF NOT EXISTS / OR
--      REPLACE throughout — so re-running 001 first is also safe if unsure).

WITH expected_tables(table_name) AS (
  VALUES
    ('profiles'), ('founders'), ('businesses'), ('stories'), ('library_items'),
    ('services'), ('media_uploads'), ('imported_content'),
    ('village_content_intelligence'), ('founder_claim_requests'),
    ('village_settings'), ('import_batches'), ('partner_programs'),
    ('publisher_partner_profiles'), ('business_partner_profiles'),
    ('recommendations'), ('opportunities'), ('trust_profiles'),
    ('founder_program_enrollments'), ('founder_affiliate_links'),
    ('tracking_records'), ('campaigns'), ('campaign_applications'),
    ('publisher_partnership_settings'), ('business_partnership_settings'),
    ('ideas'), ('events')
),
table_check AS (
  SELECT
    'TABLE' AS check_type,
    e.table_name AS name,
    CASE WHEN t.table_name IS NOT NULL THEN 'PASS' ELSE 'FAIL — table missing' END AS status
  FROM expected_tables e
  LEFT JOIN information_schema.tables t
    ON t.table_schema = 'public' AND t.table_name = e.table_name
),

expected_functions(function_name) AS (
  VALUES ('is_village_admin'), ('owns_founder'), ('owns_business'),
         ('set_updated_at'), ('handle_new_user'), ('link_own_founder')
),
function_check AS (
  SELECT
    'FUNCTION' AS check_type,
    e.function_name AS name,
    CASE WHEN p.proname IS NOT NULL THEN 'PASS' ELSE 'FAIL — function missing' END AS status
  FROM expected_functions e
  LEFT JOIN pg_proc p ON p.proname = e.function_name
),

expected_indexes(index_name) AS (
  VALUES
    ('founders_slug_unique_idx'), ('founders_profile_status_idx'),
    ('founders_status_claimable_idx'), ('founders_claimed_by_user_id_idx'),
    ('businesses_slug_unique_idx'), ('businesses_founder_id_status_idx'),
    ('stories_slug_unique_idx'), ('stories_founder_id_status_idx'),
    ('stories_business_id_status_idx'),
    ('library_items_slug_unique_idx'),
    ('imported_content_founder_id_status_idx'),
    ('vci_content_type_content_id_idx'),
    ('founder_claim_requests_founder_id_idx'), ('founder_claim_requests_status_idx'),
    ('partner_programs_slug_unique_idx'), ('partner_programs_business_id_status_idx'),
    ('publisher_partner_profiles_founder_id_idx'),
    ('business_partner_profiles_business_id_idx'),
    ('recommendations_founder_id_status_idx'),
    ('opportunities_target_founder_id_idx'),
    ('trust_profiles_entity_idx'),
    ('ideas_slug_unique_idx'), ('events_slug_unique_idx')
),
index_check AS (
  SELECT
    'INDEX' AS check_type,
    e.index_name AS name,
    CASE WHEN i.indexname IS NOT NULL THEN 'PASS' ELSE 'FAIL — index missing' END AS status
  FROM expected_indexes e
  LEFT JOIN pg_indexes i ON i.indexname = e.index_name AND i.schemaname = 'public'
),

-- Every table in expected_tables (except media_uploads, which predates this
-- naming convention but is still RLS-enabled per 001) must have RLS enabled.
rls_check AS (
  SELECT
    'RLS_ENABLED' AS check_type,
    e.table_name AS name,
    CASE WHEN c.relrowsecurity THEN 'PASS' ELSE 'FAIL — RLS not enabled' END AS status
  FROM expected_tables e
  JOIN pg_class c ON c.relname = e.table_name
  JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
),

-- Spot-check the policies that matter most for the RLS test plan
-- (rls_test_plan.md) — a missing policy here means a role boundary likely
-- doesn't behave as documented.
expected_policies(table_name, policy_name) AS (
  VALUES
    ('profiles', 'profiles_read_own'),
    ('founders', 'founders_public_read'),
    ('founders', 'founders_auth_read_own'),
    ('stories', 'stories_public_read'),
    ('businesses', 'businesses_public_read'),
    ('services', 'services_public_read'),
    ('imported_content', 'imported_content_public_read'),
    ('imported_content', 'imported_content_owner_read'),
    ('imported_content', 'imported_content_owner_write'),
    ('village_content_intelligence', 'vci_public_read'),
    ('village_content_intelligence', 'vci_owner_write'),
    ('founder_claim_requests', 'claims_public_insert'),
    ('founder_claim_requests', 'claims_admin_read'),
    ('founder_claim_requests', 'claims_admin_update'),
    ('village_settings', 'village_settings_public_read'),
    ('village_settings', 'village_settings_admin_write'),
    ('import_batches', 'import_batches_admin_all_read'),
    ('trust_profiles', 'trust_profiles_public_read'),
    ('tracking_records', 'tracking_records_public_insert'),
    ('tracking_records', 'tracking_records_owner_read'),
    ('ideas', 'ideas_public_read'),
    ('ideas', 'ideas_admin_write'),
    ('events', 'events_public_read'),
    ('events', 'events_owner_write'),
    ('founders', 'founders_admin_read'),
    ('businesses', 'businesses_admin_read'),
    ('stories', 'stories_admin_read'),
    ('library_items', 'library_admin_read'),
    ('services', 'services_admin_read')
),
policy_check AS (
  SELECT
    'POLICY' AS check_type,
    e.table_name || '.' || e.policy_name AS name,
    CASE WHEN p.policyname IS NOT NULL THEN 'PASS' ELSE 'FAIL — policy missing' END AS status
  FROM expected_policies e
  LEFT JOIN pg_policies p
    ON p.schemaname = 'public' AND p.tablename = e.table_name AND p.policyname = e.policy_name
),

-- Unique constraints that public URLs depend on (slug collisions would be a
-- routing bug, not just a data-quality one).
expected_unique(index_name) AS (
  VALUES ('founders_slug_unique_idx'), ('businesses_slug_unique_idx'),
         ('stories_slug_unique_idx'), ('library_items_slug_unique_idx'),
         ('ideas_slug_unique_idx'), ('events_slug_unique_idx')
),
unique_check AS (
  SELECT
    'UNIQUE_CONSTRAINT' AS check_type,
    e.index_name AS name,
    CASE WHEN i.indexdef LIKE '%UNIQUE%' THEN 'PASS' ELSE 'FAIL — not unique' END AS status
  FROM expected_unique e
  LEFT JOIN pg_indexes i ON i.indexname = e.index_name AND i.schemaname = 'public'
)

SELECT * FROM table_check
UNION ALL SELECT * FROM function_check
UNION ALL SELECT * FROM index_check
UNION ALL SELECT * FROM rls_check
UNION ALL SELECT * FROM policy_check
UNION ALL SELECT * FROM unique_check
ORDER BY check_type, name;

-- ─── Summary ────────────────────────────────────────────────────────────────
-- Run this second query to get a one-row pass/fail count instead of scrolling
-- the full list above.
--
-- WITH all_checks AS ( ...paste the same query above without ORDER BY... )
-- SELECT
--   count(*) FILTER (WHERE status = 'PASS') AS passed,
--   count(*) FILTER (WHERE status != 'PASS') AS failed,
--   count(*) AS total
-- FROM all_checks;
