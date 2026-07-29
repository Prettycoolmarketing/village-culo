-- New businesses now default to Published (everything in the Village is
-- either CULO-curated or added by a real joined member — no reason to make
-- someone flip a visibility switch first). Existing businesses created
-- before that change are still sitting as Draft, which is why they weren't
-- showing up in the Businesses directory. Bring them in line — only ones
-- still on the old default, not anything already Archived on purpose.
UPDATE businesses
SET status = 'published',
    published_at = COALESCE(published_at, now()),
    data = jsonb_set(data, '{status}', '"published"')
WHERE status = 'draft';
