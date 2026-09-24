// CULO Village — submit-account-feedback Edge Function
//
// Plain "why" capture attached to the Cancel Creatives and Delete Profile
// flows in Settings — routed through the service role for the same reason
// creative_feedback/canva_waitlist are (direct anon inserts get rejected at
// Supabase's API gateway in production), and because founders don't have a
// client INSERT policy on account_feedback. Verifies the caller actually
// owns the founderId they're submitting feedback for (via their own JWT,
// same pattern as stripe-connect-onboarding) rather than trusting the body.
//
// Deploy: supabase functions deploy submit-account-feedback

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL          = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY     = Deno.env.get('SUPABASE_ANON_KEY')!
const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Not signed in.' }), {
      status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  try {
    const body = await req.json() as { founderId?: string; section?: string; reason?: string; answer?: string }
    const founderId = body.founderId?.trim()
    const section = body.section === 'culo-creatives' ? 'culo-creatives' : body.section === 'culo-village' ? 'culo-village' : undefined
    const reason = body.reason?.trim()
    const answer = body.answer?.trim()
    if (!founderId || !section || !reason || !answer) {
      throw new Error('founderId, section, reason and answer are all required.')
    }

    // Runs as the caller — owns_founder()/is_village_admin() via RLS is the
    // real authorization check here, same as stripe-connect-onboarding.
    const asCaller = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: founder, error: founderError } = await asCaller
      .from('founders').select('id').eq('id', founderId).single()
    if (founderError || !founder) throw new Error('You do not have access to this founder profile.')

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)
    const now = new Date().toISOString()
    const { error: insertError } = await admin.from('account_feedback').insert({
      id: crypto.randomUUID(),
      founder_id: founderId,
      data: { founderId, section, reason, answer, createdAt: now },
    })
    if (insertError) throw new Error(insertError.message)

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
