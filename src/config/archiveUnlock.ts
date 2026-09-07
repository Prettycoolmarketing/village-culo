// Archive Unlock — a one-time fee to fully process/publish a founder's
// entire imported archive, separate from the CULO Creatives subscription. A
// founder can unlock their archive without ever subscribing to Creatives,
// and vice versa. The Village itself, and the first 10 most-ready pieces of
// any archive, stay free forever — this only ever gates what's beyond that.
//
// Pricing is derived from real cost data, not round numbers: importing +
// AI-structuring + storing 100 pieces costs roughly $5.50 (~$0.055/piece —
// see the cost breakdown this was built from). Each tier prices the *extra*
// pieces beyond the free 10 at a real margin over that per-piece cost, not
// a flat number picked for looking clean. A single flat fee stops being
// margin-safe past ~1,000 pieces (cost scales linearly with volume, a flat
// price doesn't), so the top tier is a base + per-piece formula instead of
// a bigger flat number.
//
// Live-mode Payment Links (one-time, NOT subscription), created via the
// one-off stripe-setup-archive-unlock Edge Function — AUD, branded product
// names/descriptions, redirect back to Content on completion. Each must
// carry client_reference_id (see buildPaymentUrl) so
// stripe-archive-unlock-webhook can find the founder from the resulting
// Checkout Session.
export const ARCHIVE_UNLOCK_TIER_1_LINK = 'https://buy.stripe.com/aFafZi5rP28z2au92T83C0a' // <= 50 pieces — $19 AUD
export const ARCHIVE_UNLOCK_TIER_2_LINK = 'https://buy.stripe.com/4gMfZi8E16oP4iCbb183C0b' // 51-250 pieces — $39 AUD
export const ARCHIVE_UNLOCK_TIER_3_LINK = 'https://buy.stripe.com/28EdRadYlaF52au5QH83C0c' // 251-1,000 pieces — $79 AUD

// Free preview — same number regardless of tier or archive size.
export const ARCHIVE_UNLOCK_FREE_COUNT = 10

export interface ArchiveUnlockTier {
  id: 'tier1' | 'tier2' | 'tier3' | 'custom'
  label: string
  price: number | null // null for the uncapped custom tier — see priceLabel
  priceLabel: string
  paymentLink: string | null // null for 'custom' — no fixed-price Payment Link is possible
}

// maxCount is inclusive of this tier's upper bound; 'custom' has none.
const TIERS: Array<ArchiveUnlockTier & { maxCount: number | null }> = [
  { id: 'tier1', label: 'Up to 50 pieces', price: 19, priceLabel: '$19 AUD once', paymentLink: ARCHIVE_UNLOCK_TIER_1_LINK, maxCount: 50 },
  { id: 'tier2', label: '51–250 pieces', price: 39, priceLabel: '$39 AUD once', paymentLink: ARCHIVE_UNLOCK_TIER_2_LINK, maxCount: 250 },
  { id: 'tier3', label: '251–1,000 pieces', price: 79, priceLabel: '$79 AUD once', paymentLink: ARCHIVE_UNLOCK_TIER_3_LINK, maxCount: 1000 },
  // Stripe Payment Links can't do dynamic per-piece pricing, so past 1,000
  // this is a formula shown to the founder rather than a fixed-price link —
  // routes to a "get in touch" flow instead of straight to Stripe.
  { id: 'custom', label: '1,001+ pieces', price: null, priceLabel: '$79 AUD + $0.08/piece over 1,000', paymentLink: null, maxCount: null },
]

/** Which tier a given total-detected-pieces count falls into. */
export function getArchiveTier(totalCount: number): ArchiveUnlockTier {
  const tier = TIERS.find(t => t.maxCount === null || totalCount <= t.maxCount)!
  return tier
}

/** The actual dollar figure for a given count — including the uncapped custom tier's formula. */
export function getArchiveUnlockPrice(totalCount: number): number {
  const tier = getArchiveTier(totalCount)
  if (tier.price !== null) return tier.price
  return 79 + Math.max(0, totalCount - 1000) * 0.08
}
