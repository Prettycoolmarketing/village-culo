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

export async function parseInstagramArchiveFile(file: File): Promise<{ posts: ParsedInstagramPost[]; zip: JSZip }> {
  const zip = await JSZip.loadAsync(file)
  const posts: ParsedInstagramPost[] = []

  for (const path of Object.keys(zip.files)) {
    const lower = path.toLowerCase()
    if (!lower.endsWith('.json')) continue
    const kind: InstagramEntryKind | null =
      lower.includes('reel') ? 'reel' :
      lower.includes('stor')  ? 'story' :
      lower.includes('post') || lower.includes('video') || lower.includes('photo') ? 'post' :
      null
    if (!kind) continue

    try {
      const text = await zip.files[path]!.async('string')
      const json = JSON.parse(text) as unknown
      const raw = Array.isArray(json)
        ? json
        : (Object.values(json as Record<string, unknown>).find(v => Array.isArray(v)) ?? [])
      posts.push(...normalizeEntries(raw, kind))
    } catch {
      continue
    }
  }

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
): Promise<BuiltArchiveItem[]> {
  const results: BuiltArchiveItem[] = []

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
    const title = lines[0] || `Instagram ${post.kind} — ${new Date(post.timestamp * 1000).toLocaleDateString('en-AU')}`
    const subtitle = lines[1]
    const hashtags = extractHashtags(post.caption)

    const contentTypeHint: ContentType[] =
      post.kind === 'reel' ? ['reel', 'blog'] :
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

  return results
}
