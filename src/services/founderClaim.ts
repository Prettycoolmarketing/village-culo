import { readCache, writeEntityUnowned, type WriteResult } from '../lib/entityStore'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { store } from '../lib/store'
import { getFounder, updateFounder } from './founders'
import { sendTransactionalEmail } from './transactionalEmail'
import type { FounderClaimRequest } from '../types/founderClaim'

const KEY = 'founder_claims'
const TABLE = 'founder_claim_requests'

function toRow(c: FounderClaimRequest) {
  return {
    id: c.id,
    founder_id: c.founderId,
    requester_name: c.requesterName,
    requester_email: c.requesterEmail,
    requester_user_id: c.requesterUserId ?? null,
    status: c.status,
    reviewed_by: c.reviewedBy ?? null,
    requested_at: c.requestedAt,
    reviewed_at: c.reviewedAt ?? null,
    data: c,
  }
}

export const founderClaimService = {
  getAll(): FounderClaimRequest[] {
    return readCache<FounderClaimRequest>(KEY)
  },

  getByFounderId(founderId: string): FounderClaimRequest[] {
    return this.getAll().filter(c => c.founderId === founderId)
  },

  getPending(): FounderClaimRequest[] {
    return this.getAll().filter(c => c.status === 'pending')
  },

  async create(data: Pick<FounderClaimRequest, 'founderId' | 'requesterName' | 'requesterEmail' | 'requesterMessage' | 'evidenceUrl' | 'requesterUserId'>): Promise<FounderClaimRequest> {
    // Routed through the submit-founder-claim Edge Function rather than a
    // direct anon-key table insert — Supabase's API gateway has been
    // rejecting anonymous writes project-wide (confirmed: the identical
    // insert succeeds as a raw SQL/service-role write, but fails with a 401
    // through the REST API using the anon key, for this table and others).
    // The function does the actual write server-side with the service role
    // key, sidestepping that gateway issue entirely. Falls back to the old
    // direct-write path when Supabase isn't configured (local/dev store).
    if (isSupabaseConfigured && supabase) {
      const { data: fnData, error } = await supabase.functions.invoke<{ claim?: FounderClaimRequest; error?: string }>(
        'submit-founder-claim', { body: data },
      )
      if (error || fnData?.error) throw new Error(fnData?.error || (error instanceof Error ? error.message : 'Failed to submit claim'))
      const claim = fnData!.claim!
      store.update<FounderClaimRequest>(KEY, claim)
      const founder = getFounder(data.founderId)
      if (founder) store.update('founders', { ...founder, profileStatus: 'claim-pending' })
      sendTransactionalEmail({ type: 'claim-received', to: claim.requesterEmail, founderName: founder?.name ?? 'this profile' })
      sendTransactionalEmail({ type: 'claim-submitted-staff', founderName: founder?.name ?? 'Unknown founder', founderSlug: founder?.slug ?? '', requesterName: claim.requesterName, requesterEmail: claim.requesterEmail })
      return claim
    }

    const claim: FounderClaimRequest = {
      ...data,
      id: crypto.randomUUID(),
      status: 'pending',
      requestedAt: new Date().toISOString(),
    }
    const result = await writeEntityUnowned<FounderClaimRequest>({ cacheKey: KEY, item: claim, table: TABLE, toRow })
    if (!result.success) throw new Error(result.error ?? 'Failed to submit claim')
    const founder = getFounder(data.founderId)
    if (founder) void updateFounder({ ...founder, profileStatus: 'claim-pending' })
    sendTransactionalEmail({ type: 'claim-received', to: claim.requesterEmail, founderName: founder?.name ?? 'this profile' })
    return claim
  },

  async approve(id: string, reviewedBy?: string, adminNotes?: string): Promise<WriteResult> {
    const all = this.getAll()
    const claim = all.find(c => c.id === id)
    if (!claim) return { success: false, error: 'Claim not found' }

    const updated: FounderClaimRequest = {
      ...claim,
      status: 'approved',
      reviewedAt: new Date().toISOString(),
      reviewedBy,
      adminNotes,
    }
    const result = await writeAdminClaim(updated)
    if (!result.success) return result

    const founder = getFounder(claim.founderId)
    if (founder) {
      void updateFounder({
        ...founder,
        profileStatus: 'claimed',
        claimedAt: new Date().toISOString(),
        claimEmail: claim.requesterEmail,
        isClaimable: false,
        // Ownership transfer is only fully wired up if the requester was already signed
        // in when they filed the claim (rare — claims are usually filed anonymously).
        // Otherwise claimedByUserId stays unset; getCurrentFounder() still resolves
        // ownership for the requester once they sign up/in with the same email, via
        // the claimEmail match. There is no invite/notification email sent yet — that
        // is intentionally out of scope here (see Sprint 19A).
        claimedByUserId: claim.requesterUserId ?? founder.claimedByUserId,
      })
    }
    sendTransactionalEmail({
      type: 'claim-approved',
      to: claim.requesterEmail,
      founderName: founder?.name ?? 'your profile',
      founderSlug: founder?.slug ?? '',
    })
    return result
  },

  async reject(id: string, reviewedBy?: string, adminNotes?: string): Promise<WriteResult> {
    const all = this.getAll()
    const claim = all.find(c => c.id === id)
    if (!claim) return { success: false, error: 'Claim not found' }

    const updated: FounderClaimRequest = {
      ...claim,
      status: 'rejected',
      reviewedAt: new Date().toISOString(),
      reviewedBy,
      adminNotes,
    }
    const result = await writeAdminClaim(updated)
    if (!result.success) return result

    const founder = getFounder(claim.founderId)
    if (founder && founder.profileStatus === 'claim-pending') {
      void updateFounder({ ...founder, profileStatus: 'village-curated', isClaimable: true })
    }
    sendTransactionalEmail({
      type: 'claim-rejected',
      to: claim.requesterEmail,
      founderName: founder?.name ?? 'this profile',
      reason: adminNotes,
    })
    return result
  },

  markVerified(founderId: string): void {
    const founder = getFounder(founderId)
    if (founder) void updateFounder({ ...founder, profileStatus: 'verified' })
  },

  markCurated(founderId: string, curatedBy = 'CULO Village'): void {
    const founder = getFounder(founderId)
    if (founder) {
      void updateFounder({
        ...founder,
        profileStatus: 'village-curated',
        curatedBy,
        curatedAt: new Date().toISOString(),
        isClaimable: true,
      })
    }
  },
}

// Approve/reject are admin-only writes (RLS requires is_village_admin()), unlike the
// anonymous insert path create() uses — so this goes through Supabase directly rather
// than writeEntityUnowned/writeEntity (which assume either no owner or a founder owner).
async function writeAdminClaim(claim: FounderClaimRequest): Promise<WriteResult> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from(TABLE).upsert(toRow(claim), { onConflict: 'id' })
    if (error) return { success: false, error: error.message }
  }
  store.update<FounderClaimRequest>(KEY, claim)
  return { success: true }
}
