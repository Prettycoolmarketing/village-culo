// Partnerships Program — CULO-negotiated affiliate deals, distinct from a
// founder's own FounderAffiliateLink (types/partnership.ts). A Partner is
// curated: either a business on the platform requesting partner status
// (source: 'business-request', starts 'pending'), or a brand PCM staff
// sourced directly (source: 'capo-added'). Founders browse active partners
// in Opportunities and write about them; the payout is Village's own
// affiliate relationship with the brand, split with the founder.

export type PartnerStatus = 'pending' | 'active' | 'inactive' | 'declined'
export type PartnerSource = 'business-request' | 'capo-added'

export interface Partner {
  id: string
  // Set when the partner originates from a real platform Business (either a
  // self-request, or a capo-added partner that happens to also be a Village
  // business). Absent for brands with no presence on the platform at all.
  businessId?: string

  name: string
  logo?: string
  website?: string

  // What a founder should actually write about — shown on the partner card
  // and used to pre-fill the Publish wizard when they click "Write about this".
  pitch: string

  // The business's own "apply here" URL, submitted at request time — this is
  // NOT a working affiliate link yet, just where PCM staff go to sign up.
  applicationUrl?: string
  // Village's real, working affiliate link for this brand — required before
  // status can become 'active'. Filled in by staff once they've actually
  // signed up for the program.
  affiliateUrl?: string

  status: PartnerStatus
  source: PartnerSource
  // % of the commission Village earns from this deal that goes to the
  // founder who wrote about it (e.g. 50 on a program paying 30% commission
  // means the founder effectively earns 15%). Not a % of sale price, and not
  // the brand's own program rate — that's set by the brand, not this system.
  founderRevenueSharePercent: number
  // Paid placement — shown first / badged in the founder-facing list.
  sponsored: boolean

  requestedByFounderId?: string
  declineReason?: string

  createdAt: string
  updatedAt: string
}

export interface PartnerFilter {
  status?: PartnerStatus
  businessId?: string
  sponsored?: boolean
}

// ─── Partner flags ──────────────────────────────────────────────────────────
// Auto-detected, possibly-negative mention of a Partner in a published
// story. Keyword-based and imperfect on purpose — it queues the story for a
// PCM staff member to look at, it never blocks the founder from publishing.

export type PartnerFlagStatus = 'pending' | 'reviewed' | 'dismissed'

export interface PartnerFlag {
  id: string
  partnerId: string
  storyId?: string
  founderId?: string
  status: PartnerFlagStatus
  reason: string
  contextSnippet?: string
  createdAt: string
  updatedAt: string
}

export interface PartnerFlagFilter {
  status?: PartnerFlagStatus
  partnerId?: string
}
