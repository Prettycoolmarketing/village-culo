// CULO Village — submit-support-request Edge Function
//
// Backs the contact form at the bottom of /creatives — this page's URL is
// used as the official Support URL in the Culo Creatives Canva app
// listing, so this needs to actually work, not just be a mailto link.
//
// Emails every Capo/Admin (same "query profiles, not a hardcoded inbox"
// pattern as stripe-pcm-webhook's sale notification) with the message, and
// sends the submitter a short confirmation. No database table — this is a
// support inbox, not a ticket system; the email itself is the record.
//
// Deploy: supabase functions deploy submit-support-request --no-verify-jwt

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendEmail, emailLayout } from '../_shared/resend.ts'

const SUPABASE_URL          = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const STAFF_NOTIFICATION_EMAIL = Deno.env.get('STAFF_NOTIFICATION_EMAIL')

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface RequestBody {
  name?: string
  email?: string
  message?: string
  source?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  try {
    const body = await req.json() as RequestBody
    const name = body.name?.trim() || 'Someone'
    const email = body.email?.trim().toLowerCase()
    const message = body.message?.trim()
    const source = body.source?.trim() || 'creatives-page'

    if (!email || !email.includes('@')) throw new Error('A real email address is required')
    if (!message) throw new Error('A message is required')

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)

    const { data: staff } = await admin.from('profiles').select('email').neq('role', 'founder')
    const staffEmails = (staff ?? []).map(s => s.email).filter((e): e is string => !!e)
    // Fall back to the one configured inbox if no staff profiles exist yet
    // (e.g. a fresh project) rather than silently sending nothing.
    const recipients = staffEmails.length > 0 ? staffEmails : (STAFF_NOTIFICATION_EMAIL ? [STAFF_NOTIFICATION_EMAIL] : [])

    await Promise.all(recipients.map(staffEmail => sendEmail(
      staffEmail,
      `Support request — ${name}`,
      emailLayout(
        'New support request',
        `<p><strong>${name}</strong> (<a href="mailto:${email}">${email}</a>) sent a support request via ${source}:</p><p style="white-space:pre-wrap;border-left:3px solid #E8E4DD;padding-left:12px;">${message.replace(/</g, '&lt;')}</p>`,
      ),
    )))

    // Confirmation to the sender so they know it actually went somewhere —
    // important specifically because this doubles as Canva's Support URL.
    await sendEmail(
      email,
      "We've got your message",
      emailLayout(
        'Support request received',
        `<p>Hi ${name.split(' ')[0]},</p><p>Thanks for reaching out — we've received your message and will get back to you as soon as we can.</p><p style="white-space:pre-wrap;color:#6B7280;border-left:3px solid #E8E4DD;padding-left:12px;">${message.replace(/</g, '&lt;')}</p>`,
      ),
    )

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
