-- CULO Village — Canva import
--
-- Stores each founder's Canva OAuth tokens so they can pick a Canva design
-- and import its slides (as carousel images / a static photo, plus the
-- slide text as blog/caption copy) without leaving the app. Unlike other
-- founder-owned tables in this app, this one is never synced to the client
-- (see lib/sync.ts's SYNCED_TABLES — deliberately NOT listed here) and has
-- no client-readable RLS policy at all, not even for the owning founder —
-- access_token/refresh_token are real bearer credentials for a founder's
-- Canva account, unlike e.g. a Stripe account id, so nothing here should
-- ever reach a browser. Every read/write goes through a canva-* Edge
-- Function using the service role key; the client only ever learns a
-- yes/no "connected" boolean via the canva-status function's response.

CREATE TABLE IF NOT EXISTS founder_canva_accounts (
  founder_id      TEXT        PRIMARY KEY REFERENCES founders(id) ON DELETE CASCADE,
  user_id         UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  canva_user_id   TEXT,
  access_token    TEXT        NOT NULL,
  refresh_token   TEXT        NOT NULL,
  expires_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE founder_canva_accounts ENABLE ROW LEVEL SECURITY;
-- Intentionally no SELECT/INSERT/UPDATE policies for any client role —
-- service-role Edge Functions bypass RLS entirely, which is the only way
-- in or out of this table.

CREATE TRIGGER founder_canva_accounts_updated_at BEFORE UPDATE ON founder_canva_accounts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
