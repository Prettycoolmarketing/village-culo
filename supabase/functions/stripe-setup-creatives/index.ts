// CULO Village — stripe-setup-creatives Edge Function
//
// ONE-OFF admin utility: creates the CULO Creatives Products, Prices and
// Payment Links in Stripe (test mode, using whatever STRIPE_SECRET_KEY is
// currently set — swap the secret to a live key later and re-run against
// live mode when ready to launch for real). Exists so the actual secret key
// never has to leave Supabase or appear in chat/code — this runs server-side
// with the key already configured there.
//
// Not meant to stay wired into the app long-term. Invoke it once, copy the
// two payment_link URLs out of the response into the codebase
// (DashboardCreativesPage.tsx's UPGRADE_PAYMENT_LINK for the $25 standard
// link; wherever the $19 collaborator link ends up surfacing), then this
// function can be left deployed and unused or deleted.
//
// Deploy: supabase functions deploy stripe-setup-creatives
// Invoke:  supabase functions invoke stripe-setup-creatives

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
    // Collaborator — $19/mo. No trial_period_days set here: the webhook
    // fixes the real trial_end to the founder's stored fixed calendar date
    // (2027-01-01) right after checkout, since Payment Links can't express
    // a shared fixed end date themselves (see stripe-creatives-webhook).
    const collaboratorProduct = await stripe.products.create({ name: 'CULO Creatives — Collaborator' })
    const collaboratorPrice = await stripe.prices.create({
      product: collaboratorProduct.id,
      currency: 'usd',
      unit_amount: 1900,
      recurring: { interval: 'month' },
    })
    const collaboratorLink = await stripe.paymentLinks.create({
      line_items: [{ price: collaboratorPrice.id, quantity: 1 }],
    })

    // Standard — $25/mo with Stripe's own rolling 14-day trial. Not meant to
    // go live/public until Jan 1 2027 (see the launch plan) — created now,
    // in test mode, so it's ready; keep it out of the Canva project/any
    // public page until then.
    const standardProduct = await stripe.products.create({ name: 'CULO Creatives — Standard' })
    const standardPrice = await stripe.prices.create({
      product: standardProduct.id,
      currency: 'usd',
      unit_amount: 2500,
      recurring: { interval: 'month' },
    })
    const standardLink = await stripe.paymentLinks.create({
      line_items: [{ price: standardPrice.id, quantity: 1 }],
      subscription_data: { trial_period_days: 14 },
    })

    return new Response(JSON.stringify({
      livemode: collaboratorProduct.livemode,
      collaborator: { productId: collaboratorProduct.id, priceId: collaboratorPrice.id, paymentLink: collaboratorLink.url },
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
