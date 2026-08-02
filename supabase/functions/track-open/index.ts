// CULO Village — track-open Edge Function
//
// Every sent campaign email embeds <img src=".../track-open?s={sendId}">.
// When an email client loads that image, this records the open (first-time
// timestamp + running count) and returns a 1x1 transparent GIF — never an
// error status, since a broken pixel must never show as a broken image or
// affect deliverability.
//
// Deploy: supabase functions deploy track-open --no-verify-jwt

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL          = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// 1x1 transparent GIF, base64-decoded once at module load.
const PIXEL = Uint8Array.from(atob('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBTAA7'), c => c.charCodeAt(0))

serve(async (req) => {
  const url = new URL(req.url)
  const sendId = url.searchParams.get('s')

  if (sendId) {
    try {
      const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)
      const { data: row } = await admin.from('email_campaign_sends').select('open_count, opened_at').eq('id', sendId).maybeSingle()
      if (row) {
        await admin.from('email_campaign_sends').update({
          opened_at: row.opened_at ?? new Date().toISOString(),
          open_count: (row.open_count ?? 0) + 1,
        }).eq('id', sendId)
      }
    } catch {
      // Never let tracking failures surface — the pixel always returns.
    }
  }

  return new Response(PIXEL, {
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
    },
  })
})
