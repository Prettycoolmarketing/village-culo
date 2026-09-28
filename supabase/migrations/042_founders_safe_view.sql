-- Closes a real data-exposure gap found while investigating the claim
-- flow: founders.data is one JSONB blob holding both public-safe fields
-- (name, bio, social links...) and editorial-engine-internal fields
-- (evidenceLedger, researchStatus/*At, claimNotes) that were only ever
-- meant for CAPO staff (is_village_admin()) — but RLS is row-level, not
-- column-level, so the moment a researched curated founder gets
-- published, `founders_public_read` (status IN ('published','featured'))
-- would hand the ENTIRE blob, editorial internals included, to any
-- anonymous visitor via a plain REST call. curatedBy/curatedAt are
-- deliberately left in — ClaimProfilePage shows them as a public
-- "Curated by X" disclosure, not internal data.
--
-- This view is what the client actually reads instead of the raw table
-- for anyone who isn't CAPO staff (see src/lib/publicSync.ts and the
-- role-aware branch in src/lib/sync.ts) — `security_invoker` makes it
-- run with the querying role's own RLS, so an anonymous visitor still
-- only sees published/featured rows, exactly as before, just with the
-- internal keys stripped from what's returned either way.

create or replace view founders_safe as
select
  id,
  (data - 'evidenceLedger' - 'researchStatus' - 'researchRequestedAt' - 'researchCompletedAt' - 'claimNotes') as data
from founders;

alter view founders_safe set (security_invoker = true);

grant select on founders_safe to anon, authenticated;
