// CULO Village — stripe-cancel-subscription Edge Function
//
// Cancels a founder's own CULO Creatives subscription at Stripe — at the
// end of the current billing period, not immediately, so they keep access
// they've already paid for. Verifies the caller actually owns the
// founderId via their own JWT (same pattern as stripe-connect-onboarding)
// before touching anything. The real status flip to "cancelled" happens
// via stripe-creatives-webhook's customer.subscription.updated/deleted
// handler once Stripe actually processes it — this function only requests
// the cancellation and reflects it optimistically as "cancelling" so the
// UI doesn't sit there looking like nothing happened.
//
// Deploy: supabase functions deploy stripe-cancel-subscription

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@17?target=deno'

const SUPABASE_URL          = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY     = Deno.env.get('SUPABASE_ANON_KEY')!
const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const STRIPE_SECRET_KEY     = Deno.env.get('STRIPE_SECRET_KEY')

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  if (!STRIPE_SECRET_KEY) {
    return new Response(JSON.stringify({ error: 'Stripe is not configured on this deployment.' }), {
      status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Not signed in.' }), {
      status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  try {
    const { founderId } = await req.json() as { founderId?: string }
    if (!founderId) throw new Error('founderId is required')

    const asCaller = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: founderRow, error: founderError } = await asCaller
      .from('founders').select('id, data').eq('id', founderId).single()
    if (founderError || !founderRow) throw new Error('You do not have access to this founder profile.')

    const founderData = founderRow.data as { creativeSubscription?: { stripeSubscriptionId?: string } }
    const subscriptionId = founderData.creativeSubscription?.stripeSubscriptionId
    if (!subscriptionId) throw new Error('No active Culo Creatives subscription found to cancel.')

    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })
    const subscription = await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true })

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)
    const current = (founderData as { creativeSubscription?: Record<string, unknown> }).creativeSubscription ?? {}
    await admin.from('founders').update({
      data: {
        ...(founderRow.data as Record<string, unknown>),
        creativeSubscription: { ...current, cancelAtPeriodEnd: true },
      },
    }).eq('id', founderId)

    return new Response(JSON.stringify({
      success: true,
      cancelAt: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : undefined,
    }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
