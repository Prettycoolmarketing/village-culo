-- Backfill sharper YouTube thumbnails onto already-imported content.
--
-- src/services/importedContent.ts's youtubeThumbnailUrl() was fixed to (a)
-- request sddefault.jpg (640x480) instead of hqdefault.jpg (480x360), and
-- (b) recognize youtube.com/shorts/<id> URLs, which it previously missed
-- entirely — meaning existing Shorts imports have no thumbnailUrl at all.
-- That fix only affects content imported from now on; this backfills rows
-- that already exist so the blur/missing-thumbnail fix applies retroactively
-- across every page that renders these thumbnails, not just new imports.

-- 1. Bump existing hqdefault.jpg thumbnails to sddefault.jpg.
UPDATE imported_content
SET data = jsonb_set(
  data, '{thumbnailUrl}',
  to_jsonb(replace(data->>'thumbnailUrl', '/hqdefault.jpg', '/sddefault.jpg'))
)
WHERE source_platform = 'youtube'
  AND data->>'thumbnailUrl' LIKE '%/hqdefault.jpg';

-- 2. Fill in the thumbnail Shorts imports never got, extracting the video id
-- straight out of the stored originalUrl.
UPDATE imported_content
SET data = jsonb_set(
  data, '{thumbnailUrl}',
  to_jsonb(
    'https://i.ytimg.com/vi/' ||
    substring(data->>'originalUrl' from '/shorts/([\w-]+)') ||
    '/sddefault.jpg'
  )
)
WHERE source_platform = 'youtube'
  AND (data->>'thumbnailUrl') IS NULL
  AND data->>'originalUrl' ~ '/shorts/[\w-]+';
