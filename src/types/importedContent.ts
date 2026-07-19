export type ImportedContentPlatform =
  | 'youtube'
  | 'vimeo'
  | 'instagram'
  | 'linkedin'
  | 'tiktok'
  | 'podcast'
  | 'website'
  | 'canva'

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

  // Set when this draft was created by a connector scan (see services/connectedSources.ts)
  // rather than a manual paste-a-link import — lets a re-scan skip URLs already imported.
  connectedSourceId?: string

  // Transcript
  transcriptText?: string
  transcriptSource?: 'manual' | 'youtube' | 'platform' | 'generated' | 'unknown'
  transcriptImportedAt?: string
  transcriptStatus?: 'none' | 'available' | 'unavailable' | 'manual' | 'generated'

  // Every exported slide image, in Canva's page order — only set for
  // sourcePlatform 'canva'. thumbnailUrl holds whichever one the founder
  // picked as the cover; this holds the full set for a carousel.
  imageUrls?: string[]

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

  // Affiliate / partner link — connects this piece to the Partnership
  // Program. When partnerId is set, ctaUrl is expected to be that partner's
  // affiliateUrl (kept as its own field so a founder can still hand-edit the
  // URL without losing the partner attribution). Carried onto the published
  // Story's ctaLabel/ctaUrl/partnerId by buildStoryFromImport / synced back
  // by syncImportEditsToStory.
  partnerId?: string
  ctaLabel?: string
  ctaUrl?: string
}

export interface ImportedContentFilter {
  founderId?: string
  businessId?: string
  status?: ImportedContentStatus
  platform?: ImportedContentPlatform
  publicOnly?: boolean
}
