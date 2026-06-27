// ─── Primitives ────────────────────────────────────────────────────────────────

export type Status = 'draft' | 'submitted' | 'published' | 'featured' | 'archived'
export type ContentType = 'blog' | 'reel' | 'carousel'
export type NoticeType = 'event' | 'collaboration' | 'opportunity' | 'request'
export type PermissionRole = 'visitor' | 'founder' | 'business' | 'moderator' | 'admin'
export type ResourceType = 'guide' | 'template' | 'tool' | 'framework' | 'video' | 'article'
export type PriceType = 'flat' | 'monthly' | 'hourly' | 'custom'

export type ProductType =
  | 'book' | 'novel' | 'ebook' | 'pdf' | 'guide' | 'checklist' | 'workbook'
  | 'course' | 'prompt-pack' | 'template' | 'canva-template' | 'framework'
  | 'worksheet' | 'printable' | 'research' | 'presentation' | 'audio'
  | 'video' | 'toolkit' | 'bundle'

export type LibraryStatus =
  | 'coming-soon' | 'available' | 'pre-order' | 'sold-out'
  | 'free-download' | 'external' | 'members-only' | 'early-access'

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
  // Metadata
  seoTitle?: string
  seoDescription?: string
}

// ─── Business ──────────────────────────────────────────────────────────────────

export interface Business {
  id: string
  slug: string
  name: string
  tagline: string
  description: string
  logo: string
  coverImage: string
  founderId: string
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
  carouselImages?: string[]
  // Relationships
  ideaIds: string[]
  relatedStoryIds: string[]
  // CTA
  ctaLabel: string
  ctaUrl: string
  // Metadata
  status: Status
  featured: boolean
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
  createdAt: string
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
  limit?: number
}

export interface FounderFilter {
  ids?: string[]
  locationId?: string
  industryId?: string
  topicId?: string
  expertiseId?: string
  featured?: boolean
  limit?: number
}

export interface BusinessFilter {
  ids?: string[]
  locationId?: string
  industryId?: string
  topicId?: string
  expertiseId?: string
  featured?: boolean
  limit?: number
}

export interface IdeaFilter {
  topicId?: string
  expertiseId?: string
  founderId?: string
  businessId?: string
  storyId?: string
  featured?: boolean
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
