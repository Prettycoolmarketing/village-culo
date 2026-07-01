-- CULO Village — Sprint 19B: Supabase Data Foundation
-- Makes Supabase the real persistence layer for every entity the dashboard and Village HQ
-- manage today (most of which were previously localStorage-only — see Sprint 19A/B audits).
-- Safe to re-run: every statement is idempotent (IF NOT EXISTS / OR REPLACE / DO blocks).
--
-- Conventions carried over from 001_initial_schema.sql:
--   - id TEXT primary key (matches the app's crypto.randomUUID()/slug-based ids)
--   - real, queryable columns for anything filtered/joined on; `data JSONB` for the rest
--   - RLS enabled on every table, no table is left open by default
--
-- Ordering note: table/column changes that a later section's RLS helper functions
-- depend on MUST run before those functions are created — e.g. owns_founder()
-- references founders.claimed_by_user_id, so that column has to exist first.
-- This file was previously ordered functions-then-columns and failed on a fresh
-- database; it's now columns-then-functions throughout.

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. Harden existing tables (founders / businesses / stories / library_items / services)
--    Adds the queryable columns the original schema was missing, backfills them from
--    the existing JSONB blob, then enforces them going forward. Runs BEFORE the RLS
--    helper functions below, since owns_founder() needs founders.claimed_by_user_id
--    to already exist.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── founders ───────────────────────────────────────────────────────────────────
ALTER TABLE founders ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE founders ADD COLUMN IF NOT EXISTS profile_status TEXT;
ALTER TABLE founders ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'public';
ALTER TABLE founders ADD COLUMN IF NOT EXISTS is_claimable BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE founders ADD COLUMN IF NOT EXISTS claimed_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE founders ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

UPDATE founders SET slug = data->>'slug' WHERE slug IS NULL;
UPDATE founders SET profile_status = data->>'profileStatus' WHERE profile_status IS NULL;
UPDATE founders SET is_claimable = COALESCE((data->>'isClaimable')::boolean, false) WHERE NOT is_claimable;
UPDATE founders SET claimed_by_user_id = NULLIF(data->>'claimedByUserId', '')::uuid
  WHERE claimed_by_user_id IS NULL AND data->>'claimedByUserId' IS NOT NULL AND data->>'claimedByUserId' != '';

CREATE UNIQUE INDEX IF NOT EXISTS founders_slug_unique_idx ON founders (slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS founders_profile_status_idx       ON founders (profile_status);
CREATE INDEX IF NOT EXISTS founders_status_claimable_idx     ON founders (profile_status, is_claimable);
CREATE INDEX IF NOT EXISTS founders_published_at_idx         ON founders (published_at);
CREATE INDEX IF NOT EXISTS founders_claimed_by_user_id_idx   ON founders (claimed_by_user_id);

-- ─── businesses ─────────────────────────────────────────────────────────────────
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'public';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

UPDATE businesses SET slug = data->>'slug' WHERE slug IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS businesses_slug_unique_idx     ON businesses (slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS businesses_founder_id_status_idx      ON businesses (founder_id, status);

-- ─── stories ────────────────────────────────────────────────────────────────────
ALTER TABLE stories ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS business_id TEXT;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'public';
ALTER TABLE stories ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

UPDATE stories SET slug = data->>'slug' WHERE slug IS NULL;
UPDATE stories SET business_id = data->>'businessId' WHERE business_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS stories_slug_unique_idx    ON stories (slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS stories_founder_id_status_idx     ON stories (founder_id, status);
CREATE INDEX IF NOT EXISTS stories_business_id_status_idx    ON stories (business_id, status);
CREATE INDEX IF NOT EXISTS stories_published_at_idx          ON stories (published_at);

-- ─── library_items ──────────────────────────────────────────────────────────────
ALTER TABLE library_items ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE library_items ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'public';
ALTER TABLE library_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

UPDATE library_items SET slug = data->>'slug' WHERE slug IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS library_items_slug_unique_idx ON library_items (slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS library_items_status_idx             ON library_items (status);

DROP TRIGGER IF EXISTS library_items_updated_at ON library_items;
CREATE TRIGGER library_items_updated_at BEFORE UPDATE ON library_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── services (service offerings) ────────────────────────────────────────────────
-- Previously had no status column at all and a blanket `USING (true)` public-read
-- policy — every offering was public regardless of draft state. Fixed below.
ALTER TABLE services ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published';
ALTER TABLE services ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

UPDATE services SET slug = data->>'slug' WHERE slug IS NULL;

CREATE INDEX IF NOT EXISTS services_status_idx ON services (status);

DROP POLICY IF EXISTS "services_public_read" ON services;
CREATE POLICY "services_public_read" ON services
  FOR SELECT USING (status IN ('published', 'featured'));

DROP TRIGGER IF EXISTS services_updated_at ON services;
CREATE TRIGGER services_updated_at BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. Shared RLS helper functions
--    Centralised so ownership/admin checks aren't re-implemented in every policy
--    (13+ partnership tables alone would otherwise each repeat this logic).
--    Runs AFTER section 1 — owns_founder() below depends on founders.user_id
--    (from migration 001) and founders.claimed_by_user_id (added just above).
-- ═══════════════════════════════════════════════════════════════════════════════

-- profiles: the server-side source of truth for role/founder linkage (Sprint 19A
-- flagged that relying on client-editable auth.user_metadata for role was a gap —
-- this table, with no client UPDATE policy, closes it).
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT,
  role        TEXT        NOT NULL DEFAULT 'founder' CHECK (role IN ('founder', 'admin', 'editor', 'moderator')),
  founder_id  TEXT,
  village_role TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_read_own" ON profiles;
CREATE POLICY "profiles_read_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Intentionally no client INSERT/UPDATE policy: rows are created by the
-- handle_new_user trigger below, and role changes are an admin/service-role
-- operation (Supabase dashboard or a future admin tool) until Sprint 19C+.
-- This is what actually prevents self-promotion to admin, not just UI hiding.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'founder')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE OR REPLACE FUNCTION is_village_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor', 'moderator')
  );
$$;

CREATE OR REPLACE FUNCTION owns_founder(fid TEXT)
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM founders
    WHERE id = fid AND (user_id = auth.uid() OR claimed_by_user_id = auth.uid())
  );
$$;

CREATE OR REPLACE FUNCTION owns_business(bid TEXT)
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM businesses WHERE id = bid AND user_id = auth.uid());
$$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. New tables — entities that were localStorage-only before this migration
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── imported_content ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS imported_content (
  id          TEXT        PRIMARY KEY,
  user_id     UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  founder_id  TEXT        REFERENCES founders(id) ON DELETE CASCADE,
  business_id TEXT,
  status      TEXT        NOT NULL DEFAULT 'draft',
  visibility  TEXT        NOT NULL DEFAULT 'private',
  source_platform TEXT,
  published_at TIMESTAMPTZ,
  data        JSONB       NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS imported_content_founder_id_status_idx ON imported_content (founder_id, status);
CREATE INDEX IF NOT EXISTS imported_content_business_id_idx       ON imported_content (business_id);
CREATE INDEX IF NOT EXISTS imported_content_status_idx            ON imported_content (status);

ALTER TABLE imported_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "imported_content_public_read" ON imported_content
  FOR SELECT USING (visibility = 'public' AND status IN ('published', 'featured'));
CREATE POLICY "imported_content_owner_read" ON imported_content
  FOR SELECT USING (owns_founder(founder_id) OR is_village_admin());
CREATE POLICY "imported_content_owner_write" ON imported_content
  FOR INSERT WITH CHECK (owns_founder(founder_id));
CREATE POLICY "imported_content_owner_update" ON imported_content
  FOR UPDATE USING (owns_founder(founder_id)) WITH CHECK (owns_founder(founder_id));
CREATE POLICY "imported_content_owner_delete" ON imported_content
  FOR DELETE USING (owns_founder(founder_id));

CREATE TRIGGER imported_content_updated_at BEFORE UPDATE ON imported_content
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── village_content_intelligence ────────────────────────────────────────────────
-- Public read: this powers "related content" blocks on public Founder/Business/Story
-- pages (see Sprint 19 audit). Write is allowed for the founder who owns the analysed
-- content (it runs from their own Import Content page, not just Village HQ) or an admin.
CREATE TABLE IF NOT EXISTS village_content_intelligence (
  id           TEXT        PRIMARY KEY,
  content_type TEXT        NOT NULL,
  content_id   TEXT        NOT NULL,
  founder_id   TEXT,
  business_id  TEXT,
  data         JSONB       NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS vci_content_type_content_id_idx ON village_content_intelligence (content_type, content_id);
CREATE INDEX IF NOT EXISTS vci_founder_id_idx ON village_content_intelligence (founder_id);
CREATE INDEX IF NOT EXISTS vci_business_id_idx ON village_content_intelligence (business_id);

ALTER TABLE village_content_intelligence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vci_public_read" ON village_content_intelligence FOR SELECT USING (true);
CREATE POLICY "vci_owner_write" ON village_content_intelligence
  FOR INSERT WITH CHECK (owns_founder(founder_id) OR is_village_admin());
CREATE POLICY "vci_owner_update" ON village_content_intelligence
  FOR UPDATE USING (owns_founder(founder_id) OR is_village_admin())
  WITH CHECK (owns_founder(founder_id) OR is_village_admin());
CREATE POLICY "vci_admin_delete" ON village_content_intelligence
  FOR DELETE USING (is_village_admin());

CREATE TRIGGER vci_updated_at BEFORE UPDATE ON village_content_intelligence
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── founder_claim_requests ───────────────────────────────────────────────────────
-- Claims are filed anonymously (no login required), so INSERT is open to anyone.
-- Only admins can see/triage the queue or change status — a founder must never be
-- able to read other founders' claim requests or self-approve.
CREATE TABLE IF NOT EXISTS founder_claim_requests (
  id               TEXT        PRIMARY KEY,
  founder_id       TEXT        NOT NULL REFERENCES founders(id) ON DELETE CASCADE,
  requester_name   TEXT        NOT NULL,
  requester_email  TEXT        NOT NULL,
  requester_user_id UUID       REFERENCES auth.users(id) ON DELETE SET NULL,
  status           TEXT        NOT NULL DEFAULT 'pending',
  reviewed_by      TEXT,
  data             JSONB       NOT NULL,
  requested_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at      TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS founder_claim_requests_founder_id_idx ON founder_claim_requests (founder_id);
CREATE INDEX IF NOT EXISTS founder_claim_requests_status_idx     ON founder_claim_requests (status);

ALTER TABLE founder_claim_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "claims_public_insert" ON founder_claim_requests
  FOR INSERT WITH CHECK (true);
CREATE POLICY "claims_admin_read" ON founder_claim_requests
  FOR SELECT USING (is_village_admin());
CREATE POLICY "claims_admin_update" ON founder_claim_requests
  FOR UPDATE USING (is_village_admin()) WITH CHECK (is_village_admin());

-- ─── village_settings (singleton) ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS village_settings (
  id         TEXT        PRIMARY KEY DEFAULT 'default',
  data       JSONB       NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE village_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "village_settings_public_read" ON village_settings FOR SELECT USING (true);
CREATE POLICY "village_settings_admin_write" ON village_settings
  FOR INSERT WITH CHECK (is_village_admin());
CREATE POLICY "village_settings_admin_update" ON village_settings
  FOR UPDATE USING (is_village_admin()) WITH CHECK (is_village_admin());

CREATE TRIGGER village_settings_updated_at BEFORE UPDATE ON village_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── import_batches ───────────────────────────────────────────────────────────────
-- Village HQ tooling only — not founder-facing, not public.
CREATE TABLE IF NOT EXISTS import_batches (
  id            TEXT        PRIMARY KEY,
  created_by    UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  batch_name    TEXT,
  founder_count INTEGER     NOT NULL DEFAULT 0,
  data          JSONB       NOT NULL,
  imported_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS import_batches_imported_at_idx ON import_batches (imported_at);

ALTER TABLE import_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "import_batches_admin_all_read" ON import_batches
  FOR SELECT USING (is_village_admin());
CREATE POLICY "import_batches_admin_insert" ON import_batches
  FOR INSERT WITH CHECK (is_village_admin());
CREATE POLICY "import_batches_admin_delete" ON import_batches
  FOR DELETE USING (is_village_admin());

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. Partnership Operating System
--    13 entities, all sharing the same two ownership shapes (founder-owned /
--    business-owned), so policies stay short via owns_founder()/owns_business().
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── partner_programs (business-owned, can be public) ────────────────────────────
CREATE TABLE IF NOT EXISTS partner_programs (
  id           TEXT        PRIMARY KEY,
  slug         TEXT,
  business_id  TEXT        NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  program_type TEXT,
  status       TEXT        NOT NULL DEFAULT 'draft',
  is_public    BOOLEAN     NOT NULL DEFAULT false,
  featured     BOOLEAN     NOT NULL DEFAULT false,
  data         JSONB       NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS partner_programs_slug_unique_idx ON partner_programs (slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS partner_programs_business_id_status_idx ON partner_programs (business_id, status);

ALTER TABLE partner_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "partner_programs_public_read" ON partner_programs
  FOR SELECT USING (is_public AND status = 'active');
CREATE POLICY "partner_programs_owner_read" ON partner_programs
  FOR SELECT USING (owns_business(business_id) OR is_village_admin());
CREATE POLICY "partner_programs_owner_write" ON partner_programs
  FOR INSERT WITH CHECK (owns_business(business_id));
CREATE POLICY "partner_programs_owner_update" ON partner_programs
  FOR UPDATE USING (owns_business(business_id)) WITH CHECK (owns_business(business_id));
CREATE POLICY "partner_programs_owner_delete" ON partner_programs
  FOR DELETE USING (owns_business(business_id));
CREATE TRIGGER partner_programs_updated_at BEFORE UPDATE ON partner_programs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── publisher_partner_profiles (founder-owned) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS publisher_partner_profiles (
  id          TEXT        PRIMARY KEY,
  founder_id  TEXT        NOT NULL REFERENCES founders(id) ON DELETE CASCADE,
  enabled     BOOLEAN     NOT NULL DEFAULT false,
  data        JSONB       NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS publisher_partner_profiles_founder_id_idx ON publisher_partner_profiles (founder_id);

ALTER TABLE publisher_partner_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ppp_owner_read" ON publisher_partner_profiles
  FOR SELECT USING (owns_founder(founder_id) OR is_village_admin());
CREATE POLICY "ppp_owner_write" ON publisher_partner_profiles
  FOR INSERT WITH CHECK (owns_founder(founder_id));
CREATE POLICY "ppp_owner_update" ON publisher_partner_profiles
  FOR UPDATE USING (owns_founder(founder_id)) WITH CHECK (owns_founder(founder_id));
CREATE TRIGGER ppp_updated_at BEFORE UPDATE ON publisher_partner_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── business_partner_profiles (business-owned) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS business_partner_profiles (
  id          TEXT        PRIMARY KEY,
  business_id TEXT        NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  enabled     BOOLEAN     NOT NULL DEFAULT false,
  data        JSONB       NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS business_partner_profiles_business_id_idx ON business_partner_profiles (business_id);

ALTER TABLE business_partner_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bpp_owner_read" ON business_partner_profiles
  FOR SELECT USING (owns_business(business_id) OR is_village_admin());
CREATE POLICY "bpp_owner_write" ON business_partner_profiles
  FOR INSERT WITH CHECK (owns_business(business_id));
CREATE POLICY "bpp_owner_update" ON business_partner_profiles
  FOR UPDATE USING (owns_business(business_id)) WITH CHECK (owns_business(business_id));
CREATE TRIGGER bpp_updated_at BEFORE UPDATE ON business_partner_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── recommendations (founder-owned; business can read recs that name them) ─────
CREATE TABLE IF NOT EXISTS recommendations (
  id          TEXT        PRIMARY KEY,
  slug        TEXT,
  founder_id  TEXT        NOT NULL REFERENCES founders(id) ON DELETE CASCADE,
  business_id TEXT,
  story_id    TEXT,
  status      TEXT        NOT NULL DEFAULT 'detected',
  visibility  TEXT        NOT NULL DEFAULT 'private',
  featured    BOOLEAN     NOT NULL DEFAULT false,
  data        JSONB       NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS recommendations_founder_id_status_idx ON recommendations (founder_id, status);
CREATE INDEX IF NOT EXISTS recommendations_business_id_idx       ON recommendations (business_id);

ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recommendations_public_read" ON recommendations
  FOR SELECT USING (visibility = 'public' AND status = 'approved');
CREATE POLICY "recommendations_founder_read" ON recommendations
  FOR SELECT USING (owns_founder(founder_id) OR owns_business(business_id) OR is_village_admin());
CREATE POLICY "recommendations_founder_write" ON recommendations
  FOR INSERT WITH CHECK (owns_founder(founder_id));
CREATE POLICY "recommendations_founder_update" ON recommendations
  FOR UPDATE USING (owns_founder(founder_id)) WITH CHECK (owns_founder(founder_id));
CREATE TRIGGER recommendations_updated_at BEFORE UPDATE ON recommendations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── opportunities (business/admin-sourced; targeted founder can read) ──────────
CREATE TABLE IF NOT EXISTS opportunities (
  id                TEXT        PRIMARY KEY,
  slug              TEXT,
  business_id       TEXT,
  target_founder_id TEXT,
  status            TEXT        NOT NULL DEFAULT 'suggested',
  visibility        TEXT        NOT NULL DEFAULT 'targeted',
  data              JSONB       NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS opportunities_target_founder_id_idx ON opportunities (target_founder_id, status);
CREATE INDEX IF NOT EXISTS opportunities_business_id_idx       ON opportunities (business_id);

ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "opportunities_public_read" ON opportunities
  FOR SELECT USING (visibility = 'public');
CREATE POLICY "opportunities_targeted_read" ON opportunities
  FOR SELECT USING (owns_founder(target_founder_id) OR owns_business(business_id) OR is_village_admin());
CREATE POLICY "opportunities_owner_write" ON opportunities
  FOR INSERT WITH CHECK (owns_business(business_id) OR is_village_admin());
CREATE POLICY "opportunities_owner_update" ON opportunities
  FOR UPDATE USING (owns_business(business_id) OR owns_founder(target_founder_id) OR is_village_admin())
  WITH CHECK (owns_business(business_id) OR owns_founder(target_founder_id) OR is_village_admin());
CREATE TRIGGER opportunities_updated_at BEFORE UPDATE ON opportunities
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── trust_profiles (public read — shown on public founder pages) ───────────────
CREATE TABLE IF NOT EXISTS trust_profiles (
  id          TEXT        PRIMARY KEY,
  entity_id   TEXT        NOT NULL,
  entity_type TEXT        NOT NULL,
  data        JSONB       NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS trust_profiles_entity_idx ON trust_profiles (entity_id, entity_type);

ALTER TABLE trust_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trust_profiles_public_read" ON trust_profiles FOR SELECT USING (true);
CREATE POLICY "trust_profiles_owner_write" ON trust_profiles
  FOR INSERT WITH CHECK (owns_founder(entity_id) OR owns_business(entity_id) OR is_village_admin());
CREATE POLICY "trust_profiles_owner_update" ON trust_profiles
  FOR UPDATE USING (owns_founder(entity_id) OR owns_business(entity_id) OR is_village_admin())
  WITH CHECK (owns_founder(entity_id) OR owns_business(entity_id) OR is_village_admin());
CREATE TRIGGER trust_profiles_updated_at BEFORE UPDATE ON trust_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── founder_program_enrollments (founder + program-owning business) ────────────
CREATE TABLE IF NOT EXISTS founder_program_enrollments (
  id          TEXT        PRIMARY KEY,
  founder_id  TEXT        NOT NULL REFERENCES founders(id) ON DELETE CASCADE,
  program_id  TEXT        NOT NULL REFERENCES partner_programs(id) ON DELETE CASCADE,
  business_id TEXT        NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  status      TEXT        NOT NULL DEFAULT 'active',
  data        JSONB       NOT NULL,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS fpe_founder_id_business_id_idx ON founder_program_enrollments (founder_id, business_id);
CREATE INDEX IF NOT EXISTS fpe_program_id_idx ON founder_program_enrollments (program_id);

ALTER TABLE founder_program_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fpe_owner_read" ON founder_program_enrollments
  FOR SELECT USING (owns_founder(founder_id) OR owns_business(business_id) OR is_village_admin());
CREATE POLICY "fpe_owner_write" ON founder_program_enrollments
  FOR INSERT WITH CHECK (owns_founder(founder_id));
CREATE POLICY "fpe_owner_update" ON founder_program_enrollments
  FOR UPDATE USING (owns_founder(founder_id)) WITH CHECK (owns_founder(founder_id));
CREATE TRIGGER fpe_updated_at BEFORE UPDATE ON founder_program_enrollments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── founder_affiliate_links (founder-owned, business can read its own) ─────────
CREATE TABLE IF NOT EXISTS founder_affiliate_links (
  id          TEXT        PRIMARY KEY,
  founder_id  TEXT        NOT NULL REFERENCES founders(id) ON DELETE CASCADE,
  business_id TEXT        NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  data        JSONB       NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS fal_founder_id_business_id_idx ON founder_affiliate_links (founder_id, business_id);

ALTER TABLE founder_affiliate_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fal_owner_read" ON founder_affiliate_links
  FOR SELECT USING (owns_founder(founder_id) OR owns_business(business_id) OR is_village_admin());
CREATE POLICY "fal_owner_write" ON founder_affiliate_links
  FOR INSERT WITH CHECK (owns_founder(founder_id));
CREATE POLICY "fal_owner_update" ON founder_affiliate_links
  FOR UPDATE USING (owns_founder(founder_id)) WITH CHECK (owns_founder(founder_id));
CREATE POLICY "fal_owner_delete" ON founder_affiliate_links
  FOR DELETE USING (owns_founder(founder_id));
CREATE TRIGGER fal_updated_at BEFORE UPDATE ON founder_affiliate_links
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── tracking_records (public can INSERT — link clicks are anonymous visitors) ──
CREATE TABLE IF NOT EXISTS tracking_records (
  id               TEXT        PRIMARY KEY,
  founder_id       TEXT        NOT NULL,
  business_id      TEXT        NOT NULL,
  recommendation_id TEXT,
  link_type        TEXT        NOT NULL,
  source_page      TEXT,
  redirect_url     TEXT        NOT NULL,
  clicked_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tracking_records_founder_id_idx  ON tracking_records (founder_id);
CREATE INDEX IF NOT EXISTS tracking_records_business_id_idx ON tracking_records (business_id);
CREATE INDEX IF NOT EXISTS tracking_records_clicked_at_idx  ON tracking_records (clicked_at);

ALTER TABLE tracking_records ENABLE ROW LEVEL SECURITY;
-- Anyone (including anonymous visitors) can record a click — this is what powers
-- click tracking on public recommendation links.
CREATE POLICY "tracking_records_public_insert" ON tracking_records
  FOR INSERT WITH CHECK (true);
-- Only the founder/business being tracked (or an admin) can read the click data —
-- competitors should not be able to scrape another founder's tracking numbers.
CREATE POLICY "tracking_records_owner_read" ON tracking_records
  FOR SELECT USING (owns_founder(founder_id) OR owns_business(business_id) OR is_village_admin());

-- ─── campaigns / campaign_applications / partnership settings ──────────────────
-- Same partnership.ts service file as the tables above; migrated together so the
-- file isn't left half on Supabase, half on localStorage.
CREATE TABLE IF NOT EXISTS campaigns (
  id          TEXT        PRIMARY KEY,
  slug        TEXT,
  business_id TEXT        NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  status      TEXT        NOT NULL DEFAULT 'draft',
  is_public   BOOLEAN     NOT NULL DEFAULT false,
  featured    BOOLEAN     NOT NULL DEFAULT false,
  data        JSONB       NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS campaigns_slug_unique_idx ON campaigns (slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS campaigns_business_id_status_idx ON campaigns (business_id, status);

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "campaigns_public_read" ON campaigns FOR SELECT USING (is_public AND status IN ('published', 'applications-open', 'in-progress'));
CREATE POLICY "campaigns_owner_read" ON campaigns FOR SELECT USING (owns_business(business_id) OR is_village_admin());
CREATE POLICY "campaigns_owner_write" ON campaigns FOR INSERT WITH CHECK (owns_business(business_id));
CREATE POLICY "campaigns_owner_update" ON campaigns FOR UPDATE USING (owns_business(business_id)) WITH CHECK (owns_business(business_id));
CREATE TRIGGER campaigns_updated_at BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS campaign_applications (
  id          TEXT        PRIMARY KEY,
  campaign_id TEXT        NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  founder_id  TEXT        NOT NULL REFERENCES founders(id) ON DELETE CASCADE,
  status      TEXT        NOT NULL DEFAULT 'applied',
  data        JSONB       NOT NULL,
  applied_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS campaign_applications_campaign_id_idx ON campaign_applications (campaign_id);
CREATE INDEX IF NOT EXISTS campaign_applications_founder_id_idx  ON campaign_applications (founder_id);

ALTER TABLE campaign_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "campaign_apps_owner_read" ON campaign_applications
  FOR SELECT USING (
    owns_founder(founder_id) OR is_village_admin()
    OR EXISTS (SELECT 1 FROM campaigns c WHERE c.id = campaign_id AND owns_business(c.business_id))
  );
CREATE POLICY "campaign_apps_founder_write" ON campaign_applications
  FOR INSERT WITH CHECK (owns_founder(founder_id));
CREATE POLICY "campaign_apps_update" ON campaign_applications
  FOR UPDATE USING (
    owns_founder(founder_id)
    OR EXISTS (SELECT 1 FROM campaigns c WHERE c.id = campaign_id AND owns_business(c.business_id))
  )
  WITH CHECK (
    owns_founder(founder_id)
    OR EXISTS (SELECT 1 FROM campaigns c WHERE c.id = campaign_id AND owns_business(c.business_id))
  );
CREATE TRIGGER campaign_applications_updated_at BEFORE UPDATE ON campaign_applications
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS publisher_partnership_settings (
  id          TEXT        PRIMARY KEY,
  founder_id  TEXT        NOT NULL REFERENCES founders(id) ON DELETE CASCADE,
  data        JSONB       NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS pps_founder_id_idx ON publisher_partnership_settings (founder_id);

ALTER TABLE publisher_partnership_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pps_owner_read" ON publisher_partnership_settings
  FOR SELECT USING (owns_founder(founder_id) OR is_village_admin());
CREATE POLICY "pps_owner_write" ON publisher_partnership_settings
  FOR INSERT WITH CHECK (owns_founder(founder_id));
CREATE POLICY "pps_owner_update" ON publisher_partnership_settings
  FOR UPDATE USING (owns_founder(founder_id)) WITH CHECK (owns_founder(founder_id));
CREATE TRIGGER pps_updated_at BEFORE UPDATE ON publisher_partnership_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS business_partnership_settings (
  id          TEXT        PRIMARY KEY,
  business_id TEXT        NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  data        JSONB       NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS bps_business_id_idx ON business_partnership_settings (business_id);

ALTER TABLE business_partnership_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bps_owner_read" ON business_partnership_settings
  FOR SELECT USING (owns_business(business_id) OR is_village_admin());
CREATE POLICY "bps_owner_write" ON business_partnership_settings
  FOR INSERT WITH CHECK (owns_business(business_id));
CREATE POLICY "bps_owner_update" ON business_partnership_settings
  FOR UPDATE USING (owns_business(business_id)) WITH CHECK (owns_business(business_id));
CREATE TRIGGER bps_updated_at BEFORE UPDATE ON business_partnership_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
