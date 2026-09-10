// Village publishing entitlements — how many articles a founder may publish.
//
// Two separate free entitlements, deliberately encountered in different
// parts of the product (see the funnel design):
//   • 10 IMPORTED publications free  — publish pieces from your imported
//     archive. Archive Unlock raises this limit (see archiveUnlock.ts).
//   • 10 NEW/self publications free  — publish pieces you compose or edit
//     yourself (Publish flow / Culo Creatives). Flat, never changes.
//
// Beyond either, PAID publication credits (Publishing Packs) apply — a
// flexible pool that covers whichever entitlement runs out. Free
// entitlement is always consumed before a paid credit.
//
// PCM-managed founders (pcmManaged = true) bypass ALL of this — their
// publishing is a service deliverable tracked in Capo, not a Village
// self-serve limit.

import {
  getArchiveTier, ARCHIVE_UNLOCK_FREE_COUNT, type ArchiveUnlockTier,
} from './archiveUnlock'

export const FREE_ARCHIVE_PUBLISH = ARCHIVE_UNLOCK_FREE_COUNT // 10
export const FREE_SELF_PUBLISH = 10

/** −1 means unlimited. The publishing limit an Archive Unlock tier grants. */
export function archiveTierLimit(tier: ArchiveUnlockTier): number {
  const t = tier as ArchiveUnlockTier & { maxCount: number | null }
  return t.maxCount ?? -1
}

/** The archive publishing limit for a founder who has unlocked at `detectedCount` pieces. */
export function archiveLimitForCount(detectedCount: number): number {
  return archiveTierLimit(getArchiveTier(detectedCount))
}

// ─── Publishing Packs — one-off, no expiry, flexible credits ──────────────
// Created via a one-off stripe-setup-* function (same pattern as the
// archive tiers). Placeholders until the links exist.
export interface PublishingPack {
  id: 'pack100' | 'pack365'
  label: string
  credits: number
  price: number
  priceLabel: string
  paymentLink: string
}

export const PUBLISHING_PACK_100_LINK = '#' // TODO: Stripe Payment Link — "Village Publishing Pack" $199 AUD / 100
export const PUBLISHING_PACK_365_LINK = '#' // TODO: Stripe Payment Link — "Annual Publishing Pack" $395 AUD / 365

export const PUBLISHING_PACKS: Record<PublishingPack['id'], PublishingPack> = {
  pack100: {
    id: 'pack100',
    label: '100 publications',
    credits: 100,
    price: 199,
    priceLabel: '$199 AUD once',
    paymentLink: PUBLISHING_PACK_100_LINK,
  },
  pack365: {
    id: 'pack365',
    label: 'A year of publishing — 365 publications',
    credits: 365,
    price: 395,
    priceLabel: '$395 AUD once',
    paymentLink: PUBLISHING_PACK_365_LINK,
  },
}

/** The meter/upsell only surfaces once a founder is this close to a limit. */
export const PUBLISH_METER_THRESHOLD = 2
