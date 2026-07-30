-- A brand-new business starts with slug = '' (empty string) until the
-- founder names it and hits Save — but businesses_slug_unique_idx only
-- excluded real NULLs, not empty strings, so a second unsaved business
-- ('' again) collided with the first one still sitting blank and the
-- insert silently failed. Empty string means "no slug yet" here, same as
-- NULL — exclude it from the uniqueness check the same way.
DROP INDEX IF EXISTS businesses_slug_unique_idx;
CREATE UNIQUE INDEX IF NOT EXISTS businesses_slug_unique_idx
  ON businesses (slug) WHERE slug IS NOT NULL AND slug <> '';
