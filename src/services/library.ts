import { readCache, writeEntity, type WriteResult } from '../lib/entityStore'
import type { LibraryItem, LibraryFilter } from '../types'

const KEY = 'library'
const TABLE = 'library_items'

function live(): LibraryItem[] {
  return readCache<LibraryItem>(KEY)
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

export async function updateLibraryItem(item: LibraryItem): Promise<WriteResult> {
  return writeEntity<LibraryItem>({
    cacheKey: KEY,
    item,
    table: TABLE,
    toRow: (i, userId) => ({
      id: i.id,
      user_id: userId,
      founder_id: i.authorFounderId,
      status: i.status,
      featured: i.featured,
      slug: i.slug,
      visibility: 'public',
      data: i,
    }),
  })
}
