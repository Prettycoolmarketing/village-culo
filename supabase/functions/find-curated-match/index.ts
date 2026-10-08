// CULO Village — find-curated-match Edge Function
//
// Called by ensureJoinedFounder (src/services/joinFlow.ts) right before it
// would otherwise create a brand-new, blank founder for a plain /join
// signup. A curated founder's claimEmail is only readable by the public
// once the profile is published (founders_public_read: status IN
// ('published','featured')) — a draft curated profile, or any founder row
// in general, can't be queried for this from the client even with a
// signed-in session, so this runs server-side with the service role
// instead. Returns only the matched founder's id — never claimEmail or any
// other field — so this can't be used to enumerate claimEmails for other
// founders by trying different inputs.
//
// Deploy: supabase functions deploy find-curated-match --no-verify-jwt

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL          = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  try {
    const { email } = await req.json() as { email?: string }
    if (!email?.trim()) return json({ founderId: null })

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)
    const { data, error } = await admin
      .from('founders')
      .select('id')
      .is('claimed_by_user_id', null)
      .ilike('data->>claimEmail', email.trim())
      .maybeSingle()

    if (error) return json({ founderId: null })
    return json({ founderId: data?.id ?? null })
  } catch {
    return json({ founderId: null })
  }
})
