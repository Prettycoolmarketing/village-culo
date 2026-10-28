-- Same pattern as migration 050's business_slug_backfill_trigger — the
-- dedicated evidence_ledger column was found null on a founder whose
-- data->'evidenceLedger' was correctly populated (research had genuinely
-- run and succeeded). The app only ever reads from data (see
-- entityStore.ts's pullVisibleRows, select('data') only), so this never
-- caused the actual reported bug (that was a stale client cache) — but
-- the column drifting from the real data is still worth the same
-- database-level safety net so it can't mislead anything that queries it
-- directly later.
CREATE OR REPLACE FUNCTION founder_evidence_ledger_backfill() RETURNS trigger AS $$
BEGIN
  IF NEW.evidence_ledger IS NULL AND NEW.data ? 'evidenceLedger' THEN
    NEW.evidence_ledger := NEW.data->'evidenceLedger';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS founder_evidence_ledger_backfill_trigger ON founders;
CREATE TRIGGER founder_evidence_ledger_backfill_trigger
  BEFORE INSERT OR UPDATE ON founders
  FOR EACH ROW
  EXECUTE FUNCTION founder_evidence_ledger_backfill();

-- One-time backfill for rows already affected.
UPDATE founders SET evidence_ledger = data->'evidenceLedger'
WHERE evidence_ledger IS NULL AND data ? 'evidenceLedger';
