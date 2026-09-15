import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { Founder } from '../types'

// Deliberately its own table, not a field on Founder — founders.data is
// publicly readable for any published/featured founder (founders_public_read),
// so a secret stored there would be visible to anyone who queried that
// founder's row directly with the anon key, defeating the entire point of a
// per-founder claim secret. founder_claim_tokens has no public read policy;
// only a village admin's own authenticated session can read/write it (see
// migration 036), and the real visitor-facing check — a stranger loading
// /claim/:slug?key=... with no login at all — goes through the
// verify-claim-token Edge Function instead, which never echoes the real
// token back, only true/false.

/**
 * Every founder handed out for outreach (CSV export, a one-off invite link)
 * needs a real claim token to gate the instant-claim flow — generates and
 * persists one for anyone missing it, and returns every requested founder's
 * token (existing or freshly made) keyed by founder id. Staff-only: relies
 * on the caller already being signed in as a village admin.
 */
export async function ensureClaimTokens(founders: Founder[]): Promise<Map<string, string>> {
  const tokens = new Map<string, string>()
  if (!isSupabaseConfigured || !supabase || founders.length === 0) return tokens

  const ids = founders.map(f => f.id)
  const { data: existing } = await supabase
    .from('founder_claim_tokens')
    .select('founder_id, token')
    .in('founder_id', ids)
  for (const row of existing ?? []) tokens.set(row.founder_id, row.token)

  const missing = founders.filter(f => !tokens.has(f.id))
  if (missing.length > 0) {
    const fresh = missing.map(f => ({ founder_id: f.id, token: crypto.randomUUID().replace(/-/g, '') }))
    const { error } = await supabase.from('founder_claim_tokens').insert(fresh)
    if (!error) for (const row of fresh) tokens.set(row.founder_id, row.token)
  }
  return tokens
}
