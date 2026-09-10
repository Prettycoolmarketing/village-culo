-- Pretty Cool Marketing client tracker — was localStorage-only (per staff
-- browser, see the old comment in src/lib/pcmClients.ts), which breaks the
-- moment a client is created server-side by stripe-pcm-webhook instead of
-- typed in by a staff member. Shared, durable storage, staff-only (same
-- is_village_admin() pattern as pcm_leads).

CREATE TABLE IF NOT EXISTS pcm_clients (
  id          TEXT        PRIMARY KEY,
  founder_id  TEXT,
  email       TEXT        NOT NULL,
  data        JSONB       NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pcm_clients_email_idx ON pcm_clients (email);
CREATE INDEX IF NOT EXISTS pcm_clients_founder_idx ON pcm_clients (founder_id);

ALTER TABLE pcm_clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pcm_clients_admin_all" ON pcm_clients;
CREATE POLICY "pcm_clients_admin_all" ON pcm_clients
  FOR ALL USING (is_village_admin()) WITH CHECK (is_village_admin());
