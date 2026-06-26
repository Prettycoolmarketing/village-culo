// ─── Primitives ────────────────────────────────────────────────────────────────

export type Status = 'draft' | 'submitted' | 'published' | 'featured' | 'archived'
export type ContentType = 'blog' | 'reel' | 'carousel'
export type NoticeType = 'event' | 'collaboration' | 'opportunity' | 'request'
export type PermissionRole = 'visitor' | 'founder' | 'business' | 'moderator' | 'admin'

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
  count: number // number of stories using this topic
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
  topics: Topic[]
  website?: string
  instagram?: string
  linkedin?: string
  offers: Offer[]
  status: Status
  featured: boolean
  createdAt: string
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
// Shared filter shape used across all grid widgets so pages can assemble them declaratively.

export interface StoryFilter {
  ids?: string[]         // restrict to exactly these story IDs
  founderId?: string
  businessId?: string
  locationId?: string
  topicId?: string
  industryId?: string
  contentType?: ContentType
  featured?: boolean
  status?: Status
  limit?: number
}

export interface FounderFilter {
  ids?: string[]         // restrict to exactly these founder IDs
  locationId?: string
  industryId?: string
  topicId?: string
  featured?: boolean
  limit?: number
}

export interface BusinessFilter {
  ids?: string[]         // restrict to exactly these business IDs
  locationId?: string
  industryId?: string
  topicId?: string
  featured?: boolean
  limit?: number
}

export interface IdeaFilter {
  topicId?: string
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
  // Distribution preview — shown after publish
  distributedTo?: string[]
  extractedIdeaIds?: string[]
}
