export type ConnectedSourceType = 'youtube' | 'podcast-rss' | 'website-rss'
export type ConnectedSourceStatus = 'idle' | 'scanning' | 'error'

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
  lastError?: string
  discoveredCount: number
}

export interface ConnectedSourceFilter {
  founderId?: string
  businessId?: string
}
