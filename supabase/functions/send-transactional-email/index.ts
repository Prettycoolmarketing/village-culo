// CULO Village — send-transactional-email Edge Function
//
// One function, one place, for every automated email the app sends: claim
// received, claim approved, claim rejected, staff invite. The client never
// talks to Resend directly (no API key in the browser) — it just tells this
// function which template + who + what data, and this function renders the
// HTML and sends it. Deliberately non-fatal from the caller's point of view:
// callers fire-and-forget this and never block a claim/invite on email
// actually landing (see sendEmail()'s ok:false path in _shared/resend.ts).
//
// Deploy: supabase functions deploy send-transactional-email --no-verify-jwt

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { sendEmail, emailLayout, emailButton } from '../_shared/resend.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const SITE_URL = Deno.env.get('SITE_URL') || 'https://culovillage.com'
const STAFF_NOTIFICATION_EMAIL = Deno.env.get('STAFF_NOTIFICATION_EMAIL')

type EmailBody =
  | { type: 'claim-received'; to: string; founderName: string }
  | { type: 'claim-approved'; to: string; founderName: string; founderSlug: string }
  | { type: 'claim-rejected'; to: string; founderName: string; reason?: string }
  | { type: 'staff-invite'; to: string; role: string; invitedBy?: string }
  | { type: 'claim-submitted-staff'; founderName: string; founderSlug: string; requesterName: string; requesterEmail: string }
  | { type: 'partner-application-staff'; businessName: string; applicationUrl: string; pitch: string }

// Staff-facing notifications (new claim / new partner application) always go
// to the fixed CAPO inbox, never a caller-supplied address — the caller is
// often an anonymous claimant and shouldn't get to choose who gets alerted.
function recipientFor(body: EmailBody): string | undefined {
  if (body.type === 'claim-submitted-staff' || body.type === 'partner-application-staff') return STAFF_NOTIFICATION_EMAIL
  return body.to
}

function render(body: EmailBody): { subject: string; html: string } {
  switch (body.type) {
    case 'claim-received':
      return {
        subject: `We've got your claim for ${body.founderName}'s profile`,
        html: emailLayout(
          `Claim received for ${body.founderName}`,
          `<p>Hi there,</p>
           <p>Thanks for letting us know <strong>${body.founderName}</strong>'s Village profile is yours. Our team reviews claims by hand, so it may take a few days — we'll email you the moment there's a decision.</p>
           <p>In the meantime, there's nothing else you need to do.</p>`,
        ),
      }
    case 'claim-approved':
      return {
        subject: `You're in — ${body.founderName}'s profile is yours`,
        html: emailLayout(
          `Your claim was approved`,
          `<p>Good news — your claim for <strong>${body.founderName}</strong>'s Village profile has been approved.</p>
           <p>To take control of it, create a Village account using <strong>this exact email address</strong>. As soon as you sign up, your existing profile — bio, stories, everything already there — will be waiting for you, fully editable.</p>
           ${emailButton('Create your account', `${SITE_URL}/onboarding`)}
           <p style="margin-top:20px;font-size:13px;color:#6B7280;">Don't create a new profile from scratch during sign-up — just create the account with this email and we'll connect the two automatically.</p>`,
        ),
      }
    case 'claim-rejected':
      return {
        subject: `An update on your Village profile claim`,
        html: emailLayout(
          `Your claim wasn't approved`,
          `<p>Hi there,</p>
           <p>We weren't able to verify your claim for <strong>${body.founderName}</strong>'s Village profile${body.reason ? `: ${body.reason}` : '.'}</p>
           <p>If you believe this is a mistake, reply to this email and we'll take another look.</p>`,
        ),
      }
    case 'staff-invite':
      return {
        subject: `You've been invited to CULO Village staff`,
        html: emailLayout(
          `Staff invite`,
          `<p>Hi there,</p>
           <p>${body.invitedBy ? `${body.invitedBy} has` : 'You\'ve been'} invited you to join the CULO Village team as <strong>${body.role}</strong>.</p>
           <p>Create an account using this exact email address and your access will be applied automatically the moment you sign up.</p>
           ${emailButton('Create your account', `${SITE_URL}/dashboard/login`)}`,
        ),
      }
    case 'claim-submitted-staff':
      return {
        subject: `New claim: ${body.founderName}`,
        html: emailLayout(
          `New profile claim waiting for review`,
          `<p><strong>${body.requesterName}</strong> (${body.requesterEmail}) has claimed the profile for <strong>${body.founderName}</strong>.</p>
           ${emailButton('Review claims', `${SITE_URL}/dashboard/village/claims`)}`,
        ),
      }
    case 'partner-application-staff':
      return {
        subject: `New partner application: ${body.businessName}`,
        html: emailLayout(
          `New partner application waiting for review`,
          `<p><strong>${body.businessName}</strong> has applied to become a CULO partner.</p>
           <p style="margin-top:16px;"><strong>Signup link:</strong> ${body.applicationUrl}</p>
           <p style="margin-top:8px;"><strong>Pitch:</strong> ${body.pitch}</p>
           ${emailButton('Review partners', `${SITE_URL}/dashboard/village/partners`)}`,
        ),
      }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  try {
    const body = await req.json() as EmailBody
    if (!body?.type) throw new Error('type is required')

    const to = recipientFor(body)
    if (!to) {
      return new Response(JSON.stringify({ ok: false, error: 'No recipient configured' }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const { subject, html } = render(body)
    const result = await sendEmail(to, subject, html)

    return new Response(JSON.stringify(result), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
