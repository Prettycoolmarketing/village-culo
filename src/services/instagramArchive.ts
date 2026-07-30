// Instagram "Download your information" ZIP → ImportedContent items.
//
// Instagram doesn't publish a fixed export spec and the JSON shape has
// shifted across versions/locales, so this reads defensively: it looks for
// any posts_*.json / reels.json / stories.json file anywhere in the archive,
// accepts either caption-at-post-level or caption-on-the-media-item shapes,
// and skips (rather than fails on) any file it can't make sense of.
//
// What this does NOT do: read on-screen text baked into photos/video frames,
// or transcribe spoken audio in Reels — Instagram's export doesn't include
// either, and there's no free/reliable way to generate them here. The real
// caption text Instagram DOES export becomes the title/subtitle/blog.

import JSZip from 'jszip'
import { mediaUploadsService } from './mediaUploads'
import { getFounder } from './founders'
import { getBusiness } from './businesses'
import type { ImportedContent } from '../types/importedContent'
import type { ContentType } from '../types'

export type InstagramEntryKind = 'post' | 'reel' | 'story'

export interface ParsedInstagramPost {
  kind: InstagramEntryKind
  caption: string
  timestamp: number // unix seconds — the ORIGINAL post date, never the export/upload date
  mediaPaths: { path: string; isVideo: boolean }[]
}

const HASHTAG_RE = /#(\w+)/g

function extractHashtags(text: string): string[] {
  return Array.from(new Set([...text.matchAll(HASHTAG_RE)].map(m => m[1]!)))
}

function firstLines(text: string, n: number): string[] {
  return text.split(/\r?\n/).map(l => l.trim()).filter(Boolean).slice(0, n)
}

function normalizeEntries(raw: unknown, kind: InstagramEntryKind): ParsedInstagramPost[] {
  if (!Array.isArray(raw)) return []
  const out: ParsedInstagramPost[] = []
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue
    const e = entry as Record<string, unknown>
    const mediaList: Record<string, unknown>[] = Array.isArray(e.media) ? e.media as Record<string, unknown>[] : [e]

    const caption =
      (typeof e.title === 'string' && e.title) ||
      (typeof mediaList[0]?.title === 'string' ? (mediaList[0]!.title as string) : '') ||
      ''

    const timestamps = mediaList
      .map(m => (typeof m.creation_timestamp === 'number' ? m.creation_timestamp : undefined))
      .filter((t): t is number => typeof t === 'number')
    const timestamp = timestamps.length > 0
      ? Math.min(...timestamps)
      : (typeof e.creation_timestamp === 'number' ? (e.creation_timestamp as number) : Math.floor(Date.now() / 1000))

    const mediaPaths = mediaList
      .map(m => (typeof m.uri === 'string' ? m.uri : undefined))
      .filter((p): p is string => typeof p === 'string')
      .map(path => ({ path, isVideo: /\.(mp4|mov|m4v)$/i.test(path) }))

    if (mediaPaths.length === 0) continue
    out.push({ kind, caption, timestamp, mediaPaths })
  }
  return out
}

// Some export variants list every photo/video as its own top-level JSON
// entry instead of grouping a multi-media post under one entry's `media`
// array — which is exactly the case that produced one ImportedContent per
// clip instead of one per post. Same day + same kind = the same original
// post (or close enough that a founder would rather write one blog about
// the whole day than five near-identical ones), so entries get merged here
// before anything is built.
function groupByDay(posts: ParsedInstagramPost[]): ParsedInstagramPost[] {
  const groups = new Map<string, ParsedInstagramPost>()
  for (const post of posts) {
    const dayKey = `${post.kind}:${new Date(post.timestamp * 1000).toISOString().slice(0, 10)}`
    const existing = groups.get(dayKey)
    if (!existing) {
      groups.set(dayKey, { ...post, mediaPaths: [...post.mediaPaths] })
      continue
    }
    existing.mediaPaths.push(...post.mediaPaths)
    existing.timestamp = Math.min(existing.timestamp, post.timestamp)
    if (post.caption && !existing.caption.includes(post.caption)) {
      existing.caption = existing.caption ? `${existing.caption}\n\n${post.caption}` : post.caption
    }
  }
  return Array.from(groups.values())
}

// Looks like an entry Instagram's exports actually produce — either a
// direct media item (`uri` on itself) or a post wrapper (`media: [...]`
// with `uri` inside). Anything else isn't worth treating as a post no
// matter what array it came from.
function looksLikeMediaEntry(v: unknown): boolean {
  if (!v || typeof v !== 'object') return false
  const e = v as Record<string, unknown>
  if (typeof e.uri === 'string') return true
  if (Array.isArray(e.media)) return e.media.some(m => m && typeof m === 'object' && typeof (m as Record<string, unknown>).uri === 'string')
  return false
}

// Instagram's export JSON shape isn't fixed — this walks the object tree
// (not just the top level) looking for the first array that's actually full
// of media entries, so a nested wrapper like `{ data: { stories: [...] } }`
// or an unfamiliar top-level key still gets found.
function findMediaArray(json: unknown, depth = 0): unknown[] | null {
  if (depth > 4 || !json) return null
  if (Array.isArray(json)) {
    return json.some(looksLikeMediaEntry) ? json : null
  }
  if (typeof json === 'object') {
    for (const value of Object.values(json as Record<string, unknown>)) {
      const found = findMediaArray(value, depth + 1)
      if (found) return found
    }
  }
  return null
}

// Last resort when no JSON file anywhere in the archive yields a real media
// array — Instagram's export JSON has shifted shape too many times to
// promise this skill will always parse it. Every real media file is still
// sitting right there in the ZIP regardless of what the JSON looks like, so
// grab every photo/video directly by extension. The ZIP entry's stored date
// is the best timestamp available here, but it isn't necessarily the real
// post date (it can just reflect when the export was assembled) — good
// enough to sort/display by, not reliable enough to group posts on. No
// caption available this way either — the founder writes it, same as
// pasting in a bare YouTube link.
const MEDIA_FILE_RE = /\.(mp4|mov|m4v|jpe?g|png|webp|heic)$/i

function rawMediaFallback(zip: JSZip): ParsedInstagramPost[] {
  const posts: ParsedInstagramPost[] = []
  zip.forEach((path, entry) => {
    if (entry.dir || !MEDIA_FILE_RE.test(path)) return
    const isVideo = /\.(mp4|mov|m4v)$/i.test(path)
    const timestamp = Math.floor((entry.date?.getTime() ?? Date.now()) / 1000)
    posts.push({ kind: 'post', caption: '', timestamp, mediaPaths: [{ path, isVideo }] })
  })
  return posts
}

export async function parseInstagramArchiveFile(file: File): Promise<{ posts: ParsedInstagramPost[]; zip: JSZip }> {
  const zip = await JSZip.loadAsync(file)
  const posts: ParsedInstagramPost[] = []

  for (const path of Object.keys(zip.files)) {
    const lower = path.toLowerCase()
    if (!lower.endsWith('.json')) continue

    // Filename hints the kind when it can; otherwise every export we've
    // seen calls it a "post" (the plain feed/camera-roll case), so that's
    // the fallback — never a reason to skip a file outright.
    const kind: InstagramEntryKind =
      lower.includes('reel') ? 'reel' :
      lower.includes('stor')  ? 'story' :
      'post'

    try {
      const text = await zip.files[path]!.async('string')
      const json = JSON.parse(text) as unknown
      const raw = findMediaArray(json)
      if (!raw) continue
      posts.push(...normalizeEntries(raw, kind))
    } catch {
      continue
    }
  }

  // Grouping by day only makes sense when the day actually came from
  // Instagram's own per-post timestamp (the JSON path above). The raw file
  // fallback below has no real post date to go on — a ZIP entry's stored
  // date is often just whenever the export was put together, so every clip
  // can end up stamped with the same day regardless of when it was really
  // posted. Grouping those by that unreliable date was merging an entire
  // export into one giant post — each raw file stays its own piece instead.
  if (posts.length === 0) return { posts: rawMediaFallback(zip), zip }

  return { posts: groupByDay(posts), zip }
}

export interface BuiltArchiveItem {
  item: ImportedContent
  dayKey: string // YYYY-MM-DD of the original post date — for grouping in the UI
}

export async function buildImportedContentFromArchive(
  founderId: string,
  posts: ParsedInstagramPost[],
  zip: JSZip,
  onProgress?: (message: string) => void,
  businessId?: string,
): Promise<{ built: BuiltArchiveItem[]; uploadErrors: string[] }> {
  const results: BuiltArchiveItem[] = []
  const uploadErrors: string[] = []

  // Used only as a fallback title when Instagram's export had no caption to
  // pull from (the raw-media-file path) — real captions always win.
  const founderName = getFounder(founderId)?.name
  const businessName = businessId ? getBusiness(businessId)?.name : undefined
  const fallbackWho = [founderName, businessName].filter(Boolean).join(' — ')

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i]!
    onProgress?.(`Uploading media ${i + 1} of ${posts.length}…`)

    const uploadedUrls: string[] = []
    const videoUrls: string[] = []

    for (const media of post.mediaPaths) {
      const zipEntry = zip.file(media.path)
      if (!zipEntry) continue
      const blob = await zipEntry.async('blob')
      const filename = media.path.split('/').pop() || `instagram-${Date.now()}.jpg`
      const file = new File([blob], filename, { type: media.isVideo ? 'video/mp4' : 'image/jpeg' })
      const result = await mediaUploadsService.uploadAndTrack(file, {
        founderId,
        usageType: media.isVideo ? 'reel-preview' : 'carousel-slide',
      })
      if (result.media) {
        if (media.isVideo) videoUrls.push(result.media.publicUrl)
        else uploadedUrls.push(result.media.publicUrl)
      } else if (result.error) {
        // A video failing to upload used to just vanish — the post it
        // belonged to silently never got created if it had no other media.
        // Most common cause: the file is bigger than the Storage bucket's
        // configured max upload size (Instagram exports can be large).
        uploadErrors.push(`${filename}: ${result.error}`)
      }
    }

    // Grouping same-day entries can bring several clips together under one
    // piece — the first is the primary video, any more ride along as extra
    // reels rather than silently overwriting each other.
    const videoUrl = videoUrls[0]
    const extraVideoUrls = videoUrls.slice(1)

    if (uploadedUrls.length === 0 && !videoUrl) continue

    // The hook — the line most IG captions lead with — becomes the title;
    // the next line (if there is one) becomes the subtitle. The full
    // caption still goes into description/blog untouched.
    const lines = firstLines(post.caption, 2)
    const publishedAtIso = new Date(post.timestamp * 1000).toISOString()
    const dateLabel = new Date(post.timestamp * 1000).toLocaleDateString('en-AU')
    const title = lines[0] || `Instagram post${fallbackWho ? ` by ${fallbackWho}` : ''} — ${dateLabel}`
    const subtitle = lines[1]
    const hashtags = extractHashtags(post.caption)

    // Driven by what actually got uploaded, not post.kind — the raw-file
    // fallback always reports kind 'post' regardless of whether the file was
    // a video or a photo. Without checking videoUrl here, an MP4 imported
    // that way got hinted as plain 'blog', which meant buildStoryFromImport
    // (gated on contentTypes including 'reel'/'youtube-video'/'social-post')
    // never set story.reelUrl on publish — the video silently never made it
    // into the published story at all. A video is a video regardless of
    // where it came from; only stays 'carousel' when there's no video and
    // more than one photo.
    const contentTypeHint: ContentType[] =
      videoUrl ? ['reel', 'blog'] :
      uploadedUrls.length > 1 ? ['carousel'] :
      ['blog']

    const item: ImportedContent = {
      id: `imp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      founderId,
      businessId,
      sourcePlatform: 'instagram',
      originalUrl: '',
      thumbnailUrl: uploadedUrls[0] ?? videoUrl,
      imageUrls: uploadedUrls.length > 0 ? uploadedUrls : undefined,
      reelVideoUrl: videoUrl,
      additionalVideoUrls: extraVideoUrls.length > 0 ? extraVideoUrls : undefined,
      title,
      subtitle,
      description: post.caption || undefined,
      publishedAt: publishedAtIso,
      importedAt: new Date().toISOString(),
      status: 'draft',
      topics: hashtags,
      locations: [],
      visibility: 'private',
      contentTypeHint,
    }

    results.push({ item, dayKey: publishedAtIso.slice(0, 10) })
  }

  return { built: results, uploadErrors }
}
