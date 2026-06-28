import { mediaItems as mediaData } from '../data/media'
import { founders as foundersData } from '../data/founders'
import { businesses as businessesData } from '../data/businesses'
import { stories as storiesData } from '../data/stories'
import { libraryItems as libraryData } from '../data/library'
import type { Media, MediaFilter } from '../types'

export function getMedia(filter?: MediaFilter): Media[] {
  let result = [...mediaData]
  if (!filter) return result
  if (filter.founderId)       result = result.filter(m => m.relatedFounderIds.includes(filter.founderId!))
  if (filter.businessId)      result = result.filter(m => m.relatedBusinessIds.includes(filter.businessId!))
  if (filter.mediaType)       result = result.filter(m => m.mediaType === filter.mediaType)
  if (filter.assetRole)       result = result.filter(m => m.assetRole === filter.assetRole)
  if (filter.sourceType)      result = result.filter(m => m.sourceType === filter.sourceType)
  if (filter.approvalStatus)  result = result.filter(m => m.approvalStatus === filter.approvalStatus)
  if (filter.featured !== undefined) result = result.filter(m => m.featured === filter.featured)
  if (filter.limit)           result = result.slice(0, filter.limit)
  return result
}

export function getMediaById(id: string): Media | undefined {
  return mediaData.find(m => m.id === id)
}

export interface MediaUsedIn {
  founders: { id: string; name: string; avatar: string }[]
  businesses: { id: string; name: string; logo: string }[]
  stories: { id: string; title: string; slug: string }[]
  library: { id: string; title: string; slug: string }[]
}

export function getMediaUsedIn(mediaId: string): MediaUsedIn {
  const item = mediaData.find(m => m.id === mediaId)
  if (!item) return { founders: [], businesses: [], stories: [], library: [] }

  return {
    founders: foundersData
      .filter(f => item.relatedFounderIds.includes(f.id))
      .map(f => ({ id: f.id, name: f.name, avatar: f.avatar })),

    businesses: businessesData
      .filter(b => item.relatedBusinessIds.includes(b.id))
      .map(b => ({ id: b.id, name: b.name, logo: b.logo })),

    stories: storiesData
      .filter(s => item.relatedStoryIds.includes(s.id))
      .map(s => ({ id: s.id, title: s.title, slug: s.slug })),

    library: libraryData
      .filter(l => item.relatedLibraryItemIds.includes(l.id))
      .map(l => ({ id: l.id, title: l.title, slug: l.slug })),
  }
}
