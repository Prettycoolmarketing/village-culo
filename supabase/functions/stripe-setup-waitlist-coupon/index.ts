// CULO Village — stripe-setup-waitlist-coupon Edge Function
//
// ONE-OFF admin utility: creates a $6 AUD/month-off, permanent Stripe
// Promotion Code — applied to the Standard $25/mo payment link, it brings
// the recurring price down to $19/mo forever. Replaces the old approach of
// a separate Collaborator product/payment link with a free-until-2027-01-01
// cohort: now everyone signs up on the same Standard 14-day-trial offer,
// and the curated waitlist gets this code to hand-key at checkout for the
// same $19/mo founding rate, no separate link or signup path to maintain.
//
// Safe to leave deployed and unused after the one invocation that matters.
//
// Deploy: supabase functions deploy stripe-setup-waitlist-coupon
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
    const coupon = await stripe.coupons.create({
      amount_off: 600,
      currency: 'aud',
      duration: 'forever',
      name: 'Founding Waitlist — $19/mo',
    })
    const promotionCode = await stripe.promotionCodes.create({
      coupon: coupon.id,
      code: 'FOUNDER19',
    })

    return new Response(JSON.stringify({
      livemode: coupon.livemode,
      code: promotionCode.code,
      couponId: coupon.id,
      promotionCodeId: promotionCode.id,
      note: '$6 AUD/month off, forever — on the $25/mo Standard price this brings it to $19/mo. Hand this code to curated waitlist members to enter at Stripe Checkout on the Standard payment link.',
    }, null, 2), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
