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

export const PLATFORM_LABELS: Record<ImportedContentPlatform, string> = {
  youtube:   'YouTube',
  vimeo:     'Vimeo',
  instagram: 'Instagram',
  linkedin:  'LinkedIn',
  tiktok:    'TikTok',
  podcast:   'Podcast',
  website:   'Website',
}

export const PLATFORM_COLORS: Record<ImportedContentPlatform, string> = {
  youtube:   'bg-red-100 text-red-700',
  vimeo:     'bg-blue-100 text-blue-700',
  instagram: 'bg-pink-100 text-pink-700',
  linkedin:  'bg-blue-100 text-blue-800',
  tiktok:    'bg-neutral-100 text-neutral-800',
  podcast:   'bg-purple-100 text-purple-700',
  website:   'bg-[#F3EDE6] text-[#6B7280]',
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
    return items
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
}
