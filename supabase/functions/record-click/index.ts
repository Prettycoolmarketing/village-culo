// CULO Village — record-click Edge Function
//
// Same fix as submit-founder-claim: tracking_records has an RLS policy that
// allows anyone to INSERT ("tracking_records_public_insert", WITH CHECK
// (true)), but Supabase's API gateway rejects the anon-key REST insert with
// a 401 before it reaches Postgres — confirmed project-wide, not specific
// to this table. Recording a click through this function instead writes
// server-side with the service role key, which works.
//
// Deploy: supabase functions deploy record-click --no-verify-jwt

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL          = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ClickBody {
  founderId: string
  businessId: string
  recommendationId?: string
  linkType: string
  redirectUrl: string
  sourcePage?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  try {
    const body = await req.json() as ClickBody
    const { founderId, businessId, recommendationId, linkType, redirectUrl, sourcePage } = body

    if (!founderId || !businessId || !linkType || !redirectUrl) {
      throw new Error('founderId, businessId, linkType and redirectUrl are required')
    }

    const id = crypto.randomUUID()
    const clickedAt = new Date().toISOString()

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)
    const { error } = await admin.from('tracking_records').insert({
      id,
      founder_id: founderId,
      business_id: businessId,
      recommendation_id: recommendationId ?? null,
      link_type: linkType,
      source_page: sourcePage ?? null,
      redirect_url: redirectUrl,
      clicked_at: clickedAt,
    })
    if (error) throw new Error(error.message)

    return new Response(JSON.stringify({ id, clickedAt }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
