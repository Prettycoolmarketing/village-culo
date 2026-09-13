// CULO Village — stripe-setup-canva-upsell-link Edge Function
//
// ONE-OFF admin utility: creates a Standard $25/mo payment link identical
// to the existing one (STANDARD_PAYMENT_LINK), except its
// after_completion.redirect.url points at the new post-payment "set your
// password" page instead of /dashboard/creatives. Needed because that
// existing link is used by /join/offer, where a founder record already
// exists (client_reference_id = founderId) — this one is used by the
// in-app "10 tries used up" upsell inside the Canva app itself, where NO
// founder exists yet (client_reference_id = the Canva user's own id
// instead), so the redirect target has to be a page that can create one
// from the completed Stripe session, not the dashboard directly.
//
// Deploy: supabase functions deploy stripe-setup-canva-upsell-link
// Invoke:  curl -X POST <function URL> -H "Authorization: Bearer <anon key>"

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
    // Reuse the existing Standard price rather than creating a new
    // product/price — same $25/mo, same 14-day trial, just a different
    // Payment Link (and therefore a different redirect target) pointing at it.
    const prices = await stripe.prices.list({ limit: 100 })
    const standardPrice = prices.data.find(p => p.unit_amount === 2500 && p.currency === 'aud' && p.recurring?.interval === 'month')
    if (!standardPrice) throw new Error('Could not find the existing $25 AUD/month Standard price to attach this link to.')

    const link = await stripe.paymentLinks.create({
      line_items: [{ price: standardPrice.id, quantity: 1 }],
      subscription_data: { trial_period_days: 14 },
      after_completion: { type: 'redirect', redirect: { url: 'https://www.culovillage.com/join/canva-paid?session_id={CHECKOUT_SESSION_ID}' } },
      custom_text: { after_submit: { message: 'Your 14-day free trial has started. One more step to set up your account.' } },
    })

    return new Response(JSON.stringify({
      livemode: link.livemode,
      priceId: standardPrice.id,
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
