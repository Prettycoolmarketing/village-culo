-- One business row (Nomii) was saved with slug = NULL in the dedicated
-- column even though its data->>'slug' was correctly set ("nomii") — exact
-- cause not pinned down (isolated to one row, not reproducible). Rather
-- than trust the write path never does this again, backfill it at the
-- database layer: whenever a business is inserted/updated with no slug in
-- the column, fall back to the slug already present in its data blob.
CREATE OR REPLACE FUNCTION business_slug_backfill() RETURNS trigger AS $$
BEGIN
  IF (NEW.slug IS NULL OR NEW.slug = '') AND NEW.data ? 'slug' AND NEW.data->>'slug' <> '' THEN
    NEW.slug := NEW.data->>'slug';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS business_slug_backfill_trigger ON businesses;
CREATE TRIGGER business_slug_backfill_trigger
  BEFORE INSERT OR UPDATE ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION business_slug_backfill();
