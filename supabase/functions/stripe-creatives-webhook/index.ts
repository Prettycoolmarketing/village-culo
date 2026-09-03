// CULO Village — stripe-creatives-webhook Edge Function
//
// Syncs CULO Creatives subscription state (founders.data.creativeSubscription)
// from Stripe onto the founder record. This is the one piece of code the
// Payment Links approach actually needs — everything else (recurring
// billing, retries, grandfathered pricing via immutable Prices, self-serve
// cancellation) is handled by Stripe itself.
//
// How a founder gets linked to a Stripe customer:
//   The Payment Link URL must be given a client_reference_id query param set
//   to the founder's id, e.g.
//     https://buy.stripe.com/xxxxx?client_reference_id=<founder.id>&prefilled_email=<founder email>
//   Stripe carries that through to the resulting Checkout Session, which
//   checkout.session.completed below reads to find the founder — no lookup
//   by email needed (emails can differ/repeat; ids don't).
//
// Deploy: supabase functions deploy stripe-creatives-webhook --no-verify-jwt
// (Stripe calls this directly — there's no Supabase-authenticated caller.)
//
// Secrets needed (supabase secrets set ...):
//   STRIPE_SECRET_KEY         — already set (used by stripe-connect-* functions)
//   STRIPE_WEBHOOK_SECRET     — from the Stripe Dashboard once this endpoint
//                               is registered there (Developers → Webhooks →
//                               Add endpoint → this function's URL). Get the
//                               signing secret from that page and set it here.

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@17?target=deno'

const SUPABASE_URL          = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const STRIPE_SECRET_KEY     = Deno.env.get('STRIPE_SECRET_KEY')
const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET')

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
    return new Response(JSON.stringify({ error: 'Stripe webhook is not configured on this deployment.' }), {
      status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)

  const signature = req.headers.get('stripe-signature')
  const rawBody = await req.text()

  let event: Stripe.Event
  try {
    if (!signature) throw new Error('Missing stripe-signature header')
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    return new Response(JSON.stringify({ error: `Webhook signature verification failed: ${err instanceof Error ? err.message : 'unknown error'}` }), {
      status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  async function findFounderByCustomerId(customerId: string) {
    const { data } = await admin
      .from('founders')
      .select('id, data')
      .eq('data->creativeSubscription->>stripeCustomerId', customerId)
      .maybeSingle()
    return data as { id: string; data: Record<string, unknown> } | null
  }

  async function patchSubscription(founderId: string, founderData: Record<string, unknown>, patch: Record<string, unknown>) {
    const current = (founderData.creativeSubscription as Record<string, unknown>) ?? {}
    const updated = { ...founderData, creativeSubscription: { ...current, ...patch } }
    await admin.from('founders').update({ data: updated }).eq('id', founderId)
  }

  try {
    switch (event.type) {
      // First payment link visit that completes checkout — this is the only
      // place we learn the Stripe customer/subscription id for a founder.
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const founderId = session.client_reference_id
        if (!founderId || typeof session.customer !== 'string') break
        const { data: founderRow } = await admin.from('founders').select('id, data').eq('id', founderId).maybeSingle()
        if (!founderRow) break
        await patchSubscription(founderId, founderRow.data as Record<string, unknown>, {
          status: 'active',
          stripeCustomerId: session.customer,
          stripeSubscriptionId: typeof session.subscription === 'string' ? session.subscription : undefined,
        })
        break
      }

      // Ongoing lifecycle — trial ending, past_due, cancellation, etc. Stripe
      // is the source of truth for these; we just mirror `status`.
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id
        const founderRow = await findFounderByCustomerId(customerId)
        if (!founderRow) break
        const status = event.type === 'customer.subscription.deleted'
          ? 'cancelled'
          : subscription.status === 'active' || subscription.status === 'trialing'
            ? (subscription.status === 'trialing' ? 'trial' : 'active')
            : subscription.status === 'past_due' || subscription.status === 'unpaid'
              ? 'expired'
              : 'cancelled'
        await patchSubscription(founderRow.id, founderRow.data, { status })
        break
      }

      default:
        break
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
