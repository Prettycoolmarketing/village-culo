// CULO Village — stripe-setup-archive-unlock Edge Function
//
// ONE-OFF admin utility, same pattern as stripe-setup-creatives: creates
// the 3 Archive Unlock one-time Products/Prices/Payment Links AND registers
// the stripe-archive-unlock-webhook endpoint itself, all in one call — the
// secret key never has to leave Supabase. Currency is AUD, prices derived
// from real cost data (see src/config/archiveUnlock.ts's own comments):
//   Tier 1 (<=50 pieces)     — $19 AUD once
//   Tier 2 (51-250 pieces)   — $39 AUD once
//   Tier 3 (251-1,000 pieces)— $79 AUD once
// The 1,001+ tier is deliberately NOT a fixed Payment Link — Stripe Payment
// Links can't do dynamic per-piece pricing, so that tier stays a "contact
// for a quote" flow in the app instead (see DashboardArchiveFoundPage).
//
// Invoke once, copy the 3 payment_link URLs into
// src/config/archiveUnlock.ts (ARCHIVE_UNLOCK_TIER_1/2/3_LINK), and set the
// webhook secret with:
//   supabase secrets set STRIPE_ARCHIVE_UNLOCK_WEBHOOK_SECRET=<value>
// Safe to re-run: skips creating a duplicate webhook endpoint if one
// already exists for this exact URL.
//
// Deploy: supabase functions deploy stripe-setup-archive-unlock
// Invoke:  supabase functions invoke stripe-setup-archive-unlock

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@17?target=deno'

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')
const SUPABASE_URL      = Deno.env.get('SUPABASE_URL')!
const WEBHOOK_URL       = `${SUPABASE_URL}/functions/v1/stripe-archive-unlock-webhook`

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const TIERS = [
  { key: 'tier1', name: 'CULO Village — Archive Unlock (up to 50 pieces)', description: 'A one-time fee to fully process and publish your complete imported archive, beyond your free first 10 pieces.', amount: 1900 },
  { key: 'tier2', name: 'CULO Village — Archive Unlock (51–250 pieces)', description: 'A one-time fee to fully process and publish your complete imported archive, beyond your free first 10 pieces.', amount: 3900 },
  { key: 'tier3', name: 'CULO Village — Archive Unlock (251–1,000 pieces)', description: 'A one-time fee to fully process and publish your complete imported archive, beyond your free first 10 pieces.', amount: 7900 },
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
    const tierResults: Record<string, { productId: string; priceId: string; paymentLink: string }> = {}
    for (const tier of TIERS) {
      const product = await stripe.products.create({ name: tier.name, description: tier.description })
      // One-time price — no `recurring`, this is a single payment, not a
      // subscription. Distinct from every CULO Creatives price.
      const price = await stripe.prices.create({
        product: product.id,
        currency: 'aud',
        unit_amount: tier.amount,
      })
      const link = await stripe.paymentLinks.create({
        line_items: [{ price: price.id, quantity: 1 }],
        after_completion: { type: 'redirect', redirect: { url: 'https://www.culovillage.com/dashboard/profile?tab=content&contentSubTab=ready' } },
        custom_text: { after_submit: { message: 'Your full archive is being unlocked now. Head back to your Village dashboard to see everything.' } },
      })
      tierResults[tier.key] = { productId: product.id, priceId: price.id, paymentLink: link.url }
    }

    const existingEndpoints = await stripe.webhookEndpoints.list({ limit: 100 })
    let webhookSecret: string | undefined
    let webhookAlreadyExisted = false
    const existing = existingEndpoints.data.find(e => e.url === WEBHOOK_URL)
    if (existing) {
      webhookAlreadyExisted = true
    } else {
      const endpoint = await stripe.webhookEndpoints.create({
        url: WEBHOOK_URL,
        enabled_events: ['checkout.session.completed'],
      })
      webhookSecret = endpoint.secret
    }

    return new Response(JSON.stringify({
      livemode: false,
      ...tierResults,
      webhook: webhookAlreadyExisted
        ? { url: WEBHOOK_URL, note: 'An endpoint for this URL already existed — its secret is not re-exposed by Stripe. Check the Stripe Dashboard if STRIPE_ARCHIVE_UNLOCK_WEBHOOK_SECRET is missing.' }
        : { url: WEBHOOK_URL, secret: webhookSecret, setCommand: `supabase secrets set STRIPE_ARCHIVE_UNLOCK_WEBHOOK_SECRET=${webhookSecret}` },
    }, null, 2), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
