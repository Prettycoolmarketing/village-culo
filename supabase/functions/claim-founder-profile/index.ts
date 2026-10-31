// CULO Village — claim-founder-profile Edge Function
//
// The write side of the instant-claim flow, moved server-side. The client
// (ClaimProfilePage) used to call updateFounder() directly to mark the
// founder claimed/set claimEmail — but that runs with the visitor's own
// anon session, and founders' UPDATE RLS only allows is_village_admin() or
// auth.uid() = user_id/claimed_by_user_id. A brand-new claimant has none of
// those yet (they haven't even finished signUp() at the point this fires),
// so that write was silently failing every single time — confirmed via a
// real claimant (tibo@tap4change.org) whose claimEmail was still null in
// the database despite having gone through the form. This is why: it looks
// like it worked (no error surfaced to the client, since updateFounder's
// own failure path wasn't being checked either), but nothing was ever
// actually saved, so the "connects automatically on sign-in" promise
// (getCurrentFounder's claimEmail match, see currentFounder.ts) had
// nothing to match against.
//
// Re-does the match check server-side rather than trusting whatever the
// client claims the match level is — a client could otherwise call this
// directly and claim it was a "verified" match for any founder it likes.
// Matching logic now lives in _shared/claimMatch.ts, shared with
// find-curated-match (the automatic /join signup match uses the exact
// same verified/likely/none tiers now, not a hard exact-email-only check)
// — keep both call sites in mind if the matching rules ever change.
//
// Deploy: supabase functions deploy claim-founder-profile --no-verify-jwt

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { matchClaimEmail, type ClaimMatch, type ClaimableFounder } from '../_shared/claimMatch.ts'

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

type FounderData = ClaimableFounder & {
  isClaimable?: boolean
  profileStatus?: string
  claimNotes?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  try {
    const { founderId, name, email, key } = await req.json() as {
      founderId?: string; name?: string; email?: string; key?: string
    }
    if (!founderId || !name?.trim() || !email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: 'Missing or invalid founder, name or email.' }, 400)
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)

    const { data: row, error: readError } = await admin
      .from('founders').select('id, data').eq('id', founderId).maybeSingle()
    if (readError || !row) return json({ error: 'Profile not found.' }, 404)
    const founder = row.data as FounderData

    if (founder.isClaimable === false) return json({ error: 'This profile is no longer claimable.' }, 400)
    if (founder.profileStatus === 'claimed') return json({ error: 'This profile has already been claimed.' }, 400)

    // A trusted ?key= link (same token verify-claim-token checks) always
    // counts as verified — skips the heuristic match entirely, same as the
    // client's skipVerification flag.
    let match: ClaimMatch = 'none'
    if (key) {
      const { data: tokenRow } = await admin
        .from('founder_claim_tokens').select('token').eq('founder_id', founderId).maybeSingle()
      if (tokenRow?.token && tokenRow.token === key) match = 'verified'
    }
    if (match !== 'verified') match = matchClaimEmail(email, founder)

    if (match === 'none') {
      return json({ error: 'Could not verify this email against the profile — use the review request instead.' }, 400)
    }

    const nextData: FounderData = {
      ...founder,
      profileStatus: 'claimed',
      claimedAt: new Date().toISOString(),
      claimEmail: email.trim(),
      isClaimable: false,
      claimNotes: match === 'likely'
        ? `Instant-claimed by ${name.trim()} <${email.trim()}> — soft match (name/domain), not an exact verified email. Worth a quick look.`
        : founder.claimNotes,
    }
    const { error: writeError } = await admin.from('founders').update({ data: nextData }).eq('id', founderId)
    if (writeError) return json({ error: writeError.message }, 500)

    // Staff alert — fire-and-forget, this flow's own success must never
    // wait on or fail because of the notification.
    void fetch(`${SUPABASE_URL}/functions/v1/notify-claim-activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SUPABASE_SERVICE_ROLE}` },
      body: JSON.stringify({ kind: 'instant-claim', match, founderId, founderName: founder.name, requesterName: name.trim(), requesterEmail: email.trim() }),
    }).catch(() => { /* best-effort */ })

    return json({ success: true, match })
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Unknown error' }, 500)
  }
})
