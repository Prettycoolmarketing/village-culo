// CULO Village — notify-stuck-onboarding Edge Function
//
// Targets founders whose onboardingStatus has sat at 'ready' for 24h+ —
// research finished (bio already written, first article drafted), but
// they haven't opened the dashboard since, so it never got the chance to
// silently flip to 'confirmed' (see DashboardLayout's auto-confirm
// effect). These are genuinely stuck: nothing is going to move them along
// on its own. Confirmed real via a direct query before this was built —
// e.g. a founder sitting at 'ready' for 2+ days with no nudge anywhere.
//
// Each stuck founder gets one email with their actual written bio
// included (not a generic "come back" message) and a prompt to import
// their content. readyNudgeSentAt stops the same person getting this
// every single day — sent once, not a repeating reminder.
//
// Also sends one digest to support@prettycoolmarketing.com listing
// everyone this run just nudged, so staff can personally follow up on
// anyone that matters.
//
// Deploy: supabase functions deploy notify-stuck-onboarding --no-verify-jwt

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendEmail, emailLayout } from '../_shared/resend.ts'

const SUPABASE_URL          = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const STUCK_THRESHOLD_MS = 24 * 60 * 60 * 1000
const STAFF_DIGEST_EMAIL = 'support@prettycoolmarketing.com'

interface FounderRow {
  id: string
  updated_at: string
  data: {
    name?: string
    signupEmail?: string
    bio?: string
    onboardingStatus?: string
    readyNudgeSentAt?: string
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok')

  try {
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)

    const { data: rows, error } = await admin
      .from('founders')
      .select('id, updated_at, data')
      .filter('data->>onboardingStatus', 'eq', 'ready')
    if (error) throw new Error(error.message)

    const now = Date.now()
    const stuck = (rows ?? [])
      .map(r => r as unknown as FounderRow)
      .filter(r => !r.data.readyNudgeSentAt && now - new Date(r.updated_at).getTime() >= STUCK_THRESHOLD_MS)
      .filter(r => r.data.signupEmail)

    const notified: string[] = []

    for (const founder of stuck) {
      const email = founder.data.signupEmail!
      const name = founder.data.name || 'there'
      const bio = founder.data.bio?.trim()

      const bodyHtml = `
        <p>Hey ${name},</p>
        <p>The link you gave us when you signed up has already been researched — your bio is written and your first article is drafted, both waiting for you.</p>
        ${bio ? `<div style="background:#F8F5F0;border-radius:12px;padding:16px 20px;margin:20px 0;"><p style="font-size:13px;color:#9CA3AF;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Your bio</p><p style="margin:0;white-space:pre-line;">${bio}</p></div>` : ''}
        <p>Have a read, fix anything that's not quite right, and then import the rest of what you've already posted so it stops disappearing into the feed:</p>
        <p><a href="https://www.culovillage.com/dashboard/import-content">Import your content →</a></p>
        <p>With love,<br/>Shakas</p>
      `
      const result = await sendEmail(email, 'Your profile is ready and waiting', emailLayout('The Culo Village: Brisbane, Australia', bodyHtml), 'connect@culovillage.com')
      if (result.ok) {
        notified.push(`${name} <${email}>`)
        await admin.from('founders').update({
          data: { ...founder.data, readyNudgeSentAt: new Date().toISOString() },
        }).eq('id', founder.id)
      }
    }

    if (notified.length > 0) {
      const digestHtml = `
        <p>${notified.length} founder${notified.length === 1 ? '' : 's'} had been stuck at "ready to confirm" for 24h+ and just got nudged with their bio:</p>
        <ul>${notified.map(n => `<li>${n}</li>`).join('')}</ul>
      `
      await sendEmail(STAFF_DIGEST_EMAIL, `${notified.length} founder${notified.length === 1 ? '' : 's'} nudged — stuck at "ready to confirm"`, emailLayout('Staff digest', digestHtml))
    }

    return new Response(JSON.stringify({ ok: true, notified: notified.length }), { headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    })
  }
})
