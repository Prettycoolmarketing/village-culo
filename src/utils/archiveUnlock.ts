import { isReadyToPublish, hasRealCaption } from '../pages/dashboard/DashboardImportContentPage'
import { ARCHIVE_UNLOCK_FREE_COUNT } from '../config/archiveUnlock'
import type { Founder } from '../types'
import type { ImportedContent } from '../types/importedContent'

/** Once true, every imported piece is fully usable — nothing locked. */
export function hasArchiveAccess(founder: Founder | null | undefined): boolean {
  return !!founder?.archiveUnlocked
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
    // Capped unlock (the "publish my most-ready 5,000" option) — everything
    // already published stays usable, plus the top N unpublished pieces.
    const cap = founder?.archiveUnlockCap
    if (typeof cap === 'number' && cap > 0 && cap < unpublished.length) {
      const capSlice = rankForUnlock(unpublished).slice(0, cap)
      return new Set([...alreadyPublished, ...capSlice].map(i => i.id))
    }
    return new Set(items.map(i => i.id))
  }

  const freeSlice = rankForUnlock(unpublished).slice(0, ARCHIVE_UNLOCK_FREE_COUNT)
  return new Set([...alreadyPublished, ...freeSlice].map(i => i.id))
}
