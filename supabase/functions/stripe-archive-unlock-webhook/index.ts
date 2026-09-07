// CULO Village — stripe-archive-unlock-webhook Edge Function
//
// Marks founders.data.archiveUnlocked = true once a founder pays the
// one-time Archive Unlock fee (see src/config/archiveUnlock.ts). Entirely
// separate from stripe-creatives-webhook / creativeSubscription — this is a
// one-time payment, not a subscription, so there's no ongoing lifecycle to
// track: checkout.session.completed is the only event this cares about.
//
// How a founder gets linked to a Stripe customer: same pattern as the
// Creatives webhook — the Payment Link URL carries client_reference_id set
// to the founder's id (see buildPaymentUrl in src/config/paymentLinks.ts),
// which Stripe carries through to the resulting Checkout Session.
//
// Deploy: supabase functions deploy stripe-archive-unlock-webhook --no-verify-jwt
// (Stripe calls this directly — there's no Supabase-authenticated caller.)
//
// This needs its OWN webhook endpoint registered in the Stripe Dashboard
// (Developers → Webhooks → Add endpoint → this function's URL, listening
// for checkout.session.completed) and its own signing secret — set as
// STRIPE_ARCHIVE_UNLOCK_WEBHOOK_SECRET so it doesn't collide with
// stripe-creatives-webhook's STRIPE_WEBHOOK_SECRET. STRIPE_SECRET_KEY is
// shared (already set for the other Stripe functions).

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@17?target=deno'

const SUPABASE_URL          = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const STRIPE_SECRET_KEY     = Deno.env.get('STRIPE_SECRET_KEY')
const WEBHOOK_SECRET        = Deno.env.get('STRIPE_ARCHIVE_UNLOCK_WEBHOOK_SECRET')

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  if (!STRIPE_SECRET_KEY || !WEBHOOK_SECRET) {
    return new Response(JSON.stringify({ error: 'Archive Unlock webhook is not configured on this deployment.' }), {
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
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, WEBHOOK_SECRET)
  } catch (err) {
    return new Response(JSON.stringify({ error: `Webhook signature verification failed: ${err instanceof Error ? err.message : 'unknown error'}` }), {
      status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const founderId = session.client_reference_id
      // 'paid' (not just session status) — a $0 or still-processing session
      // should never flip this on.
      if (founderId && session.payment_status === 'paid') {
        const { data: founderRow } = await admin.from('founders').select('id, data').eq('id', founderId).maybeSingle()
        if (founderRow) {
          const founderData = founderRow.data as Record<string, unknown>
          await admin.from('founders').update({
            data: { ...founderData, archiveUnlocked: true, archiveUnlockedAt: new Date().toISOString() },
          }).eq('id', founderId)
        }
      }
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
