import { store } from '../lib/store'
import { getFounder, updateFounder } from './founders'
import type { FounderClaimRequest } from '../types/founderClaim'

const KEY = 'founder_claims'

export const founderClaimService = {
  getAll(): FounderClaimRequest[] {
    return store.get<FounderClaimRequest>(KEY) ?? []
  },

  getByFounderId(founderId: string): FounderClaimRequest[] {
    return this.getAll().filter(c => c.founderId === founderId)
  },

  getPending(): FounderClaimRequest[] {
    return this.getAll().filter(c => c.status === 'pending')
  },

  create(data: Pick<FounderClaimRequest, 'founderId' | 'requesterName' | 'requesterEmail' | 'requesterMessage' | 'evidenceUrl'>): FounderClaimRequest {
    const claim: FounderClaimRequest = {
      ...data,
      id: crypto.randomUUID(),
      status: 'pending',
      requestedAt: new Date().toISOString(),
    }
    store.update<FounderClaimRequest>(KEY, claim)
    const founder = getFounder(data.founderId)
    if (founder) {
      updateFounder({ ...founder, profileStatus: 'claim-pending' })
    }
    return claim
  },

  approve(id: string, reviewedBy?: string, adminNotes?: string): void {
    const all = this.getAll()
    const claim = all.find(c => c.id === id)
    if (!claim) return
    store.update<FounderClaimRequest>(KEY, {
      ...claim,
      status: 'approved',
      reviewedAt: new Date().toISOString(),
      reviewedBy,
      adminNotes,
    })
    const founder = getFounder(claim.founderId)
    if (founder) {
      updateFounder({
        ...founder,
        profileStatus: 'claimed',
        claimedAt: new Date().toISOString(),
        claimEmail: claim.requesterEmail,
        isClaimable: false,
        // TODO: Set claimedByUserId once Supabase auth transfer is implemented.
        // When the requester's email is matched to a Supabase user, link here:
        // claimedByUserId: supabaseUser.id
      })
    }
  },

  reject(id: string, reviewedBy?: string, adminNotes?: string): void {
    const all = this.getAll()
    const claim = all.find(c => c.id === id)
    if (!claim) return
    store.update<FounderClaimRequest>(KEY, {
      ...claim,
      status: 'rejected',
      reviewedAt: new Date().toISOString(),
      reviewedBy,
      adminNotes,
    })
    const founder = getFounder(claim.founderId)
    if (founder && founder.profileStatus === 'claim-pending') {
      updateFounder({ ...founder, profileStatus: 'village-curated', isClaimable: true })
    }
  },

  markVerified(founderId: string): void {
    const founder = getFounder(founderId)
    if (founder) updateFounder({ ...founder, profileStatus: 'verified' })
  },

  markCurated(founderId: string, curatedBy = 'CULO Village'): void {
    const founder = getFounder(founderId)
    if (founder) {
      updateFounder({
        ...founder,
        profileStatus: 'village-curated',
        curatedBy,
        curatedAt: new Date().toISOString(),
        isClaimable: true,
      })
    }
  },
}
