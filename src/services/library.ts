import { libraryItems as libraryData } from '../data/library'
import type { LibraryItem, LibraryFilter } from '../types'

export function getLibraryItems(filter?: LibraryFilter): LibraryItem[] {
  let result = [...libraryData]
  if (!filter) return result
  if (filter.founderId)    result = result.filter(i => i.authorFounderId === filter.founderId)
  if (filter.businessId)   result = result.filter(i => i.businessId === filter.businessId)
  if (filter.productType)  result = result.filter(i => i.productType === filter.productType)
  if (filter.topicId)      result = result.filter(i => i.topics.some(t => t.id === filter.topicId))
  if (filter.featured !== undefined) result = result.filter(i => i.featured === filter.featured)
  if (filter.limit)        result = result.slice(0, filter.limit)
  return result
}

export function getLibraryItem(id: string): LibraryItem | undefined {
  return libraryData.find(i => i.id === id)
}

export function getLibraryItemBySlug(slug: string): LibraryItem | undefined {
  return libraryData.find(i => i.slug === slug)
}
