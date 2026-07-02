// ─── Primitives ────────────────────────────────────────────────────────────────

export type Status = 'draft' | 'submitted' | 'published' | 'featured' | 'archived'
export type ContentType =
  | 'blog' | 'reel' | 'carousel'
  | 'podcast' | 'talking-head' | 'voice-over'
  | 'photo-story' | 'document' | 'external-article'
  | 'youtube-video' | 'social-post'
export type NoticeType = 'event' | 'collaboration' | 'opportunity' | 'request'
export type PermissionRole = 'visitor' | 'founder' | 'business' | 'moderator' | 'admin'
export type PublishingSource =
  | 'manual-dashboard'
  | 'piazza-form'
  | 'canva-api'
  | 'website-import'
  | 'youtube-import'
  | 'one-drive-import'
  | 'system-generated'
export type ResourceType = 'guide' | 'template' | 'tool' | 'framework' | 'video' | 'article'
export type PriceType = 'flat' | 'monthly' | 'hourly' | 'custom'

export type ProductType =
  | 'book' | 'novel' | 'ebook' | 'pdf' | 'guide' | 'checklist' | 'workbook'
  | 'course' | 'prompt-pack' | 'template' | 'canva-template' | 'framework'
  | 'worksheet' | 'printable' | 'research' | 'presentation' | 'audio'
  | 'video' | 'toolkit' | 'bundle'

export type LibraryStatus =
  | 'coming-soon' | 'available' | 'pre-order' | 'sold-out'
  | 'free-download' | 'external' | 'members-only' | 'early-access' | 'archived'

export type PurchaseProvider =
  | 'internal' | 'amazon' | 'audible' | 'shopify' | 'gumroad'
  | 'etsy' | 'website' | 'url'

// ─── Library Purchase Link ──────────────────────────────────────────────────────
// One product may exist in many places (Amazon, Kindle, Audible, Direct, etc.)

export interface LibraryPurchaseLink {
  label: string
  url: string
  provider: PurchaseProvider
  note?: string   // e.g. "Signed copy", "Paperback"
}

// ─── Library Created-From Entry ────────────────────────────────────────────────
// Documents the journey that led to this product being created.

export interface LibraryCreatedFromEntry {
  id: string
  date: string
  title: string
  description: string
  type: 'idea' | 'story' | 'milestone' | 'talk' | 'experience' | 'decision'
  linkSlug?: string   // slug of related story or idea
  linkType?: 'story' | 'idea'
}

// ─── Library Item ──────────────────────────────────────────────────────────────
// The permanent home for everything a founder has intentionally published —
// whether free, paid, internal, external, physical or digital.
// Purchasing is only one possible action. Discovery, learning and authority
// are the primary goals.

export interface LibraryItem {
  id: string
  slug: string
  title: string
  subtitle?: string
  description: string
  why?: string           // "Why did this exist?" in the creator's voice
  authorFounderId: string
  businessId?: string
  coverImage: string
  previewImages?: string[]
  productType: ProductType
  topics: Topic[]
  expertiseIds?: string[]
  location?: Location
  price?: string
  currency?: string
  status: LibraryStatus
  purchaseLinks: LibraryPurchaseLink[]
  deliveryMethod?: 'digital' | 'physical' | 'digital-and-physical'
  downloadable?: boolean
  featured: boolean
  createdAt: string
  relatedStoryIds?: string[]
  relatedIdeaIds?: string[]
  createdFrom?: LibraryCreatedFromEntry[]
  seoTitle?: string
  seoDescription?: string
}

// ─── Location ──────────────────────────────────────────────────────────────────

export interface Location {
  id: string
  slug: string
  name: string
  state: string
  country: string
  description: string
  image: string
}

// ─── Topic ─────────────────────────────────────────────────────────────────────

export interface Topic {
  id: string
  slug: string
  name: string
  description: string
  count: number
}

// ─── Industry ──────────────────────────────────────────────────────────────────

export interface Industry {
  id: string
  slug: string
  name: string
}

// ─── Offer / CTA ───────────────────────────────────────────────────────────────

export interface Offer {
  id: string
  title: string
  description: string
  ctaLabel: string
  ctaUrl: string
}

// ─── FAQ ───────────────────────────────────────────────────────────────────────
// Questions answered by a founder or business. Indexed, linkable, schema-ready.

export interface FAQ {
  id: string
  question: string
  answer: string
  topicIds: string[]
  expertiseIds: string[]
  relatedStoryIds: string[]
  relatedIdeaIds: string[]
}

// ─── Resource ──────────────────────────────────────────────────────────────────
// Curated links, tools, templates, guides. Each surfaces on expertise pages + profiles.

export interface Resource {
  id: string
  slug: string
  title: string
  description: string
  url: string
  type: ResourceType
  founderId?: string
  businessId?: string
  topicIds: string[]
  expertiseIds: string[]
  free: boolean
  ctaLabel: string
}

// ─── Service ───────────────────────────────────────────────────────────────────
// Structured service offering. Surfaces on business profile + expertise pages.

export interface Service {
  id: string
  slug: string
  name: string
  description: string
  deliverable?: string
  price?: string
  priceType?: PriceType
  businessId: string
  founderId: string
  topicIds: string[]
  expertiseIds: string[]
  ctaLabel: string
  ctaUrl: string
  // Optional: services with no status are treated as 'published' (the only state
  // they could ever be in before Sprint 19B added a real status column/policy).
  status?: Status
}

// ─── Product ───────────────────────────────────────────────────────────────────

export interface Product {
  id: string
  slug: string
  name: string
  description: string
  price?: string
  image?: string
  businessId: string
  founderId: string
  topicIds: string[]
  ctaLabel: string
  ctaUrl: string
}

// ─── Case Study ────────────────────────────────────────────────────────────────
// Documented result. Shows authority and surfaces on business profile + expertise pages.

export interface CaseStudy {
  id: string
  slug: string
  title: string
  summary: string
  challenge: string
  outcome: string
  result?: string
  founderId: string
  businessId: string
  topicIds: string[]
  expertiseIds: string[]
  relatedStoryIds: string[]
  createdAt: string
}

// ─── Talk ──────────────────────────────────────────────────────────────────────
// Speaking appearances. Builds authority on expertise pages + founder profiles.

export interface Talk {
  id: string
  title: string
  event: string
  date?: string
  location?: string
  description: string
  videoUrl?: string
  founderId: string
  topicIds: string[]
  expertiseIds: string[]
}

// ─── Testimonial ───────────────────────────────────────────────────────────────

export interface Testimonial {
  id: string
  quote: string
  authorName: string
  authorRole?: string
  authorCompany?: string
  authorAvatar?: string
  founderId?: string
  businessId?: string
  serviceId?: string
  featured: boolean
  createdAt: string
}

// ─── Media Mention ─────────────────────────────────────────────────────────────

export interface MediaMention {
  id: string
  title: string
  publication: string
  url?: string
  date?: string
  founderId?: string
  businessId?: string
  description?: string
}

// ─── Award ─────────────────────────────────────────────────────────────────────

export interface Award {
  id: string
  title: string
  issuer: string
  year: string
  description?: string
  founderId?: string
  businessId?: string
}

// ─── Timeline Entry ────────────────────────────────────────────────────────────

export interface TimelineEntry {
  id: string
  date: string
  title: string
  description: string
  type: 'business' | 'story' | 'milestone' | 'talk' | 'award' | 'product'
  linkUrl?: string
  linkLabel?: string
}

// ─── Expertise ─────────────────────────────────────────────────────────────────
// Aggregation pages. Each expertise slug becomes a canonical URL like /expertise/storytelling.
// Founders, businesses, stories, ideas, resources, FAQs all surface here.

export interface Expertise {
  id: string
  slug: string
  name: string
  tagline: string
  description: string
  icon?: string
  topicIds: string[]
  // Aggregated at runtime from cross-entity relationships
  founderIds: string[]
  businessIds: string[]
  storyIds: string[]
  ideaIds: string[]
  resourceIds: string[]
  serviceIds: string[]
  caseStudyIds: string[]
  talkIds: string[]
  seoTitle?: string
  seoDescription?: string
}

// ─── Evidence Metrics ──────────────────────────────────────────────────────────
// Computed credibility metrics. Not stored — derived at runtime from all entities.

export interface EvidenceMetrics {
  storiesCount: number
  ideasCount: number
  faqsCount: number
  resourcesCount: number
  eventsCount: number
  businessesCount: number
  servicesCount: number
  testimonialsCount: number
  talksCount: number
  caseStudiesCount: number
  topicsCount: number
  yearsPublishing: number
  contentTypes: {
    blogs: number
    reels: number
    carousels: number
  }
}

// ─── Founder ───────────────────────────────────────────────────────────────────

export type FounderProfileStatus = 'claimed' | 'village-curated' | 'claim-pending' | 'verified'

export interface Founder {
  id: string
  slug: string
  name: string
  bio: string
  avatar: string
  coverImage?: string
  location: Location
  industry: Industry
  businessId: string
  topics: Topic[]
  website?: string
  instagram?: string
  linkedin?: string
  youtube?: string
  tiktok?: string
  podcast?: string
  newsletter?: string
  status: Status
  featured: boolean
  createdAt: string
  // Knowledge graph extensions
  expertiseIds?: string[]
  faqs?: FAQ[]
  resourceIds?: string[]
  talkIds?: string[]
  testimonialIds?: string[]
  awardIds?: string[]
  mediaMentionIds?: string[]
  timeline?: TimelineEntry[]
  // Profile ownership (Sprint 15)
  // userId: set only when the founder created/published this profile themselves
  // (Onboarding self-publish). Never set by admin-driven writes (curated builder,
  // bulk import, Village HQ edits) — see getCurrentFounder() resolution order.
  userId?: string
  profileStatus?: FounderProfileStatus
  curatedBy?: string
  curatedAt?: string
  claimedAt?: string
  claimedByUserId?: string // TODO: wire to Supabase auth transfer in future sprint
  claimEmail?: string
  claimNotes?: string
  isClaimable?: boolean
  // Sprint 3.5 — Village Intelligence pipeline: a real, persisted, recomputed-
  // on-publish score (see computeAuthorityScore in services/ideaSync.ts).
  // Heuristic, not ML — deterministic from ideas created/strengthened, stories
  // published and business connections. Never fabricated for display only.
  authorityScore?: number
  // Metadata
  seoTitle?: string
  seoDescription?: string
}

// ─── Business ──────────────────────────────────────────────────────────────────

export type BusinessCategory = 'business' | 'platform' | 'community' | 'event'

export interface Business {
  id: string
  slug: string
  name: string
  tagline: string
  description: string
  logo: string
  coverImage: string
  founderId: string
  category?: BusinessCategory
  location: Location
  industry: Industry
  industriesServed?: Industry[]
  topics: Topic[]
  website?: string
  instagram?: string
  linkedin?: string
  offers: Offer[]
  status: Status
  featured: boolean
  createdAt: string
  // Knowledge graph extensions
  expertiseIds?: string[]
  serviceIds?: string[]
  productIds?: string[]
  caseStudyIds?: string[]
  testimonialIds?: string[]
  faqs?: FAQ[]
  resourceIds?: string[]
  // Sprint 3.5 — Village Intelligence pipeline: same real, recomputed-on-publish
  // score as Founder.authorityScore (see services/ideaSync.ts).
  authorityScore?: number
  // Partnership Operating System fields (managed by Partnership Engine)
  partnerEnabled?: boolean       // Business is discoverable in the Partnership Engine
  villageProActive?: boolean     // Business has an active Village Pro account
  // Metadata
  seoTitle?: string
  seoDescription?: string
}

// ─── Story ─────────────────────────────────────────────────────────────────────
// A Story is the source of truth. Blog, Reel and Carousel are outputs of the same Story.

export interface Story {
  id: string
  slug: string
  title: string
  summary: string
  coverImage: string
  founderId: string
  businessId: string
  location: Location
  industry: Industry
  topics: Topic[]
  expertiseIds?: string[]
  // A Story can have multiple content outputs
  contentTypes: ContentType[]
  blog?: string
  reelUrl?: string
  audioUrl?: string
  carouselImages?: string[]
  // Relationships
  ideaIds: string[]
  relatedStoryIds: string[]
  // Set when this Story was built from an ImportedContent item via the Story
  // Builder's "Turn into Story" entry point — the source ImportedContent record
  // mirrors this back via its own relatedStoryId.
  importedContentId?: string
  // CTA
  ctaLabel: string
  ctaUrl: string
  // Metadata
  status: Status
  featured: boolean
  publishingSource?: PublishingSource
  createdAt: string
  updatedAt: string
  seoTitle?: string
  seoDescription?: string
}

// ─── Idea ──────────────────────────────────────────────────────────────────────
// An Idea is extracted knowledge that can span many Stories and Founders.

export interface Idea {
  id: string
  slug: string
  title: string
  description: string
  quote?: string
  quoteFounderId?: string
  topics: Topic[]
  expertiseIds?: string[]
  relatedStoryIds: string[]
  relatedFounderIds: string[]
  relatedBusinessIds: string[]
  featured: boolean
  status?: Status
  createdAt: string
  // Sprint 3.5 — Village Intelligence pipeline: the founder whose story caused
  // Village to create this idea (RLS ownership; see migration 006). Distinct
  // from relatedFounderIds, which can include other founders this idea also
  // connects to. relatedStoryIds.length IS this idea's "strength" — every time
  // a new story reinforces an existing idea instead of creating a duplicate,
  // that story's id is appended here rather than adding a separate counter.
  founderId?: string
}

// ─── Event / Notice ────────────────────────────────────────────────────────────

export interface Event {
  id: string
  slug: string
  title: string
  description: string
  coverImage?: string
  type: NoticeType
  founderId?: string
  businessId?: string
  location?: Location
  date?: string
  ctaLabel: string
  ctaUrl: string
  status: Status
  featured: boolean
  createdAt: string
}

// ─── Widget Filter Props ────────────────────────────────────────────────────────

export interface StoryFilter {
  ids?: string[]
  founderId?: string
  businessId?: string
  locationId?: string
  topicId?: string
  industryId?: string
  expertiseId?: string
  contentType?: ContentType
  featured?: boolean
  status?: Status
  publicOnly?: boolean
  limit?: number
}

export interface FounderFilter {
  ids?: string[]
  locationId?: string
  industryId?: string
  topicId?: string
  expertiseId?: string
  featured?: boolean
  publicOnly?: boolean
  limit?: number
}

export interface BusinessFilter {
  ids?: string[]
  locationId?: string
  industryId?: string
  topicId?: string
  expertiseId?: string
  featured?: boolean
  publicOnly?: boolean
  limit?: number
}

export interface IdeaFilter {
  topicId?: string
  expertiseId?: string
  founderId?: string
  businessId?: string
  storyId?: string
  featured?: boolean
  publicOnly?: boolean
  limit?: number
}

export interface EventFilter {
  type?: NoticeType
  locationId?: string
  founderId?: string
  featured?: boolean
  limit?: number
}

export interface LibraryFilter {
  founderId?: string
  businessId?: string
  productType?: ProductType
  topicId?: string
  expertiseId?: string
  status?: LibraryStatus
  featured?: boolean
  limit?: number
}

// ─── Media ─────────────────────────────────────────────────────────────────────
// First-class Media object. Every approved asset in the Village knowledge graph.
// Imported content is always a suggestion until the founder approves it.

export type MediaType =
  | 'image' | 'video' | 'logo' | 'headshot' | 'cover'
  | 'product-photo' | 'speaking-photo' | 'screenshot' | 'reel'
  | 'carousel' | 'youtube-video' | 'podcast-art' | 'book-cover'
  | 'press-image' | 'document-preview'

export type AssetRole =
  | 'profile-photo' | 'founder-cover' | 'business-logo' | 'business-cover'
  | 'story-cover' | 'library-cover' | 'product-gallery' | 'service-cover'
  | 'speaking-proof' | 'testimonial-proof' | 'behind-the-scenes'
  | 'social-proof' | 'website-hero' | 'press-feature'
  | 'youtube-embed' | 'carousel-slide' | 'reel-preview'

export type SourceType =
  | 'manual-upload' | 'official-website' | 'linkedin' | 'instagram'
  | 'youtube' | 'tiktok' | 'amazon' | 'podcast' | 'speaker-page'
  | 'canva-publish' | 'system-generated'

export type ApprovalStatus = 'approved' | 'rejected' | 'needs-review' | 'pending'

export interface Media {
  id: string
  slug: string
  title: string
  description?: string
  mediaType: MediaType
  assetRole: AssetRole
  sourceType: SourceType
  sourceUrl?: string        // Original URL where asset was discovered
  fileUrl: string           // Stored/placeholder asset URL
  thumbnailUrl?: string     // Thumbnail for video/reel assets
  altText: string           // Required for SEO/accessibility
  caption?: string
  credit?: string
  copyrightOwner?: string
  approved: boolean
  approvalStatus: ApprovalStatus
  featured: boolean
  relatedFounderIds: string[]
  relatedBusinessIds: string[]
  relatedStoryIds: string[]
  relatedLibraryItemIds: string[]
  relatedServiceIds: string[]
  relatedExpertiseIds: string[]
  relatedTopicIds: string[]
  createdAt: string
  updatedAt: string
}

// ─── Import Suggestion ─────────────────────────────────────────────────────────
// Suggested text fields discovered from public sources.
// Never published directly — always requires founder review.

export type ConfidenceLevel = 'high' | 'medium' | 'low'

export interface ImportSuggestion {
  id: string
  field: string             // e.g. 'bio', 'businessDescription', 'faq', 'serviceDescription'
  suggestedValue: string
  sourceUrl: string
  sourceType: SourceType
  confidenceLevel: ConfidenceLevel
  reviewStatus: ApprovalStatus
  approvedValue?: string    // Set when founder edits + approves
  relatedFounderId?: string
  relatedBusinessId?: string
  createdAt: string
}

// ─── Import Source ─────────────────────────────────────────────────────────────
// An entry point the curator uses to discover assets and text.

export interface ImportSource {
  id: string
  label: string
  sourceType: SourceType
  url: string
  relatedFounderId?: string
  relatedBusinessId?: string
  lastScannedAt?: string
  status: 'pending' | 'scanning' | 'complete' | 'error'
  discoveredMediaCount?: number
  discoveredSuggestionCount?: number
}

// ─── Media Filter ──────────────────────────────────────────────────────────────

export interface MediaFilter {
  founderId?: string
  businessId?: string
  mediaType?: MediaType
  assetRole?: AssetRole
  sourceType?: SourceType
  approvalStatus?: ApprovalStatus
  featured?: boolean
  limit?: number
}

// ─── Piazza Submission ─────────────────────────────────────────────────────────

export interface PiazzaSubmission {
  id: string
  title: string
  summary: string
  coverImage?: string
  contentTypes: ContentType[]
  reelUrl?: string
  blogContent?: string
  carouselImages?: string[]
  founderId: string
  businessId: string
  locationId: string
  industryId: string
  topicIds: string[]
  ctaLabel: string
  ctaUrl: string
  status: Status
  submittedAt: string
  distributedTo?: string[]
  extractedIdeaIds?: string[]
}
