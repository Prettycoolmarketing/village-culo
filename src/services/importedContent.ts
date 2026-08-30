import { readCache, writeEntity, deleteEntity, type WriteResult } from '../lib/entityStore'
import type {
  ImportedContent,
  ImportedContentFilter,
  ImportedContentPlatform,
  ImportedContentStatus,
} from '../types/importedContent'

const KEY = 'imported_content'
const TABLE = 'imported_content'

function now() { return new Date().toISOString() }

// ─── Platform detection ───────────────────────────────────────────────────────

export function detectPlatform(url: string): ImportedContentPlatform {
  try {
    const u    = new URL(url)
    const host = u.hostname.replace(/^www\./, '')
    if (host === 'youtube.com' || host === 'youtu.be') return 'youtube'
    if (host === 'vimeo.com') return 'vimeo'
    if (host === 'instagram.com') return 'instagram'
    if (host.includes('linkedin.com')) return 'linkedin'
    if (host === 'tiktok.com') return 'tiktok'
    if (
      (host.includes('spotify.com') && u.pathname.includes('/show')) ||
      host.includes('anchor.fm') ||
      host.includes('buzzsprout.com') ||
      host.includes('podbean.com') ||
      host.includes('transistor.fm') ||
      host.includes('simplecast.com') ||
      u.pathname.includes('/feed') ||
      url.endsWith('.rss') ||
      url.endsWith('.xml')
    ) return 'podcast'
    return 'website'
  } catch {
    return 'website'
  }
}

export function generateEmbedUrl(url: string, platform: ImportedContentPlatform): string | undefined {
  try {
    const u = new URL(url)
    if (platform === 'youtube') {
      let videoId: string | null = null
      if (u.hostname === 'youtu.be') {
        videoId = u.pathname.slice(1).split('?')[0]
      } else {
        videoId = u.searchParams.get('v')
      }
      if (videoId) return `https://www.youtube.com/embed/${videoId}`
    }
    if (platform === 'vimeo') {
      const match = u.pathname.match(/^\/(\d+)/)
      if (match) return `https://player.vimeo.com/video/${match[1]}`
    }
    if (platform === 'tiktok') {
      const match = u.pathname.match(/\/video\/(\d+)/)
      if (match) return `https://www.tiktok.com/embed/v2/${match[1]}`
    }
  } catch {
    // ignore invalid URLs
  }
  return undefined
}

// A YouTube link has a real, hosted thumbnail image available with no
// upload/processing needed — used so "Extra Media" can show the actual
// thumbnail for a merged-in video instead of a bare URL text box (an
// uploaded video file has no equivalent; that case renders the file itself
// muted as its own preview instead).
export function youtubeThumbnailUrl(url: string): string | undefined {
  try {
    const u = new URL(url)
    let videoId: string | null = null
    if (u.hostname.replace(/^www\./, '') === 'youtu.be') {
      videoId = u.pathname.slice(1).split('?')[0] || null
    } else if (u.hostname.replace(/^www\./, '') === 'youtube.com') {
      videoId = u.searchParams.get('v')
    }
    return videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : undefined
  } catch {
    return undefined
  }
}

export const PLATFORM_LABELS: Record<ImportedContentPlatform, string> = {
  youtube:   'YouTube',
  vimeo:     'Vimeo',
  instagram: 'Instagram',
  linkedin:  'LinkedIn',
  tiktok:    'TikTok',
  podcast:   'Podcast',
  website:   'Blogs',
  canva:     'Canva',
}

export const PLATFORM_COLORS: Record<ImportedContentPlatform, string> = {
  youtube:   'bg-red-100 text-red-700',
  vimeo:     'bg-blue-100 text-blue-700',
  instagram: 'bg-pink-100 text-pink-700',
  linkedin:  'bg-blue-100 text-blue-800',
  tiktok:    'bg-neutral-100 text-neutral-800',
  podcast:   'bg-purple-100 text-purple-700',
  website:   'bg-[#F3EDE6] text-[#6B7280]',
  canva:     'bg-cyan-100 text-cyan-700',
}

export function buildDraftImport(founderId: string, url: string): ImportedContent {
  const platform = detectPlatform(url)
  const embedUrl = generateEmbedUrl(url, platform)
  return {
    id:             crypto.randomUUID(),
    founderId,
    sourcePlatform: platform,
    originalUrl:    url,
    embedUrl,
    title:          `Imported from ${PLATFORM_LABELS[platform]}`,
    topics:         [],
    locations:      [],
    importedAt:     now(),
    status:         'draft',
    visibility:     'private',
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const importedContentService = {
  getAll(filter?: ImportedContentFilter): ImportedContent[] {
    let items = readCache<ImportedContent>(KEY)
    if (filter?.founderId)  items = items.filter(i => i.founderId === filter.founderId)
    if (filter?.businessId) items = items.filter(i => i.businessId === filter.businessId)
    if (filter?.status)     items = items.filter(i => i.status === filter.status)
    if (filter?.platform)   items = items.filter(i => i.sourcePlatform === filter.platform)
    if (filter?.publicOnly) items = items.filter(i => i.status === 'published' || i.status === 'featured')
    // Most recently imported/touched first — otherwise items sit in
    // whatever order the cache happened to fetch them in, and something a
    // founder just merged (which bumps importedAt, see merge() below) has
    // no predictable place to look for it.
    return items.slice().sort((a, b) => b.importedAt.localeCompare(a.importedAt))
  },

  get(id: string): ImportedContent | undefined {
    return readCache<ImportedContent>(KEY).find(i => i.id === id)
  },

  getByFounderId(founderId: string): ImportedContent[] {
    return this.getAll({ founderId })
  },

  upsert(item: ImportedContent): Promise<WriteResult> {
    return writeEntity<ImportedContent>({
      cacheKey: KEY,
      item,
      table: TABLE,
      toRow: (i, userId) => ({
        id: i.id,
        user_id: userId,
        founder_id: i.founderId,
        business_id: i.businessId ?? null,
        status: i.status,
        visibility: i.visibility,
        source_platform: i.sourcePlatform,
        connected_source_id: i.connectedSourceId ?? null,
        published_at: i.status === 'published' || i.status === 'featured' ? new Date().toISOString() : null,
        data: i,
      }),
    })
  },

  delete(id: string): Promise<WriteResult> {
    return deleteEntity({ cacheKey: KEY, id, table: TABLE })
  },

  async updateStatus(id: string, status: ImportedContentStatus): Promise<WriteResult> {
    const item = this.get(id)
    if (!item) return { success: false, error: 'Not found' }
    return this.upsert({ ...item, status })
  },

  /**
   * Combines several separately-imported pieces into one — for when
   * same-day grouping (Instagram archive, or any other connector) didn't
   * catch clips that were genuinely posted together. The earliest item
   * becomes the survivor: keeps its title/subtitle/thumbnail, absorbs every
   * other item's photos and videos, merges captions and topics, and the
   * rest get deleted rather than left behind as empty duplicates.
   */
  async merge(ids: string[]): Promise<WriteResult> {
    if (ids.length < 2) return { success: false, error: 'Select at least two items to merge.' }
    const items = ids.map(id => this.get(id)).filter((i): i is ImportedContent => !!i)
    if (items.length < 2) return { success: false, error: 'Could not find those items.' }

    const sorted = [...items].sort((a, b) => (a.publishedAt ?? a.importedAt).localeCompare(b.publishedAt ?? b.importedAt))
    const primary = sorted[0]!
    const rest = sorted.slice(1)

    // reelVideoUrl only ever holds an uploaded/exported video file — a plain
    // YouTube/Vimeo/TikTok import has no such file, its "video" IS
    // originalUrl (the real hosted video). Without this fallback, merging
    // several YouTube items together silently dropped every video but the
    // primary's own originalUrl (which survives separately via `...primary`)
    // — every other item's actual video vanished the moment it got deleted.
    const VIDEO_LINK_PLATFORMS = new Set(['youtube', 'vimeo', 'tiktok'])
    const effectiveVideo = (i: ImportedContent) =>
      i.reelVideoUrl ?? (VIDEO_LINK_PLATFORMS.has(i.sourcePlatform) ? i.originalUrl : undefined)

    const allImages = Array.from(new Set(items.flatMap(i => i.imageUrls ?? [])))
    const allVideos = Array.from(new Set(
      items.flatMap(i => [effectiveVideo(i), ...(i.additionalVideoUrls ?? [])]).filter((u): u is string => !!u),
    ))
    // The primary item's own video leads (matches whose title/thumbnail/
    // description are winning) — everything else becomes an extra video,
    // regardless of which order they were selected in.
    const primaryVideo = effectiveVideo(primary) ?? allVideos[0]
    const extraVideos = allVideos.filter(v => v !== primaryVideo)
    const captions = Array.from(new Set(items.map(i => i.description?.trim()).filter((d): d is string => !!d)))
    const topics = Array.from(new Set(items.flatMap(i => i.topics)))
    const locations = Array.from(new Set(items.flatMap(i => i.locations)))

    const contentTypeHint = primaryVideo
      ? ['reel', 'blog'] as const
      : allImages.length > 1 ? ['carousel'] as const : ['blog'] as const

    const merged: ImportedContent = {
      ...primary,
      thumbnailUrl: primary.thumbnailUrl ?? sorted.find(i => i.thumbnailUrl)?.thumbnailUrl,
      imageUrls: allImages.length > 0 ? allImages : undefined,
      reelVideoUrl: primaryVideo,
      additionalVideoUrls: extraVideos.length > 0 ? extraVideos : undefined,
      description: captions.length > 0 ? captions.join('\n\n') : primary.description,
      topics,
      locations,
      contentTypeHint: [...contentTypeHint],
      // Bumped to now so the merged result sorts to the top of the Content
      // list (see getAll's recency sort) — otherwise it survives under
      // whichever original item's old timestamp and a founder has no
      // reliable way to find what they just merged.
      importedAt: new Date().toISOString(),
    }

    const result = await this.upsert(merged)
    if (!result.success) return result

    for (const item of rest) await this.delete(item.id)
    return { success: true }
  },
}
