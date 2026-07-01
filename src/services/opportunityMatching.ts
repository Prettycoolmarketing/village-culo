import { getFounders } from './founders'
import { getBusinesses } from './businesses'
import {
  programService,
  publisherPartnerProfileService,
  recommendationService,
  opportunityService,
} from './partnership'
import type { Opportunity, OpportunityType } from '../types/partnership'
import type { PublisherPartnerProfile } from '../types/partnership'

// ─── Program type → opportunity type ─────────────────────────────────────────

const PROGRAM_TO_OPP: Record<string, OpportunityType> = {
  affiliate:            'affiliate',
  referral:             'referral',
  creator:              'creator-campaign',
  ambassador:           'creator-campaign',
  influencer:           'creator-campaign',
  'media-partner':      'guest-blog',
  'community-partner':  'collaboration',
  sponsor:              'creator-campaign',
  'podcast-partner':    'podcast-guest',
  'speaker-partner':    'speaking',
  'workshop-partner':   'workshop',
  'event-partner':      'speaking',
  'education-partner':  'mentoring',
  'technology-partner': 'business-partnership',
  'agency-partner':     'business-partnership',
  reseller:             'business-partnership',
  marketplace:          'business-partnership',
  custom:               'business-partnership',
}

// Publisher openTo field → opportunity types it enables
const OPEN_TO_TYPES: Array<{ key: keyof PublisherPartnerProfile; types: OpportunityType[] }> = [
  { key: 'openToSpeaking',     types: ['speaking']                       },
  { key: 'openToPodcasts',     types: ['podcast-guest']                  },
  { key: 'openToGuestBlogs',   types: ['guest-blog']                     },
  { key: 'openToWorkshops',    types: ['workshop']                       },
  { key: 'openToMentoring',    types: ['mentoring']                      },
  { key: 'openToAdvisory',     types: ['advisory']                       },
  { key: 'openToConsulting',   types: ['advisory']                       },
  { key: 'openToCampaigns',    types: ['creator-campaign']               },
  { key: 'openToAffiliates',   types: ['affiliate']                      },
  { key: 'openToReferrals',    types: ['referral']                       },
  { key: 'openToCollaboration',types: ['collaboration', 'community-intro']},
  { key: 'openToFreelance',    types: ['advisory']                       },
]

// ─── Human-readable opportunity labels ───────────────────────────────────────

const OPP_LABELS: Record<OpportunityType, string> = {
  'recommendation':         'Recommendation',
  'affiliate':              'Affiliate Program',
  'referral':               'Referral Program',
  'creator-campaign':       'Content Collaboration',
  'speaking':               'Speaking Opportunity',
  'podcast-guest':          'Podcast Appearance',
  'workshop':               'Workshop Partnership',
  'guest-blog':             'Guest Editorial',
  'case-study':             'Case Study',
  'mentoring':              'Mentoring or Education',
  'advisory':               'Advisory or Consulting',
  'community-intro':        'Community Introduction',
  'business-partnership':   'Business Partnership',
  'collaboration':          'Collaboration',
  'media-interview':        'Media Interview',
  'technology-partnership': 'Technology Partnership',
  'event-speaker':          'Event Speaking',
  'custom':                 'Custom Opportunity',
}

export function oppLabel(type: OpportunityType): string {
  return OPP_LABELS[type] ?? type.replace(/-/g, ' ')
}

// ─── Duplicate check ──────────────────────────────────────────────────────────

function alreadyExists(founderId: string, businessId: string, type: OpportunityType): boolean {
  return opportunityService
    .getAll({ founderId })
    .some(o => o.businessId === businessId && o.type === type)
}

// ─── Priority from score ──────────────────────────────────────────────────────

function priority(score: number): 'high' | 'medium' | 'low' {
  return score >= 0.75 ? 'high' : score >= 0.50 ? 'medium' : 'low'
}

// ─── Match result ─────────────────────────────────────────────────────────────

export interface MatchResult {
  generated: number
  skipped:   number
  businesses: number
  error?:    string
}

// ─── Main matching function ───────────────────────────────────────────────────
// Collects every generated opportunity and writes them in one batch at the end —
// see the equivalent note in recommendationDetection.ts.

export async function runMatching(founderId: string): Promise<MatchResult> {
  const founders  = getFounders()
  const founder   = founders.find(f => f.id === founderId) ?? founders[0]
  if (!founder) return { generated: 0, skipped: 0, businesses: 0 }

  const profile   = publisherPartnerProfileService.get(founderId)
  const businesses = getBusinesses()
  const allPrograms = programService.getAll({ status: 'active' })
  const approvedRecs = recommendationService.getAll({ founderId, status: 'approved' })
  const genuineSet = new Set(
    (profile?.genuineRecommendations ?? []).map(r => r.toLowerCase().trim())
  )

  // Which opportunity types the publisher is open to
  const openTypes = new Set<OpportunityType>()
  if (profile) {
    for (const { key, types } of OPEN_TO_TYPES) {
      if (profile[key] as boolean) types.forEach(t => openTypes.add(t))
    }
  }
  // Always include recommendation and collaboration as baseline types
  openTypes.add('recommendation')
  openTypes.add('collaboration')

  const ts = new Date().toISOString()
  let generated = 0
  let skipped   = 0
  const toWrite: Opportunity[] = []

  for (const biz of businesses) {
    if (!biz.name) continue

    const bizPrograms     = allPrograms.filter(p => p.businessId === biz.id)
    const bizTopicIds     = new Set(biz.topics.map(t => t.id))
    const sharedTopics    = founder.topics.filter(t => bizTopicIds.has(t.id))
    const sharedIndustry  = biz.industry?.id === founder.industry?.id
    const sameLocation    = biz.location?.id === founder.location?.id
    const hasApprovedRec  = approvedRecs.some(r => r.businessId === biz.id)
    const isGenuineRec    = genuineSet.has(biz.name.toLowerCase())
    const partnerEnabled  = !!biz.partnerEnabled

    // Minimum signal required: topics OR approved rec OR genuine rec OR active programs OR partner enabled
    const hasSignal = sharedTopics.length > 0 || hasApprovedRec || isGenuineRec || bizPrograms.length > 0 || partnerEnabled

    if (!hasSignal) continue

    // Determine which opportunity types to generate for this business
    const typesToGenerate = new Set<OpportunityType>()

    // 1. Approved recommendation → recommendation opportunity
    if (hasApprovedRec) typesToGenerate.add('recommendation')

    // 2. Active programs that match publisher's openTo
    for (const prog of bizPrograms) {
      const oppType = PROGRAM_TO_OPP[prog.programType as string]
      if (oppType && openTypes.has(oppType)) typesToGenerate.add(oppType)
    }

    // 3. Topic overlap → collaboration (if no program match already)
    if (sharedTopics.length >= 2 && typesToGenerate.size === 0) {
      typesToGenerate.add('collaboration')
    }

    // 4. Genuine rec → recommendation (if not already captured)
    if (isGenuineRec) typesToGenerate.add('recommendation')

    // If still nothing to generate (no open types matched), skip
    if (typesToGenerate.size === 0) continue

    for (const oppType of typesToGenerate) {
      if (alreadyExists(founderId, biz.id, oppType)) { skipped++; continue }

      // ── Score calculation ────────────────────────────────────────────────

      let score = 0.20 // base

      // Topic overlap: up to +0.30 (0.10 per topic, capped at 3)
      const topicBonus = Math.min(sharedTopics.length, 3) * 0.10
      score += topicBonus

      // Industry match: +0.10
      if (sharedIndustry) score += 0.10

      // Location match: +0.08
      if (sameLocation) score += 0.08

      // Publisher is open to this opportunity type: +0.20
      if (openTypes.has(oppType)) score += 0.20

      // Approved recommendation: +0.25
      if (hasApprovedRec) score += 0.25

      // Genuine recommendation: +0.15
      if (isGenuineRec) score += 0.15

      // Active program of this type exists: +0.12
      const hasMatchingProgram = bizPrograms.some(p => PROGRAM_TO_OPP[p.programType as string] === oppType)
      if (hasMatchingProgram) score += 0.12

      // Partner enabled: +0.05
      if (partnerEnabled) score += 0.05

      score = Math.min(score, 1.0)

      // Minimum threshold
      if (score < 0.35) { skipped++; continue }

      // ── Build match reasons ──────────────────────────────────────────────

      const reasons: string[] = []

      if (hasApprovedRec) {
        reasons.push(`You've already mentioned ${biz.name} in your stories and approved the recommendation.`)
      }
      if (isGenuineRec) {
        reasons.push(`${biz.name} is in your Genuine Recommendations list.`)
      }
      if (sharedTopics.length > 0) {
        const topicNames = sharedTopics.map(t => t.name).join(', ')
        reasons.push(`Shared topic${sharedTopics.length > 1 ? 's' : ''}: ${topicNames}.`)
      }
      if (sharedIndustry) {
        reasons.push(`Same industry: ${founder.industry?.name ?? 'matched'}.`)
      }
      if (hasMatchingProgram) {
        const prog = bizPrograms.find(p => PROGRAM_TO_OPP[p.programType as string] === oppType)
        if (prog) reasons.push(`${biz.name} has an active ${prog.name || oppLabel(oppType)} program.`)
      }
      if (openTypes.has(oppType) && !hasMatchingProgram) {
        reasons.push(`You're open to ${oppLabel(oppType).toLowerCase()} opportunities.`)
      }

      // ── Build title ──────────────────────────────────────────────────────

      const titles: Record<OpportunityType, string> = {
        'recommendation':         `Formalise your relationship with ${biz.name}`,
        'affiliate':              `Affiliate program with ${biz.name}`,
        'referral':               `Referral program with ${biz.name}`,
        'creator-campaign':       `Content collaboration with ${biz.name}`,
        'speaking':               `Speaking opportunity with ${biz.name}`,
        'podcast-guest':          `Podcast appearance with ${biz.name}`,
        'workshop':               `Workshop partnership with ${biz.name}`,
        'guest-blog':             `Guest editorial with ${biz.name}`,
        'case-study':             `Case study with ${biz.name}`,
        'mentoring':              `Mentoring opportunity with ${biz.name}`,
        'advisory':               `Advisory role with ${biz.name}`,
        'community-intro':        `Community introduction via ${biz.name}`,
        'business-partnership':   `Business partnership with ${biz.name}`,
        'collaboration':          `Collaborate with ${biz.name}`,
        'media-interview':        `Media interview with ${biz.name}`,
        'technology-partnership': `Technology partnership with ${biz.name}`,
        'event-speaker':          `Speak at a ${biz.name} event`,
        'custom':                 `Custom opportunity with ${biz.name}`,
      }

      const opp: Opportunity = {
        id:               crypto.randomUUID(),
        slug:             `${founderId}-${biz.id}-${oppType}-${Date.now()}`,
        title:            titles[oppType] ?? `Opportunity with ${biz.name}`,
        summary:          reasons[0],
        type:             oppType,
        status:           'suggested',
        sourceType:       'knowledge-graph',
        businessId:       biz.id,
        programId:        bizPrograms.find(p => PROGRAM_TO_OPP[p.programType as string] === oppType)?.id,
        targetFounderId:  founderId,
        topics:           sharedTopics.map(t => t.name),
        matchScore:       score,
        matchReason:      reasons.join(' '),
        matchedTopics:    sharedTopics.map(t => t.name),
        matchedIndustries: sharedIndustry ? [founder.industry?.name ?? ''] : [],
        priority:         priority(score),
        visibility:       'targeted',
        createdAt:        ts,
        updatedAt:        ts,
      }

      toWrite.push(opp)
      generated++
    }
  }

  if (toWrite.length > 0) {
    const result = await opportunityService.upsertBatch(toWrite)
    if (!result.success) {
      return { generated: 0, skipped, businesses: businesses.length, error: result.error ?? 'Failed to save matched opportunities.' }
    }
  }

  return { generated, skipped, businesses: businesses.length }
}
