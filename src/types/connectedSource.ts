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
  // Daily import drip — a scan only ever brings in up to DAILY_IMPORT_LIMIT
  // new items per calendar day. lastScanDate is the day importedToday last
  // reset; importedToday is how much of today's allowance has been used.
  lastScanDate?: string
  importedToday?: number
  // Per-source override of the platform-wide daily import drip — set only
  // for allowlisted high-volume founders (see VITE_HIGH_VOLUME_IMPORT_EMAILS
  // in DashboardImportContentPage.tsx), never a general-purpose setting.
  dailyLimitOverride?: number
}

export interface ConnectedSourceFilter {
  founderId?: string
  businessId?: string
}
