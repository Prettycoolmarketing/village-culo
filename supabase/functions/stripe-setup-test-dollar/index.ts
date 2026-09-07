// CULO Village — stripe-setup-test-dollar Edge Function
//
// ONE-OFF, temporary utility: creates a single $1 AUD one-time Product/
// Price/Payment Link so a real live-mode payment can be tested end-to-end
// (does the checkout complete, does money actually move) before switching
// on any of the real Creatives/Archive Unlock prices. No webhook wiring —
// this is purely a "does a real charge work" smoke test, not meant to
// update any founder record. Delete this function once the test is done.
//
// Deploy: supabase functions deploy stripe-setup-test-dollar
// Invoke:  POST https://<project-ref>.supabase.co/functions/v1/stripe-setup-test-dollar

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@17?target=deno'

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  if (!STRIPE_SECRET_KEY) {
    return new Response(JSON.stringify({ error: 'STRIPE_SECRET_KEY is not set on this deployment.' }), {
      status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })

  try {
    const product = await stripe.products.create({ name: 'CULO Village — $1 Test Payment' })
    const price = await stripe.prices.create({
      product: product.id,
      currency: 'aud',
      unit_amount: 100,
    })
    const link = await stripe.paymentLinks.create({
      line_items: [{ price: price.id, quantity: 1 }],
    })

    return new Response(JSON.stringify({
      livemode: product.livemode,
      productId: product.id,
      priceId: price.id,
      paymentLink: link.url,
    }, null, 2), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
