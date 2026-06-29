export type FounderClaimStatus = 'pending' | 'approved' | 'rejected'

export interface FounderClaimRequest {
  id: string
  founderId: string
  requesterName: string
  requesterEmail: string
  requesterMessage?: string
  evidenceUrl?: string
  status: FounderClaimStatus
  requestedAt: string
  reviewedAt?: string
  reviewedBy?: string
  adminNotes?: string
}
