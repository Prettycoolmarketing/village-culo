// CULO Village — notify-new-signup Edge Function
//
// Instant, not a daily batch — called directly from joinFlow.ts the moment
// a new founder record is created, same "fire immediately, don't wait for
// the next cron" treatment as enroll-email-sequence's day:0 fix. Tells
// staff a real person just joined, right as it happens, rather than only
// being visible by going and looking at Culo Members.
//
// Deploy: supabase functions deploy notify-new-signup --no-verify-jwt

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
    const body = await req.json() as { founderId?: string; name?: string; email?: string; source?: string }
    const founderId = body.founderId?.trim()
    if (!founderId) throw new Error('founderId is required')

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)

    // Idempotent per founder, same reasoning as enroll-email-sequence —
    // a retried/duplicated call must never send staff the same alert twice.
    const { data: row, error } = await admin.from('founders').select('data').eq('id', founderId).maybeSingle()
    if (error) throw new Error(error.message)
    if (!row) throw new Error('Founder not found')
    const founderData = row.data as Record<string, unknown>
    if (founderData.signupAlertSentAt) {
      return new Response(JSON.stringify({ success: true, alreadySent: true }), { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })
    }

    const name = body.name || (founderData.name as string) || 'Someone'
    const email = body.email || ''
    const source = body.source || 'village'

    const bodyHtml = `
      <p>New sign up:</p>
      <p><strong>${name}</strong>${email ? ` — ${email}` : ''}<br/>Source: ${source}</p>
      <p><a href="https://www.culovillage.com/dashboard/village/emails">See them in Culo Members →</a></p>
    `
    await sendEmail(STAFF_DIGEST_EMAIL, `New sign up: ${name}`, emailLayout('Staff alert', bodyHtml))

    await admin.from('founders').update({
      data: { ...founderData, signupAlertSentAt: new Date().toISOString() },
    }).eq('id', founderId)

    return new Response(JSON.stringify({ success: true }), { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
