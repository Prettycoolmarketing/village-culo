-- CULO Village — Sprint 3.5: founder-owned Idea creation
-- Village Intelligence is being upgraded from "extract lessons as throwaway
-- strings" to "extract Ideas as first-class, deduplicated, persisted entities
-- linked back to the story/founder/business that produced them" (see
-- src/services/ideaSync.ts). That means a founder's own publish action must be
-- able to INSERT/UPDATE rows in `ideas` — but migration 003 made `ideas`
-- admin-write-only, because at the time there was no founder-facing idea
-- creation path at all (it was purely curated content).
--
-- This adds a `founder_id` ownership column — the founder whose story caused
-- this idea to be created, distinct from `relatedFounderIds` in `data` (people
-- *mentioned/connected*, which can be many) — and RLS policies that let a
-- founder manage ideas they own, additively alongside the existing admin
-- policies (Postgres RLS policies within the same command are OR'd together,
-- so this cannot narrow what admins could already do).

ALTER TABLE ideas ADD COLUMN IF NOT EXISTS founder_id TEXT;
CREATE INDEX IF NOT EXISTS ideas_founder_id_idx ON ideas (founder_id);

DROP POLICY IF EXISTS "ideas_founder_read" ON ideas;
CREATE POLICY "ideas_founder_read" ON ideas
  FOR SELECT USING (owns_founder(founder_id));

DROP POLICY IF EXISTS "ideas_founder_write" ON ideas;
CREATE POLICY "ideas_founder_write" ON ideas
  FOR INSERT WITH CHECK (owns_founder(founder_id));

DROP POLICY IF EXISTS "ideas_founder_update" ON ideas;
CREATE POLICY "ideas_founder_update" ON ideas
  FOR UPDATE USING (owns_founder(founder_id)) WITH CHECK (owns_founder(founder_id));
