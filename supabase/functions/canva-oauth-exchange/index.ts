// CULO Village — canva-oauth-exchange Edge Function
//
// Finishes the OAuth 2.0 Authorization Code + PKCE flow started by
// startCanvaConnect (src/services/canva.ts): trades the `code` Canva just
// redirected back with, plus the code_verifier that never left the
// browser, for a real access/refresh token pair. Runs server-side because
// it needs CANVA_CLIENT_SECRET, which must never reach the browser.
//
// Deploy: supabase functions deploy canva-oauth-exchange
// Requires secrets:
//   supabase secrets set CANVA_CLIENT_ID=...
//   supabase secrets set CANVA_CLIENT_SECRET=...
// (CANVA_CLIENT_ID here just needs to match VITE_CANVA_CLIENT_ID — it's not
// secret, but Canva's token endpoint wants it alongside the secret.)

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL          = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY     = Deno.env.get('SUPABASE_ANON_KEY')!
const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const CANVA_CLIENT_ID       = Deno.env.get('CANVA_CLIENT_ID')
const CANVA_CLIENT_SECRET   = Deno.env.get('CANVA_CLIENT_SECRET')

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  if (!CANVA_CLIENT_ID || !CANVA_CLIENT_SECRET) {
    return new Response(JSON.stringify({ error: 'Canva import is not configured on this deployment.' }), {
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
    const { founderId, code, codeVerifier, redirectUri } = await req.json()
    if (!founderId || !code || !codeVerifier || !redirectUri) throw new Error('Missing required fields.')

    const asCaller = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: founder, error: founderError } = await asCaller
      .from('founders').select('id').eq('id', founderId).single()
    if (founderError || !founder) throw new Error('You do not have access to this founder profile.')

    const basicAuth = btoa(`${CANVA_CLIENT_ID}:${CANVA_CLIENT_SECRET}`)
    const form = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      code_verifier: codeVerifier,
      redirect_uri: redirectUri,
    })
    const res = await fetch('https://api.canva.com/rest/v1/oauth/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form,
    })
    const token = await res.json()
    if (!res.ok) throw new Error(token.error_description ?? token.error ?? 'Canva rejected the connection.')

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)
    const expiresAt = new Date(Date.now() + (Number(token.expires_in) || 3600) * 1000).toISOString()
    const { error: upsertError } = await admin.from('founder_canva_accounts').upsert({
      founder_id: founderId,
      access_token: token.access_token,
      refresh_token: token.refresh_token,
      expires_at: expiresAt,
    }, { onConflict: 'founder_id' })
    if (upsertError) throw new Error(upsertError.message)

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
