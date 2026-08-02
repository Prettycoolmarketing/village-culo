// CULO Village — submit-waitlist Edge Function
//
// Anonymous visitors join a waitlist (e.g. "CULO Creatives in Canva —
// coming soon") from public pages. Same reason submit-founder-claim routes
// through a function instead of a direct anon insert: Supabase's API
// gateway rejects direct anon REST inserts in production even when the RLS
// policy would allow it, confirmed on other tables this session. Routing
// through here with the service role key sidesteps that entirely.
//
// Deploy: supabase functions deploy submit-waitlist --no-verify-jwt

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL          = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface WaitlistBody {
  email: string
  name?: string
  source: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  try {
    const body = await req.json() as WaitlistBody
    const email = body.email?.trim().toLowerCase()
    if (!email || !email.includes('@')) throw new Error('A real email address is required')

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)

    const entry = {
      id: crypto.randomUUID(),
      email,
      name: body.name?.trim() || undefined,
      source: body.source || 'unknown',
      createdAt: new Date().toISOString(),
    }

    const { error: insertError } = await admin.from('canva_waitlist').insert({
      id: entry.id,
      email: entry.email,
      data: entry,
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
