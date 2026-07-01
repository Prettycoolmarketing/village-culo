import { getFounders, getFounder } from './founders'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { AuthUser } from '../contexts/AuthContext'
import type { Founder } from '../types'

/**
 * Canonical resolver for "which Founder record does this logged-in user own?"
 *
 * Resolution order:
 *  1. profiles.founder_id, surfaced as user.founderId (fast path — set by
 *     link_own_founder() on self-publish, or by claim approval)
 *  2. Founder.userId === user.id (the founder created/published this profile
 *     themselves via Onboarding — the self-serve path; see OnboardingPage.publish())
 *  3. Founder.claimedByUserId === user.id (claimed profile, ownership already
 *     transferred via the admin-curated → claim flow)
 *  4. Founder.claimEmail === user.email (claim approved but auth ownership not
 *     yet linked — the requester hadn't signed in yet when the claim was approved)
 *  5. Dev-mode-only fallback to the first seed founder, so local development still
 *     works without wiring up real accounts
 *  6. null — caller must render an onboarding/create-profile state, never assume
 *     a founder exists
 */
export function getCurrentFounder(user: AuthUser | null): Founder | null {
  if (!user) return null

  if (user.founderId) {
    const byId = getFounder(user.founderId)
    if (byId) return byId
  }

  const all = getFounders()

  const bySelfPublish = all.find(f => f.userId === user.id)
  if (bySelfPublish) return bySelfPublish

  const byOwnership = all.find(f => f.claimedByUserId === user.id)
  if (byOwnership) return byOwnership

  if (user.email) {
    const byClaimEmail = all.find(f => f.claimEmail === user.email)
    if (byClaimEmail) return byClaimEmail
  }

  if (!isSupabaseConfigured) {
    return all[0] ?? null
  }

  return null
}

/** Convenience variant for call sites that only need the id, with the same resolution order. */
export function getCurrentFounderId(user: AuthUser | null): string | null {
  return getCurrentFounder(user)?.id ?? null
}

/**
 * Populates profiles.founder_id for the current session, so the fast path
 * (resolution step 1) is set as soon as a founder owns a profile — whether by
 * self-publishing (Onboarding) or by an approved claim. Call after either.
 *
 * Uses a SECURITY DEFINER RPC (see migration 005) rather than a direct UPDATE,
 * because `profiles` intentionally has no client UPDATE policy (role changes
 * must stay admin-only) — the RPC only ever touches founder_id, and only after
 * verifying the founder is actually owned by the caller.
 *
 * No-op in dev mode; failures are non-fatal — Founder.userId/claimedByUserId
 * already resolve ownership without this column being populated.
 */
export async function linkOwnFounder(founderId: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return
  try {
    await supabase.rpc('link_own_founder', { p_founder_id: founderId })
  } catch {
    // non-fatal — see getCurrentFounder()'s other resolution steps
  }
}
