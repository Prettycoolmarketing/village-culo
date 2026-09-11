// CULO Village — stripe-setup-review-coupon Edge Function
//
// ONE-OFF admin utility: creates a 100%-off, single-use Stripe Promotion
// Code so Canva's review team can complete real checkout on the Standard
// $25/mo payment link without being charged — safer than relying on the
// 14-day trial window alone, since app reviews can run longer than that.
//
// Safe to leave deployed and unused after the one invocation that matters.
//
// Deploy: supabase functions deploy stripe-setup-review-coupon
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
      percent_off: 100,
      duration: 'forever',
      name: 'Canva App Review',
      max_redemptions: 3,
    })
    const promotionCode = await stripe.promotionCodes.create({
      coupon: coupon.id,
      code: 'CANVAREVIEW',
      max_redemptions: 3,
    })

    return new Response(JSON.stringify({
      livemode: coupon.livemode,
      code: promotionCode.code,
      couponId: coupon.id,
      promotionCodeId: promotionCode.id,
      note: 'Enter this code at Stripe Checkout on the Standard payment link — reduces the charge to $0, forever, for up to 3 redemptions.',
    }, null, 2), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
