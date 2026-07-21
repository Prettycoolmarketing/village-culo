// CULO Village — submit-founder-claim Edge Function
//
// Claims are filed by anonymous visitors (no login required) via a direct
// PostgREST insert with the anon key, which is meant to be allowed by the
// "claims_public_insert" RLS policy (WITH CHECK (true)). In production this
// insert is being rejected at Supabase's API gateway with a 401 before it
// ever reaches Postgres — confirmed by testing the exact same insert via
// psql-as-anon (succeeds) vs the live REST endpoint with the same anon key
// (fails), and it's not specific to this table (tracking_records shows the
// same symptom). That's a platform-level issue, not something fixable from
// application code.
//
// Routing the write through this function instead sidesteps it entirely:
// the browser calls this function (no JWT required — deployed with
// --no-verify-jwt, since the whole point is anonymous visitors can use it),
// and the actual insert happens server-side with the service role key,
// which was confirmed to work.
//
// Deploy: supabase functions deploy submit-founder-claim --no-verify-jwt

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL          = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ClaimBody {
  founderId: string
  requesterName: string
  requesterEmail: string
  requesterMessage?: string
  evidenceUrl?: string
  requesterUserId?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  try {
    const body = await req.json() as ClaimBody
    const { founderId, requesterName, requesterEmail, requesterMessage, evidenceUrl, requesterUserId } = body

    if (!founderId || !requesterName?.trim() || !requesterEmail?.trim()) {
      throw new Error('founderId, requesterName and requesterEmail are required')
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)

    const claim = {
      id: crypto.randomUUID(),
      founderId,
      requesterName: requesterName.trim(),
      requesterEmail: requesterEmail.trim(),
      requesterMessage: requesterMessage?.trim() || undefined,
      evidenceUrl: evidenceUrl?.trim() || undefined,
      requesterUserId: requesterUserId || undefined,
      status: 'pending' as const,
      requestedAt: new Date().toISOString(),
    }

    const { error: insertError } = await admin.from('founder_claim_requests').insert({
      id: claim.id,
      founder_id: claim.founderId,
      requester_name: claim.requesterName,
      requester_email: claim.requesterEmail,
      requester_user_id: claim.requesterUserId ?? null,
      status: claim.status,
      data: claim,
      requested_at: claim.requestedAt,
    })
    if (insertError) throw new Error(insertError.message)

    // Mirrors founderClaimService.create()'s side effect — mark the founder as
    // having a claim pending so the profile stops offering to claim again.
    const { data: founderRow } = await admin.from('founders').select('data').eq('id', founderId).maybeSingle()
    if (founderRow?.data) {
      const updatedData = { ...founderRow.data, profileStatus: 'claim-pending' }
      await admin.from('founders').update({ data: updatedData, profile_status: 'claim-pending' }).eq('id', founderId)
    }

    return new Response(JSON.stringify({ claim }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
