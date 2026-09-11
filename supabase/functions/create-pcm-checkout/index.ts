// CULO Village — create-pcm-checkout Edge Function
//
// Builds a Stripe Checkout Session on the fly for any PCM service that
// carries a one-off Archive Transfer (Blog Management, Village Creatives,
// Full Service) — the transfer is quoted from the prospect's archive size,
// so the total is different for every customer and can't be a static
// Payment Link. Social Media Management and Content Creator have no
// transfer and keep their static links.
//
// Two plans per service:
//   upfront     — transfer + 3 months of the monthly fee now; the monthly
//                 subscription then auto-bills from month 4.
//   installment — the monthly subscription starts now; the transfer is
//                 split across the first 3 invoices (this first invoice
//                 carries 1/3, stripe-pcm-webhook adds the rest on
//                 invoice.paid).
//
// Deploy: supabase functions deploy create-pcm-checkout --no-verify-jwt

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@17?target=deno'

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')
const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://www.culovillage.com'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Mirror of src/config/pcmServices.ts — monthly price (AUD cents) per
// service that goes through this dynamic checkout.
const MONTHLY_CENTS: Record<string, number> = {
  publishing: 90_000,
  creatives: 390_000,
  full: 478_800,
}
const SERVICE_NAME: Record<string, string> = {
  publishing: 'Blog Management',
  creatives: 'Village Creatives',
  full: 'Full Service',
}

// Mirror of getArchiveTier in src/config/archiveUnlock.ts.
function transferPriceCents(total: number): number {
  if (total <= 50) return 1_900
  if (total <= 250) return 3_900
  if (total <= 1_000) return 7_900
  if (total <= 2_500) return 17_500
  if (total <= 5_000) return 34_900
  if (total <= 10_000) return 69_900
  return 200_000
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })
  if (!STRIPE_SECRET_KEY) {
    return new Response(JSON.stringify({ error: 'Checkout is not configured on this deployment.' }), {
      status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  try {
    const body = await req.json() as { email?: string; service?: string; archiveTotal?: number; plan?: 'upfront' | 'installment' }
    const email = body.email?.trim().toLowerCase()
    const service = body.service && MONTHLY_CENTS[body.service] ? body.service : 'publishing'
    const archiveTotal = Math.max(0, Math.round(body.archiveTotal ?? 0))
    const plan = body.plan === 'installment' ? 'installment' : 'upfront'
    if (!email || !email.includes('@')) throw new Error('A real email address is required')

    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })
    const monthly = MONTHLY_CENTS[service]
    const transfer = transferPriceCents(archiveTotal)

    const recurringLine: Stripe.Checkout.SessionCreateParams.LineItem = {
      quantity: 1,
      price_data: {
        currency: 'aud',
        unit_amount: monthly,
        recurring: { interval: 'month' },
        product_data: { name: SERVICE_NAME[service] },
      },
    }
    const oneTime = (name: string, cents: number): Stripe.Checkout.SessionCreateParams.LineItem => ({
      quantity: 1,
      price_data: { currency: 'aud', unit_amount: cents, product_data: { name } },
    })

    const metadata = { pcm_service: service, plan, archive_total: String(archiveTotal) }
    let params: Stripe.Checkout.SessionCreateParams

    if (plan === 'upfront') {
      const anchor = Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60
      params = {
        mode: 'subscription',
        customer_email: email,
        line_items: [
          recurringLine,
          oneTime('Archive Transfer (one-off, initial import)', transfer),
          oneTime(`${SERVICE_NAME[service]} — 3 months upfront`, monthly * 3),
        ],
        subscription_data: { billing_cycle_anchor: anchor, proration_behavior: 'none', metadata },
        metadata,
        success_url: `${SITE_URL}/marketing/start?offer=${service}&paid=1`,
        cancel_url: `${SITE_URL}/marketing`,
      }
    } else {
      const perInstalment = Math.ceil(transfer / 3)
      params = {
        mode: 'subscription',
        customer_email: email,
        line_items: [recurringLine, oneTime('Archive Transfer — instalment 1 of 3', perInstalment)],
        subscription_data: {
          metadata: { ...metadata, transfer_instalments_remaining: '2', transfer_instalment_cents: String(perInstalment) },
        },
        metadata,
        success_url: `${SITE_URL}/marketing/start?offer=${service}&paid=1`,
        cancel_url: `${SITE_URL}/marketing`,
      }
    }

    const session = await stripe.checkout.sessions.create(params)
    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
