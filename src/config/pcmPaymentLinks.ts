// Pretty Cool Marketing — Stripe Payment Links (AUD).
//
// PCM is the done-for-you service arm of the Culo Village. These two links
// back the fixed-price tiers on /marketing/social (Social Media Management,
// Content Creator). Blog Management/Village Creatives/Full Service have a
// variable-price Archive Transfer and go through the dynamic
// create-pcm-checkout Edge Function instead — see PublishingQuoteModal.
//
// "Village Service" ($900 AUD one-off) still exists and is active in
// Stripe, but nothing in the app renders it anymore now that Publishing
// only ever goes through the quote flow — left alone in Stripe rather than
// archived (it's real and correctly priced, just unwired), just no longer
// referenced here.

export interface PcmOffer {
  id: 'tier2' | 'tier3'
  name: string
  priceLabel: string
  cadence: string
  paymentLink: string
}

// Live-mode Payment Links, created via stripe-setup-2026-tiers (AUD).
export const PCM_TIER2_LINK = 'https://buy.stripe.com/00weVe5rPbJ94iCdj983C0t' // "Social Media Service" $3,000 AUD / month
export const PCM_TIER3_LINK = 'https://buy.stripe.com/bJe5kEbQdfZp4iC3Iz83C0u' // "Content Creator Full Service" $3,888 AUD / month

export const PCM_SUPPORT_EMAIL = 'support@prettycoolmarketing.com'

export const PCM_OFFERS: Record<PcmOffer['id'], PcmOffer> = {
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
