import { libraryItems as staticData } from '../data/library'
import { store } from '../lib/store'
import { isSupabaseConfigured } from '../lib/supabase'
import { dbUpsertLibraryItem } from '../lib/db'
import type { LibraryItem, LibraryFilter } from '../types'

const KEY = 'library'

function live(): LibraryItem[] {
  return store.get<LibraryItem>(KEY) ?? staticData
}

export function getLibraryItems(filter?: LibraryFilter): LibraryItem[] {
  let result = live()
  if (!filter) return result
  if (filter.founderId)   result = result.filter(i => i.authorFounderId === filter.founderId)
  if (filter.businessId)  result = result.filter(i => i.businessId === filter.businessId)
  if (filter.productType) result = result.filter(i => i.productType === filter.productType)
  if (filter.topicId)     result = result.filter(i => i.topics.some(t => t.id === filter.topicId))
  if (filter.expertiseId) result = result.filter(i => i.expertiseIds?.includes(filter.expertiseId!))
  if (filter.status)      result = result.filter(i => i.status === filter.status)
  if (filter.featured !== undefined) result = result.filter(i => i.featured === filter.featured)
  if (filter.limit)       result = result.slice(0, filter.limit)
  return result
}

export function getLibraryItem(id: string): LibraryItem | undefined {
  return live().find(i => i.id === id)
}

export function getLibraryItemBySlug(slug: string): LibraryItem | undefined {
  return live().find(i => i.slug === slug)
}

export function updateLibraryItem(item: LibraryItem): void {
  store.update<LibraryItem>(KEY, item)
  if (isSupabaseConfigured) void dbUpsertLibraryItem(item)
}
