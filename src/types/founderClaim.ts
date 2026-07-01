export type FounderClaimStatus = 'pending' | 'approved' | 'rejected'

export interface FounderClaimRequest {
  id: string
  founderId: string
  requesterName: string
  requesterEmail: string
  requesterMessage?: string
  evidenceUrl?: string
  /** Set only if the requester happened to be signed in when filing the claim. Most claims are filed anonymously, so this is usually absent — ownership then links later via claimEmail matching at login (see getCurrentFounder). */
  requesterUserId?: string
  status: FounderClaimStatus
  requestedAt: string
  reviewedAt?: string
  reviewedBy?: string
  adminNotes?: string
}
