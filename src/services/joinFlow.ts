import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { store } from '../lib/store'
import { updateFounder } from './founders'
import { linkOwnFounder } from './currentFounder'
import { UNSET_LOCATION } from '../data/locations'
import { UNSET_INDUSTRY } from '../data/industries'
import { slugify } from '../utils/slugify'
import type { Founder } from '../types'

// Shared by JoinVillagePage (immediate-session case, e.g. Supabase's "Confirm
// email" off), JoinConfirmPage (the far more common case — signUp() came
// back with needsConfirmation, so there's no session/userId yet to attach a
// founder record to until they actually click the email link and land back
// here with one), and JoinCanvaPaidPage (the "10 free tries used up,
// straight to Stripe" upsell inside the Canva app — payment already
// happened *before* this account exists, so the subscription is seeded
// from a completed Stripe session instead of a fresh local trial). Having
// exactly one place create this record fixes the bug where a founder who
// had to confirm their email never got one at all: the old code created it
// inline right after signUp(), which only ever ran on the
// no-confirmation-needed branch. Was two near-identical functions
// (ensureJoinedFounder + createFounderFromCanvaCheckout) until merged —
// same shape either way, just which values populate creativeSubscription
// and passwordSet differ.

const STANDARD_TRIAL_DAYS = 14

export interface JoinOptions {
  canvaUserId?: string
  // True only from JoinCanvaPaidPage — they just set a real password on
  // that page, not the throwaway one the email-first flows start with.
  passwordAlreadySet?: boolean
  // Present only when Stripe checkout happened before this account did —
  // skip the local trialEnd (Stripe's own checkout already started the
  // real trial) and record the customer/subscription ids instead.
  // stripe-creatives-webhook's ongoing lifecycle handling
  // (customer.subscription.updated/deleted) finds this founder the same
  // way it finds any other, by stripeCustomerId — no special-casing
  // needed there once this record exists with that field set.
  stripeSeed?: { customerId?: string; subscriptionId?: string }
}

/**
 * Idempotent: safe to call every time /join/confirm or /join/canva-paid
 * loads, including a second device/browser than the one that originally
 * signed up (very common for "click the link in Gmail") — checks Supabase
 * directly rather than trusting the local cache, since that cache is empty
 * on a fresh device.
 */
export async function ensureJoinedFounder(userId: string, email: string, source: 'village' | 'canva', options: JoinOptions = {}): Promise<string | null> {
  const { canvaUserId, passwordAlreadySet, stripeSeed } = options

  if (isSupabaseConfigured && supabase) {
    const { data: existing } = await supabase.from('founders').select('data').eq('user_id', userId).maybeSingle()
    if (existing?.data) {
      let founder = existing.data as Founder
      // A founder who joined before without a canvaUserId (e.g. plain /join)
      // and is now landing here via the Canva app's own link — link the two
      // up so village-culo's Stripe webhook can notify CULO Creatives once
      // they start paying, same as a brand-new signup would get.
      if (canvaUserId && founder.canvaUserId !== canvaUserId) {
        const result = await updateFounder({ ...founder, canvaUserId })
        if (result.success) founder = { ...founder, canvaUserId }
      }
      // Found on a device/browser whose local cache doesn't know about it yet
      // (e.g. they signed up on desktop, confirmed on their phone) — hydrate
      // the cache now so getCurrentFounder() resolves it on this device too.
      store.update<Founder>('founders', founder)
      return founder.id
    }
  }

  const now = new Date()
  const founderId = crypto.randomUUID()
  const founder: Founder = {
    id: founderId,
    slug: slugify(email.split('@')[0] || 'founder') + '-' + Math.random().toString(36).slice(2, 6),
    name: email.split('@')[0] || 'New Founder',
    bio: '',
    avatar: '/placeholders/village-founder.svg',
    // Deliberately not locations[0]/industries[0] — this founder hasn't told
    // us anything yet (just an email/password), so their profile shouldn't
    // read as if they're a Brisbane marketer before they've filled in a
    // single real detail. See UNSET_LOCATION/UNSET_INDUSTRY.
    location: UNSET_LOCATION,
    industry: UNSET_INDUSTRY,
    businessId: '',
    topics: [],
    status: 'draft',
    featured: false,
    createdAt: now.toISOString(),
    userId,
    signupProduct: source,
    signupEmail: email,
    passwordSet: !!passwordAlreadySet,
    canvaUserId,
    // Every new self-serve signup — /join, /joincanva, or the in-app
    // Stripe upsell alike — gets the same Standard $25/mo tier now. The
    // old "free until 2027-01-01" collaborator cohort is no longer granted
    // at signup; it's now a $19/mo-forever Stripe promotion code handed
    // out individually to the curated waitlist, applied at Standard
    // checkout (see stripe-setup-waitlist-coupon). Founders who already
    // signed up under the old collaborator terms keep whatever their
    // stored creativeSubscription already says — this only affects new
    // records.
    creativeSubscription: stripeSeed
      ? { status: 'trial', tier: 'standard', stripeCustomerId: stripeSeed.customerId, stripeSubscriptionId: stripeSeed.subscriptionId }
      : { status: 'trial', tier: 'standard', trialEnd: new Date(now.getTime() + STANDARD_TRIAL_DAYS * 86400000).toISOString() },
  }

  const result = await updateFounder(founder)
  if (!result.success) return null
  void linkOwnFounder(founderId)

  // Sequence A = Village joiners, Sequence B = Canva Creatives joiners.
  // Fire-and-forget — a nurture enrollment failing must never block signup.
  // Safe even before either sequence has content: it just enrolls now, and
  // the daily sender picks everyone up automatically once steps exist.
  if (isSupabaseConfigured && supabase) {
    void supabase.functions.invoke('enroll-email-sequence', {
      body: { sequenceId: source === 'canva' ? 'B' : 'A', email, name: founder.name, source },
    }).catch(() => { /* best-effort */ })
  }

  return founderId
}
