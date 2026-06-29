import { getFounders } from './founders'
import { getBusinesses } from './businesses'
import { getStories } from './stories'
import {
  recommendationService,
  publisherPartnerProfileService,
  opportunityService,
  trustProfileService,
  programService,
} from './partnership'
import type { TrustProfile, TrustBadge, TrustLevel } from '../types/partnership'

// ─── Score levels ─────────────────────────────────────────────────────────────

export function levelFromScore(score: number): TrustLevel {
  if (score >= 85) return 'highly-trusted'
  if (score >= 65) return 'trusted'
  if (score >= 45) return 'strong'
  if (score >= 20) return 'building'
  return 'getting-started'
}

export const LEVEL_LABELS: Record<TrustLevel, string> = {
  'getting-started': 'Getting Started',
  'building':        'Building',
  'strong':          'Strong',
  'trusted':         'Trusted',
  'highly-trusted':  'Highly Trusted',
}

export const LEVEL_COLORS: Record<TrustLevel, string> = {
  'getting-started': '#9CA3AF',
  'building':        '#D6A94D',
  'strong':          '#C86A43',
  'trusted':         '#5E6B4A',
  'highly-trusted':  '#2D2A26',
}

// ─── Component result ─────────────────────────────────────────────────────────

export interface ComponentResult {
  score:   number   // raw points earned
  max:     number   // max points available
  pct:     number   // 0-100 for HealthBar display
  signals: string[] // what contributed
}

// ─── Full calculation ─────────────────────────────────────────────────────────

export interface TrustCalculation {
  overall:    number
  level:      TrustLevel
  components: {
    stories:      ComponentResult
    recommendations: ComponentResult
    disclosure:   ComponentResult
    profile:      ComponentResult
    engagement:   ComponentResult
  }
  positives:   string[]   // what's already working
  nextActions: string[]   // how to improve
  badges:      TrustBadge[]
  rawCounts: {
    stories:      number
    approved:     number
    pending:      number
    ignored:      number
    rejected:     number
    oppSaved:     number
    oppInterested:number
    oppDeclined:  number
  }
}

export function calculateTrust(founderId: string): TrustCalculation {
  const founders  = getFounders()
  const founder   = founders.find(f => f.id === founderId) ?? founders[0]
  const allStories = founder ? getStories({ founderId: founder.id }) : []
  const published  = allStories.filter(s => s.status === 'published' || s.status === 'featured' || s.status === 'archived')

  const allRecs  = recommendationService.getAll({ founderId })
  const approved = allRecs.filter(r => r.status === 'approved')
  const pending  = allRecs.filter(r => r.status === 'pending_review' || r.status === 'detected')
  const ignored  = allRecs.filter(r => r.status === 'ignored')
  const rejected = allRecs.filter(r => r.status === 'rejected')

  const profile = publisherPartnerProfileService.get(founderId)
  const allOpps = opportunityService.getAll({ founderId })
  const oppSaved     = allOpps.filter(o => o.status === 'saved')
  const oppInterested = allOpps.filter(o => o.status === 'interested')
  const oppDeclined  = allOpps.filter(o => o.status === 'declined')

  const businesses = getBusinesses()
  const myBusinessIds = new Set(
    founder ? businesses.filter(b => b.founderId === founder.id).map(b => b.id) : []
  )
  const myBusinesses = [...myBusinessIds].map(id => businesses.find(b => b.id === id)).filter(Boolean)
  const partnerBizCount = myBusinesses.filter(b => b?.partnerEnabled).length
  const activePrograms  = programService.getAll({ status: 'active' }).filter(p => myBusinessIds.has(p.businessId))

  // ── 1. Stories (max 25) ────────────────────────────────────────────────────

  const storySignals: string[] = []
  let storiesScore = 0
  const storyCount = published.length
  if (storyCount >= 1)  { storiesScore += 10; storySignals.push(`${storyCount} published ${storyCount === 1 ? 'story' : 'stories'}`) }
  if (storyCount >= 3)  { storiesScore += 4 }
  if (storyCount >= 5)  { storiesScore += 4; storySignals.push('5+ stories — strong publishing history') }
  if (storyCount >= 10) { storiesScore += 4; storySignals.push('10+ stories — consistent content output') }
  if (storyCount >= 20) { storiesScore += 3; storySignals.push('20+ stories — highly active publisher') }

  // ── 2. Recommendations (max 25) ───────────────────────────────────────────

  const recSignals: string[] = []
  let recsScore = 0
  const approvedCount = approved.length
  const perRec = 4
  const recPoints = Math.min(approvedCount * perRec, 20)
  if (recPoints > 0) {
    recsScore += recPoints
    recSignals.push(`${approvedCount} approved ${approvedCount === 1 ? 'recommendation' : 'recommendations'}`)
  }
  if (pending.length > 0) {
    const pendingBonus = Math.min(pending.length * 2, 5)
    recsScore += pendingBonus
    recSignals.push(`${pending.length} pending — actively curating`)
  }
  recsScore = Math.min(recsScore, 25)

  // ── 3. Disclosure (max 20) ────────────────────────────────────────────────

  const disclosureSignals: string[] = []
  let disclosureScore = 0
  if (approvedCount === 0) {
    disclosureScore = 10   // neutral — not penalised for no recs yet
    disclosureSignals.push('No approved recommendations yet — disclosure score neutral')
  } else {
    const withDisclosure = approved.filter(r => r.disclosureVisible && r.disclosureText?.trim()).length
    const rate = withDisclosure / approvedCount
    disclosureScore = Math.round(rate * 20)
    if (rate === 1) disclosureSignals.push('All approved recommendations include disclosure')
    else if (rate >= 0.5) disclosureSignals.push(`${withDisclosure}/${approvedCount} recommendations have disclosure`)
    else disclosureSignals.push(`${withDisclosure}/${approvedCount} recommendations have disclosure — review and add missing disclosures`)
  }

  // ── 4. Profile completeness (max 20) ──────────────────────────────────────

  const profileSignals: string[] = []
  let profileScore = 0
  if (profile?.enabled) {
    profileScore += 5
    profileSignals.push('Discovery Profile enabled')
  }
  if ((profile?.genuineRecommendations ?? []).length > 0) {
    profileScore += 4
    profileSignals.push(`${profile!.genuineRecommendations!.length} genuine ${profile!.genuineRecommendations!.length === 1 ? 'recommendation' : 'recommendations'} listed`)
  }
  const openToCount = [
    'openToSpeaking', 'openToPodcasts', 'openToGuestBlogs', 'openToWorkshops',
    'openToMentoring', 'openToAdvisory', 'openToCampaigns', 'openToAffiliates',
    'openToReferrals', 'openToCollaboration',
  ].filter(k => profile?.[k as keyof typeof profile] as boolean).length
  if (openToCount > 0) {
    profileScore += 3
    profileSignals.push(`${openToCount} opportunity ${openToCount === 1 ? 'type' : 'types'} selected`)
  }
  if (profile?.idealCollaborator) {
    profileScore += 3
    profileSignals.push('Ideal collaborator described')
  }
  if (profile?.availability) {
    profileScore += 2
    profileSignals.push('Availability set')
  }
  if (profile?.contactPreference) {
    profileScore += 2
    profileSignals.push('Contact preference set')
  }
  if ((profile?.countries ?? []).length > 0) {
    profileScore += 1
    profileSignals.push('Markets listed')
  }
  profileScore = Math.min(profileScore, 20)

  // ── 5. Opportunity engagement (max 10) ────────────────────────────────────

  const engagementSignals: string[] = []
  let engagementScore = 0
  const engaged = oppSaved.length + oppInterested.length
  if (allOpps.length > 0) {
    engagementScore += 3
    engagementSignals.push(`${allOpps.length} ${allOpps.length === 1 ? 'opportunity' : 'opportunities'} surfaced`)
  }
  if (oppInterested.length > 0) {
    engagementScore += 4
    engagementSignals.push(`${oppInterested.length} marked as interested`)
  }
  if (oppSaved.length > 0) {
    engagementScore += 2
    engagementSignals.push(`${oppSaved.length} saved for later`)
  }
  if (oppDeclined.length > 0 && engaged > 0) {
    engagementScore += 1
    engagementSignals.push('Actively curating — some opportunities declined')
  }
  engagementScore = Math.min(engagementScore, 10)

  // ── Overall score ──────────────────────────────────────────────────────────

  const overall = Math.min(
    storiesScore + recsScore + disclosureScore + profileScore + engagementScore,
    100
  )
  const level = levelFromScore(overall)

  // ── What's working (positive summary) ────────────────────────────────────

  const positives: string[] = []
  if (storyCount >= 1) positives.push(`${storyCount} published ${storyCount === 1 ? 'story' : 'stories'} in your Knowledge Graph`)
  if (approvedCount >= 1) positives.push(`${approvedCount} approved ${approvedCount === 1 ? 'recommendation' : 'recommendations'} with disclosure`)
  if (profile?.enabled) positives.push('Publisher Discovery Profile is active')
  if ((profile?.genuineRecommendations ?? []).length > 0) positives.push(`${profile!.genuineRecommendations!.length} genuine ${profile!.genuineRecommendations!.length === 1 ? 'tool' : 'tools'} in your recommendations list`)
  if (oppInterested.length > 0) positives.push(`Expressed interest in ${oppInterested.length} ${oppInterested.length === 1 ? 'opportunity' : 'opportunities'}`)
  if (partnerBizCount > 0) positives.push(`${partnerBizCount} ${partnerBizCount === 1 ? 'business' : 'businesses'} with Discovery Profile enabled`)
  if (activePrograms.length > 0) positives.push(`${activePrograms.length} active ${activePrograms.length === 1 ? 'program' : 'programs'} on your businesses`)

  // ── Next best actions ─────────────────────────────────────────────────────

  const nextActions: string[] = []
  if (storyCount === 0) nextActions.push('Publish your first story to start building your Knowledge Graph')
  else if (storyCount < 5) nextActions.push(`Publish ${5 - storyCount} more ${5 - storyCount === 1 ? 'story' : 'stories'} to strengthen your publishing score`)
  if (approvedCount === 0) nextActions.push('Scan your stories and approve your first genuine recommendation')
  if (!profile?.enabled) nextActions.push('Enable your Publisher Discovery Profile so CULO can start matching you')
  if (profile?.enabled && (profile?.genuineRecommendations ?? []).length === 0) {
    nextActions.push('Add tools and businesses you genuinely use to your Discovery Profile')
  }
  if (profile?.enabled && openToCount === 0) {
    nextActions.push('Select opportunity types you\'re open to in your Discovery Profile')
  }
  if (allOpps.length > 0 && engaged === 0) {
    nextActions.push('Review your suggested opportunities and save or mark interest in the ones that fit')
  }
  if (allOpps.length === 0 && storyCount > 0) {
    nextActions.push('Run "Find opportunities" to see businesses CULO has matched you with')
  }
  const approvedWithDisclosure = approved.filter(r => r.disclosureVisible && r.disclosureText?.trim()).length
  if (approvedCount > 0 && approvedWithDisclosure < approvedCount) {
    nextActions.push('Check your approved recommendations — some may be missing disclosure text')
  }

  // ── Badges ────────────────────────────────────────────────────────────────

  const ts = new Date().toISOString()
  const badges: TrustBadge[] = []

  if (storyCount >= 1) badges.push({
    id: 'first-story', name: 'First Story',
    description: 'Published your first story',
    icon: '📖', category: 'publishing', earnedAt: ts,
  })
  if (storyCount >= 10) badges.push({
    id: 'ten-stories', name: '10 Stories',
    description: 'Published 10 or more stories',
    icon: '📚', category: 'publishing', earnedAt: ts,
  })
  if (approvedCount >= 1) badges.push({
    id: 'first-recommendation', name: 'First Recommendation',
    description: 'Approved your first genuine recommendation with disclosure',
    icon: '✓', category: 'recommendation', earnedAt: ts,
  })
  if (profile?.enabled && (profile?.genuineRecommendations ?? []).length >= 3 && openToCount >= 2) badges.push({
    id: 'discovery-ready', name: 'Discovery Ready',
    description: 'Publisher Discovery Profile is complete and active',
    icon: '◉', category: 'trust', earnedAt: ts,
  })
  if (oppInterested.length >= 1) badges.push({
    id: 'first-opportunity', name: 'Opportunity Explorer',
    description: 'Marked your first opportunity as interested',
    icon: '→', category: 'community', earnedAt: ts,
  })
  if (overall >= 65) badges.push({
    id: 'trusted-publisher', name: 'Trusted Publisher',
    description: 'Reached Trusted reputation level',
    icon: '★', category: 'trust', earnedAt: ts,
  })

  return {
    overall,
    level,
    components: {
      stories:         { score: storiesScore,    max: 25, pct: Math.round(storiesScore    / 25 * 100), signals: storySignals     },
      recommendations: { score: recsScore,       max: 25, pct: Math.round(recsScore       / 25 * 100), signals: recSignals       },
      disclosure:      { score: disclosureScore, max: 20, pct: Math.round(disclosureScore / 20 * 100), signals: disclosureSignals },
      profile:         { score: profileScore,    max: 20, pct: Math.round(profileScore    / 20 * 100), signals: profileSignals    },
      engagement:      { score: engagementScore, max: 10, pct: Math.round(engagementScore / 10 * 100), signals: engagementSignals },
    },
    positives,
    nextActions,
    badges,
    rawCounts: {
      stories: storyCount, approved: approvedCount, pending: pending.length,
      ignored: ignored.length, rejected: rejected.length,
      oppSaved: oppSaved.length, oppInterested: oppInterested.length, oppDeclined: oppDeclined.length,
    },
  }
}

// ─── Save trust profile ───────────────────────────────────────────────────────

export function saveTrustProfile(founderId: string): { calc: TrustCalculation; profile: TrustProfile } {
  const calc     = calculateTrust(founderId)
  const existing = trustProfileService.getOrCreate(founderId, 'publisher')
  const ts       = new Date().toISOString()

  const history = [
    ...(existing.scoreHistory ?? []).slice(-29),
    { date: ts.split('T')[0], score: calc.overall },
  ]

  const profile: TrustProfile = {
    ...existing,
    overallScore:             calc.overall,
    trustLevel:               calc.level,
    knowledgeScore:           calc.components.stories.pct,
    recommendationScore:      calc.components.recommendations.pct,
    transparencyScore:        calc.components.disclosure.pct,
    communityScore:           calc.components.engagement.pct,
    relationshipScore:        calc.components.profile.pct,
    consistencyScore:         calc.components.stories.pct,
    disclosureComplianceScore: calc.components.disclosure.pct,
    storiesPublished:         calc.rawCounts.stories,
    recommendationsApproved:  calc.rawCounts.approved,
    disclosureComplianceRate: calc.components.disclosure.pct / 100,
    scoreHistory:             history,
    lastCalculatedAt:         ts,
    badges:                   calc.badges,
    updatedAt:                ts,
  }

  trustProfileService.upsert(profile)
  return { calc, profile }
}
