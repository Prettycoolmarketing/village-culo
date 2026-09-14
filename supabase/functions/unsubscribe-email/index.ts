// CULO Village — unsubscribe-email Edge Function
//
// The real, working one-click unsubscribe every newsletter footer links
// to. Anonymous by design (a recipient clicking a link in their inbox has
// no session) — records the email in email_unsubscribes, which
// send-campaign checks against every recipient list at send time. Returns
// a small standalone HTML confirmation page directly (this is what a
// browser opening the link actually renders), not JSON.
//
// Deploy: supabase functions deploy unsubscribe-email --no-verify-jwt

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL          = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

function page(title: string, message: string): Response {
  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>${title}</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family:Georgia,'Times New Roman',serif;background:#F8F5F0;margin:0;padding:64px 16px;color:#2D2A26;">
  <div style="max-width:420px;margin:0 auto;background:#FFFFFF;border-radius:16px;border:1px solid #E8E4DD;padding:36px 28px;text-align:center;">
    <p style="color:#F9E4C0;background:#2D2A26;display:inline-block;padding:6px 14px;border-radius:999px;font-size:12px;letter-spacing:2px;margin:0 0 20px;">CULO VILLAGE</p>
    <h1 style="font-size:20px;margin:0 0 12px;">${title}</h1>
    <p style="font-size:14px;line-height:1.6;color:#6B7280;margin:0;">${message}</p>
  </div>
</body></html>`
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}

serve(async (req) => {
  try {
    const url = new URL(req.url)
    const email = (url.searchParams.get('email') ?? '').trim().toLowerCase()
    if (!email || !email.includes('@')) {
      return page("That link's missing something", 'No email address was included in this link, so nothing was changed.')
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)
    await admin.from('email_unsubscribes').upsert({ email })

    return page("You're unsubscribed", `${email} won't receive any more newsletters from The Culo Village. Sorry to see you go.`)
  } catch (err) {
    return page('Something went wrong', err instanceof Error ? err.message : 'Please try again, or email support@prettycoolmarketing.com.')
  }
})
