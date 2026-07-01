export type ImportedContentPlatform =
  | 'youtube'
  | 'vimeo'
  | 'instagram'
  | 'linkedin'
  | 'tiktok'
  | 'podcast'
  | 'website'

export type ImportedContentStatus = 'draft' | 'published' | 'featured' | 'archived'
export type ImportedContentVisibility = 'private' | 'discoverable' | 'public'

export interface ImportedContent {
  id: string
  founderId: string
  businessId?: string
  sourcePlatform: ImportedContentPlatform
  originalUrl: string
  embedUrl?: string
  thumbnailUrl?: string
  title: string
  description?: string
  publishedAt?: string
  importedAt: string
  status: ImportedContentStatus
  diaryNote?: string
  topics: string[]
  locations: string[]
  originalAuthor?: string
  canonicalUrl?: string
  visibility: ImportedContentVisibility

  // Set once this import has been turned into a published Story via the Story
  // Builder — the Story mirrors this back via its own importedContentId.
  relatedStoryId?: string

  // Transcript
  transcriptText?: string
  transcriptSource?: 'manual' | 'youtube' | 'platform' | 'generated' | 'unknown'
  transcriptImportedAt?: string
  transcriptStatus?: 'none' | 'available' | 'unavailable' | 'manual' | 'generated'

  // Auto enrichment
  autoSummary?: string
  keyMoments?: string[]
  peopleMentions?: string[]
  businessMentions?: string[]
  suggestedTopics?: string[]
  suggestedLocations?: string[]

  // Diary generation metadata
  diaryGeneratedAt?: string
  diaryGenerationMode?: 'transcript' | 'metadata' | 'manual'
}

export interface ImportedContentFilter {
  founderId?: string
  businessId?: string
  status?: ImportedContentStatus
  platform?: ImportedContentPlatform
  publicOnly?: boolean
}
