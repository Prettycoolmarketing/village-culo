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
  | 'snapchat'

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
  // Subtitle doubles as the short reader-facing summary — no separate
  // Summary field, since the two were redundant. Falls back to
  // autoSummary/description when publishing if never set.
  subtitle?: string
  description?: string
  publishedAt?: string
  importedAt: string
  status: ImportedContentStatus
  diaryNote?: string
  topics: string[]
  locations: string[]
  originalAuthor?: string
  canonicalUrl?: string

  // Set true for content someone ELSE wrote (a journalist's piece, another
  // blog's feature) rather than the founder's own writing — defaults to
  // true for anything connected through WebsiteConnectForm's "Connect your
  // blogs / Been featured on someone else's blog?" flow (see
  // connectedSources.ts), since that form's whole framing assumes
  // third-party authorship unless the founder says otherwise. Gates
  // publishStory.ts from putting the raw scraped description straight into
  // a published Story's body — see descriptionRewrittenAt below.
  thirdPartyAuthored?: boolean
  // Set whenever `description` has actually passed through an AI rewrite
  // (Rewrite with AI / Rewrite as a Culo Article / the mention_article
  // Writer) rather than being raw feed/scrape text. A thirdPartyAuthored
  // item without this can't become a published Story's full body — see
  // publishStory.ts's fullDescription gate.
  descriptionRewrittenAt?: string
  // Set true when this row didn't come from the founder themselves using
  // their own Import Content connectors — either CAPO staff created it
  // (bulk JSON curation's content[]/sourceLinks, the Curated Founder
  // Builder, Spotlight, a mention article, the staff-triggered editorial
  // pipeline) or it's a fully-automated system write with no founder
  // action behind it (the one-link onboarding auto-research a brand-new
  // self-serve signup never had to touch Import Content for). Every
  // curated founder gets at least a few of these automatically (sourceLinks
  // alone guarantees it) — without this, Founder Management's "Imported"
  // badge showed on literally every curated founder regardless of whether
  // they'd ever touched Import Content themselves, which is what it's
  // actually meant to signal. Left unset (falsy) on anything created
  // through a founder's own self-serve import flow.
  staffCreated?: boolean
  visibility: ImportedContentVisibility

  // Set once this import has been turned into a published Story via the Story
  // Builder — the Story mirrors this back via its own importedContentId.
  relatedStoryId?: string

  // Set when a source's title and caption/description don't obviously match
  // (e.g. a YouTube video whose title and description came from different
  // uploads) — caught during manual/AI review, not auto-detected. Shown as
  // an asterisk next to the title and excluded from "select all" bulk
  // actions so it doesn't get swept into a batch rewrite/publish without a
  // human actually looking at it first; still individually selectable.
  flaggedForReview?: boolean
  flagReason?: string

  // Editorial ledger from the last AI rewrite — see generate-blog's
  // FRAMEWORK_PROMPT. Not shown publicly; exists so that at scale
  // ("show me every article where the lesson was Level C") the founder can
  // audit how a piece was actually written rather than trusting it blind.
  generationType?: 'source_led' | 'insight_led'
  insightConfidence?: 'A' | 'B' | 'C'
  insightSource?: string
  factSources?: string[]
  primaryQuestion?: string
  decision?: 'full_story' | 'short_story' | 'insight_support'
  possibleGroupHint?: string
  articleShape?: 'story_led' | 'expertise_led' | 'insight_led' | 'question_led' | 'current_reflection_led' | 'personal'

  // Series grouping while still a draft — deliberately separate from
  // Story.seriesId/episodeNumber (see types/index.ts), which only applies
  // once something is actually published. This lets a founder sort
  // imported/unpublished content into a series before publishing anything,
  // without forcing a publish just to organise. Episode order within the
  // series isn't tracked here; that's assigned once the piece is published.
  seriesId?: string

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

  // Extra reel/video clips beyond the primary one (reelVideoUrl/originalUrl)
  // — same "just add more" pattern as Story.additionalReelUrls, added during
  // Advanced Edit rather than only at first import.
  additionalVideoUrls?: string[]

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
  // Beyond the one primary link above — a piece can genuinely mention more
  // than one partner/product worth linking (e.g. a roundup-style post).
  additionalLinks?: { partnerId?: string; label: string; url: string }[]

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

  // How the video should be framed on the published page. Defaults to
  // 'vertical' (a phone-frame 9:16 box) — but a YouTube Short pasted in as
  // originalUrl/reelVideoUrl is still vertical, while a regular landscape
  // YouTube video needs the wide 16:9 frame instead, and there's no reliable
  // way to detect that automatically from the URL alone.
  videoOrientation?: 'vertical' | 'landscape'
}

export interface ImportedContentFilter {
  founderId?: string
  businessId?: string
  status?: ImportedContentStatus
  platform?: ImportedContentPlatform
  publicOnly?: boolean
}
