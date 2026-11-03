// CULO Village — find-curated-match Edge Function
//
// Called by ensureJoinedFounder (src/services/joinFlow.ts) right before it
// would otherwise create a brand-new, blank founder for a plain /join
// signup. A curated founder's claimEmail is only readable by the public
// once the profile is published (founders_public_read: status IN
// ('published','featured')) — a draft curated profile, or any founder row
// in general, can't be queried for this from the client even with a
// signed-in session, so this runs server-side with the service role
// instead.
//
// Used to require an exact claimEmail match only — but almost no curated
// founder actually has one on file (staff curation never had a field for
// it), so this silently failed for the vast majority of real people with
// a real waiting profile, creating a disconnected duplicate instead
// (confirmed real: tibo@tap4change.org, and again for a fresh curated
// profile with no claimEmail set at all). Now uses the same tiered match
// as the "claim this profile" button (_shared/claimMatch.ts): 'verified'
// (exact email) still auto-connects silently; 'likely' (name/domain
// match, no exact email on file) now ALSO auto-connects rather than
// blocking the signup on a missing claimEmail — removing that barrier —
// but the caller is told which tier it was so it can flag a 'likely'
// connection for staff to double-check (see notify-claim-activity)
// instead of trusting it blindly.
//
// Restricted to founders with claimed_by_user_id still null — never every
// founder row, since a self-signup founder's own blank profile is also
// "unclaimed" in that sense, and the fuzzy 'likely' tier (unlike an exact
// email match) could otherwise cross-match two different real people's
// accounts by name/domain coincidence. 'village-curated'/'claim-pending'
// (nobody's claimed it yet) get the full fuzzy tier. 'claimed'/'verified'
// are included too — but only to catch a claim staff already approved
// before the person ever signed up (confirmed real: Mitchell Bateman,
// approved while claimed_by_user_id was still null) — restricted further
// down to an exact claimEmail match only, not the fuzzy tier, since that
// founder is already someone's settled profile, not an open placeholder.
//
// Returns the matched founder's id and match tier — never claimEmail or
// any other field — so this can't be used to enumerate claimEmails for
// other founders by trying different inputs.
//
// Deploy: supabase functions deploy find-curated-match --no-verify-jwt

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.108.2'
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

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  try {
    const { email } = await req.json() as { email?: string }
    if (!email?.trim()) return json({ founderId: null, match: 'none' })

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)

    const { data: candidates, error } = await admin
      .from('founders')
      .select('id, data')
      .is('claimed_by_user_id', null)
      .in('data->>profileStatus', ['village-curated', 'claim-pending', 'claimed', 'verified'])

    if (error || !candidates) return json({ founderId: null, match: 'none' })

    // Fetched once for every candidate rather than per-row — same
    // business-name signal claim-founder-profile uses (see claimMatch.ts),
    // keyed by founderId so the loop below is just a map lookup.
    const { data: bizRows } = await admin.from('businesses').select('data')
    const businessNamesByFounder = new Map<string, string[]>()
    for (const b of bizRows ?? []) {
      const biz = b.data as { founderId?: string; name?: string }
      if (!biz.founderId || !biz.name) continue
      const list = businessNamesByFounder.get(biz.founderId) ?? []
      list.push(biz.name)
      businessNamesByFounder.set(biz.founderId, list)
    }

    let best: { id: string; data: ClaimableFounder; match: ClaimMatch } | null = null
    for (const row of candidates) {
      const founder = row.data as ClaimableFounder & { profileStatus?: string }
      const m = matchClaimEmail(email, founder, businessNamesByFounder.get(row.id as string) ?? [])
      if (m === 'none') continue
      // A founder already 'claimed'/'verified' is here only to catch a
      // claim staff approved before the person ever signed up (claimEmail
      // is already an exact, deliberate match at that point) — not to open
      // the fuzzy name/domain tier against that whole pool too, which
      // would risk cross-matching an unrelated new signup against someone
      // else's already-settled profile. Only 'village-curated'/'claim-
      // pending' (genuinely unclaimed, nobody's checked yet) get the
      // 'likely' tier's benefit of the doubt.
      const isAlreadyClaimed = founder.profileStatus === 'claimed' || founder.profileStatus === 'verified'
      if (isAlreadyClaimed && m !== 'verified') continue
      if (m === 'verified') { best = { id: row.id as string, data: founder, match: m }; break }
      if (!best) best = { id: row.id as string, data: founder, match: m }
    }

    if (!best) return json({ founderId: null, match: 'none' })

    // A 'likely' match has no claimEmail on file yet — set it now so
    // link_claimed_founder's own server-side check (auth.email() must
    // equal claimEmail) passes when the caller runs it next, same write
    // claim-founder-profile makes for its own 'likely' instant-claims.
    // Confirmed real: if this write silently fails, the caller still
    // gets told "connected" and runs link_claimed_founder next — which
    // will itself then fail (claimEmail never actually got set, so the
    // RPC's own auth.email()===claimEmail check won't pass), leaving the
    // person's real curated profile and their new signup permanently
    // disconnected with nothing ever telling anyone why. Report 'none'
    // instead of a match this function can't actually deliver on.
    if (best.match === 'likely') {
      const { error } = await admin.from('founders').update({
        data: {
          ...best.data,
          claimEmail: email.trim(),
          claimNotes: `Auto-connected at signup by <${email.trim()}> — soft match (name/domain), not an exact verified email. Worth a quick look.`,
        },
      }).eq('id', best.id)
      if (error) return json({ founderId: null, match: 'none' })
    }

    return json({ founderId: best.id, match: best.match })
  } catch {
    return json({ founderId: null, match: 'none' })
  }
})
