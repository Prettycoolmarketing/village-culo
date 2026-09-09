// CULO Village — stripe-setup-2026-tiers Edge Function
//
// ONE-OFF admin utility, same pattern as stripe-setup-archive-unlock /
// stripe-setup-creatives. Creates every new Product / Price / Payment Link
// in one call using the STRIPE_SECRET_KEY already in Supabase, so the key
// never leaves the platform. Currency is AUD throughout. No dashes in
// product names. Every product has a description.
//
// It does NOT register any webhook endpoints — all of these reuse webhooks
// that already exist:
//   - the 5 Archive Unlock links      -> stripe-archive-unlock-webhook
//   - the Founding Collaborator link   -> stripe-creatives-webhook
//   - the 3 Pretty Cool Marketing links have no webhook (Capo is manual)
//
// After invoking, copy the URLs from the JSON response into:
//   src/config/archiveUnlock.ts   ARCHIVE_UNLOCK_TIER_4/5/6/7_LINK, ARCHIVE_UNLOCK_SUBSET_5000_LINK
//   src/config/paymentLinks.ts    COLLABORATOR_PAYMENT_LINK  (retire the old one)
//   src/config/pcmPaymentLinks.ts PCM_PUBLISHING_LINK, PCM_TIER2_LINK, PCM_TIER3_LINK
// and set the subset link's plink_ id on the archive webhook:
//   supabase secrets set ARCHIVE_SUBSET_LINK_ID=plink_xxx
//
// Deploy: supabase functions deploy stripe-setup-2026-tiers
// Invoke:  supabase functions invoke stripe-setup-2026-tiers

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@17?target=deno'

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const ARCHIVE_REDIRECT = 'https://www.culovillage.com/dashboard/profile?tab=content&contentSubTab=ready'
const CREATIVES_REDIRECT = 'https://www.culovillage.com/dashboard/creatives'

const ARCHIVE_DESC =
  'A one time fee to publish your full imported archive as individual Culo Village articles, beyond your free first 10.'

// One time Archive Unlock tiers (AUD, cents).
const ARCHIVE_TIERS = [
  { key: 'tier4',  name: 'The Culo Village Archive Unlock (1,001 to 2,500 articles)',   description: ARCHIVE_DESC, amount: 17500 },
  { key: 'tier5',  name: 'The Culo Village Archive Unlock (2,501 to 5,000 articles)',   description: ARCHIVE_DESC, amount: 34900 },
  { key: 'tier6',  name: 'The Culo Village Archive Unlock (5,001 to 10,000 articles)',  description: ARCHIVE_DESC, amount: 69900 },
  { key: 'tier7',  name: 'The Culo Village Archive Unlock (10,001 or more articles)',   description: ARCHIVE_DESC, amount: 200000 },
  { key: 'subset', name: 'The Culo Village Archive Unlock (your 5,000 most ready articles)',
    description: 'A one time fee to publish your 5,000 strongest imported pieces as individual Culo Village articles. For very large archives that want to cap the cost.',
    amount: 69900 },
] as const

// Pretty Cool Marketing services (AUD, cents). recurring: null = one time.
const PCM_SERVICES = [
  { key: 'publishing', name: 'Pretty Cool Marketing Village Service',
    description: 'We take your existing videos, podcasts, blogs, website pages and Instagram posts, restructure them, and publish each one as an individual Culo Village article so AI and search can find you. One off service.',
    amount: 90000, recurring: null, offer: 'publishing' },
  { key: 'social', name: 'Pretty Cool Marketing Social Media Service',
    description: 'We edit and distribute up to 30 pieces of content each month using Culo Creatives, scheduled across your social platforms and into the Culo Village with curated hooks and captions.',
    amount: 300000, recurring: 'month', offer: 'tier2' },
  { key: 'full', name: 'Pretty Cool Marketing Content Creator Full Service',
    description: 'Everything in the Social Media Service plus a half day content shoot every four weeks using Pretty Cool Marketing filming frameworks, turned around into your content for the month ahead.',
    amount: 388800, recurring: 'month', offer: 'tier3' },
] as const

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  if (!STRIPE_SECRET_KEY) {
    return new Response(JSON.stringify({ error: 'STRIPE_SECRET_KEY is not set on this deployment.' }), {
      status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })

  try {
    const out: Record<string, unknown> = {}

    // ── Archive Unlock tiers (one time) ──────────────────────────────────
    const archive: Record<string, { paymentLink: string; paymentLinkId: string; priceId: string }> = {}
    for (const t of ARCHIVE_TIERS) {
      const product = await stripe.products.create({ name: t.name, description: t.description })
      const price = await stripe.prices.create({ product: product.id, currency: 'aud', unit_amount: t.amount })
      const link = await stripe.paymentLinks.create({
        line_items: [{ price: price.id, quantity: 1 }],
        after_completion: { type: 'redirect', redirect: { url: ARCHIVE_REDIRECT } },
      })
      archive[t.key] = { paymentLink: link.url, paymentLinkId: link.id, priceId: price.id }
    }
    out.archive = archive

    // ── Culo Creatives Founding Collaborator ($19/mo, ~114 day trial) ────
    const collabProduct = await stripe.products.create({
      name: 'Culo Creatives Founding Collaborator',
      description: 'The Culo Creatives editing app inside Canva. Founding rate, locked for as long as you stay subscribed. Free until 1 January 2027.',
    })
    const collabPrice = await stripe.prices.create({
      product: collabProduct.id,
      currency: 'aud',
      unit_amount: 1900,
      recurring: { interval: 'month' },
    })
    const collabLink = await stripe.paymentLinks.create({
      line_items: [{ price: collabPrice.id, quantity: 1 }],
      subscription_data: { trial_period_days: 114 },
      after_completion: { type: 'redirect', redirect: { url: CREATIVES_REDIRECT } },
    })
    out.collaborator = { paymentLink: collabLink.url, paymentLinkId: collabLink.id, priceId: collabPrice.id }

    // ── Pretty Cool Marketing services ──────────────────────────────────
    const pcm: Record<string, { paymentLink: string; paymentLinkId: string; priceId: string }> = {}
    for (const s of PCM_SERVICES) {
      const product = await stripe.products.create({ name: s.name, description: s.description })
      const price = await stripe.prices.create({
        product: product.id,
        currency: 'aud',
        unit_amount: s.amount,
        ...(s.recurring ? { recurring: { interval: s.recurring } } : {}),
      })
      const link = await stripe.paymentLinks.create({
        line_items: [{ price: price.id, quantity: 1 }],
        after_completion: { type: 'redirect', redirect: { url: `https://www.culovillage.com/marketing/start?offer=${s.offer}` } },
      })
      pcm[s.key] = { paymentLink: link.url, paymentLinkId: link.id, priceId: price.id }
    }
    out.pcm = pcm

    out.next_steps = [
      'archiveUnlock.ts: ARCHIVE_UNLOCK_TIER_4_LINK = archive.tier4.paymentLink (etc for 5/6/7)',
      'archiveUnlock.ts: ARCHIVE_UNLOCK_SUBSET_5000_LINK = archive.subset.paymentLink',
      `supabase secrets set ARCHIVE_SUBSET_LINK_ID=${archive.subset.paymentLinkId}`,
      'paymentLinks.ts: COLLABORATOR_PAYMENT_LINK = collaborator.paymentLink (retire the old link in Stripe)',
      'pcmPaymentLinks.ts: PCM_PUBLISHING_LINK = pcm.publishing.paymentLink, PCM_TIER2_LINK = pcm.social.paymentLink, PCM_TIER3_LINK = pcm.full.paymentLink',
    ]

    return new Response(JSON.stringify(out, null, 2), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
