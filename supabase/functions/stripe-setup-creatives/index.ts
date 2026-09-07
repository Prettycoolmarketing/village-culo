// CULO Village — stripe-setup-creatives Edge Function
//
// ONE-OFF admin utility: creates the CULO Creatives Products, Prices,
// Payment Links AND the stripe-creatives-webhook endpoint itself in Stripe
// (test mode, using whatever STRIPE_SECRET_KEY is currently set — swap the
// secret to a live key later and re-run against live mode when ready to
// launch for real). Exists so the actual secret key never has to leave
// Supabase or appear in chat/code — this runs server-side with the key
// already configured there. Currency is AUD throughout, matching every
// price mentioned in the app's own copy ("$19 AUD/month").
//
// Registering the webhook here too (not just the products/prices) means
// its signing secret — only ever returned once, at creation — gets
// captured automatically instead of requiring a manual Stripe Dashboard
// step. Set it with:
//   supabase secrets set STRIPE_WEBHOOK_SECRET=<value from the response>
// Safe to re-run: skips creating a new webhook endpoint if one already
// exists for this exact URL.
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
const SUPABASE_URL      = Deno.env.get('SUPABASE_URL')!
const WEBHOOK_URL       = `${SUPABASE_URL}/functions/v1/stripe-creatives-webhook`

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
    const collaboratorProduct = await stripe.products.create({
      name: 'CULO Creatives — Collaborator',
      description: 'Founding-member access to CULO Creatives in Canva, locked in at $19 AUD/month for as long as you stay subscribed. Free until January 1, 2027.',
    })
    const collaboratorPrice = await stripe.prices.create({
      product: collaboratorProduct.id,
      currency: 'aud',
      unit_amount: 1900,
      recurring: { interval: 'month' },
    })
    const collaboratorLink = await stripe.paymentLinks.create({
      line_items: [{ price: collaboratorPrice.id, quantity: 1 }],
      after_completion: { type: 'redirect', redirect: { url: 'https://www.culovillage.com/dashboard/creatives' } },
      custom_text: { after_submit: { message: "You're locked in at $19 AUD/month, free until January 1, 2027. Head back to your Village dashboard to start creating." } },
    })

    // Standard — $25/mo with Stripe's own rolling 14-day trial. Not meant to
    // go live/public until Jan 1 2027 (see the launch plan) — created now
    // so it's ready; keep it out of the Canva project/any public page
    // until then.
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

    // Register the webhook endpoint itself — skip if one already exists for
    // this exact URL (re-running this function shouldn't create duplicates).
    const existingEndpoints = await stripe.webhookEndpoints.list({ limit: 100 })
    let webhookSecret: string | undefined
    let webhookAlreadyExisted = false
    const existing = existingEndpoints.data.find(e => e.url === WEBHOOK_URL)
    if (existing) {
      webhookAlreadyExisted = true
    } else {
      const endpoint = await stripe.webhookEndpoints.create({
        url: WEBHOOK_URL,
        enabled_events: ['checkout.session.completed', 'customer.subscription.updated', 'customer.subscription.deleted'],
      })
      webhookSecret = endpoint.secret
    }

    return new Response(JSON.stringify({
      livemode: collaboratorProduct.livemode,
      collaborator: { productId: collaboratorProduct.id, priceId: collaboratorPrice.id, paymentLink: collaboratorLink.url },
      standard: { productId: standardProduct.id, priceId: standardPrice.id, paymentLink: standardLink.url },
      webhook: webhookAlreadyExisted
        ? { url: WEBHOOK_URL, note: 'An endpoint for this URL already existed — its secret is not re-exposed by Stripe. Check the Stripe Dashboard if STRIPE_WEBHOOK_SECRET is missing.' }
        : { url: WEBHOOK_URL, secret: webhookSecret, setCommand: `supabase secrets set STRIPE_WEBHOOK_SECRET=${webhookSecret}` },
    }, null, 2), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
