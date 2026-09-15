// CULO Village — verify-claim-token Edge Function
//
// The real, anonymous check behind the instant-claim flow: a visitor lands
// on /claim/:slug?key=... with no login at all, and the client needs to
// know whether that key is the founder's real secret before it'll show the
// "create your account" form instead of the old request-and-review one.
// The token itself lives in founder_claim_tokens, which has no public read
// policy (see migration 036) — so this runs server-side with the service
// role to do the comparison, and only ever returns true/false, never the
// real token. Deployed with --no-verify-jwt since the whole point is an
// anonymous visitor can call it.
//
// Deploy: supabase functions deploy verify-claim-token --no-verify-jwt

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL          = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  try {
    const { founderId, key } = await req.json() as { founderId?: string; key?: string }
    if (!founderId || !key) {
      return new Response(JSON.stringify({ valid: false }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)
    const { data } = await admin
      .from('founder_claim_tokens')
      .select('token')
      .eq('founder_id', founderId)
      .maybeSingle()

    const valid = !!data?.token && data.token === key
    return new Response(JSON.stringify({ valid }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch {
    return new Response(JSON.stringify({ valid: false }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
