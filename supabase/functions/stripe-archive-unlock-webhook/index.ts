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
//
// ARCHIVE_SUBSET_LINK_ID (optional): the Payment Link id (plink_…) for the
// "publish my most-ready 5,000 for $699" option. When a checkout comes
// from that link, this sets archiveUnlockCap = 5000 instead of a full
// unlock (see src/config/archiveUnlock.ts and utils/archiveUnlock.ts).
//
// PUBLISHING_PACK_100_LINK_ID / PUBLISHING_PACK_365_LINK_ID (optional): the
// Payment Link ids for the Village Publishing Packs. A checkout from those
// adds 100 / 365 to paidPublishCreditsGranted instead of touching the
// archive (see src/config/publishing.ts).
//
// Idempotent: every checkout.session.completed is recorded in
// stripe_processed_sessions before it grants anything; a retry of the same
// session id is a no-op.

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@17?target=deno'

const SUPABASE_URL          = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const STRIPE_SECRET_KEY     = Deno.env.get('STRIPE_SECRET_KEY')
const WEBHOOK_SECRET        = Deno.env.get('STRIPE_ARCHIVE_UNLOCK_WEBHOOK_SECRET')
const SUBSET_LINK_ID        = Deno.env.get('ARCHIVE_SUBSET_LINK_ID')  // plink_… for the "publish 5,000" option
const PACK_100_LINK_ID     = Deno.env.get('PUBLISHING_PACK_100_LINK_ID')
const PACK_365_LINK_ID     = Deno.env.get('PUBLISHING_PACK_365_LINK_ID')
const SUBSET_CAP            = 5000

// Amount actually charged (AUD cents) → the archive publishing limit that
// tier grants. −1 = unlimited. The $699 subset link is disambiguated by id
// before this map is consulted.
const AMOUNT_TO_ARCHIVE_LIMIT: Record<number, number> = {
  1900: 50, 3900: 250, 7900: 1000, 17500: 2500, 34900: 5000, 69900: 10000, 200000: -1,
}

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
        // Idempotency: claim this session id first. A duplicate delivery
        // hits the primary key and we bail without re-granting.
        const { error: claimErr } = await admin.from('stripe_processed_sessions').insert({
          session_id: session.id, handler: 'archive-unlock', founder_id: founderId,
        })
        if (claimErr) {
          return new Response(JSON.stringify({ received: true, duplicate: true }), {
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
          })
        }

        const { data: founderRow } = await admin.from('founders').select('id, data').eq('id', founderId).maybeSingle()
        if (founderRow) {
          const d = founderRow.data as Record<string, unknown>
          const linkId = typeof session.payment_link === 'string' ? session.payment_link : session.payment_link?.id
          const cents = typeof session.amount_total === 'number' ? session.amount_total : 0

          let patch: Record<string, unknown>
          if (linkId && (linkId === PACK_100_LINK_ID || linkId === PACK_365_LINK_ID)) {
            // Publishing Pack — flexible paid credits, no archive change.
            const add = linkId === PACK_365_LINK_ID ? 365 : 100
            patch = { paidPublishCreditsGranted: (Number(d.paidPublishCreditsGranted) || 0) + add }
          } else if (!!SUBSET_LINK_ID && linkId === SUBSET_LINK_ID) {
            // "Publish my most-ready 5,000" — capped archive unlock.
            patch = {
              archiveUnlocked: true,
              archiveUnlockedAt: new Date().toISOString(),
              archiveUnlockAmount: cents / 100,
              archiveUnlockCurrency: session.currency ?? undefined,
              archiveUnlockCap: SUBSET_CAP,
              archivePublishLimit: SUBSET_CAP,
            }
          } else {
            // Archive Unlock tier — raise the archive publishing limit.
            const limit = AMOUNT_TO_ARCHIVE_LIMIT[cents] ?? -1
            patch = {
              archiveUnlocked: true,
              archiveUnlockedAt: new Date().toISOString(),
              archiveUnlockAmount: cents / 100,
              archiveUnlockCurrency: session.currency ?? undefined,
              archivePublishLimit: limit,
            }
          }

          await admin.from('founders').update({ data: { ...d, ...patch } }).eq('id', founderId)
        }
      }
      // NOTE: this webhook only ever touches an EXISTING founder identified by
      // client_reference_id. All new-account creation (Blog Management, Social,
      // Content, Full Service) goes through stripe-pcm-webhook — a session with
      // no client_reference_id is not ours to act on here.
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
