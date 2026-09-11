// CULO Village — stripe-pcm-webhook Edge Function
//
// Unlike stripe-creatives-webhook / stripe-archive-unlock-webhook, a PCM
// checkout has no existing founder to attach to — the buyer is a brand new
// prospect from /marketing/social, not a signed-in Village member. On
// checkout.session.completed this creates everything from scratch:
//   1. A Supabase auth user for the buyer's email (or reuses one that
//      already exists — a client paying for a second package, say).
//   2. A minimal founder + business row for them, linked via founder.userId
//      so getCurrentFounder() resolves it the moment they set a password.
//      pcmManaged: true (bypasses self-serve publish limits/meters),
//      pcmService set from which Payment Link they paid through,
//      pcmGateOpen: false (dashboard shows a "being built" banner until
//      CAPO staff flips this on from PcmClientDetailPage).
//   3. A pcm_clients row so the new client shows up in the Capo tracker
//      immediately, no staff data entry required.
//   4. A branded "set your password" email (a Supabase recovery link,
//      sent through Resend rather than Supabase's own default template).
//
// This needs its own webhook endpoint in the Stripe Dashboard (Developers →
// Webhooks → Add endpoint → this function's URL, listening for
// checkout.session.completed) and its own signing secret —
// STRIPE_PCM_WEBHOOK_SECRET. STRIPE_SECRET_KEY is shared with the other
// Stripe functions.
//
// PCM_TIER2_LINK_ID / PCM_TIER3_LINK_ID (optional but recommended): the
// Payment Link ids (plink_…) for the Social Media Service / Content
// Creator Full Service links in src/config/pcmPaymentLinks.ts — used to
// set pcmService correctly. Without them every PCM checkout defaults to
// 'social'.
//
// Idempotent via stripe_processed_sessions, same as the other Stripe
// webhooks — a retried delivery of the same session id is a no-op.
//
// Deploy: supabase functions deploy stripe-pcm-webhook --no-verify-jwt

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@17?target=deno'
import { sendEmail, emailLayout, emailButton } from '../_shared/resend.ts'

const SUPABASE_URL          = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const STRIPE_SECRET_KEY     = Deno.env.get('STRIPE_SECRET_KEY')
const WEBHOOK_SECRET        = Deno.env.get('STRIPE_PCM_WEBHOOK_SECRET')
const TIER2_LINK_ID         = Deno.env.get('PCM_TIER2_LINK_ID') // Social Media Service
const TIER3_LINK_ID         = Deno.env.get('PCM_TIER3_LINK_ID') // Content Creator Full Service
const SITE_URL              = Deno.env.get('SITE_URL') ?? 'https://www.culovillage.com'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// A generic, always-valid starting point — staff fill in the founder's
// real location/industry from Profile once they're onboarded; nothing here
// blocks that from being edited immediately.
const DEFAULT_LOCATION = { id: 'brisbane', slug: 'brisbane', name: 'Brisbane', state: 'QLD', country: 'Australia', description: '', image: '/placeholders/village-location.svg' }
const DEFAULT_INDUSTRY = { id: 'marketing', slug: 'marketing', name: 'Marketing & Advertising' }

function slugify(text: string): string {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'client'
}

// admin.auth.admin.listUsers() with no args only returns its first page
// (50 users) — a repeat client (buying a second package) whose account
// isn't in that first page used to fail with "Could not find or create a
// user for this email" even though their account genuinely exists. Pages
// through properly instead; capped at 5,000 users as a sanity limit, not
// an expected ceiling.
async function findUserByEmail(admin: ReturnType<typeof createClient>, email: string) {
  const perPage = 200
  for (let page = 1; page <= 25; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error || !data?.users?.length) return null
    const found = data.users.find(u => u.email?.toLowerCase() === email)
    if (found) return found
    if (data.users.length < perPage) return null // last page
  }
  return null
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  if (!STRIPE_SECRET_KEY || !WEBHOOK_SECRET) {
    return new Response(JSON.stringify({ error: 'PCM webhook is not configured on this deployment.' }), {
      status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)

  const signature = req.headers.get('stripe-signature')
  const rawBody = await req.text()

  let event: Stripe.Event
  try {
    if (!signature) throw new Error('Missing stripe-signature header')
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, WEBHOOK_SECRET)
  } catch (err) {
    return new Response(JSON.stringify({ error: `Webhook signature verification failed: ${err instanceof Error ? err.message : 'unknown error'}` }), {
      status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  try {
    // Blog Management "pay monthly" plan — the Archive Transfer is split
    // across the first 3 invoices. Invoice 1 (billing_reason
    // subscription_create) carried instalment 1 as a checkout line item;
    // here we drop instalments 2 and 3 onto the next invoices as the
    // subscription pays them.
    if (event.type === 'invoice.paid') {
      const invoice = event.data.object as Stripe.Invoice
      const subId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id
      if (!subId) return new Response(JSON.stringify({ received: true }), { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })

      const sub = await stripe.subscriptions.retrieve(subId)
      const remaining = Number(sub.metadata?.transfer_instalments_remaining ?? 0)
      const cents = Number(sub.metadata?.transfer_instalment_cents ?? 0)
      const isFirstOrCycle = invoice.billing_reason === 'subscription_create' || invoice.billing_reason === 'subscription_cycle'
      if (remaining > 0 && cents > 0 && isFirstOrCycle && typeof sub.customer === 'string') {
        await stripe.invoiceItems.create({
          customer: sub.customer,
          subscription: subId,
          amount: cents,
          currency: 'aud',
          description: `Archive Transfer — instalment ${4 - remaining} of 3`,
        })
        await stripe.subscriptions.update(subId, {
          metadata: { ...sub.metadata, transfer_instalments_remaining: String(remaining - 1) },
        })
      }
      return new Response(JSON.stringify({ received: true }), { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })
    }

    if (event.type !== 'checkout.session.completed') {
      return new Response(JSON.stringify({ received: true }), { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })
    }

    const session = event.data.object as Stripe.Checkout.Session
    const email = session.customer_details?.email?.trim().toLowerCase()
    if (!email || session.payment_status !== 'paid') {
      return new Response(JSON.stringify({ received: true, skipped: 'no email or not paid' }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    // Idempotency: claim this session id first — a retried delivery hits
    // the primary key and bails without creating a duplicate account.
    const { error: claimErr } = await admin.from('stripe_processed_sessions').insert({
      session_id: session.id, handler: 'pcm', founder_id: null,
    })
    if (claimErr) {
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const linkId = typeof session.payment_link === 'string' ? session.payment_link : session.payment_link?.id
    const META_SERVICES = ['publishing', 'creatives', 'full'] as const
    type PcmSvc = 'publishing' | 'social' | 'content' | 'creatives' | 'full'
    const metaSvc = session.metadata?.pcm_service
    const pcmService: PcmSvc =
      metaSvc && (META_SERVICES as readonly string[]).includes(metaSvc) ? metaSvc as PcmSvc
        : linkId === TIER3_LINK_ID ? 'content'
        : 'social'
    const SERVICE_LABELS: Record<PcmSvc, string> = {
      publishing: 'Blog Management', social: 'Social Media Management', content: 'Content Creator',
      creatives: 'Village Creatives', full: 'Full Service',
    }
    const serviceLabel = SERVICE_LABELS[pcmService]
    // Any tier that includes publishing (publishing, creatives, full) is a
    // managed publishing service — the whole archive is theirs, so unlock
    // it fully on the new account.
    const includesPublishing = pcmService === 'publishing' || pcmService === 'creatives' || pcmService === 'full'
    const publishingGrant = includesPublishing
      ? { archiveUnlocked: true, archiveUnlockedAt: new Date().toISOString(), archivePublishLimit: -1 }
      : {}
    const name = session.customer_details?.name?.trim() || email.split('@')[0]

    // Reuse an existing auth user if this email already has one (a client
    // buying a second package) — otherwise create a fresh one with no
    // password; the recovery email below is how they ever set one.
    let userId: string
    const { data: created, error: createErr } = await admin.auth.admin.createUser({ email, email_confirm: true })
    if (created?.user) {
      userId = created.user.id
    } else if (createErr?.message?.toLowerCase().includes('already')) {
      const existing = await findUserByEmail(admin, email)
      if (!existing) throw new Error('Could not find or create a user for this email')
      userId = existing.id
    } else {
      throw new Error(createErr?.message ?? 'Could not create a user for this email')
    }

    // Only create a founder/business/pcm_clients row the first time this
    // person pays — a second purchase (e.g. upgrading tier2 -> tier3) just
    // updates the existing one.
    const { data: existingClientRow } = await admin.from('pcm_clients').select('id, founder_id, data').eq('email', email).maybeSingle()

    let founderId: string
    if (existingClientRow?.founder_id) {
      founderId = existingClientRow.founder_id
      const { data: founderRow } = await admin.from('founders').select('data').eq('id', founderId).maybeSingle()
      if (founderRow) {
        await admin.from('founders').update({
          data: { ...founderRow.data, pcmManaged: true, pcmManagedAt: new Date().toISOString(), pcmService, ...publishingGrant },
        }).eq('id', founderId)
      }
    } else {
      founderId = crypto.randomUUID()
      const businessId = crypto.randomUUID()
      const baseSlug = slugify(name)
      const slug = `${baseSlug}-${founderId.slice(0, 6)}`

      const now = new Date().toISOString()
      const businessSlug = `${baseSlug}-biz-${businessId.slice(0, 6)}`

      await admin.from('businesses').insert({
        id: businessId, slug: businessSlug, founder_id: founderId, status: 'draft', visibility: 'private',
        data: {
          id: businessId, slug: businessSlug, name, tagline: '', description: '',
          logo: '', coverImage: '', founderId, location: DEFAULT_LOCATION, industry: DEFAULT_INDUSTRY, topics: [],
          offers: [], status: 'draft', featured: false, createdAt: now,
        },
      })

      await admin.from('founders').insert({
        id: founderId, user_id: userId, status: 'draft', featured: false, slug, visibility: 'private',
        data: {
          id: founderId, slug, name, bio: '', avatar: '', location: DEFAULT_LOCATION, industry: DEFAULT_INDUSTRY,
          businessId, topics: [], status: 'draft', featured: false, createdAt: now,
          userId, pcmManaged: true, pcmManagedAt: now, pcmService, pcmGateOpen: false, ...publishingGrant,
        },
      })
    }

    const clientData = {
      id: existingClientRow?.id ?? crypto.randomUUID(),
      name, email,
      offer: pcmService, // pcm_clients' own PcmOfferId type already covers 'social' | 'full'
      startDate: new Date().toISOString().slice(0, 10),
      nextShootDate: '',
      stages: existingClientRow?.data?.stages ?? { raw: null, editing: null, approvals: null, live: null },
      notes: existingClientRow?.data?.notes ?? '',
      activity: [
        { at: new Date().toISOString(), text: `Paid via Stripe checkout — ${serviceLabel}${session.metadata?.plan ? ` (${session.metadata.plan})` : ''}.` },
        ...(existingClientRow?.data?.activity ?? []),
      ],
      createdAt: existingClientRow?.data?.createdAt ?? new Date().toISOString(),
      founderId,
      monthlyTarget: 30,
    }
    await admin.from('pcm_clients').upsert({
      id: clientData.id, founder_id: founderId, email, data: clientData,
    })

    // Branded "set your password" email — a Supabase recovery link sent
    // through Resend instead of Supabase's own default-styled template.
    const { data: linkData } = await admin.auth.admin.generateLink({
      type: 'recovery', email, options: { redirectTo: `${SITE_URL}/dashboard/reset-password` },
    })
    const actionLink = linkData?.properties?.action_link
    if (actionLink) {
      await sendEmail(
        email,
        "You're in — set your password",
        emailLayout(
          'Set your Culo Village dashboard password',
          `<p>Hi ${name.split(' ')[0]},</p><p>Thanks for joining Pretty Cool Marketing. Set your password to get into your dashboard — your account manager is already getting started on your first batch of content.</p>${emailButton('Set your password', actionLink)}`,
        ),
      )
    }

    return new Response(JSON.stringify({ received: true, founderId }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
