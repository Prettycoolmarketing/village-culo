-- "What I Genuinely Use & Recommend" was restricted to affiliate links for
-- a founder's own registered Village businesses (business_id was NOT NULL,
-- and the UI only offered a dropdown of those). Founders overwhelmingly want
-- to recommend real Village businesses.

-- Relax the constraint so a link can exist with just a typed business name
-- (stored in the JSONB `data` blob as businessName) and no business_id at
-- all — owns_founder(founder_id) alone is sufficient for RLS in that case.
ALTER TABLE founder_affiliate_links ALTER COLUMN business_id DROP NOT NULL;
