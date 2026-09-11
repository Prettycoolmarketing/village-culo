// CULO Village — stripe-setup-standard-only Edge Function
//
// ONE-OFF admin utility, split out of stripe-setup-creatives: creates ONLY
// the CULO Creatives "Standard" Product/Price/Payment Link ($25 AUD/month,
// Stripe's own rolling 14-day trial). stripe-setup-creatives creates this
// alongside a fresh Collaborator product every time it's invoked — running
// it again just to recover a lost Standard link URL would also duplicate
// the live $19/mo Collaborator product that's already wired into the app.
// This function does only the one thing that's actually needed right now.
//
// Safe to leave deployed and unused after the one invocation that matters —
// delete whenever convenient.
//
// Deploy: supabase functions deploy stripe-setup-standard-only
// Invoke:  supabase functions invoke stripe-setup-standard-only

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
    const standardProduct = await stripe.products.create({
      name: 'CULO Creatives — Standard',
      description: 'CULO Creatives in Canva — $25 AUD/month, 14-day free trial.',
    })
    const standardPrice = await stripe.prices.create({
      product: standardProduct.id,
      currency: 'aud',
      unit_amount: 2500,
      recurring: { interval: 'month' },
    })
    const standardLink = await stripe.paymentLinks.create({
      line_items: [{ price: standardPrice.id, quantity: 1 }],
      subscription_data: { trial_period_days: 14 },
      after_completion: { type: 'redirect', redirect: { url: 'https://www.culovillage.com/dashboard/creatives' } },
      custom_text: { after_submit: { message: 'Your 14-day free trial has started. Head back to your Village dashboard to start creating.' } },
    })

    return new Response(JSON.stringify({
      livemode: standardProduct.livemode,
      standard: { productId: standardProduct.id, priceId: standardPrice.id, paymentLink: standardLink.url },
    }, null, 2), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
