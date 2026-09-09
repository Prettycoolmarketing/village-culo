// Pretty Cool Marketing — Stripe Payment Links (AUD).
//
// PCM is the done-for-you service arm of the Culo Village. These three
// links back the marketing funnels at /marketing/publishing and
// /marketing/social. Create them in the Stripe Dashboard (Payment Links —
// NOT via an Edge Function, these are standalone products) and paste the
// real URLs in below. Until then they point at "#" and the funnel buttons
// fall back to an email CTA.
//
//   1. Publishing in the Culo Village — one-off, $900 AUD
//   2. Social — Tier 2 (Content editing & distribution) — $3,000 AUD / month
//   3. Social — Tier 3 (Content creator) — $3,888 AUD every 4 weeks
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

export const PCM_PUBLISHING_LINK = '#' // TODO: paste Stripe Payment Link — $900 AUD one-off
export const PCM_TIER2_LINK      = '#' // TODO: paste Stripe Payment Link — $3,000 AUD / month
export const PCM_TIER3_LINK      = '#' // TODO: paste Stripe Payment Link — $3,888 AUD / 4 weeks

export const PCM_SUPPORT_EMAIL = 'support@prettycoolmarketing.com'

export const PCM_OFFERS: Record<PcmOffer['id'], PcmOffer> = {
  publishing: {
    id: 'publishing',
    name: 'Publishing in the Culo Village',
    priceLabel: '$900 AUD',
    cadence: 'one-off',
    paymentLink: PCM_PUBLISHING_LINK,
  },
  tier2: {
    id: 'tier2',
    name: 'Content Editing & Distribution',
    priceLabel: '$3,000 AUD',
    cadence: 'per month',
    paymentLink: PCM_TIER2_LINK,
  },
  tier3: {
    id: 'tier3',
    name: 'Content Creator',
    priceLabel: '$3,888 AUD',
    cadence: 'every 4 weeks',
    paymentLink: PCM_TIER3_LINK,
  },
}

/** True once a real Stripe link has been pasted in (i.e. not the "#" placeholder). */
export function isLive(link: string): boolean {
  return link.startsWith('https://')
}
