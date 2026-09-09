// CULO Village — submit-pcm-lead Edge Function
//
// Anonymous visitors on culovillage.com/marketing submit a short form
// (name, email, phone, website) before pricing is revealed. Routed through
// here with the service role key for the same reason submit-waitlist is —
// direct anon REST inserts get rejected at Supabase's API gateway in
// production even when RLS would allow them.
//
// Deploy: supabase functions deploy submit-pcm-lead --no-verify-jwt

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL          = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface LeadBody {
  name?: string
  email: string
  phone?: string
  website?: string
  source: string   // e.g. 'marketing-publishing' | 'marketing-social'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  try {
    const body = await req.json() as LeadBody
    const email = body.email?.trim().toLowerCase()
    if (!email || !email.includes('@')) throw new Error('A real email address is required')

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)

    const entry = {
      id: crypto.randomUUID(),
      name: body.name?.trim() || undefined,
      email,
      phone: body.phone?.trim() || undefined,
      website: body.website?.trim() || undefined,
      source: body.source || 'marketing',
      createdAt: new Date().toISOString(),
    }

    const { error: insertError } = await admin.from('pcm_leads').insert({
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
