import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { store } from '../lib/store'
import { updateFounder } from './founders'
import { linkOwnFounder } from './currentFounder'
import { locations } from '../data/locations'
import { industries } from '../data/industries'
import { slugify } from '../utils/slugify'
import type { Founder } from '../types'

// Shared by JoinVillagePage (immediate-session case, e.g. Supabase's "Confirm
// email" off) and JoinConfirmPage (the far more common case — signUp() came
// back with needsConfirmation, so there's no session/userId yet to attach a
// founder record to until they actually click the email link and land back
// here with one). Having exactly one place create this record fixes the bug
// where a founder who had to confirm their email never got one at all: the
// old code created it inline right after signUp(), which only ever ran on
// the no-confirmation-needed branch.

const COLLABORATOR_CUTOFF = '2027-01-01T00:00:00.000Z'
const STANDARD_TRIAL_DAYS = 14

/**
 * Idempotent: safe to call every time /join/confirm loads, including a
 * second device/browser than the one that originally signed up (very common
 * for "click the link in Gmail") — checks Supabase directly rather than
 * trusting the local cache, since that cache is empty on a fresh device.
 */
export async function ensureJoinedFounder(userId: string, email: string, source: 'village' | 'canva'): Promise<string | null> {
  if (isSupabaseConfigured && supabase) {
    const { data: existing } = await supabase.from('founders').select('data').eq('user_id', userId).maybeSingle()
    if (existing?.data) {
      // Found on a device/browser whose local cache doesn't know about it yet
      // (e.g. they signed up on desktop, confirmed on their phone) — hydrate
      // the cache now so getCurrentFounder() resolves it on this device too.
      store.update<Founder>('founders', existing.data as Founder)
      return (existing.data as Founder).id
    }
  }

  const now = new Date()
  const isPreLaunchCohort = now.toISOString() < COLLABORATOR_CUTOFF
  const founderId = crypto.randomUUID()
  const founder: Founder = {
    id: founderId,
    slug: slugify(email.split('@')[0] || 'founder') + '-' + Math.random().toString(36).slice(2, 6),
    name: email.split('@')[0] || 'New Founder',
    bio: '',
    avatar: '/placeholders/village-founder.svg',
    location: locations[0]!,
    industry: industries[0]!,
    businessId: '',
    topics: [],
    status: 'draft',
    featured: false,
    createdAt: now.toISOString(),
    userId,
    signupProduct: source,
    signupEmail: email,
    passwordSet: false,
    creativeSubscription: isPreLaunchCohort
      ? { status: 'trial', trialEnd: COLLABORATOR_CUTOFF }
      : { status: 'trial', tier: 'standard', trialEnd: new Date(now.getTime() + STANDARD_TRIAL_DAYS * 86400000).toISOString() },
  }

  const result = await updateFounder(founder)
  if (!result.success) return null
  void linkOwnFounder(founderId)
  return founderId
}
