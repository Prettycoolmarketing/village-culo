// The contract every connector implements. A connector's only job is to
// authenticate, fetch, and normalize into this shape — everything after
// that (dedup, drafting, analysis, writing to the Import Engine) is handled
// identically for every source in connectedSources.ts. No connector module
// should know anything about ImportedContent, Village Intelligence, or how
// its output gets used downstream.
export interface NormalizedImportItem {
  originalUrl: string
  title: string
  description?: string
  thumbnailUrl?: string
  publishedAt?: string
  embedUrl?: string

  // Podcast-only fields — left undefined by every other connector. Only
  // ever set from what the feed itself actually supplied (see
  // connectors/podcastRss.ts) — never invented.
  episodeGuid?: string
  enclosureUrl?: string
  enclosureType?: string
  durationSeconds?: number
  episodeNumber?: number
  seasonNumber?: number
  episodeKind?: 'full' | 'trailer' | 'bonus'
  explicit?: boolean
  showNotes?: string
  chapters?: { title: string; startSeconds: number }[]
  transcriptUrl?: string
  transcriptText?: string
  podcastTitle?: string
}
