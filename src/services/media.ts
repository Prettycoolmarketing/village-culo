import { readCache } from '../lib/entityStore'
import { store } from '../lib/store'
import { getFounders } from './founders'
import { getBusinesses } from './businesses'
import { getStories } from './stories'
import { getLibraryItems } from './library'
import type { Media, MediaFilter } from '../types'

const KEY = 'media'

function live(): Media[] {
  return readCache<Media>(KEY)
}

export function getMedia(filter?: MediaFilter): Media[] {
  let result = live()
  if (!filter) return result
  if (filter.founderId)      result = result.filter(m => m.relatedFounderIds.includes(filter.founderId!))
  if (filter.businessId)     result = result.filter(m => m.relatedBusinessIds.includes(filter.businessId!))
  if (filter.mediaType)      result = result.filter(m => m.mediaType === filter.mediaType)
  if (filter.assetRole)      result = result.filter(m => m.assetRole === filter.assetRole)
  if (filter.sourceType)     result = result.filter(m => m.sourceType === filter.sourceType)
  if (filter.approvalStatus) result = result.filter(m => m.approvalStatus === filter.approvalStatus)
  if (filter.featured !== undefined) result = result.filter(m => m.featured === filter.featured)
  if (filter.limit)          result = result.slice(0, filter.limit)
  return result
}

export function getMediaById(id: string): Media | undefined {
  return live().find(m => m.id === id)
}

// Not yet backed by Supabase — Media has no table in migration 002 (see Sprint 19B
// audit's "still localStorage-only" list). Cache-only write, same as before.
export function updateMedia(media: Media): void {
  store.update<Media>(KEY, media)
}

export interface MediaUsedIn {
  founders: { id: string; slug: string; name: string; avatar: string }[]
  businesses: { id: string; slug: string; name: string; logo: string }[]
  stories: { id: string; title: string; slug: string }[]
  library: { id: string; title: string; slug: string }[]
}

export function getMediaUsedIn(mediaId: string): MediaUsedIn {
  const item = live().find(m => m.id === mediaId)
  if (!item) return { founders: [], businesses: [], stories: [], library: [] }

  // Reuses the canonical service getters instead of re-implementing the
  // cache-or-fallback read pattern a second time (see Sprint 19B audit).
  return {
    founders: getFounders()
      .filter(f => item.relatedFounderIds.includes(f.id))
      .map(f => ({ id: f.id, slug: f.slug, name: f.name, avatar: f.avatar })),
    businesses: getBusinesses()
      .filter(b => item.relatedBusinessIds.includes(b.id))
      .map(b => ({ id: b.id, slug: b.slug, name: b.name, logo: b.logo })),
    stories: getStories()
      .filter(s => item.relatedStoryIds.includes(s.id))
      .map(s => ({ id: s.id, title: s.title, slug: s.slug })),
    library: getLibraryItems()
      .filter(l => item.relatedLibraryItemIds.includes(l.id))
      .map(l => ({ id: l.id, title: l.title, slug: l.slug })),
  }
}
