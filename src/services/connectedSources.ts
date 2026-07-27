import { readCache, writeEntity, deleteEntity, type WriteResult } from '../lib/entityStore'
import type { ConnectedSource, ConnectedSourceFilter, ConnectedSourceType } from '../types/connectedSource'
import type { ImportedContent } from '../types/importedContent'
import { importedContentService, PLATFORM_LABELS } from './importedContent'
import { fetchYouTubeItems } from './connectors/youtube'
import { fetchRssItems } from './connectors/rss'
import { fetchPodcastItems } from './connectors/podcastRss'
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
  // Podcast gets its own richer connector (GUID/enclosure/duration/season-
  // episode/transcript/chapters) — website-rss stays on the older generic
  // one, unaffected.
  'podcast-rss': fetchPodcastItems,
  'website-rss': fetchRssItems,
}

const PLATFORM_BY_SOURCE_TYPE: Record<ConnectedSourceType, ImportedContent['sourcePlatform']> = {
  'youtube':     'youtube',
  'podcast-rss': 'podcast',
  'website-rss': 'website',
}

function now() { return new Date().toISOString() }
function today() { return new Date().toISOString().slice(0, 10) }

// Regular founders bring in 20 previous posts a day — a deliberate pace, not
// an API/storage constraint, so a founder writes a real story per post
// instead of dumping years of content in one unreviewed batch. CAPO staff
// (and curated-profile imports done on someone's behalf) get the much
// higher HIGH_VOLUME_DAILY_LIMIT override below via isHighVolume.
const DAILY_IMPORT_LIMIT = 20

export interface ScanResult {
  imported: number
  /** True when there's more unseen content than this scan brought in — either the
   *  channel has further pages we didn't reach, or today's allowance ran out first. */
  moreAvailable: boolean
  /** True when the scan was skipped entirely because today's allowance is already spent. */
  dailyLimitReached: boolean
}

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

// Podcast feeds can change an episode's title, show notes or enclosure URL
// between syncs while keeping the same GUID (or vice versa — some feeds
// don't set a GUID at all and only the enclosure/link stays stable), so a
// single identifier isn't reliable. Every non-empty identifier an item has
// goes in the set; a match on any one of them counts as "already imported."
function alreadyImportedKeys(sourceId: string): Set<string> {
  const keys = new Set<string>()
  for (const item of importedContentService.getAll()) {
    if (item.connectedSourceId !== sourceId) continue
    if (item.originalUrl) keys.add(item.originalUrl)
    if (item.episodeGuid) keys.add(`guid:${item.episodeGuid}`)
    if (item.enclosureUrl) keys.add(`enclosure:${item.enclosureUrl}`)
  }
  return keys
}

function itemKeys(item: NormalizedImportItem): string[] {
  const keys = [item.originalUrl]
  if (item.episodeGuid) keys.push(`guid:${item.episodeGuid}`)
  if (item.enclosureUrl) keys.push(`enclosure:${item.enclosureUrl}`)
  return keys
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
    // Podcast-only fields — undefined for every other platform.
    episodeGuid: item.episodeGuid,
    enclosureUrl: item.enclosureUrl,
    enclosureType: item.enclosureType,
    durationSeconds: item.durationSeconds,
    episodeNumber: item.episodeNumber,
    seasonNumber: item.seasonNumber,
    episodeKind: item.episodeKind,
    explicit: item.explicit,
    showNotes: item.showNotes,
    chapters: item.chapters,
    podcastTitle: item.podcastTitle,
    transcriptText: item.transcriptText,
    transcriptSource: item.transcriptText ? 'platform' : undefined,
    transcriptStatus: item.transcriptText ? 'available' : undefined,
  }
}

/** Scans a connected source, writing up to today's remaining allowance of newly-discovered items as ImportedContent drafts. */
export async function scanSource(source: ConnectedSource): Promise<ScanResult> {
  const dailyLimit = source.dailyLimitOverride ?? DAILY_IMPORT_LIMIT
  const isNewDay = source.lastScanDate !== today()
  const usedToday = isNewDay ? 0 : (source.importedToday ?? 0)
  const remainingToday = Math.max(0, dailyLimit - usedToday)

  // Allowance already spent for today — skip the fetch entirely rather than
  // scan and immediately discard what it finds.
  if (remainingToday === 0) {
    return { imported: 0, moreAvailable: true, dailyLimitReached: true }
  }

  const seen = alreadyImportedKeys(source.id)

  try {
    const items = await CONNECTORS[source.sourceType](source)
    const platform = PLATFORM_BY_SOURCE_TYPE[source.sourceType]
    const unseen = items.filter(item => !itemKeys(item).some(k => seen.has(k)))
    const toImport = unseen.slice(0, remainingToday)
    const drafts = toImport.map(item => draftFrom(source.founderId, source.id, platform, item))

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
      lastScanDate: today(),
      importedToday: usedToday + drafts.length,
    })

    return { imported: drafts.length, moreAvailable: unseen.length > toImport.length, dailyLimitReached: false }
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

/**
 * Podcast connect is deliberately not the same "auto-drip up to today's
 * limit" model YouTube uses — after confirming a show, the founder sees the
 * full episode catalogue and explicitly picks which ones to bring in (see
 * the "Connect your podcast" flow in DashboardImportContentPage.tsx), the
 * same one-off "pick from a catalogue" shape as Canva import. This writes
 * exactly the given items regardless of the daily drip allowance — it's a
 * single deliberate founder action, not an automatic scan — while still
 * running through the same dedup/analysis pipeline as every other import.
 */
export async function importSelectedPodcastEpisodes(source: ConnectedSource, items: NormalizedImportItem[]): Promise<{ imported: number }> {
  const seen = alreadyImportedKeys(source.id)
  const unseen = items.filter(item => !itemKeys(item).some(k => seen.has(k)))
  const drafts = unseen.map(item => draftFrom(source.founderId, source.id, 'podcast', item))

  await Promise.all(drafts.map(d => importedContentService.upsert(d)))
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

  return { imported: drafts.length }
}
