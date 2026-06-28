import { mediaItems as staticData }   from '../data/media'
import { founders as foundersStatic }   from '../data/founders'
import { businesses as bizStatic }      from '../data/businesses'
import { stories as storiesStatic }     from '../data/stories'
import { libraryItems as libraryStatic } from '../data/library'
import { store } from '../lib/store'
import type { Media, MediaFilter, Founder, Business, Story, LibraryItem } from '../types'

const KEY = 'media'

function live(): Media[] {
  return store.get<Media>(KEY) ?? staticData
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

  const liveFounders   = (store.get<Founder>('founders')     ?? foundersStatic)
  const liveBiz        = (store.get<Business>('businesses')  ?? bizStatic)
  const liveStories    = (store.get<Story>('stories')        ?? storiesStatic)
  const liveLibrary    = (store.get<LibraryItem>('library')  ?? libraryStatic)

  return {
    founders: liveFounders
      .filter(f => item.relatedFounderIds.includes(f.id))
      .map(f => ({ id: f.id, slug: f.slug, name: f.name, avatar: f.avatar })),
    businesses: liveBiz
      .filter(b => item.relatedBusinessIds.includes(b.id))
      .map(b => ({ id: b.id, slug: b.slug, name: b.name, logo: b.logo })),
    stories: liveStories
      .filter(s => item.relatedStoryIds.includes(s.id))
      .map(s => ({ id: s.id, title: s.title, slug: s.slug })),
    library: liveLibrary
      .filter(l => item.relatedLibraryItemIds.includes(l.id))
      .map(l => ({ id: l.id, title: l.title, slug: l.slug })),
  }
}
