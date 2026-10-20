// CULO Village — notify-first-import Edge Function
//
// Instant, not a daily batch — called directly from importedContentService
// the moment a founder's very first real (non-research-written) imported
// item lands. Same "fire immediately" treatment as notify-new-signup, so
// staff see real import activity as it happens instead of only finding out
// by going and looking at Culo Members (which previously had no indicator
// of import activity at all).
//
// Deploy: supabase functions deploy notify-first-import --no-verify-jwt

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendEmail, emailLayout } from '../_shared/resend.ts'

const SUPABASE_URL          = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const STAFF_DIGEST_EMAIL = 'support@prettycoolmarketing.com'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  try {
    const body = await req.json() as { founderId?: string; platform?: string }
    const founderId = body.founderId?.trim()
    if (!founderId) throw new Error('founderId is required')

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)

    // Idempotent per founder — once per account, ever, same as every other
    // one-time nudge/alert field in this codebase.
    const { data: row, error } = await admin.from('founders').select('data').eq('id', founderId).maybeSingle()
    if (error) throw new Error(error.message)
    if (!row) throw new Error('Founder not found')
    const founderData = row.data as Record<string, unknown>
    if (founderData.firstImportAlertSentAt) {
      return new Response(JSON.stringify({ success: true, alreadySent: true }), { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })
    }

    const name = (founderData.name as string) || 'Someone'
    const email = (founderData.signupEmail as string) || ''
    const platform = body.platform || 'content'

    const bodyHtml = `
      <p>First import:</p>
      <p><strong>${name}</strong>${email ? ` — ${email}` : ''}<br/>Platform: ${platform}</p>
      <p><a href="https://www.culovillage.com/dashboard/village/emails">See them in Culo Members →</a></p>
    `
    await sendEmail(STAFF_DIGEST_EMAIL, `${name} just imported content`, emailLayout('Staff alert', bodyHtml))

    await admin.from('founders').update({
      data: { ...founderData, firstImportAlertSentAt: new Date().toISOString() },
    }).eq('id', founderId)

    return new Response(JSON.stringify({ success: true }), { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
