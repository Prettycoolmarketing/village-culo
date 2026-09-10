// Village publishing entitlements — the single source of truth for "can
// this founder publish this piece, and what does it consume?"
//
// See config/publishing.ts for the model. Two free allowances (imported /
// self), then a flexible paid credit pool. Free is always consumed before
// paid. PCM-managed founders bypass everything.

import type { Founder } from '../types'
import {
  FREE_ARCHIVE_PUBLISH, FREE_SELF_PUBLISH, PUBLISH_METER_THRESHOLD,
} from '../config/publishing'

export type PublishKind = 'imported' | 'self'

export interface PublishState {
  pcmManaged: boolean
  // Imported archive
  archiveLimit: number           // −1 = unlimited
  archivePublished: number
  archiveRemaining: number       // Infinity when unlimited
  // New / self-composed
  selfLimit: number
  selfPublished: number
  selfRemaining: number
  // Paid credit pool (covers either kind once the free allowance is gone)
  paidRemaining: number
  // Convenience
  canPublishImported: boolean
  canPublishSelf: boolean
  // Whether the small meter should render for each kind (only near a limit)
  showArchiveMeter: boolean
  showSelfMeter: boolean
}

function n(v: number | undefined, fallback: number): number {
  return typeof v === 'number' && !Number.isNaN(v) ? v : fallback
}

export function getPublishState(founder: Founder | null | undefined): PublishState {
  const pcmManaged = !!founder?.pcmManaged

  // archivePublishLimit is the source of truth once set. Fall back to the
  // legacy Archive Unlock fields for founders who paid before this model:
  // a full unlock = unlimited archive publishing; a 5,000 "subset" unlock
  // = a 5,000 limit; otherwise the free 10.
  const archiveLimit = founder?.archivePublishLimit != null
    ? founder.archivePublishLimit
    : founder?.archiveUnlocked
      ? (typeof founder.archiveUnlockCap === 'number' ? founder.archiveUnlockCap : -1)
      : FREE_ARCHIVE_PUBLISH
  const archivePublished = n(founder?.archivePublishedCount, 0)
  const archiveRemaining = archiveLimit < 0
    ? Number.POSITIVE_INFINITY
    : Math.max(0, archiveLimit - archivePublished)

  const selfLimit = FREE_SELF_PUBLISH
  const selfPublished = n(founder?.selfPublishedFreeCount, 0)
  const selfRemaining = Math.max(0, selfLimit - selfPublished)

  const paidRemaining = Math.max(
    0,
    n(founder?.paidPublishCreditsGranted, 0) - n(founder?.paidPublishCreditsUsed, 0),
  )

  const canPublishImported = pcmManaged || archiveRemaining > 0 || paidRemaining > 0
  const canPublishSelf = pcmManaged || selfRemaining > 0 || paidRemaining > 0

  return {
    pcmManaged,
    archiveLimit,
    archivePublished,
    archiveRemaining,
    selfLimit,
    selfPublished,
    selfRemaining,
    paidRemaining,
    canPublishImported,
    canPublishSelf,
    showArchiveMeter:
      !pcmManaged && archiveRemaining !== Number.POSITIVE_INFINITY && archiveRemaining <= PUBLISH_METER_THRESHOLD,
    showSelfMeter: !pcmManaged && selfRemaining <= PUBLISH_METER_THRESHOLD,
  }
}

/** Can the founder publish one more piece of this kind right now? */
export function canPublish(founder: Founder | null | undefined, kind: PublishKind): boolean {
  const s = getPublishState(founder)
  return kind === 'imported' ? s.canPublishImported : s.canPublishSelf
}

/**
 * The founder-data patch to apply when one piece of `kind` is published.
 * Free allowance first, then a paid credit. Returns null if nothing can be
 * consumed (caller should block and show the upsell) or if PCM-managed
 * (nothing is metered).
 */
export function consumePublish(
  founder: Founder,
  kind: PublishKind,
): Partial<Founder> | null {
  if (founder.pcmManaged) return {}

  const s = getPublishState(founder)

  if (kind === 'imported') {
    if (s.archiveRemaining === Number.POSITIVE_INFINITY) return {}
    if (s.archiveRemaining > 0) {
      return { archivePublishedCount: s.archivePublished + 1 }
    }
  } else {
    if (s.selfRemaining > 0) {
      return { selfPublishedFreeCount: s.selfPublished + 1 }
    }
  }

  // Free allowance exhausted — fall back to a paid credit.
  if (s.paidRemaining > 0) {
    return { paidPublishCreditsUsed: (founder.paidPublishCreditsUsed ?? 0) + 1 }
  }

  return null
}
