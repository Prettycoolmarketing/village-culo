-- Idempotency ledger for Stripe checkout.session.completed webhooks.
--
-- Stripe retries webhooks (and can deliver the same event more than once),
-- so any handler that grants a PAID entitlement must be idempotent. Before
-- acting, a webhook inserts the session id here; a duplicate insert fails
-- on the primary key and the webhook returns 200 without re-granting.
--
-- Written only by Edge Functions using the service role — no client access.

CREATE TABLE IF NOT EXISTS stripe_processed_sessions (
  session_id   TEXT        PRIMARY KEY,
  handler      TEXT        NOT NULL,
  founder_id   TEXT,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE stripe_processed_sessions ENABLE ROW LEVEL SECURITY;
-- No policies: service-role only.
