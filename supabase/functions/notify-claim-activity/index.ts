// CULO Village — notify-claim-activity Edge Function
//
// One staff alert for every way a founder profile can get claimed or
// connected — previously none of these sent anything at all, so a claim
// only became visible by someone going and looking at the Claims tab or
// Founders Management. Three kinds, matching the three real call sites:
//
//   'auto-matched'      — joinFlow.ts's ensureJoinedFounder, right after a
//                          plain /join signup connected automatically to
//                          an existing curated profile (see find-curated-
//                          match). Includes the match tier (verified vs
//                          likely) so staff know whether this is "just
//                          FYI" or "worth a quick look."
//   'instant-claim'      — claim-founder-profile, the "claim this
//                          profile" button on a founder's public page.
//                          Same verified/likely distinction.
//   'review-requested'   — submit-founder-claim, the fallback form for
//                          when no automatic match was possible at all —
//                          this one is never auto-connected, always needs
//                          a human to actually action it.
//
// Deploy: supabase functions deploy notify-claim-activity --no-verify-jwt

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { sendEmail, emailLayout } from '../_shared/resend.ts'

const STAFF_DIGEST_EMAIL = 'support@prettycoolmarketing.com'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ClaimActivityBody {
  kind?: 'auto-matched' | 'instant-claim' | 'review-requested'
  match?: 'verified' | 'likely'
  founderId?: string
  founderName?: string
  requesterName?: string
  requesterEmail?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  try {
    const body = await req.json() as ClaimActivityBody
    const { kind, match, founderId, founderName, requesterName, requesterEmail } = body
    if (!kind || !founderId) throw new Error('kind and founderId are required')

    const name = founderName || 'a founder'
    const who = requesterName ? `${requesterName}${requesterEmail ? ` <${requesterEmail}>` : ''}` : requesterEmail || 'someone'
    const profileLink = `https://www.culovillage.com/dashboard/village/founders`

    let subject: string
    let bodyHtml: string

    if (kind === 'auto-matched') {
      subject = match === 'verified'
        ? `Claim connected: ${who} → ${name}`
        : `Soft-matched claim, please verify: ${who} → ${name}`
      bodyHtml = `
        <p>${who} just signed up and was automatically connected to the curated profile for <strong>${name}</strong>.</p>
        <p>Match type: <strong>${match === 'verified' ? 'Verified (exact email on file)' : 'Likely (name/domain match, not an exact email — worth a quick look)'}</strong></p>
        <p><a href="${profileLink}">See it in Founder Management →</a></p>
      `
    } else if (kind === 'instant-claim') {
      subject = match === 'verified'
        ? `Claim connected: ${who} → ${name}`
        : `Soft-matched claim, please verify: ${who} → ${name}`
      bodyHtml = `
        <p>${who} just claimed the profile for <strong>${name}</strong> via the "claim this profile" button.</p>
        <p>Match type: <strong>${match === 'verified' ? 'Verified (exact email on file)' : 'Likely (name/domain match, not an exact email — worth a quick look)'}</strong></p>
        <p><a href="${profileLink}">See it in Founder Management →</a></p>
      `
    } else {
      subject = `Claim review needed: ${who} → ${name}`
      bodyHtml = `
        <p>${who} submitted a claim request for <strong>${name}</strong> that couldn't be matched automatically — needs a manual decision.</p>
        <p><a href="${profileLink}">Review it in Founder Management →</a></p>
      `
    }

    await sendEmail(STAFF_DIGEST_EMAIL, subject, emailLayout('Claims', bodyHtml))

    return new Response(JSON.stringify({ success: true }), { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
