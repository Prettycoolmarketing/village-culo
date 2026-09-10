// CULO Village — stripe-setup-publishing-packs Edge Function
//
// ONE-OFF admin utility (same pattern as stripe-setup-archive-unlock).
// Creates the two Village Publishing Pack products/prices/payment links in
// AUD, one-time, using the STRIPE_SECRET_KEY already in Supabase. No key
// leaves the platform.
//
// These reuse the existing stripe-archive-unlock-webhook endpoint (it
// already listens for checkout.session.completed) — that function needs to
// recognise these two Payment Links by id and add pack credits rather than
// unlocking an archive. After invoking, set:
//   supabase secrets set PUBLISHING_PACK_100_LINK_ID=plink_xxx
//   supabase secrets set PUBLISHING_PACK_365_LINK_ID=plink_yyy
// and paste the URLs into src/config/publishing.ts.
//
// Deploy: supabase functions deploy stripe-setup-publishing-packs --no-verify-jwt
// Invoke: curl -X POST <fn-url> -H "Authorization: Bearer <anon key>"

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@17?target=deno'

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const REDIRECT = 'https://www.culovillage.com/dashboard/profile?tab=content&contentSubTab=ready'

const PACKS = [
  {
    key: 'pack100',
    name: 'Village Publishing Pack',
    description: 'Adds 100 publications to your Culo Village account. Publish new work whenever you like. No expiry.',
    amount: 19900,
  },
  {
    key: 'pack365',
    name: 'Annual Publishing Pack',
    description: 'A year of publishing. Adds 365 publications to your Culo Village account, roughly one a day for a year. No expiry.',
    amount: 39500,
  },
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
    const out: Record<string, { paymentLink: string; paymentLinkId: string; priceId: string }> = {}
    for (const pack of PACKS) {
      const product = await stripe.products.create({ name: pack.name, description: pack.description })
      const price = await stripe.prices.create({ product: product.id, currency: 'aud', unit_amount: pack.amount })
      const link = await stripe.paymentLinks.create({
        line_items: [{ price: price.id, quantity: 1 }],
        after_completion: { type: 'redirect', redirect: { url: REDIRECT } },
      })
      out[pack.key] = { paymentLink: link.url, paymentLinkId: link.id, priceId: price.id }
    }

    return new Response(JSON.stringify({
      ...out,
      next_steps: [
        'src/config/publishing.ts: PUBLISHING_PACK_100_LINK = pack100.paymentLink, PUBLISHING_PACK_365_LINK = pack365.paymentLink',
        `supabase secrets set PUBLISHING_PACK_100_LINK_ID=${out.pack100.paymentLinkId}`,
        `supabase secrets set PUBLISHING_PACK_365_LINK_ID=${out.pack365.paymentLinkId}`,
        'redeploy stripe-archive-unlock-webhook',
      ],
    }, null, 2), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
