-- CULO Village — Partner Conversions & Payouts
--
-- Confirmed spend is not derivable automatically for most partners (their
-- affiliate program isn't on a network that pushes webhooks to us), so this
-- starts as a manual ledger PCM staff enter from the partner's own affiliate
-- dashboard: sale amount, commission Village actually earned, and status
-- (pending/confirmed/reversed — most programs hold a return window before a
-- commission is final). A conversion's founder_share is computed and stored
-- at record time from the Partner's founder_revenue_share_percent so a later
-- change to that percentage never silently rewrites historical payouts.
--
-- Payouts are a separate aggregate step: CAPO periodically rolls up each
-- founder's confirmed, unpaid conversions into one partner_payouts row and
-- pays it out — either via a connected Stripe account (founder_stripe_accounts)
-- or marked paid manually for founders who haven't connected one yet.

CREATE TABLE IF NOT EXISTS partner_conversions (
  id                TEXT        PRIMARY KEY,
  user_id           UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  partner_id        TEXT        NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  founder_id        TEXT        NOT NULL REFERENCES founders(id) ON DELETE CASCADE,
  story_id          TEXT        REFERENCES stories(id) ON DELETE SET NULL,
  status            TEXT        NOT NULL DEFAULT 'pending', -- pending | confirmed | reversed
  sale_amount_cents          INTEGER NOT NULL DEFAULT 0,
  commission_amount_cents    INTEGER NOT NULL DEFAULT 0,
  founder_share_cents        INTEGER NOT NULL DEFAULT 0,
  currency          TEXT        NOT NULL DEFAULT 'usd',
  payout_id         TEXT, -- set once rolled into a partner_payouts row
  data              JSONB       NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS partner_conversions_founder_idx ON partner_conversions (founder_id, status);
CREATE INDEX IF NOT EXISTS partner_conversions_partner_idx ON partner_conversions (partner_id);
CREATE INDEX IF NOT EXISTS partner_conversions_payout_idx  ON partner_conversions (payout_id);

ALTER TABLE partner_conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "partner_conversions_admin_all" ON partner_conversions
  FOR SELECT USING (is_village_admin());
CREATE POLICY "partner_conversions_founder_read" ON partner_conversions
  FOR SELECT USING (owns_founder(founder_id));
CREATE POLICY "partner_conversions_admin_write" ON partner_conversions
  FOR INSERT WITH CHECK (is_village_admin());
CREATE POLICY "partner_conversions_admin_update" ON partner_conversions
  FOR UPDATE USING (is_village_admin()) WITH CHECK (is_village_admin());
CREATE POLICY "partner_conversions_admin_delete" ON partner_conversions
  FOR DELETE USING (is_village_admin());

CREATE TRIGGER partner_conversions_updated_at BEFORE UPDATE ON partner_conversions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── founder_stripe_accounts ────────────────────────────────────────────────
-- One Stripe Express connected account per founder, created via the
-- stripe-connect-onboarding Edge Function. Never holds card/bank data
-- directly — Stripe's own hosted onboarding collects that.

CREATE TABLE IF NOT EXISTS founder_stripe_accounts (
  founder_id            TEXT        PRIMARY KEY REFERENCES founders(id) ON DELETE CASCADE,
  user_id               UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  stripe_account_id     TEXT        NOT NULL UNIQUE,
  onboarding_complete   BOOLEAN     NOT NULL DEFAULT false,
  payouts_enabled       BOOLEAN     NOT NULL DEFAULT false,
  data                  JSONB       NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE founder_stripe_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "founder_stripe_accounts_admin_read" ON founder_stripe_accounts
  FOR SELECT USING (is_village_admin());
CREATE POLICY "founder_stripe_accounts_owner_read" ON founder_stripe_accounts
  FOR SELECT USING (owns_founder(founder_id));
-- Written only by Edge Functions using the service role key (bypasses RLS),
-- never directly from the client — a founder never sets their own
-- stripe_account_id or flips payouts_enabled themselves.
CREATE POLICY "founder_stripe_accounts_admin_write" ON founder_stripe_accounts
  FOR INSERT WITH CHECK (is_village_admin());
CREATE POLICY "founder_stripe_accounts_admin_update" ON founder_stripe_accounts
  FOR UPDATE USING (is_village_admin()) WITH CHECK (is_village_admin());

CREATE TRIGGER founder_stripe_accounts_updated_at BEFORE UPDATE ON founder_stripe_accounts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── partner_payouts ────────────────────────────────────────────────────────
-- One row per payout run per founder. 'stripe' payouts are created by the
-- run-payouts Edge Function via Stripe Transfers; 'manual' is for founders
-- without a connected account yet — staff pay them outside the system
-- (bank transfer, etc.) and just record that it happened here.

CREATE TABLE IF NOT EXISTS partner_payouts (
  id                TEXT        PRIMARY KEY,
  user_id           UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  founder_id        TEXT        NOT NULL REFERENCES founders(id) ON DELETE CASCADE,
  method            TEXT        NOT NULL DEFAULT 'manual', -- stripe | manual
  status            TEXT        NOT NULL DEFAULT 'pending', -- pending | paid | failed
  amount_cents      INTEGER     NOT NULL DEFAULT 0,
  currency          TEXT        NOT NULL DEFAULT 'usd',
  stripe_transfer_id TEXT,
  note              TEXT,
  data              JSONB       NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS partner_payouts_founder_idx ON partner_payouts (founder_id);

ALTER TABLE partner_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "partner_payouts_admin_read" ON partner_payouts
  FOR SELECT USING (is_village_admin());
CREATE POLICY "partner_payouts_founder_read" ON partner_payouts
  FOR SELECT USING (owns_founder(founder_id));
CREATE POLICY "partner_payouts_admin_write" ON partner_payouts
  FOR INSERT WITH CHECK (is_village_admin());
CREATE POLICY "partner_payouts_admin_update" ON partner_payouts
  FOR UPDATE USING (is_village_admin()) WITH CHECK (is_village_admin());

CREATE TRIGGER partner_payouts_updated_at BEFORE UPDATE ON partner_payouts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
