import { readCache, writeEntity, deleteEntity, type WriteResult } from '../lib/entityStore'
import type { ConnectedSource, ConnectedSourceFilter, ConnectedSourceType } from '../types/connectedSource'
import type { ImportedContent } from '../types/importedContent'
import { importedContentService, PLATFORM_LABELS } from './importedContent'
import { fetchYouTubeItems } from './connectors/youtube'
import { fetchRssItems } from './connectors/rss'
import type { NormalizedImportItem } from './connectors/types'
import { villageContentIntelligenceService, importedContentToInput } from './villageIntelligence'

const KEY = 'connected_sources'
const TABLE = 'connected_sources'

// Every connector's entire surface area, from the pipeline's point of view:
// one function, source in, normalized items out. Adding a new connector
// (Website, LinkedIn, Canva, Drive, Dropbox, OneDrive...) means writing one
// module that implements this and adding one line here — nothing about
// scanSource below changes.
const CONNECTORS: Record<ConnectedSourceType, (source: ConnectedSource) => Promise<NormalizedImportItem[]>> = {
  'youtube':     fetchYouTubeItems,
  'podcast-rss': fetchRssItems,
  'website-rss': fetchRssItems,
}

const PLATFORM_BY_SOURCE_TYPE: Record<ConnectedSourceType, ImportedContent['sourcePlatform']> = {
  'youtube':     'youtube',
  'podcast-rss': 'podcast',
  'website-rss': 'website',
}

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

function draftFrom(founderId: string, sourceId: string, platform: ImportedContent['sourcePlatform'], item: NormalizedImportItem): ImportedContent {
  return {
    id: crypto.randomUUID(),
    founderId,
    sourcePlatform: platform,
    originalUrl: item.originalUrl,
    embedUrl: item.embedUrl,
    thumbnailUrl: item.thumbnailUrl,
    title: item.title || `Imported from ${PLATFORM_LABELS[platform]}`,
    description: item.description,
    publishedAt: item.publishedAt,
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

  try {
    const items = await CONNECTORS[source.sourceType](source)
    const platform = PLATFORM_BY_SOURCE_TYPE[source.sourceType]
    const drafts = items
      .filter(item => !seen.has(item.originalUrl))
      .map(item => draftFrom(source.founderId, source.id, platform, item))

    await Promise.all(drafts.map(d => importedContentService.upsert(d)))
    // Village does the work first — analyse every connector-discovered draft
    // immediately, so it lands in the founder's review queue with suggestions
    // already attached rather than a blank item to fill in by hand.
    await Promise.all(drafts.map(d => {
      const intel = villageContentIntelligenceService.analyse(importedContentToInput(d))
      return villageContentIntelligenceService.upsert(intel)
    }))

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
