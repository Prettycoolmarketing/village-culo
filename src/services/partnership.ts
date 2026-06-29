import { store } from '../lib/store'
import type {
  PartnerProgram,
  PublisherPartnerProfile,
  BusinessPartnerProfile,
  Recommendation,
  Opportunity,
  TrustProfile,
  Campaign,
  CampaignApplication,
  PublisherPartnershipSettings,
  BusinessPartnershipSettings,
  RecommendationFilter,
  OpportunityFilter,
  PartnerProgramFilter,
  CampaignFilter,
  FounderProgramEnrollment,
  FounderAffiliateLink,
  TrackingRecord,
  EnrollmentFilter,
  AffiliateLinkFilter,
  TrackingFilter,
} from '../types/partnership'

// ─── Store Keys ───────────────────────────────────────────────────────────────

const KEYS = {
  programs:                    'partnership_programs',
  publisherProfiles:           'partnership_publisher_profiles',
  businessProfiles:            'partnership_business_profiles',
  recommendations:             'partnership_recommendations',
  opportunities:               'partnership_opportunities',
  trustProfiles:               'partnership_trust_profiles',
  campaigns:                   'partnership_campaigns',
  campaignApplications:        'partnership_campaign_applications',
  publisherSettings:           'partnership_publisher_settings',
  businessSettings:            'partnership_business_settings',
  enrollments:                 'partnership_enrollments',
  affiliateLinks:              'partnership_affiliate_links',
  trackingRecords:             'partnership_tracking_records',
} as const

// ─── Helpers ──────────────────────────────────────────────────────────────────

function now() { return new Date().toISOString() }

// ─── Partner Program Service ──────────────────────────────────────────────────

export const programService = {
  getAll(filter?: PartnerProgramFilter): PartnerProgram[] {
    let items = store.get<PartnerProgram>(KEYS.programs) ?? []
    if (filter?.businessId) items = items.filter(p => p.businessId === filter.businessId)
    if (filter?.programType) items = items.filter(p => p.programType === filter.programType)
    if (filter?.status) items = items.filter(p => p.status === filter.status)
    if (filter?.isPublic !== undefined) items = items.filter(p => p.isPublic === filter.isPublic)
    if (filter?.limit) items = items.slice(0, filter.limit)
    return items
  },

  get(id: string): PartnerProgram | undefined {
    return (store.get<PartnerProgram>(KEYS.programs) ?? []).find(p => p.id === id)
  },

  upsert(program: PartnerProgram): void {
    program.updatedAt = now()
    store.update(KEYS.programs, program)
  },

  delete(id: string): void {
    const items = (store.get<PartnerProgram>(KEYS.programs) ?? []).filter(p => p.id !== id)
    store.set(KEYS.programs, items)
  },
}

// ─── Publisher Partner Profile Service ───────────────────────────────────────

export const publisherPartnerProfileService = {
  get(founderId: string): PublisherPartnerProfile | undefined {
    return (store.get<PublisherPartnerProfile>(KEYS.publisherProfiles) ?? [])
      .find(p => p.founderId === founderId)
  },

  upsert(profile: PublisherPartnerProfile): void {
    profile.updatedAt = now()
    store.update(KEYS.publisherProfiles, profile)
  },

  getOrCreate(founderId: string): PublisherPartnerProfile {
    const existing = this.get(founderId)
    if (existing) return existing
    const blank: PublisherPartnerProfile = {
      id: crypto.randomUUID(),
      founderId,
      enabled: false,
      receiveRecommendations: false,
      receiveOpportunities: false,
      receiveCampaigns: false,
      receiveBusinessMatches: false,
      receivePodcastOpportunities: false,
      receiveSpeakingOpportunities: false,
      receiveCollaborationRequests: false,
      openToSpeaking: false,
      openToPodcasts: false,
      openToGuestBlogs: false,
      openToWorkshops: false,
      openToMentoring: false,
      openToAdvisory: false,
      openToConsulting: false,
      openToFreelance: false,
      openToCampaigns: false,
      openToAffiliates: false,
      openToReferrals: false,
      openToCollaboration: false,
      createdAt: now(),
      updatedAt: now(),
    }
    this.upsert(blank)
    return blank
  },
}

// ─── Business Partner Profile Service ────────────────────────────────────────

export const businessPartnerProfileService = {
  get(businessId: string): BusinessPartnerProfile | undefined {
    return (store.get<BusinessPartnerProfile>(KEYS.businessProfiles) ?? [])
      .find(p => p.businessId === businessId)
  },

  upsert(profile: BusinessPartnerProfile): void {
    profile.updatedAt = now()
    store.update(KEYS.businessProfiles, profile)
  },

  getOrCreate(businessId: string): BusinessPartnerProfile {
    const existing = this.get(businessId)
    if (existing) return existing
    const blank: BusinessPartnerProfile = {
      id: crypto.randomUUID(),
      businessId,
      enabled: false,
      affiliateEnabled: false,
      referralEnabled: false,
      creatorEnabled: false,
      ambassadorEnabled: false,
      sponsorEnabled: false,
      podcastGuestEnabled: false,
      workshopPartnerEnabled: false,
      speakerOpportunitiesEnabled: false,
      brandCollaborationsEnabled: false,
      communityPartnerEnabled: false,
      mediaPartnerEnabled: false,
      technologyPartnerEnabled: false,
      customPartnershipEnabled: false,
      createdAt: now(),
      updatedAt: now(),
    }
    this.upsert(blank)
    return blank
  },
}

// ─── Recommendation Service ───────────────────────────────────────────────────

export const recommendationService = {
  getAll(filter?: RecommendationFilter): Recommendation[] {
    let items = store.get<Recommendation>(KEYS.recommendations) ?? []
    if (filter?.founderId) items = items.filter(r => r.founderId === filter.founderId)
    if (filter?.businessId) items = items.filter(r => r.businessId === filter.businessId)
    if (filter?.storyId) items = items.filter(r => r.storyId === filter.storyId)
    if (filter?.status) {
      const statuses = Array.isArray(filter.status) ? filter.status : [filter.status]
      items = items.filter(r => statuses.includes(r.status))
    }
    if (filter?.type) items = items.filter(r => r.entityType === filter.type)
    if (filter?.limit) items = items.slice(0, filter.limit)
    return items
  },

  get(id: string): Recommendation | undefined {
    return (store.get<Recommendation>(KEYS.recommendations) ?? []).find(r => r.id === id)
  },

  upsert(rec: Recommendation): void {
    rec.updatedAt = now()
    store.update(KEYS.recommendations, rec)
  },

  approve(id: string, publisherNote?: string): Recommendation | undefined {
    const rec = this.get(id)
    if (!rec) return undefined
    rec.status = 'approved'
    rec.approvedAt = now()
    rec.disclosureVisible = true
    if (publisherNote) rec.publisherNote = publisherNote
    this.upsert(rec)
    return rec
  },

  reject(id: string, reason?: string): Recommendation | undefined {
    const rec = this.get(id)
    if (!rec) return undefined
    rec.status = 'rejected'
    rec.rejectedAt = now()
    if (reason) rec.rejectionReason = reason
    this.upsert(rec)
    return rec
  },

  countByStatus(founderId: string): Record<string, number> {
    const all = this.getAll({ founderId })
    return {
      pending: all.filter(r => r.status === 'pending_review').length,
      approved: all.filter(r => r.status === 'approved').length,
      detected: all.filter(r => r.status === 'detected').length,
    }
  },
}

// ─── Opportunity Service ──────────────────────────────────────────────────────

export const opportunityService = {
  getAll(filter?: OpportunityFilter): Opportunity[] {
    let items = store.get<Opportunity>(KEYS.opportunities) ?? []
    if (filter?.founderId) items = items.filter(o => o.targetFounderId === filter.founderId)
    if (filter?.businessId) items = items.filter(o => o.businessId === filter.businessId)
    if (filter?.type) items = items.filter(o => o.type === filter.type)
    if (filter?.status) items = items.filter(o => o.status === filter.status)
    if (filter?.limit) items = items.slice(0, filter.limit)
    return items
  },

  get(id: string): Opportunity | undefined {
    return (store.get<Opportunity>(KEYS.opportunities) ?? []).find(o => o.id === id)
  },

  upsert(opportunity: Opportunity): void {
    opportunity.updatedAt = now()
    store.update(KEYS.opportunities, opportunity)
  },

  updateStatus(id: string, status: Opportunity['status']): void {
    const item = this.get(id)
    if (!item) return
    item.status = status
    item.updatedAt = now()
    this.upsert(item)
  },
}

// ─── Trust Profile Service ────────────────────────────────────────────────────

export const trustProfileService = {
  get(entityId: string): TrustProfile | undefined {
    return (store.get<TrustProfile>(KEYS.trustProfiles) ?? [])
      .find(t => t.entityId === entityId)
  },

  upsert(profile: TrustProfile): void {
    profile.updatedAt = now()
    store.update(KEYS.trustProfiles, profile)
  },

  getOrCreate(entityId: string, entityType: 'publisher' | 'business'): TrustProfile {
    const existing = this.get(entityId)
    if (existing) return existing
    const blank: TrustProfile = {
      id: crypto.randomUUID(),
      entityId,
      entityType,
      overallScore: 0,
      trustLevel: 'getting-started',
      knowledgeScore: 0,
      recommendationScore: 0,
      transparencyScore: 0,
      communityScore: 0,
      relationshipScore: 0,
      consistencyScore: 0,
      disclosureComplianceScore: 0,
      storiesPublished: 0,
      recommendationsApproved: 0,
      disclosureComplianceRate: 1.0,
      communityMemberships: 0,
      speakingEvents: 0,
      campaignsCompleted: 0,
      scoreHistory: [],
      lastCalculatedAt: now(),
      badges: [],
      createdAt: now(),
      updatedAt: now(),
    }
    this.upsert(blank)
    return blank
  },
}

// ─── Campaign Service ─────────────────────────────────────────────────────────

export const campaignService = {
  getAll(filter?: CampaignFilter): Campaign[] {
    let items = store.get<Campaign>(KEYS.campaigns) ?? []
    if (filter?.businessId) items = items.filter(c => c.businessId === filter.businessId)
    if (filter?.type) items = items.filter(c => c.type === filter.type)
    if (filter?.status) items = items.filter(c => c.status === filter.status)
    if (filter?.limit) items = items.slice(0, filter.limit)
    return items
  },

  get(id: string): Campaign | undefined {
    return (store.get<Campaign>(KEYS.campaigns) ?? []).find(c => c.id === id)
  },

  upsert(campaign: Campaign): void {
    campaign.updatedAt = now()
    store.update(KEYS.campaigns, campaign)
  },
}

export const campaignApplicationService = {
  getAll(campaignId?: string, founderId?: string): CampaignApplication[] {
    let items = store.get<CampaignApplication>(KEYS.campaignApplications) ?? []
    if (campaignId) items = items.filter(a => a.campaignId === campaignId)
    if (founderId) items = items.filter(a => a.founderId === founderId)
    return items
  },

  get(id: string): CampaignApplication | undefined {
    return (store.get<CampaignApplication>(KEYS.campaignApplications) ?? []).find(a => a.id === id)
  },

  upsert(app: CampaignApplication): void {
    app.updatedAt = now()
    store.update(KEYS.campaignApplications, app)
  },
}

// ─── Publisher Partnership Settings Service ───────────────────────────────────

export const publisherSettingsService = {
  get(founderId: string): PublisherPartnershipSettings | undefined {
    return (store.get<PublisherPartnershipSettings>(KEYS.publisherSettings) ?? [])
      .find(s => s.founderId === founderId)
  },

  getOrCreate(founderId: string): PublisherPartnershipSettings {
    const existing = this.get(founderId)
    if (existing) return existing
    const defaults: PublisherPartnershipSettings = {
      id: crypto.randomUUID(),
      founderId,
      partnershipEnabled: false,
      receiveRecommendations: false,
      receiveOpportunities: false,
      receiveCampaigns: false,
      receiveBusinessMatches: false,
      receivePodcastOpportunities: false,
      receiveSpeakingOpportunities: false,
      receiveCollaborationRequests: false,
      updatedAt: now(),
    }
    this.upsert(defaults)
    return defaults
  },

  upsert(settings: PublisherPartnershipSettings): void {
    settings.updatedAt = now()
    store.update(KEYS.publisherSettings, settings)
  },
}

// ─── Business Partnership Settings Service ────────────────────────────────────

export const businessSettingsService = {
  get(businessId: string): BusinessPartnershipSettings | undefined {
    return (store.get<BusinessPartnershipSettings>(KEYS.businessSettings) ?? [])
      .find(s => s.businessId === businessId)
  },

  getOrCreate(businessId: string): BusinessPartnershipSettings {
    const existing = this.get(businessId)
    if (existing) return existing
    const defaults: BusinessPartnershipSettings = {
      id: crypto.randomUUID(),
      businessId,
      villageProEnabled: false,
      affiliateEnabled: false,
      referralEnabled: false,
      creatorEnabled: false,
      ambassadorEnabled: false,
      sponsorEnabled: false,
      podcastGuestEnabled: false,
      workshopPartnerEnabled: false,
      speakerOpportunitiesEnabled: false,
      brandCollaborationsEnabled: false,
      communityPartnerEnabled: false,
      mediaPartnerEnabled: false,
      technologyPartnerEnabled: false,
      customPartnershipEnabled: false,
      updatedAt: now(),
    }
    this.upsert(defaults)
    return defaults
  },

  upsert(settings: BusinessPartnershipSettings): void {
    settings.updatedAt = now()
    store.update(KEYS.businessSettings, settings)
  },
}

// ─── Founder Program Enrollment Service ──────────────────────────────────────

export const enrollmentService = {
  getAll(filter?: EnrollmentFilter): FounderProgramEnrollment[] {
    let items = store.get<FounderProgramEnrollment>(KEYS.enrollments) ?? []
    if (filter?.founderId)  items = items.filter(e => e.founderId  === filter.founderId)
    if (filter?.programId)  items = items.filter(e => e.programId  === filter.programId)
    if (filter?.businessId) items = items.filter(e => e.businessId === filter.businessId)
    if (filter?.status)     items = items.filter(e => e.status     === filter.status)
    return items
  },

  get(id: string): FounderProgramEnrollment | undefined {
    return (store.get<FounderProgramEnrollment>(KEYS.enrollments) ?? []).find(e => e.id === id)
  },

  getActive(founderId: string, businessId: string): FounderProgramEnrollment | undefined {
    return (store.get<FounderProgramEnrollment>(KEYS.enrollments) ?? [])
      .find(e => e.founderId === founderId && e.businessId === businessId && e.status === 'active')
  },

  upsert(enrollment: FounderProgramEnrollment): void {
    enrollment.updatedAt = now()
    store.update(KEYS.enrollments, enrollment)
  },

  leave(id: string): void {
    const e = this.get(id)
    if (!e) return
    e.status    = 'left'
    e.updatedAt = now()
    store.update(KEYS.enrollments, e)
  },
}

// ─── Founder Affiliate Link Service ──────────────────────────────────────────

export const affiliateLinkService = {
  getAll(filter?: AffiliateLinkFilter): FounderAffiliateLink[] {
    let items = store.get<FounderAffiliateLink>(KEYS.affiliateLinks) ?? []
    if (filter?.founderId)  items = items.filter(l => l.founderId  === filter.founderId)
    if (filter?.businessId) items = items.filter(l => l.businessId === filter.businessId)
    return items
  },

  get(id: string): FounderAffiliateLink | undefined {
    return (store.get<FounderAffiliateLink>(KEYS.affiliateLinks) ?? []).find(l => l.id === id)
  },

  getForBusiness(founderId: string, businessId: string): FounderAffiliateLink | undefined {
    return (store.get<FounderAffiliateLink>(KEYS.affiliateLinks) ?? [])
      .find(l => l.founderId === founderId && l.businessId === businessId)
  },

  upsert(link: FounderAffiliateLink): void {
    link.updatedAt = now()
    store.update(KEYS.affiliateLinks, link)
  },

  delete(id: string): void {
    const items = (store.get<FounderAffiliateLink>(KEYS.affiliateLinks) ?? []).filter(l => l.id !== id)
    store.set(KEYS.affiliateLinks, items)
  },
}

// ─── Tracking Service ─────────────────────────────────────────────────────────

export const trackingService = {
  getAll(filter?: TrackingFilter): TrackingRecord[] {
    let items = store.get<TrackingRecord>(KEYS.trackingRecords) ?? []
    if (filter?.founderId)        items = items.filter(r => r.founderId        === filter.founderId)
    if (filter?.businessId)       items = items.filter(r => r.businessId       === filter.businessId)
    if (filter?.recommendationId) items = items.filter(r => r.recommendationId === filter.recommendationId)
    if (filter?.linkType)         items = items.filter(r => r.linkType         === filter.linkType)
    if (filter?.sourcePage)       items = items.filter(r => r.sourcePage       === filter.sourcePage)
    if (filter?.limit)            items = items.slice(0, filter.limit)
    return items
  },

  record(data: Omit<TrackingRecord, 'id' | 'clickedAt'>): TrackingRecord {
    const rec: TrackingRecord = { ...data, id: crypto.randomUUID(), clickedAt: now() }
    const existing = store.get<TrackingRecord>(KEYS.trackingRecords) ?? []
    store.set(KEYS.trackingRecords, [...existing, rec])
    return rec
  },
}
