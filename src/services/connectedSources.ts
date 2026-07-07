import { readCache, writeEntity, deleteEntity, type WriteResult } from '../lib/entityStore'
import type { ConnectedSource, ConnectedSourceFilter } from '../types/connectedSource'
import type { ImportedContent } from '../types/importedContent'
import { importedContentService, PLATFORM_LABELS } from './importedContent'
import { fetchChannelVideos, YouTubeConnectorError } from './connectors/youtube'
import { fetchFeed, RssConnectorError } from './connectors/rss'

const KEY = 'connected_sources'
const TABLE = 'connected_sources'

function now() { return new Date().toISOString() }

export const connectedSourcesService = {
  getAll(filter?: ConnectedSourceFilter): ConnectedSource[] {
    let items = readCache<ConnectedSource>(KEY)
    if (filter?.founderId)  items = items.filter(s => s.founderId === filter.founderId)
    if (filter?.businessId) items = items.filter(s => s.businessId === filter.businessId)
    return items
  },

  get(id: string): ConnectedSource | undefined {
    return readCache<ConnectedSource>(KEY).find(s => s.id === id)
  },

  upsert(item: ConnectedSource): Promise<WriteResult> {
    return writeEntity<ConnectedSource>({
      cacheKey: KEY,
      item,
      table: TABLE,
      toRow: (s, userId) => ({
        id: s.id,
        user_id: userId,
        founder_id: s.founderId,
        business_id: s.businessId ?? null,
        source_type: s.sourceType,
        status: s.status,
        data: s,
      }),
    })
  },

  delete(id: string): Promise<WriteResult> {
    return deleteEntity({ cacheKey: KEY, id, table: TABLE })
  },
}

function alreadyImportedUrls(sourceId: string): Set<string> {
  return new Set(
    importedContentService.getAll().filter(i => i.connectedSourceId === sourceId).map(i => i.originalUrl)
  )
}

function draftFrom(founderId: string, sourceId: string, opts: {
  originalUrl: string
  title: string
  description?: string
  thumbnailUrl?: string
  publishedAt?: string
  platform: ImportedContent['sourcePlatform']
  embedUrl?: string
}): ImportedContent {
  return {
    id: crypto.randomUUID(),
    founderId,
    sourcePlatform: opts.platform,
    originalUrl: opts.originalUrl,
    embedUrl: opts.embedUrl,
    thumbnailUrl: opts.thumbnailUrl,
    title: opts.title || `Imported from ${PLATFORM_LABELS[opts.platform]}`,
    description: opts.description,
    publishedAt: opts.publishedAt,
    topics: [],
    locations: [],
    importedAt: now(),
    status: 'draft',
    visibility: 'private',
    connectedSourceId: sourceId,
  }
}

/** Scans a connected source, writing any newly-discovered items as ImportedContent drafts. Returns the count of new items found. */
export async function scanSource(source: ConnectedSource): Promise<number> {
  const seen = alreadyImportedUrls(source.id)
  let drafts: ImportedContent[] = []

  try {
    if (source.sourceType === 'youtube') {
      if (!source.config.channelId) throw new YouTubeConnectorError('This YouTube source has no channel configured.')
      const videos = await fetchChannelVideos(source.config.channelId)
      drafts = videos
        .map(v => ({ v, url: `https://www.youtube.com/watch?v=${v.videoId}` }))
        .filter(({ url }) => !seen.has(url))
        .map(({ v, url }) => draftFrom(source.founderId, source.id, {
          originalUrl: url,
          title: v.title,
          description: v.description,
          thumbnailUrl: v.thumbnailUrl,
          publishedAt: v.publishedAt,
          platform: 'youtube',
          embedUrl: `https://www.youtube.com/embed/${v.videoId}`,
        }))
    } else {
      if (!source.config.feedUrl) throw new RssConnectorError('This feed source has no feed URL configured.')
      const items = await fetchFeed(source.config.feedUrl)
      const platform = source.sourceType === 'podcast-rss' ? 'podcast' : 'website'
      drafts = items
        .filter(item => !seen.has(item.link))
        .map(item => draftFrom(source.founderId, source.id, {
          originalUrl: item.link,
          title: item.title,
          description: item.description,
          thumbnailUrl: item.imageUrl,
          publishedAt: item.publishedAt,
          platform,
        }))
    }

    await Promise.all(drafts.map(d => importedContentService.upsert(d)))

    await connectedSourcesService.upsert({
      ...source,
      status: 'idle',
      lastScannedAt: now(),
      lastError: undefined,
      discoveredCount: source.discoveredCount + drafts.length,
    })

    return drafts.length
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Scan failed.'
    await connectedSourcesService.upsert({ ...source, status: 'error', lastError: message, lastScannedAt: now() })
    throw err
  }
}

export function newConnectedSource(founderId: string, sourceType: ConnectedSource['sourceType'], label: string, config: ConnectedSource['config']): ConnectedSource {
  return {
    id: crypto.randomUUID(),
    founderId,
    sourceType,
    label,
    config,
    status: 'idle',
    discoveredCount: 0,
  }
}
