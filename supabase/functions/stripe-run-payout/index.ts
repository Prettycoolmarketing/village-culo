// CULO Village — stripe-run-payout Edge Function
//
// Pays a founder their confirmed, unpaid Partnerships Program earnings via a
// Stripe Transfer to their connected Express account. Everything here runs
// as the calling CAPO staff member's own session (not the service role) —
// partner_conversions and partner_payouts are already admin-write-only by
// RLS, so that's the real authorization check; this function would fail
// with a Postgres permission error for a non-admin caller before it ever
// reached Stripe. The commission total is recomputed server-side from the
// conversion rows rather than trusted from the client, so a stale or
// tampered client-side sum can't cause an over/under payout.
//
// Deploy: supabase functions deploy stripe-run-payout
// Same secrets as stripe-connect-onboarding (STRIPE_SECRET_KEY, plus the
// auto-injected SUPABASE_* vars).

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL      = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')

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
    const { founderId, conversionIds } = await req.json()
    if (!founderId || !Array.isArray(conversionIds) || conversionIds.length === 0) {
      throw new Error('founderId and conversionIds are required')
    }

    const asCaller = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: stripeAccount, error: stripeAccountError } = await asCaller
      .from('founder_stripe_accounts').select('*').eq('founder_id', founderId).single()
    if (stripeAccountError || !stripeAccount) throw new Error('This founder has not connected Stripe yet.')
    if (!stripeAccount.payouts_enabled) throw new Error('This founder\'s Stripe account cannot receive payouts yet.')

    // Recompute the total from the actual, still-unpaid rows — never trust a
    // client-supplied amount for something that moves real money.
    const { data: conversions, error: conversionsError } = await asCaller
      .from('partner_conversions').select('id, founder_share_cents, currency')
      .in('id', conversionIds)
      .eq('founder_id', founderId)
      .eq('status', 'confirmed')
      .is('payout_id', null)
    if (conversionsError) throw new Error(conversionsError.message)
    if (!conversions || conversions.length === 0) throw new Error('Nothing left to pay — these conversions may already be paid.')

    const totalCents = conversions.reduce((sum: number, c: { founder_share_cents: number }) => sum + c.founder_share_cents, 0)
    const currency = conversions[0].currency ?? 'usd'
    // USD only for now — no FX conversion anywhere in this system yet.
    if (currency !== 'usd') throw new Error(`Only USD payouts are supported right now (got ${currency}).`)
    if (totalCents <= 0) throw new Error('Total is zero — nothing to transfer.')

    const form = new URLSearchParams({
      amount: String(totalCents),
      currency,
      destination: stripeAccount.stripe_account_id,
      description: `CULO Village Partnerships Program payout — ${conversions.length} conversion(s)`,
    })
    const res = await fetch('https://api.stripe.com/v1/transfers', {
      method: 'POST',
      headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form,
    })
    const transfer = await res.json()
    if (!res.ok) throw new Error(transfer.error?.message ?? 'Stripe transfer failed.')

    const payoutId = crypto.randomUUID()
    const payoutRow = {
      id: payoutId,
      founder_id: founderId,
      method: 'stripe',
      status: 'paid',
      amount_cents: totalCents,
      currency,
      stripe_transfer_id: transfer.id,
      note: `${conversions.length} conversion(s)`,
      data: {
        id: payoutId, founderId, method: 'stripe', status: 'paid',
        amountCents: totalCents, currency, stripeTransferId: transfer.id,
        note: `${conversions.length} conversion(s)`,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      },
    }
    const { error: payoutError } = await asCaller.from('partner_payouts').insert(payoutRow)
    if (payoutError) throw new Error(payoutError.message)

    const { error: updateError } = await asCaller
      .from('partner_conversions').update({ payout_id: payoutId }).in('id', conversions.map((c: { id: string }) => c.id))
    if (updateError) throw new Error(updateError.message)

    return new Response(JSON.stringify({ payoutId, transferId: transfer.id, amountCents: totalCents }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
