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
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendEmail, emailLayout, emailButton } from '../_shared/resend.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

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
  | { type: 'pcm-content-ready'; to: string; founderName: string }
  | { type: 'confirm-and-import-nudge'; to: string; name?: string }

// Staff-facing notifications (new claim / new partner application) always go
// to the fixed CAPO inbox, never a caller-supplied address — the caller is
// often an anonymous claimant and shouldn't get to choose who gets alerted.
function recipientFor(body: EmailBody): string | undefined {
  if (body.type === 'claim-submitted-staff' || body.type === 'partner-application-staff') return STAFF_NOTIFICATION_EMAIL
  return body.to
}

// Templates below this point generate a real Supabase action link (confirm,
// recovery, etc.) with the service role — unlike every other template here,
// that's a privileged action (anyone able to call it could mint a sign-in
// link for an arbitrary email), so these specifically require the caller to
// be real, signed-in Village staff. Every other template stays open (this
// function deploys --no-verify-jwt on purpose — see header) since they only
// ever send a templated email to an address the caller already supplied.
const STAFF_ONLY_TYPES: EmailBody['type'][] = ['confirm-and-import-nudge']

async function requireStaff(req: Request): Promise<void> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) throw new Error('Not signed in.')
  const asCaller = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } })
  const { data: { user: caller } } = await asCaller.auth.getUser()
  if (!caller) throw new Error('Not signed in.')
  const { data: profile } = await asCaller.from('profiles').select('role').eq('id', caller.id).maybeSingle()
  if (!profile || !['admin', 'owner', 'editor'].includes(profile.role)) {
    throw new Error('Only Village staff can send this email.')
  }
}

function render(body: EmailBody, actionLink?: string): { subject: string; html: string } {
  switch (body.type) {
    case 'confirm-and-import-nudge':
      return {
        subject: `Confirm your account and import your content`,
        html: emailLayout(
          `Finish setting up your Village profile`,
          `<p>Hi${body.name ? ` ${body.name.split(' ')[0]}` : ''},</p>
           <p>You're almost in — confirm your account below, then import your content and we'll republish each post as its own web article on your Village profile.</p>
           ${emailButton('Confirm account & get started', actionLink ?? `${SITE_URL}/dashboard/login`)}
           <p style="margin-top:20px;font-size:13px;color:#6B7280;">Once you're in, head to Import in your dashboard to bring your posts over.</p>`,
        ),
      }
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
    case 'pcm-content-ready':
      return {
        subject: `Your first batch is live, ${body.founderName.split(' ')[0]}`,
        html: emailLayout(
          `Your Pretty Cool Marketing content is live`,
          `<p>Hi ${body.founderName.split(' ')[0]},</p>
           <p>Your account manager has finished your first batch of content. It's live in your Village dashboard right now.</p>
           ${emailButton('View your dashboard', `${SITE_URL}/dashboard/profile?tab=content`)}`,
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

    let actionLink: string | undefined
    let admin: ReturnType<typeof createClient> | undefined
    if (STAFF_ONLY_TYPES.includes(body.type)) {
      await requireStaff(req)
      // magiclink (not 'signup') — confirms the account the same way clicking
      // it to sign in does, without touching a password this account may
      // already have set, and works whether or not they confirmed before.
      admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)
      const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
        type: 'magiclink', email: to, options: { redirectTo: `${SITE_URL}/dashboard/import-content` },
      })
      if (linkError) throw new Error(linkError.message)
      actionLink = linkData?.properties?.action_link
    }

    const { subject, html } = render(body, actionLink)
    const result = await sendEmail(to, subject, html)

    // Record a successful nudge so Culo Members can hide the resend button
    // for a few days — never blocks the response on this, and never records
    // a send that didn't actually go out.
    if (result.ok && body.type === 'confirm-and-import-nudge') {
      void (admin ?? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE))
        .from('confirm_nudge_sends').upsert({ email: to, sent_at: new Date().toISOString() })
    }

    return new Response(JSON.stringify(result), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
