import { isReadyToPublish, hasRealCaption } from '../pages/dashboard/DashboardImportContentPage'
import { ARCHIVE_UNLOCK_FREE_COUNT } from '../config/archiveUnlock'
import type { Founder } from '../types'
import type { ImportedContent } from '../types/importedContent'

/** Once true, the founder has paid for at least one Archive Unlock tier. */
export function hasArchiveAccess(founder: Founder | null | undefined): boolean {
  return !!founder?.archiveUnlocked
}

// archivePublishLimit is set by stripe-archive-unlock-webhook to the exact
// count the tier they just paid for actually covers (e.g. 250 for tier2,
// −1 for the unlimited top tier) — this was being recorded correctly but
// never actually read anywhere, so getUnlockedImportedIds below unlocked
// literally everything the instant archiveUnlocked flipped true, forever,
// regardless of how much more got imported afterward. Real revenue gap:
// pay the cheapest tier once, then import unlimited amounts of anything
// (Snapchat Memories included) for free. null = no recorded limit at all
// (an unlock from before this field existed) or the unlimited top tier —
// treated as unlimited either way rather than retroactively locking
// something that was already granted.
function archiveLimit(founder: Founder | null | undefined): number | null {
  const limit = founder?.archivePublishLimit
  if (typeof limit !== 'number' || limit < 0) return null
  return limit
}

/**
 * True once a founder's total archive has grown past what their last
 * Archive Unlock payment actually covers — the signal to send them back to
 * the unlock landing page for the next tier, instead of silently letting
 * everything through on what they already paid for.
 */
export function needsArchiveUpgrade(founder: Founder | null | undefined, totalCount: number): boolean {
  if (!hasArchiveAccess(founder)) return false
  const limit = archiveLimit(founder)
  return limit !== null && totalCount > limit
}

// Real caption length, tags stripped — same text hasRealCaption checks
// against its 150-char minimum, but used here as an actual quality signal
// rather than a pass/fail floor. hasRealCaption only proves a caption
// clears that low bar; it says nothing about which captions among
// several that all clear it are actually more substantial. Confirmed
// real: a founder's "free 10" all just barely cleared 150 characters —
// most recently imported, not most substantial — producing 10
// consecutive thin, near-duplicate-of-caption published pages.
function captionLength(item: ImportedContent): number {
  return (item.description ?? '').replace(/[@#]\S+/g, '').trim().length
}

// Ranks a founder's whole imported archive so the free preview always shows
// their strongest 10 pieces, not just whichever 10 happened to import
// first — real captions + already-ready-to-publish first, then ranked by
// actual caption length within that, longest (most substantial) first,
// falling back to recency only as the final tiebreak between equally
// substantial pieces.
function rankForUnlock(items: ImportedContent[]): ImportedContent[] {
  return [...items].sort((a, b) => {
    const aReady = isReadyToPublish(a) && hasRealCaption(a) ? 1 : 0
    const bReady = isReadyToPublish(b) && hasRealCaption(b) ? 1 : 0
    if (aReady !== bReady) return bReady - aReady
    const lengthDiff = captionLength(b) - captionLength(a)
    if (lengthDiff !== 0) return lengthDiff
    return (b.importedAt ?? '').localeCompare(a.importedAt ?? '')
  })
}

/**
 * The set of imported-content ids a founder can actually use right now.
 * Already-published pieces (relatedStoryId set) are never locked — a
 * founder who published something before this feature existed, or before
 * unlocking, should never lose access to what's already live. Everything
 * else is capped at ARCHIVE_UNLOCK_FREE_COUNT, picking the most ready first.
 */
export function getUnlockedImportedIds(items: ImportedContent[], founder: Founder | null | undefined): Set<string> {
  const alreadyPublished = items.filter(i => !!i.relatedStoryId || i.status === 'published' || i.status === 'featured')
  const unpublished = items.filter(i => !alreadyPublished.includes(i))

  if (hasArchiveAccess(founder)) {
    // Capped unlock — either the "publish my most-ready 5,000" subset
    // option (archiveUnlockCap) or the ordinary tier limit from the last
    // real payment (archivePublishLimit, see archiveLimit above) — either
    // way, everything already published stays usable, plus the top N
    // unpublished pieces the founder actually paid to cover.
    const cap = founder?.archiveUnlockCap ?? archiveLimit(founder) ?? undefined
    if (typeof cap === 'number' && cap > 0 && cap < unpublished.length) {
      const capSlice = rankForUnlock(unpublished).slice(0, cap)
      return new Set([...alreadyPublished, ...capSlice].map(i => i.id))
    }
    return new Set(items.map(i => i.id))
  }

  // Free is ARCHIVE_UNLOCK_FREE_COUNT total, full stop — not 10 free
  // unpublished pieces on TOP of however many are already published. This
  // used to always hand out a fresh 10-unpublished-item preview regardless
  // of publish count, so a founder who'd already published their free 10
  // still saw 10 MORE pieces as unlocked/editable in Ready and Needs More
  // Value — confirmed real: Lydia had 10 published (her whole free quota)
  // plus another ~10 unpublished pieces still showing as free/unlocked.
  // Shrinks to zero once the free quota's actually used up by publishing.
  const freeRemaining = Math.max(0, ARCHIVE_UNLOCK_FREE_COUNT - alreadyPublished.length)
  const freeSlice = rankForUnlock(unpublished).slice(0, freeRemaining)
  return new Set([...alreadyPublished, ...freeSlice].map(i => i.id))
}
