-- CULO Village is Australian — currency across Partnerships Program
-- conversions and payouts is AUD, not USD. Migration 013 was applied with a
-- 'usd' default before this was caught; this corrects the column default
-- and backfills any rows already recorded as 'usd' (there's no real FX
-- conversion anywhere in this system, so this assumes any existing 'usd'
-- rows were actually AUD amounts entered before the mistake was noticed,
-- not real USD sales).

ALTER TABLE partner_conversions ALTER COLUMN currency SET DEFAULT 'aud';
ALTER TABLE partner_payouts     ALTER COLUMN currency SET DEFAULT 'aud';

UPDATE partner_conversions SET currency = 'aud' WHERE currency = 'usd';
UPDATE partner_payouts     SET currency = 'aud' WHERE currency = 'usd';
