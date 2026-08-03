// CULO Village — track-click Edge Function
//
// Every link in a sent campaign is rewritten to route through here:
// .../track-click?c={campaignId}&s={sendId}&url={encoded real URL}.
// Logs the click (one row per click, not deduplicated — multiple clicks
// from the same recipient are real signal, not noise) then 302-redirects to
// the real URL. A missing/invalid url never dead-ends the recipient — it
// falls back to the Village homepage rather than an error page.
//
// Deploy: supabase functions deploy track-click --no-verify-jwt

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL          = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SITE_URL              = Deno.env.get('SITE_URL') || 'https://culovillage.com'

serve(async (req) => {
  const url = new URL(req.url)
  const campaignId = url.searchParams.get('c')
  const sendId      = url.searchParams.get('s')
  const target      = url.searchParams.get('url')

  const redirectTo = target && /^https?:\/\//i.test(target) ? target : SITE_URL

  if (campaignId && sendId && target) {
    try {
      const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)
      await admin.from('email_campaign_clicks').insert({
        id: crypto.randomUUID(), campaign_id: campaignId, send_id: sendId, url: target,
      })
    } catch {
      // Never let tracking failures block the redirect.
    }
  }

  return new Response(null, { status: 302, headers: { Location: redirectTo } })
})
