// Culo Editorial Engine — shared types for the evidence ledger and the
// per-item editorial pipeline. See supabase/migrations/040_editorial_engine.sql
// for the tables this maps to, and src/services/editorialEngine.ts for the
// Risk Gate that reads it.

export type ClaimType =
  | 'fact'
  | 'attributed_statement'
  | 'culo_analysis_candidate'
  | 'unverified'
  | 'conflicting'

export type VerificationStatus = 'verified' | 'attributed' | 'unverified'

export interface EvidenceSource {
  url: string
  source_type: 'article' | 'youtube' | 'podcast' | 'website' | 'other'
  publisher?: string
  source_date?: string
}

// One claim from Stage 1's research — never prose, always structured, so
// Stage 2 (the writer) can only draw on what's actually here rather than
// inventing supporting detail. The claim_type distinction is what stops a
// founder's own opinion ("Vinisha believes X") from silently becoming an
// asserted fact ("X is true") once it reaches the writer.
export interface EvidenceClaim {
  claim: string
  claim_type: ClaimType
  verification_status: VerificationStatus
  confidence: 'high' | 'medium' | 'low'
  subject: string
  // Who said/believes this, when claim_type is attributed_statement —
  // omitted for plain facts.
  speaker?: string
  // Health, legal, financial, reputational, or otherwise requiring
  // heightened verification before it can reach a reader — read by the
  // deterministic Risk Gate, never inferred by a later prompt.
  sensitive: boolean
  // True when only the subject's own material (their site, their own
  // interview answers) supports this — no independent corroboration.
  first_party_only: boolean
  sources: EvidenceSource[]
  // Set by a CAPO staff member reviewing a blocking claim directly (e.g.
  // confirming "BreakUP Buddy" is real and upcoming even though current
  // public sources don't yet corroborate it) — the one thing that can
  // clear a per-claim block, since the Risk Gate itself never re-decides
  // based on a later prompt, only on this explicit human input.
  human_review?: 'confirmed' | 'rejected'
}

export interface SourceAssessment {
  imported_content_id?: string
  url: string
  // Stage 1's verdict on whether this source actually, substantially
  // features the founder — logged even when false, with a reason, so a
  // human can spot-check false negatives rather than a link silently
  // never producing an article with no trace of why.
  source_valid: boolean
  source_valid_reason?: string
  source_title?: string
  publisher?: string
  source_date?: string
  identity_confidence: 'high' | 'medium' | 'low'
}

export interface EvidenceLedger {
  claims: EvidenceClaim[]
  source_assessments: SourceAssessment[]
  // Stage 1's own holistic risk read — separate from any individual
  // claim's `sensitive` flag, since a profile can be risky in aggregate
  // (e.g. a public figure mid-controversy) even if no single claim alone
  // is sensitive.
  reputational_risk: 'none' | 'low' | 'medium' | 'high'
  health_science_risk: boolean
  legal_risk: boolean
  financial_risk: boolean
  // The founder's own accounts, only when the Researcher is confident
  // they're genuinely theirs — distinct from a source (one article, one
  // video about them). Used to help staff contact the founder later, so
  // a platform is omitted entirely rather than guessed at.
  verified_profiles?: {
    linkedin?: string
    instagram?: string
    youtube?: string
    tiktok?: string
    podcast?: string
  }
  researched_at: string
}

export type ResearchStatus = 'queued' | 'researching' | 'done' | 'failed'
export type EditorialItemType = 'profile_bio' | 'source_article'
export type EditorialStatus = 'pending' | 'pass' | 'review' | 'reject'

export interface EditorialItem {
  id: string
  founderId: string
  importedContentId?: string
  type: EditorialItemType
  draftContent?: { title?: string; body: string }
  editorialVersion: number
  researchVersion: number
  editorialStatus: EditorialStatus
  auditorNotes?: { issue: string; sentence?: string }[]
  autoPublishAllowed: boolean
  lastVerifiedAt?: string
  correctionStatus?: 'original' | 'founder_corrected'
}
