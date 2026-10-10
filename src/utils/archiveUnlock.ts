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

// Ranks a founder's whole imported archive so the free preview always shows
// their strongest 10 pieces, not just whichever 10 happened to import
// first — real captions + already-ready-to-publish first, everything else
// after, each group newest-first.
function rankForUnlock(items: ImportedContent[]): ImportedContent[] {
  return [...items].sort((a, b) => {
    const aReady = isReadyToPublish(a) && hasRealCaption(a) ? 1 : 0
    const bReady = isReadyToPublish(b) && hasRealCaption(b) ? 1 : 0
    if (aReady !== bReady) return bReady - aReady
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

  const freeSlice = rankForUnlock(unpublished).slice(0, ARCHIVE_UNLOCK_FREE_COUNT)
  return new Set([...alreadyPublished, ...freeSlice].map(i => i.id))
}
