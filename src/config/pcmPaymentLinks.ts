// Pretty Cool Marketing — Stripe Payment Links (AUD).
//
// PCM is the done-for-you service arm of the Culo Village. These three
// links back the marketing funnels at /marketing/publishing and
// /marketing/social. Create them in the Stripe Dashboard (Payment Links —
// NOT via an Edge Function, these are standalone products) and paste the
// real URLs in below. Until then they point at "#" and the funnel buttons
// fall back to an email CTA.
//
// Stripe products / Payment Links to create (AUD), then paste the URLs below:
//   1. "Village Service"              — one-off, $900 AUD
//   2. "Social Media Service"         — recurring, $3,000 AUD / month
//   3. "Content Creator Full Service" — recurring, $3,888 AUD / month
//
// Set each link's post-payment redirect to:
//   https://culovillage.com/marketing/start?offer=publishing   (etc.)
// so the customer lands on the "email us your material" instructions.

export interface PcmOffer {
  id: 'publishing' | 'tier2' | 'tier3'
  name: string
  priceLabel: string
  cadence: string
  paymentLink: string
}

// Live-mode Payment Links, created via stripe-setup-2026-tiers (AUD).
export const PCM_PUBLISHING_LINK = 'https://buy.stripe.com/14AfZi3jH4gHcP80wn83C0s' // "Village Service" $900 AUD one-off
export const PCM_TIER2_LINK      = 'https://buy.stripe.com/00weVe5rPbJ94iCdj983C0t' // "Social Media Service" $3,000 AUD / month
export const PCM_TIER3_LINK      = 'https://buy.stripe.com/bJe5kEbQdfZp4iC3Iz83C0u' // "Content Creator Full Service" $3,888 AUD / month

export const PCM_SUPPORT_EMAIL = 'support@prettycoolmarketing.com'

export const PCM_OFFERS: Record<PcmOffer['id'], PcmOffer> = {
  publishing: {
    id: 'publishing',
    name: 'Village Service',
    priceLabel: '$900 AUD',
    cadence: 'one-off',
    paymentLink: PCM_PUBLISHING_LINK,
  },
  tier2: {
    id: 'tier2',
    name: 'Social Media Service',
    priceLabel: '$3,000 AUD',
    cadence: 'per month',
    paymentLink: PCM_TIER2_LINK,
  },
  tier3: {
    id: 'tier3',
    name: 'Content Creator Full Service',
    priceLabel: '$3,888 AUD',
    cadence: 'per month',
    paymentLink: PCM_TIER3_LINK,
  },
}

/** True once a real Stripe link has been pasted in (i.e. not the "#" placeholder). */
export function isLive(link: string): boolean {
  return link.startsWith('https://')
}
