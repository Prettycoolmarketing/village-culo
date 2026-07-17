// CULO Village — canva-status Edge Function
//
// Answers "is this founder connected to Canva?" without ever exposing the
// stored access/refresh tokens to the client — founder_canva_accounts has
// no client-readable RLS policy at all (see migration 015), so this is the
// only way the Import Content page can know whether to show "Connect
// Canva" or "Browse my designs".
//
// Deploy: supabase functions deploy canva-status

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { assertOwnsFounder } from '../_shared/canva.ts'

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
    return new Response(JSON.stringify({ connected: false }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  try {
    const { founderId } = await req.json()
    if (!founderId) throw new Error('founderId is required')

    const asCaller = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } })
    await assertOwnsFounder(asCaller, founderId)

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)
    const { data } = await admin.from('founder_canva_accounts').select('founder_id').eq('founder_id', founderId).maybeSingle()

    return new Response(JSON.stringify({ connected: Boolean(data) }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch {
    return new Response(JSON.stringify({ connected: false }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
