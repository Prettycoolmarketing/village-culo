export type ConnectedSourceType = 'youtube' | 'podcast-rss' | 'website-rss'
export type ConnectedSourceStatus = 'idle' | 'scanning' | 'error' | 'paused'

// How this source's feed/channel was identified — shown on the source card,
// distinct from the founder-facing "podcast" label used elsewhere.
export type ConnectionMethod = 'direct-rss' | 'website-discovery' | 'apple-podcasts' | 'spotify' | 'name-search' | 'manual'

// Podcast-show-level metadata, resolved once at connect time (see
// services/podcastResolve.ts) and re-confirmed on manual refresh. Only ever
// populated for sourceType 'podcast-rss'; every field is either taken
// straight from the RSS feed or from the directory API that resolved it —
// never invented.
export interface PodcastSourceMeta {
  title: string
  description?: string
  artworkUrl?: string
  author?: string
  website?: string
  language?: string
  categories?: string[]
  feedLastBuildDate?: string
  appleId?: string
  appleUrl?: string
  spotifyUrl?: string
}

export interface ConnectedSource {
  id: string
  founderId: string
  businessId?: string
  sourceType: ConnectedSourceType
  label: string
  // channelId for youtube; feedUrl for podcast-rss/website-rss
  config: { channelId?: string; feedUrl?: string }
  status: ConnectedSourceStatus
  lastScannedAt?: string
  lastAttemptedAt?: string
  lastError?: string
  discoveredCount: number
  // Daily import drip — a scan only ever brings in up to DAILY_IMPORT_LIMIT
  // new items per calendar day. lastScanDate is the day importedToday last
  // reset; importedToday is how much of today's allowance has been used.
  lastScanDate?: string
  importedToday?: number
  // Per-source override of the platform-wide daily import drip — set only
  // for allowlisted high-volume founders (see VITE_HIGH_VOLUME_IMPORT_EMAILS
  // in DashboardImportContentPage.tsx), never a general-purpose setting.
  dailyLimitOverride?: number

  // Podcast-specific — how the feed was found, and the resolved show
  // metadata used to render the source card and confirmation screen.
  connectionMethod?: ConnectionMethod
  podcast?: PodcastSourceMeta
  // Manual pause (status stays 'idle'/'error' otherwise) — a paused source
  // is skipped by both manual "Scan now" and any future recurring sync.
  autoSyncPaused?: boolean
}

export interface ConnectedSourceFilter {
  founderId?: string
  businessId?: string
}
