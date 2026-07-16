// CULO Village — stripe-connect-onboarding Edge Function
//
// Creates (or reuses) a Stripe Express connected account for a founder and
// returns a hosted onboarding link. Runs server-side because it needs the
// Stripe secret key, which must never reach the browser, and because
// founder_stripe_accounts is admin-write-only by RLS — this function writes
// it with the service role key, on the founder's own behalf, after verifying
// (via the caller's own auth token, against RLS) that they actually own the
// founderId they're asking to connect.
//
// Deploy: supabase functions deploy stripe-connect-onboarding
// Requires secrets: supabase secrets set STRIPE_SECRET_KEY=sk_...
// SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are injected
// automatically by the Supabase runtime — nothing to set for those.
//
// Optional: set SITE_URL if the deployed site's domain isn't the Supabase
// project URL — supabase secrets set SITE_URL=https://your-domain.com

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL          = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY     = Deno.env.get('SUPABASE_ANON_KEY')!
const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const STRIPE_SECRET_KEY     = Deno.env.get('STRIPE_SECRET_KEY')
const SITE_URL              = Deno.env.get('SITE_URL') ?? 'https://village-culo.vercel.app'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

async function stripeRequest(path: string, body: Record<string, string>) {
  const form = new URLSearchParams(body)
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form,
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error?.message ?? 'Stripe request failed')
  return json
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

    // Runs as the caller (their JWT, not service role) so RLS's
    // owns_founder()/is_village_admin() decides whether they're allowed to
    // see this founder row at all — that's the authorization check.
    const asCaller = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: founder, error: founderError } = await asCaller
      .from('founders').select('id, data').eq('id', founderId).single()
    if (founderError || !founder) throw new Error('You do not have access to this founder profile.')

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)

    const { data: existing } = await admin
      .from('founder_stripe_accounts').select('*').eq('founder_id', founderId).maybeSingle()

    let accountId = existing?.stripe_account_id as string | undefined

    if (!accountId) {
      const founderName = (founder.data as { name?: string } | null)?.name ?? ''
      const account = await stripeRequest('accounts', {
        type: 'express',
        'capabilities[transfers][requested]': 'true',
        business_type: 'individual',
        ...(founderName ? { 'business_profile[name]': founderName } : {}),
      })
      accountId = account.id

      const row = {
        founder_id: founderId,
        stripe_account_id: accountId,
        onboarding_complete: false,
        payouts_enabled: false,
        data: { id: founderId, founderId, stripeAccountId: accountId, onboardingComplete: false, payoutsEnabled: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      }
      const { error: insertError } = await admin.from('founder_stripe_accounts').upsert(row, { onConflict: 'founder_id' })
      if (insertError) throw new Error(insertError.message)
    }

    const link = await stripeRequest('account_links', {
      account: accountId!,
      refresh_url: `${SITE_URL}/dashboard/revenue?stripe=refresh`,
      return_url: `${SITE_URL}/dashboard/revenue?stripe=connected`,
      type: 'account_onboarding',
    })

    return new Response(JSON.stringify({ url: link.url }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
