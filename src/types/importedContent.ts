import type { ContentType } from './index'

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
  subtitle?: string
  description?: string
  // A short reader-facing summary, distinct from the full Blog text in
  // `description` — same distinction as Story.summary vs Story.blog. Falls
  // back to autoSummary/description when publishing if never set.
  summary?: string
  // Same "fill it in once instead of discovering it's missing later" fields
  // as PublishDraft's finishing touches (DashboardPublishPage.tsx) — kept
  // here too so an import that skips the wizard (quick-publish, or edited
  // after already being published) can still have them set.
  seoTitle?: string
  seoDescription?: string
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

  // Every image for this piece — Canva slides in page order, or an
  // Instagram carousel's photos in original order. thumbnailUrl holds
  // whichever one is the cover.
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

  // Podcast episode fields — only set for sourcePlatform 'podcast' items
  // discovered via the RSS connector (services/connectors/podcastRss.ts).
  // Never invented: each is only populated when the feed itself supplied it.
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
  podcastTitle?: string

  // Overrides the platform's default content-type mapping (see
  // PLATFORM_CONTENT_TYPE in services/publishStory.ts) when set. Used by the
  // Canva slide-grouping flow, where one Canva design produces several
  // separate ImportedContent items (a Reel+blog, a Carousel, a standalone
  // Blog) that each need a different format than the platform-wide default.
  contentTypeHint?: ContentType[]

  // The actual re-hosted video for a piece whose original source isn't a
  // stable public URL — a Canva-grounded Reel (set asynchronously after
  // export, see canva-export-reel-video) or a video pulled straight out of
  // an Instagram archive ZIP. buildStoryFromImport prefers this over
  // originalUrl when present.
  reelVideoUrl?: string
}

export interface ImportedContentFilter {
  founderId?: string
  businessId?: string
  status?: ImportedContentStatus
  platform?: ImportedContentPlatform
  publicOnly?: boolean
}
