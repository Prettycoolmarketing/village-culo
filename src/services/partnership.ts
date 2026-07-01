import { readCache, writeEntity, writeEntityUnowned, writeEntityBatch, deleteEntity, type WriteResult } from '../lib/entityStore'
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

// ─── Cache keys + Supabase table names ───────────────────────────────────────
// One service per Partnership Operating System entity. All now Supabase-backed
// (see Sprint 19B migration 002) — localStorage is a read cache populated by
// sync.ts, not the source of truth, the same as every other entity service.

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

const TABLES = {
  programs:             'partner_programs',
  publisherProfiles:    'publisher_partner_profiles',
  businessProfiles:     'business_partner_profiles',
  recommendations:      'recommendations',
  opportunities:        'opportunities',
  trustProfiles:        'trust_profiles',
  campaigns:            'campaigns',
  campaignApplications: 'campaign_applications',
  publisherSettings:    'publisher_partnership_settings',
  businessSettings:     'business_partnership_settings',
  enrollments:          'founder_program_enrollments',
  affiliateLinks:       'founder_affiliate_links',
  trackingRecords:      'tracking_records',
} as const

// ─── Helpers ──────────────────────────────────────────────────────────────────

function now() { return new Date().toISOString() }

// ─── Partner Program Service ──────────────────────────────────────────────────

export const programService = {
  getAll(filter?: PartnerProgramFilter): PartnerProgram[] {
    let items = readCache<PartnerProgram>(KEYS.programs)
    if (filter?.businessId) items = items.filter(p => p.businessId === filter.businessId)
    if (filter?.programType) items = items.filter(p => p.programType === filter.programType)
    if (filter?.status) items = items.filter(p => p.status === filter.status)
    if (filter?.isPublic !== undefined) items = items.filter(p => p.isPublic === filter.isPublic)
    if (filter?.limit) items = items.slice(0, filter.limit)
    return items
  },

  get(id: string): PartnerProgram | undefined {
    return readCache<PartnerProgram>(KEYS.programs).find(p => p.id === id)
  },

  upsert(program: PartnerProgram): Promise<WriteResult> {
    program.updatedAt = now()
    return writeEntity<PartnerProgram>({
      cacheKey: KEYS.programs,
      item: program,
      table: TABLES.programs,
      toRow: p => ({
        id: p.id, slug: p.slug, business_id: p.businessId, program_type: p.programType,
        status: p.status, is_public: p.isPublic, featured: p.featured, data: p,
      }),
    })
  },

  delete(id: string): Promise<WriteResult> {
    return deleteEntity({ cacheKey: KEYS.programs, id, table: TABLES.programs })
  },
}

// ─── Publisher Partner Profile Service ───────────────────────────────────────

export const publisherPartnerProfileService = {
  get(founderId: string): PublisherPartnerProfile | undefined {
    return readCache<PublisherPartnerProfile>(KEYS.publisherProfiles).find(p => p.founderId === founderId)
  },

  upsert(profile: PublisherPartnerProfile): Promise<WriteResult> {
    profile.updatedAt = now()
    return writeEntity<PublisherPartnerProfile>({
      cacheKey: KEYS.publisherProfiles,
      item: profile,
      table: TABLES.publisherProfiles,
      toRow: p => ({ id: p.id, founder_id: p.founderId, enabled: p.enabled, data: p }),
    })
  },

  // Synchronous on purpose: callers use this as a useState initializer. The blank
  // default is fully known without a round-trip, so the write happens in the
  // background rather than making every read-site async for a one-time bootstrap.
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
    void this.upsert(blank)
    return blank
  },
}

// ─── Business Partner Profile Service ────────────────────────────────────────

export const businessPartnerProfileService = {
  get(businessId: string): BusinessPartnerProfile | undefined {
    return readCache<BusinessPartnerProfile>(KEYS.businessProfiles).find(p => p.businessId === businessId)
  },

  upsert(profile: BusinessPartnerProfile): Promise<WriteResult> {
    profile.updatedAt = now()
    return writeEntity<BusinessPartnerProfile>({
      cacheKey: KEYS.businessProfiles,
      item: profile,
      table: TABLES.businessProfiles,
      toRow: p => ({ id: p.id, business_id: p.businessId, enabled: p.enabled, data: p }),
    })
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
    void this.upsert(blank)
    return blank
  },
}

// ─── Recommendation Service ───────────────────────────────────────────────────

function recommendationRow(r: Recommendation) {
  return {
    id: r.id, slug: r.slug, founder_id: r.founderId, business_id: r.businessId ?? null,
    story_id: r.storyId ?? null, status: r.status, visibility: r.visibility, featured: r.featured, data: r,
  }
}

export const recommendationService = {
  getAll(filter?: RecommendationFilter): Recommendation[] {
    let items = readCache<Recommendation>(KEYS.recommendations)
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
    return readCache<Recommendation>(KEYS.recommendations).find(r => r.id === id)
  },

  upsert(rec: Recommendation): Promise<WriteResult> {
    rec.updatedAt = now()
    return writeEntity<Recommendation>({
      cacheKey: KEYS.recommendations,
      item: rec,
      table: TABLES.recommendations,
      toRow: recommendationRow,
    })
  },

  /** One upsert call for a whole detection run's worth of new recommendations, instead of one per story/mention. */
  upsertBatch(recs: Recommendation[]): Promise<WriteResult> {
    const ts = now()
    const stamped = recs.map(r => ({ ...r, updatedAt: ts }))
    return writeEntityBatch<Recommendation>({
      cacheKey: KEYS.recommendations,
      items: stamped,
      table: TABLES.recommendations,
      toRow: recommendationRow,
    })
  },

  async approve(id: string, publisherNote?: string): Promise<WriteResult & { rec?: Recommendation }> {
    const rec = this.get(id)
    if (!rec) return { success: false, error: 'Recommendation not found' }
    rec.status = 'approved'
    rec.approvedAt = now()
    rec.disclosureVisible = true
    if (publisherNote) rec.publisherNote = publisherNote
    const result = await this.upsert(rec)
    return { ...result, rec: result.success ? rec : undefined }
  },

  async reject(id: string, reason?: string): Promise<WriteResult & { rec?: Recommendation }> {
    const rec = this.get(id)
    if (!rec) return { success: false, error: 'Recommendation not found' }
    rec.status = 'rejected'
    rec.rejectedAt = now()
    if (reason) rec.rejectionReason = reason
    const result = await this.upsert(rec)
    return { ...result, rec: result.success ? rec : undefined }
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

function opportunityRow(o: Opportunity) {
  return {
    id: o.id, slug: o.slug, business_id: o.businessId ?? null, target_founder_id: o.targetFounderId ?? null,
    status: o.status, visibility: o.visibility, data: o,
  }
}

export const opportunityService = {
  getAll(filter?: OpportunityFilter): Opportunity[] {
    let items = readCache<Opportunity>(KEYS.opportunities)
    if (filter?.founderId) items = items.filter(o => o.targetFounderId === filter.founderId)
    if (filter?.businessId) items = items.filter(o => o.businessId === filter.businessId)
    if (filter?.type) items = items.filter(o => o.type === filter.type)
    if (filter?.status) items = items.filter(o => o.status === filter.status)
    if (filter?.limit) items = items.slice(0, filter.limit)
    return items
  },

  get(id: string): Opportunity | undefined {
    return readCache<Opportunity>(KEYS.opportunities).find(o => o.id === id)
  },

  upsert(opportunity: Opportunity): Promise<WriteResult> {
    opportunity.updatedAt = now()
    return writeEntity<Opportunity>({
      cacheKey: KEYS.opportunities,
      item: opportunity,
      table: TABLES.opportunities,
      toRow: opportunityRow,
    })
  },

  /** One upsert call for a whole matching run's worth of new opportunities. */
  upsertBatch(opportunities: Opportunity[]): Promise<WriteResult> {
    const ts = now()
    const stamped = opportunities.map(o => ({ ...o, updatedAt: ts }))
    return writeEntityBatch<Opportunity>({
      cacheKey: KEYS.opportunities,
      items: stamped,
      table: TABLES.opportunities,
      toRow: opportunityRow,
    })
  },

  async updateStatus(id: string, status: Opportunity['status']): Promise<WriteResult> {
    const item = this.get(id)
    if (!item) return { success: false, error: 'Not found' }
    item.status = status
    item.updatedAt = now()
    return this.upsert(item)
  },
}

// ─── Trust Profile Service ────────────────────────────────────────────────────

export const trustProfileService = {
  get(entityId: string): TrustProfile | undefined {
    return readCache<TrustProfile>(KEYS.trustProfiles).find(t => t.entityId === entityId)
  },

  upsert(profile: TrustProfile): Promise<WriteResult> {
    profile.updatedAt = now()
    return writeEntity<TrustProfile>({
      cacheKey: KEYS.trustProfiles,
      item: profile,
      table: TABLES.trustProfiles,
      toRow: t => ({ id: t.id, entity_id: t.entityId, entity_type: t.entityType, data: t }),
    })
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
    void this.upsert(blank)
    return blank
  },
}

// ─── Campaign Service ─────────────────────────────────────────────────────────

export const campaignService = {
  getAll(filter?: CampaignFilter): Campaign[] {
    let items = readCache<Campaign>(KEYS.campaigns)
    if (filter?.businessId) items = items.filter(c => c.businessId === filter.businessId)
    if (filter?.type) items = items.filter(c => c.type === filter.type)
    if (filter?.status) items = items.filter(c => c.status === filter.status)
    if (filter?.limit) items = items.slice(0, filter.limit)
    return items
  },

  get(id: string): Campaign | undefined {
    return readCache<Campaign>(KEYS.campaigns).find(c => c.id === id)
  },

  upsert(campaign: Campaign): Promise<WriteResult> {
    campaign.updatedAt = now()
    return writeEntity<Campaign>({
      cacheKey: KEYS.campaigns,
      item: campaign,
      table: TABLES.campaigns,
      toRow: c => ({
        id: c.id, slug: c.slug, business_id: c.businessId, status: c.status,
        is_public: c.isPublic, featured: c.featured, data: c,
      }),
    })
  },
}

export const campaignApplicationService = {
  getAll(campaignId?: string, founderId?: string): CampaignApplication[] {
    let items = readCache<CampaignApplication>(KEYS.campaignApplications)
    if (campaignId) items = items.filter(a => a.campaignId === campaignId)
    if (founderId) items = items.filter(a => a.founderId === founderId)
    return items
  },

  get(id: string): CampaignApplication | undefined {
    return readCache<CampaignApplication>(KEYS.campaignApplications).find(a => a.id === id)
  },

  upsert(app: CampaignApplication): Promise<WriteResult> {
    app.updatedAt = now()
    return writeEntity<CampaignApplication>({
      cacheKey: KEYS.campaignApplications,
      item: app,
      table: TABLES.campaignApplications,
      toRow: a => ({
        id: a.id, campaign_id: a.campaignId, founder_id: a.founderId, status: a.status,
        applied_at: a.appliedAt, data: a,
      }),
    })
  },
}

// ─── Publisher Partnership Settings Service ───────────────────────────────────

export const publisherSettingsService = {
  get(founderId: string): PublisherPartnershipSettings | undefined {
    return readCache<PublisherPartnershipSettings>(KEYS.publisherSettings).find(s => s.founderId === founderId)
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
    void this.upsert(defaults)
    return defaults
  },

  upsert(settings: PublisherPartnershipSettings): Promise<WriteResult> {
    settings.updatedAt = now()
    return writeEntity<PublisherPartnershipSettings>({
      cacheKey: KEYS.publisherSettings,
      item: settings,
      table: TABLES.publisherSettings,
      toRow: s => ({ id: s.id, founder_id: s.founderId, data: s }),
    })
  },
}

// ─── Business Partnership Settings Service ────────────────────────────────────

export const businessSettingsService = {
  get(businessId: string): BusinessPartnershipSettings | undefined {
    return readCache<BusinessPartnershipSettings>(KEYS.businessSettings).find(s => s.businessId === businessId)
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
    void this.upsert(defaults)
    return defaults
  },

  upsert(settings: BusinessPartnershipSettings): Promise<WriteResult> {
    settings.updatedAt = now()
    return writeEntity<BusinessPartnershipSettings>({
      cacheKey: KEYS.businessSettings,
      item: settings,
      table: TABLES.businessSettings,
      toRow: s => ({ id: s.id, business_id: s.businessId, data: s }),
    })
  },
}

// ─── Founder Program Enrollment Service ──────────────────────────────────────

export const enrollmentService = {
  getAll(filter?: EnrollmentFilter): FounderProgramEnrollment[] {
    let items = readCache<FounderProgramEnrollment>(KEYS.enrollments)
    if (filter?.founderId)  items = items.filter(e => e.founderId  === filter.founderId)
    if (filter?.programId)  items = items.filter(e => e.programId  === filter.programId)
    if (filter?.businessId) items = items.filter(e => e.businessId === filter.businessId)
    if (filter?.status)     items = items.filter(e => e.status     === filter.status)
    return items
  },

  get(id: string): FounderProgramEnrollment | undefined {
    return readCache<FounderProgramEnrollment>(KEYS.enrollments).find(e => e.id === id)
  },

  getActive(founderId: string, businessId: string): FounderProgramEnrollment | undefined {
    return readCache<FounderProgramEnrollment>(KEYS.enrollments)
      .find(e => e.founderId === founderId && e.businessId === businessId && e.status === 'active')
  },

  upsert(enrollment: FounderProgramEnrollment): Promise<WriteResult> {
    enrollment.updatedAt = now()
    return writeEntity<FounderProgramEnrollment>({
      cacheKey: KEYS.enrollments,
      item: enrollment,
      table: TABLES.enrollments,
      toRow: e => ({
        id: e.id, founder_id: e.founderId, program_id: e.programId, business_id: e.businessId,
        status: e.status, enrolled_at: e.enrolledAt, data: e,
      }),
    })
  },

  async leave(id: string): Promise<WriteResult> {
    const e = this.get(id)
    if (!e) return { success: false, error: 'Not found' }
    e.status = 'left'
    return this.upsert(e)
  },
}

// ─── Founder Affiliate Link Service ──────────────────────────────────────────

export const affiliateLinkService = {
  getAll(filter?: AffiliateLinkFilter): FounderAffiliateLink[] {
    let items = readCache<FounderAffiliateLink>(KEYS.affiliateLinks)
    if (filter?.founderId)  items = items.filter(l => l.founderId  === filter.founderId)
    if (filter?.businessId) items = items.filter(l => l.businessId === filter.businessId)
    return items
  },

  get(id: string): FounderAffiliateLink | undefined {
    return readCache<FounderAffiliateLink>(KEYS.affiliateLinks).find(l => l.id === id)
  },

  getForBusiness(founderId: string, businessId: string): FounderAffiliateLink | undefined {
    return readCache<FounderAffiliateLink>(KEYS.affiliateLinks)
      .find(l => l.founderId === founderId && l.businessId === businessId)
  },

  upsert(link: FounderAffiliateLink): Promise<WriteResult> {
    link.updatedAt = now()
    return writeEntity<FounderAffiliateLink>({
      cacheKey: KEYS.affiliateLinks,
      item: link,
      table: TABLES.affiliateLinks,
      toRow: l => ({ id: l.id, founder_id: l.founderId, business_id: l.businessId, data: l }),
    })
  },

  delete(id: string): Promise<WriteResult> {
    return deleteEntity({ cacheKey: KEYS.affiliateLinks, id, table: TABLES.affiliateLinks })
  },
}

// ─── Tracking Service ─────────────────────────────────────────────────────────
// Click tracking is the one place an anonymous visitor writes a partnership row —
// recording a click on a public recommendation link requires no auth (RLS allows
// public INSERT on tracking_records; SELECT stays owner/admin-only).

export const trackingService = {
  getAll(filter?: TrackingFilter): TrackingRecord[] {
    let items = readCache<TrackingRecord>(KEYS.trackingRecords)
    if (filter?.founderId)        items = items.filter(r => r.founderId        === filter.founderId)
    if (filter?.businessId)       items = items.filter(r => r.businessId       === filter.businessId)
    if (filter?.recommendationId) items = items.filter(r => r.recommendationId === filter.recommendationId)
    if (filter?.linkType)         items = items.filter(r => r.linkType         === filter.linkType)
    if (filter?.sourcePage)       items = items.filter(r => r.sourcePage       === filter.sourcePage)
    if (filter?.limit)            items = items.slice(0, filter.limit)
    return items
  },

  async record(data: Omit<TrackingRecord, 'id' | 'clickedAt'>): Promise<TrackingRecord> {
    const rec: TrackingRecord = { ...data, id: crypto.randomUUID(), clickedAt: now() }
    await writeEntityUnowned<TrackingRecord>({
      cacheKey: KEYS.trackingRecords,
      item: rec,
      table: TABLES.trackingRecords,
      toRow: r => ({
        id: r.id, founder_id: r.founderId, business_id: r.businessId, recommendation_id: r.recommendationId ?? null,
        link_type: r.linkType, source_page: r.sourcePage ?? null, redirect_url: r.redirectUrl, clicked_at: r.clickedAt,
      }),
    })
    return rec
  },
}

