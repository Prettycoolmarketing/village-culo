// CULO Village — stripe-enable-promo-codes Edge Function
//
// ONE-OFF admin utility: turns on "Allow promotion codes" on the live
// Standard $25/mo Payment Link (STANDARD_PAYMENT_LINK) — a Payment Link
// doesn't accept promo codes at checkout unless this is explicitly set, and
// stripe-setup-standard-only never set it when the link was first created.
// Without this, the FOUNDER19 promotion code (see
// stripe-setup-waitlist-coupon — $6 AUD/mo off forever, brings $25/mo down
// to $19/mo) has nowhere to be entered at checkout, for testing or for
// handing to friends/family/founding members.
//
// Payment Links can't be recreated in place (that mints a new URL, and this
// one is already hardcoded across the app as STANDARD_PAYMENT_LINK), so
// this finds the existing live link by URL and updates it instead.
//
// Safe to leave deployed and unused after the one invocation that matters.
//
// Deploy: supabase functions deploy stripe-enable-promo-codes
// Invoke:  curl -X POST <function URL> -H "Authorization: Bearer <anon key>"

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@17?target=deno'

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')
const STANDARD_PAYMENT_LINK_URL = 'https://buy.stripe.com/cNi00k5rPeVleXg6UL83C0x'

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
    // Payment Links aren't fetchable by URL directly — page through the
    // list and match on .url, same as any lookup-by-a-field-that-isn't-id.
    let target: Stripe.PaymentLink | undefined
    let startingAfter: string | undefined
    while (!target) {
      const page = await stripe.paymentLinks.list({ limit: 100, starting_after: startingAfter })
      target = page.data.find(l => l.url === STANDARD_PAYMENT_LINK_URL)
      if (target || !page.has_more) break
      startingAfter = page.data[page.data.length - 1]?.id
    }

    if (!target) {
      return new Response(JSON.stringify({ error: `No live Payment Link found matching ${STANDARD_PAYMENT_LINK_URL}` }), {
        status: 404, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const updated = await stripe.paymentLinks.update(target.id, { allow_promotion_codes: true })

    return new Response(JSON.stringify({
      livemode: updated.livemode,
      paymentLinkId: updated.id,
      url: updated.url,
      allowPromotionCodes: updated.allow_promotion_codes,
      note: 'FOUNDER19 (see stripe-setup-waitlist-coupon) can now be entered at checkout on this link for $19/mo instead of $25/mo.',
    }, null, 2), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
