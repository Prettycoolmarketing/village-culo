// CULO Village — stripe-canva-checkout-info Edge Function
//
// Read-only: given a completed Stripe Checkout Session id (the
// {CHECKOUT_SESSION_ID} template var Stripe fills into the Canva-upsell
// Payment Link's redirect URL), returns the email Stripe collected, the
// Canva user id (client_reference_id), and the resulting customer/
// subscription ids. /join/canva-paid uses this to create the founder
// record after payment, since no founder exists yet at checkout time on
// this path (unlike /join/offer, where client_reference_id is already a
// founder id).
//
// Deploy: supabase functions deploy stripe-canva-checkout-info --no-verify-jwt

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

  try {
    const { sessionId } = await req.json() as { sessionId?: string }
    if (!sessionId) throw new Error('sessionId is required')

    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status !== 'paid' && session.status !== 'complete') {
      throw new Error('This checkout session has not completed.')
    }

    const email = session.customer_details?.email ?? session.customer_email
    if (!email) throw new Error('No email found on this checkout session.')

    return new Response(JSON.stringify({
      email,
      canvaUserId: session.client_reference_id ?? undefined,
      customerId: typeof session.customer === 'string' ? session.customer : session.customer?.id,
      subscriptionId: typeof session.subscription === 'string' ? session.subscription : session.subscription?.id,
    }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
