import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@17?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' })

const CHECK = {
  publishing_hardcoded: 'plink_1SBoc03jH3Xn12tP4bE28z0s', // from PCM_PUBLISHING_LINK URL
  tier2_hardcoded: '00weVe5rPbJ94iCdj983C0t',
  tier3_hardcoded: 'bJe5kEbQdfZp4iC3Iz83C0u',
}

serve(async () => {
  const out: Record<string, unknown> = {}
  out.PCM_TIER2_LINK_ID_env = Deno.env.get('PCM_TIER2_LINK_ID') ?? null
  out.PCM_TIER3_LINK_ID_env = Deno.env.get('PCM_TIER3_LINK_ID') ?? null

  const links = await stripe.paymentLinks.list({ limit: 100 })
  const rows = []
  for (const l of links.data) {
    const items = await stripe.paymentLinks.listLineItems(l.id, { expand: ['data.price.product'] })
    const item = items.data[0]
    const product = item?.price?.product as Stripe.Product | undefined
    rows.push({
      id: l.id,
      url: l.url,
      active: l.active,
      product: product?.name,
      amount: item?.price?.unit_amount,
      recurring: item?.price?.recurring?.interval,
    })
  }
  out.all_payment_links = rows
  out.hardcoded_urls_in_code = {
    PCM_PUBLISHING_LINK: 'https://buy.stripe.com/14AfZi3jH4gHcP80wn83C0s',
    PCM_TIER2_LINK: 'https://buy.stripe.com/00weVe5rPbJ94iCdj983C0t',
    PCM_TIER3_LINK: 'https://buy.stripe.com/bJe5kEbQdfZp4iC3Iz83C0u',
  }

  return new Response(JSON.stringify(out, null, 2), { headers: { 'Content-Type': 'application/json' } })
})
