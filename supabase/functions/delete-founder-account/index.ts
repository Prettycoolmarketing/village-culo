// CULO Village — delete-founder-account Edge Function
//
// Permanently deletes a founder's Supabase Auth login AND their founders
// row. The existing "Archive" bulk action (deleteFoundersBatch, see
// services/founders.ts) only ever removed the founders row — the actual
// login still existed underneath, so the same email could sign back in and
// get a brand new blank profile via ensureJoinedFounder. Deleting the real
// auth.users row needs the admin API, which only the service role can call,
// hence this function rather than a direct client delete.
//
// Deploy: supabase functions deploy delete-founder-account
//
// Restricted to admin/owner specifically (not the wider editor/moderator
// set is_village_admin() covers) — this deletes a real login, not just a
// curated profile, so it gets a tighter bar than routine founder curation.

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
    const { founderId } = await req.json()
    if (!founderId) throw new Error('founderId is required')

    // Verify the caller is actually admin/owner as themselves, before doing
    // anything with the service role — never trust a client-sent role claim.
    const asCaller = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user: caller } } = await asCaller.auth.getUser()
    if (!caller) throw new Error('Not signed in.')

    const { data: profile } = await asCaller.from('profiles').select('role').eq('id', caller.id).maybeSingle()
    if (!profile || !['admin', 'owner'].includes(profile.role)) {
      throw new Error('Only admins can delete a founder\'s account.')
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)

    const { data: founderRow, error: founderError } = await admin
      .from('founders').select('user_id').eq('id', founderId).maybeSingle()
    if (founderError) throw new Error(founderError.message)

    const { error: deleteFounderError } = await admin.from('founders').delete().eq('id', founderId)
    if (deleteFounderError) throw new Error(deleteFounderError.message)

    if (founderRow?.user_id) {
      const { error: deleteUserError } = await admin.auth.admin.deleteUser(founderRow.user_id)
      // Non-fatal — the founders row is already gone either way, and a
      // missing/already-deleted auth user shouldn't block the response.
      if (deleteUserError) console.error('deleteUser failed:', deleteUserError.message)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
