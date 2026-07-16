// CULO Village — stripe-connect-refresh Edge Function
//
// Called by the Revenue page when a founder lands back on
// /dashboard/revenue?stripe=connected after Stripe's hosted onboarding.
// Stripe's return_url is just a redirect — it doesn't tell us whether
// onboarding actually finished, so this re-reads the account's real status
// from Stripe and writes it to founder_stripe_accounts (service role, same
// reasoning as stripe-connect-onboarding: that table is admin-write-only).
//
// Deploy: supabase functions deploy stripe-connect-refresh
// Same secrets as stripe-connect-onboarding (STRIPE_SECRET_KEY, plus the
// auto-injected SUPABASE_* vars).

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const { founderId } = await req.json()
    if (!founderId) throw new Error('founderId is required')

    const asCaller = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)

    const { data: existing, error: existingError } = await asCaller
      .from('founder_stripe_accounts').select('*').eq('founder_id', founderId).single()
    if (existingError || !existing) throw new Error('No Stripe account on file for this founder.')

    const res = await fetch(`https://api.stripe.com/v1/accounts/${existing.stripe_account_id}`, {
      headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
    })
    const account = await res.json()
    if (!res.ok) throw new Error(account.error?.message ?? 'Could not reach Stripe.')

    const onboardingComplete = Boolean(account.details_submitted)
    const payoutsEnabled     = Boolean(account.payouts_enabled)

    const row = {
      founder_id: founderId,
      stripe_account_id: existing.stripe_account_id,
      onboarding_complete: onboardingComplete,
      payouts_enabled: payoutsEnabled,
      data: { ...(existing.data as Record<string, unknown>), onboardingComplete, payoutsEnabled, updatedAt: new Date().toISOString() },
    }
    const { error: updateError } = await admin.from('founder_stripe_accounts').upsert(row, { onConflict: 'founder_id' })
    if (updateError) throw new Error(updateError.message)

    return new Response(JSON.stringify({ onboardingComplete, payoutsEnabled }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
