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
}
