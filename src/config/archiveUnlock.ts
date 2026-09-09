// Archive Unlock — a one-time fee to fully process/publish a founder's
// entire imported archive, separate from the CULO Creatives subscription. A
// founder can unlock their archive without ever subscribing to Creatives,
// and vice versa. The Village itself, and the first 10 most-ready pieces of
// any archive, stay free forever — this only ever gates what's beyond that.
//
// Pricing is derived from real cost data: importing + AI-structuring +
// storing pieces costs roughly $0.055/piece. Each tier is a flat one-off
// fee that keeps a real margin over that cost across the tier's range.
// Past 10,000 pieces the flat fee jumps to $2,000 — or the founder can cap
// their cost by publishing only their most-ready 5,000 pieces for $699
// (see ARCHIVE_UNLOCK_SUBSET_5000_* and utils/archiveUnlock.ts's cap logic).
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
// Live-mode Payment Links, created via stripe-setup-2026-tiers (AUD, one-time).
export const ARCHIVE_UNLOCK_TIER_4_LINK = 'https://buy.stripe.com/5kQbJ25rP7sT6qK1Ar83C0m' // 1,001-2,500 pieces — $175 AUD
export const ARCHIVE_UNLOCK_TIER_5_LINK = 'https://buy.stripe.com/7sY4gAaM9aF56qKa6X83C0n' // 2,501-5,000 pieces — $349 AUD
export const ARCHIVE_UNLOCK_TIER_6_LINK = 'https://buy.stripe.com/7sYaEYg6t7sT02m4MD83C0o' // 5,001-10,000 pieces — $699 AUD
export const ARCHIVE_UNLOCK_TIER_7_LINK = 'https://buy.stripe.com/dRm7sM2fD28z9CW1Ar83C0p' // 10,001+ pieces — $2,000 AUD

// The "cap my cost" option offered only when a founder has more than 10,000
// pieces: publish the most-ready 5,000 for a flat $699 instead of paying
// $2,000 for everything. Same amount as tier 6, but a DISTINCT Payment Link
// so stripe-archive-unlock-webhook can tell it apart (it sets a 5,000-piece
// cap rather than a full unlock — match on the link id via the
// ARCHIVE_SUBSET_LINK_ID env var on that function).
export const ARCHIVE_UNLOCK_SUBSET_5000_LINK  = 'https://buy.stripe.com/7sY9AU2fD3cD2au7YP83C0q' // publish most-ready 5,000 — $699 AUD (plink_1UDeZPJ3Xn12tPGFKhP0lyDZ)
export const ARCHIVE_UNLOCK_SUBSET_5000_COUNT = 5000
export const ARCHIVE_UNLOCK_SUBSET_5000_PRICE = 699

// Free preview — same number regardless of tier or archive size.
export const ARCHIVE_UNLOCK_FREE_COUNT = 10

// A founder is offered the "publish only 5,000" option once their archive
// is bigger than this.
export const ARCHIVE_UNLOCK_SUBSET_THRESHOLD = 10000

export interface ArchiveUnlockTier {
  id: 'tier1' | 'tier2' | 'tier3' | 'tier4' | 'tier5' | 'tier6' | 'tier7'
  label: string
  price: number
  priceLabel: string
  paymentLink: string
}

// maxCount is inclusive of this tier's upper bound; the top tier has none.
const TIERS: Array<ArchiveUnlockTier & { maxCount: number | null }> = [
  { id: 'tier1', label: 'Up to 50 pieces',     price: 19,   priceLabel: '$19 AUD once',   paymentLink: ARCHIVE_UNLOCK_TIER_1_LINK, maxCount: 50 },
  { id: 'tier2', label: '51–250 pieces',        price: 39,   priceLabel: '$39 AUD once',   paymentLink: ARCHIVE_UNLOCK_TIER_2_LINK, maxCount: 250 },
  { id: 'tier3', label: '251–1,000 pieces',     price: 79,   priceLabel: '$79 AUD once',   paymentLink: ARCHIVE_UNLOCK_TIER_3_LINK, maxCount: 1000 },
  { id: 'tier4', label: '1,001–2,500 pieces',   price: 175,  priceLabel: '$175 AUD once',  paymentLink: ARCHIVE_UNLOCK_TIER_4_LINK, maxCount: 2500 },
  { id: 'tier5', label: '2,501–5,000 pieces',   price: 349,  priceLabel: '$349 AUD once',  paymentLink: ARCHIVE_UNLOCK_TIER_5_LINK, maxCount: 5000 },
  { id: 'tier6', label: '5,001–10,000 pieces',  price: 699,  priceLabel: '$699 AUD once',  paymentLink: ARCHIVE_UNLOCK_TIER_6_LINK, maxCount: 10000 },
  { id: 'tier7', label: '10,001+ pieces',       price: 2000, priceLabel: '$2,000 AUD once', paymentLink: ARCHIVE_UNLOCK_TIER_7_LINK, maxCount: null },
]

/** Which tier a given total-detected-pieces count falls into. */
export function getArchiveTier(totalCount: number): ArchiveUnlockTier {
  return TIERS.find(t => t.maxCount === null || totalCount <= t.maxCount)!
}

/** The one-off dollar figure for a given count. */
export function getArchiveUnlockPrice(totalCount: number): number {
  return getArchiveTier(totalCount).price
}

/** Whether to offer the "publish only your most-ready 5,000" option. */
export function offersSubsetUnlock(totalCount: number): boolean {
  return totalCount > ARCHIVE_UNLOCK_SUBSET_THRESHOLD
}

/** True once a real Stripe link has been pasted in (not the "#" placeholder). */
export function isLive(link: string): boolean {
  return link.startsWith('https://')
}
