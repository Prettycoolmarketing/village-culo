// ─── Partnership Operating System — Type Definitions ─────────────────────────
// Every type here extends the Entity Blueprint principles:
// id (UUID), slug, status, visibility, owner, created_at, updated_at

// ─── Enumerations ─────────────────────────────────────────────────────────────

export type PartnerProgramType =
  | 'affiliate'
  | 'referral'
  | 'creator'
  | 'ambassador'
  | 'influencer'
  | 'technology-partner'
  | 'community-partner'
  | 'media-partner'
  | 'podcast-partner'
  | 'speaker-partner'
  | 'workshop-partner'
  | 'event-partner'
  | 'sponsor'
  | 'education-partner'
  | 'agency-partner'
  | 'reseller'
  | 'marketplace'
  | 'custom'

export type PartnershipStatus =
  | 'draft'
  | 'active'
  | 'paused'
  | 'inactive'
  | 'suspended'
  | 'archived'

export type RecommendationStatus =
  | 'detected'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'ignored'
  | 'expired'
  | 'withdrawn'

export type RecommendationType =
  | 'product'
  | 'service'
  | 'software'
  | 'business'
  | 'book'
  | 'podcast'
  | 'community'
  | 'event'
  | 'course'
  | 'person'
  | 'tool'
  | 'resource'
  | 'local-business'
  | 'experience'

export type MentionType =
  | 'experience'
  | 'recommendation'
  | 'reference'
  | 'comparison'
  | 'teaching'
  | 'criticism'
  | 'question'
  | 'unknown'

export type DisclosureType =
  | 'affiliate'
  | 'referral'
  | 'sponsored'
  | 'gifted'
  | 'paid-partnership'
  | 'ambassador'
  | 'creator-program'
  | 'community-partner'
  | 'none'

export type OpportunityType =
  | 'business-partnership'
  | 'recommendation'
  | 'affiliate'
  | 'referral'
  | 'creator-campaign'
  | 'speaking'
  | 'podcast-guest'
  | 'workshop'
  | 'media-interview'
  | 'collaboration'
  | 'guest-blog'
  | 'case-study'
  | 'mentoring'
  | 'advisory'
  | 'community-intro'
  | 'technology-partnership'
  | 'event-speaker'
  | 'custom'

export type OpportunityStatus =
  | 'suggested'
  | 'saved'
  | 'applied'
  | 'interested'
  | 'accepted'
  | 'declined'
  | 'expired'
  | 'archived'

export type TrustLevel = 'getting-started' | 'building' | 'strong' | 'trusted' | 'highly-trusted'

export type CampaignStatus =
  | 'draft'
  | 'published'
  | 'applications-open'
  | 'in-progress'
  | 'review'
  | 'completed'
  | 'archived'
  | 'cancelled'

export type CampaignType =
  | 'affiliate'
  | 'referral'
  | 'launch'
  | 'product'
  | 'brand-awareness'
  | 'content'
  | 'video'
  | 'podcast'
  | 'workshop'
  | 'speaker'
  | 'community'
  | 'education'
  | 'local'
  | 'event'
  | 'ugc'
  | 'case-study'
  | 'custom'

export type ApplicationStatus =
  | 'applied'
  | 'shortlisted'
  | 'approved'
  | 'rejected'
  | 'withdrawn'
  | 'completed'

// ─── Partner Program ──────────────────────────────────────────────────────────
// A formal program a Business creates to invite Publishers to recommend them.

export interface PartnerProgram {
  id: string
  slug: string
  name: string
  description?: string
  shortDescription?: string
  businessId: string
  partnerId?: string
  programType: PartnerProgramType
  status: PartnershipStatus
  featured: boolean
  isPublic: boolean

  // Eligibility
  countries: string[]
  languages: string[]
  industries: string[]
  topics: string[]

  // Benefits
  commissionType?: 'percentage' | 'flat' | 'tiered' | 'custom'
  commissionValue?: string
  cookieDurationDays?: number
  rewards?: string[]            // ["10% commission", "Free product", "Speaking opportunity"]

  // Requirements
  minimumExperience?: string
  requirements?: string[]
  idealPublisher?: string

  // Content preferences
  preferredFormats?: string[]
  contentGuidelines?: string

  // Disclosure
  disclosureType: DisclosureType
  disclosureText?: string

  // Application
  applicationMode: 'open' | 'application' | 'invitation' | 'approval'
  applicationUrl?: string
  termsUrl?: string
  landingPageUrl?: string

  // Assets
  mediaKitUrl?: string
  brandGuideUrl?: string

  // Tracking placeholders (future Stripe/PartnerStack)
  trackingEnabled: boolean
  stripeId?: string             // future

  createdAt: string
  updatedAt: string
}

// ─── Publisher Partner Profile ────────────────────────────────────────────────
// A Publisher's professional partnership profile. Powers matching and discovery.

export interface PublisherPartnerProfile {
  id: string
  founderId: string
  enabled: boolean

  // Settings (Sprint 1 toggles)
  receiveRecommendations: boolean
  receiveOpportunities: boolean
  receiveCampaigns: boolean
  receiveBusinessMatches: boolean
  receivePodcastOpportunities: boolean
  receiveSpeakingOpportunities: boolean
  receiveCollaborationRequests: boolean

  // About
  professionalBio?: string
  mission?: string
  yearsExperience?: number
  currentProjects?: string[]
  availability?: 'available' | 'limited' | 'unavailable' | 'coming-soon'
  languages?: string[]
  countries?: string[]
  timezone?: string
  remote?: boolean

  // Expertise
  industries?: string[]
  topics?: string[]
  skills?: string[]
  software?: string[]           // Tools they use
  communities?: string[]        // Communities they belong to
  books?: string[]              // Books they recommend
  podcasts?: string[]           // Podcasts they follow
  events?: string[]             // Events they attend

  // Opportunities they're open to
  openToSpeaking: boolean
  openToPodcasts: boolean
  openToGuestBlogs: boolean
  openToWorkshops: boolean
  openToMentoring: boolean
  openToAdvisory: boolean
  openToConsulting: boolean
  openToFreelance: boolean
  openToCampaigns: boolean
  openToAffiliates: boolean
  openToReferrals: boolean
  openToCollaboration: boolean

  // What they genuinely use and recommend (powers Sprint 5 detection baseline)
  genuineRecommendations?: string[]

  // Who they want to connect with
  idealCollaborator?: string

  // Contact & visibility
  contactPreference?: 'open' | 'email' | 'direct-message' | 'application-form'
  profileVisibility?: 'public' | 'discoverable' | 'private'

  // Content preferences
  publishingFrequency?: string
  preferredFormats?: string[]

  // Trust placeholder
  trustScore?: number           // 0-100, calculated by Trust Engine (Sprint 7)
  knowledgeScore?: number
  recommendationScore?: number

  createdAt: string
  updatedAt: string
}

// ─── Business Partner Profile ─────────────────────────────────────────────────
// A Business's profile within the Partnership Operating System.

export interface BusinessPartnerProfile {
  id: string
  businessId: string
  enabled: boolean

  // Program toggles (Sprint 1)
  affiliateEnabled: boolean
  referralEnabled: boolean
  creatorEnabled: boolean
  ambassadorEnabled: boolean
  sponsorEnabled: boolean
  podcastGuestEnabled: boolean
  workshopPartnerEnabled: boolean
  speakerOpportunitiesEnabled: boolean
  brandCollaborationsEnabled: boolean
  communityPartnerEnabled: boolean
  mediaPartnerEnabled: boolean
  technologyPartnerEnabled: boolean
  customPartnershipEnabled: boolean

  // What they want recommended
  recommendationPriorities?: string[]
  idealPublisher?: string
  idealAudience?: string
  idealIndustries?: string[]
  idealTopics?: string[]
  idealContentTypes?: string[]

  // For Publishers — plain-English description written for matching, not marketing
  descriptionForDiscovery?: string

  // Where they operate
  locationsServed?: string[]

  // Discoverability
  keywords?: string[]
  searchPhrases?: string[]
  relatedBusinesses?: string[]

  // Contact & visibility
  contactPreference?: 'open' | 'email' | 'direct-message' | 'application-form'
  profileVisibility?: 'public' | 'discoverable' | 'private'

  // Trust placeholder
  trustScore?: number           // Sprint 7
  recommendationScore?: number
  campaignReliabilityScore?: number

  createdAt: string
  updatedAt: string
}

// ─── Recommendation ───────────────────────────────────────────────────────────
// A detected or approved commercial relationship between a Publisher and an entity.

export interface Recommendation {
  id: string
  slug: string
  founderId: string
  storyId?: string
  partnerId?: string
  businessId?: string           // Business being recommended
  entityName: string            // Name of the entity being recommended
  entityType: RecommendationType
  status: RecommendationStatus
  mentionType: MentionType

  // Detection metadata
  confidence: number            // 0.0 - 1.0
  confidenceReason?: string     // Why AI detected this
  detectedAt?: string
  detectedInContext?: string    // Excerpt from story where entity was found

  // Publisher decision
  approvedAt?: string
  rejectedAt?: string
  rejectionReason?: string
  publisherNote?: string

  // Disclosure
  disclosureType: DisclosureType
  disclosureText?: string
  disclosureVisible: boolean    // Must always be true when approved

  // Program link
  programId?: string
  programType?: PartnerProgramType
  trackingUrl?: string          // future affiliate/referral link

  // Analytics placeholders (Sprint 8)
  clickCount?: number
  conversionCount?: number
  revenueAttributed?: number

  featured: boolean
  visibility: 'public' | 'private' | 'system'

  createdAt: string
  updatedAt: string
}

// ─── Opportunity ──────────────────────────────────────────────────────────────
// A growth or partnership opportunity surfaced by the Growth Engine.

export interface Opportunity {
  id: string
  slug: string
  title: string
  description?: string
  summary?: string
  type: OpportunityType
  status: OpportunityStatus

  // Source
  sourceType: 'business' | 'community' | 'event' | 'campaign' | 'ai' | 'admin' | 'knowledge-graph'
  businessId?: string
  communityId?: string
  campaignId?: string   // reserved for Campaign Engine (Sprint 9)
  programId?: string    // links to PartnerProgram that generated this opportunity

  // Targeting
  targetFounderId?: string      // If targeted at a specific publisher
  countries?: string[]
  industries?: string[]
  topics?: string[]
  requirements?: string[]

  // Match metadata (Sprint 6 will populate these)
  matchScore?: number           // 0.0-1.0 confidence score
  matchReason?: string          // Why this was matched
  matchedTopics?: string[]
  matchedIndustries?: string[]
  matchedStories?: string[]

  // Value
  estimatedValue?: string
  priority?: 'high' | 'medium' | 'low'

  // Expiry
  expiresAt?: string
  visibility: 'public' | 'targeted' | 'private'

  createdAt: string
  updatedAt: string
}

// ─── Trust Profile ────────────────────────────────────────────────────────────
// Trust & reputation data for a Publisher or Business.
// Calculated by Trust Engine (Sprint 7). Sprint 1 = placeholder structure only.

export interface TrustProfile {
  id: string
  entityId: string              // founderId or businessId
  entityType: 'publisher' | 'business'

  // Composite score
  overallScore: number          // 0-100
  trustLevel: TrustLevel

  // Component scores (Sprint 7 will calculate these)
  knowledgeScore: number
  recommendationScore: number
  transparencyScore: number
  communityScore: number
  relationshipScore: number
  consistencyScore: number
  disclosureComplianceScore: number

  // Trust signals count
  storiesPublished: number
  recommendationsApproved: number
  disclosureComplianceRate: number  // 0.0-1.0
  communityMemberships: number
  speakingEvents: number
  campaignsCompleted: number

  // Trend
  scoreHistory: Array<{ date: string; score: number }>
  lastCalculatedAt: string

  // Achievements (Sprint 7)
  badges: TrustBadge[]

  createdAt: string
  updatedAt: string
}

// ─── Trust Badge ──────────────────────────────────────────────────────────────

export interface TrustBadge {
  id: string
  name: string
  description: string
  icon: string
  category: 'publishing' | 'community' | 'recommendation' | 'knowledge' | 'trust' | 'speaking' | 'special'
  earnedAt: string
}

// ─── Campaign ─────────────────────────────────────────────────────────────────
// A business-created initiative to collaborate with publishers.

export interface Campaign {
  id: string
  slug: string
  name: string
  description?: string
  summary?: string
  businessId: string
  type: CampaignType
  status: CampaignStatus
  featured: boolean
  isPublic: boolean

  // Goals
  goals?: string[]
  targetAudience?: string

  // Requirements
  countries?: string[]
  languages?: string[]
  industries?: string[]
  topics?: string[]
  minimumTrust?: number
  requirements?: string[]
  preferredFormats?: string[]

  // Deliverables
  deliverableTypes?: string[]
  deliverableCount?: number

  // Timeline
  startDate?: string
  endDate?: string
  applicationDeadline?: string

  // Budget placeholders (Sprint 8)
  budgetRange?: string
  rewardType?: string
  rewardValue?: string

  // Analytics placeholders
  applicationCount?: number
  publisherCount?: number
  storiesCount?: number

  createdAt: string
  updatedAt: string
}

// ─── Campaign Application ─────────────────────────────────────────────────────

export interface CampaignApplication {
  id: string
  campaignId: string
  founderId: string
  status: ApplicationStatus
  note?: string
  appliedAt: string
  reviewedAt?: string
  reviewNote?: string
  completedAt?: string
  updatedAt: string
}

// ─── Partnership Settings (stored per publisher) ──────────────────────────────

export interface PublisherPartnershipSettings {
  id: string
  founderId: string
  partnershipEnabled: boolean
  receiveRecommendations: boolean
  receiveOpportunities: boolean
  receiveCampaigns: boolean
  receiveBusinessMatches: boolean
  receivePodcastOpportunities: boolean
  receiveSpeakingOpportunities: boolean
  receiveCollaborationRequests: boolean
  updatedAt: string
}

// ─── Business Partnership Settings ───────────────────────────────────────────

export interface BusinessPartnershipSettings {
  id: string
  businessId: string
  villageProEnabled: boolean
  affiliateEnabled: boolean
  referralEnabled: boolean
  creatorEnabled: boolean
  ambassadorEnabled: boolean
  sponsorEnabled: boolean
  podcastGuestEnabled: boolean
  workshopPartnerEnabled: boolean
  speakerOpportunitiesEnabled: boolean
  brandCollaborationsEnabled: boolean
  communityPartnerEnabled: boolean
  mediaPartnerEnabled: boolean
  technologyPartnerEnabled: boolean
  customPartnershipEnabled: boolean
  updatedAt: string
}

// ─── Founder Program Enrollment ───────────────────────────────────────────────
// A founder joining a Village Recommendation Program for a specific business.

export interface FounderProgramEnrollment {
  id: string
  founderId: string
  programId: string
  businessId: string
  recommendationId?: string     // which approved rec triggered this
  status: 'active' | 'paused' | 'left'
  enrolledAt: string
  updatedAt: string
}

// ─── Founder Affiliate Link ───────────────────────────────────────────────────
// A founder's own affiliate URL for a specific business.
// Takes priority after program enrollment in the link resolver.

export interface FounderAffiliateLink {
  id: string
  founderId: string
  businessId: string
  businessWebsite?: string      // stored for display; sourced from Business record
  affiliateUrl: string
  createdAt: string
  updatedAt: string
}

// ─── Tracking Record ──────────────────────────────────────────────────────────
// Created when a recommendation link is clicked on a public page.

export type TrackingLinkType = 'village-program' | 'affiliate' | 'normal'

export interface TrackingRecord {
  id: string
  founderId: string
  businessId: string
  recommendationId?: string
  storyId?: string
  linkType: TrackingLinkType
  clickedAt: string
  redirectUrl: string
  sourcePage?: 'story' | 'founder' | 'business'
}

// ─── Filters ─────────────────────────────────────────────────────────────────

export interface EnrollmentFilter {
  founderId?: string
  programId?: string
  businessId?: string
  status?: FounderProgramEnrollment['status']
}

export interface AffiliateLinkFilter {
  founderId?: string
  businessId?: string
}

export interface TrackingFilter {
  founderId?: string
  businessId?: string
  recommendationId?: string
  linkType?: TrackingLinkType
  sourcePage?: 'story' | 'founder' | 'business'
  limit?: number
}

export interface RecommendationFilter {
  founderId?: string
  businessId?: string
  status?: RecommendationStatus | RecommendationStatus[]
  type?: RecommendationType
  storyId?: string
  limit?: number
}

export interface OpportunityFilter {
  founderId?: string
  businessId?: string
  type?: OpportunityType
  status?: OpportunityStatus
  limit?: number
}

export interface PartnerProgramFilter {
  businessId?: string
  programType?: PartnerProgramType
  status?: PartnershipStatus
  isPublic?: boolean
  limit?: number
}

export interface CampaignFilter {
  businessId?: string
  founderId?: string
  type?: CampaignType
  status?: CampaignStatus
  limit?: number
}
