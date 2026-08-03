// CULO Village — send-campaign Edge Function
//
// Sends a draft email_campaigns row to every current email_subscribers row,
// one Resend call per recipient, each with its own tracking pixel (recorded
// as its own email_campaign_sends row so opens can be attributed per
// address) and every link rewritten through track-click (a real, deliberate
// action — a much more trustworthy signal than the open pixel, which mail
// clients increasingly pre-fetch automatically regardless of whether anyone
// actually read the email). Deliberately simple — no scheduling, no
// batching/rate-limit backoff, no unsubscribe link yet — a real
// send-and-track loop, not a full ESP. Staff-only: verifies the caller is a
// village admin via is_village_admin() before sending anything, using their
// own JWT (this function keeps JWT verification on, unlike the
// anonymous-submission functions elsewhere in this codebase).
//
// Deploy: supabase functions deploy send-campaign

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendEmail } from '../_shared/resend.ts'

const SUPABASE_URL          = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY     = Deno.env.get('SUPABASE_ANON_KEY')!
const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Rewrites every href="..." in the campaign body to route through
// track-click first — done per-recipient (not once) since the click must
// carry that recipient's own sendId to attribute it correctly.
function rewriteLinksForTracking(html: string, campaignId: string, sendId: string): string {
  return html.replace(/href="([^"]+)"/g, (_match, rawUrl: string) => {
    if (!/^https?:\/\//i.test(rawUrl)) return `href="${rawUrl}"`
    const tracked = `${SUPABASE_URL}/functions/v1/track-click?c=${campaignId}&s=${sendId}&url=${encodeURIComponent(rawUrl)}`
    return `href="${tracked}"`
  })
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
    const { campaignId } = await req.json()
    if (!campaignId) throw new Error('campaignId is required')

    const asCaller = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } })
    const { data: isAdmin } = await asCaller.rpc('is_village_admin')
    if (!isAdmin) throw new Error('Staff access required.')

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)

    const { data: campaignRow, error: campaignError } = await admin.from('email_campaigns').select('data, status').eq('id', campaignId).maybeSingle()
    if (campaignError) throw new Error(campaignError.message)
    if (!campaignRow) throw new Error('Campaign not found.')
    if (campaignRow.status === 'sent') throw new Error('This campaign has already been sent.')

    const campaign = campaignRow.data as { subject: string; bodyHtml: string }
    const { data: subscriberRows, error: subError } = await admin.from('email_subscribers').select('email')
    if (subError) throw new Error(subError.message)

    const subscribers = (subscriberRows ?? []).map(r => r.email as string)
    let sent = 0
    const failures: string[] = []

    for (const email of subscribers) {
      const sendId = crypto.randomUUID()
      const pixel = `<img src="${SUPABASE_URL}/functions/v1/track-open?s=${sendId}" width="1" height="1" alt="" style="display:none" />`
      const trackedHtml = rewriteLinksForTracking(campaign.bodyHtml, campaignId, sendId)
      const result = await sendEmail(email, campaign.subject, `${trackedHtml}${pixel}`)
      await admin.from('email_campaign_sends').insert({
        id: sendId, campaign_id: campaignId, email,
      })
      if (result.ok) sent++
      else failures.push(email)
    }

    await admin.from('email_campaigns').update({
      status: 'sent',
      data: { ...campaign, sentAt: new Date().toISOString(), recipientCount: subscribers.length },
    }).eq('id', campaignId)

    return new Response(JSON.stringify({ sent, total: subscribers.length, failures }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
