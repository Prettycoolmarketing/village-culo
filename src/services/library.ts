import { readCache, writeEntity, deleteEntity, type WriteResult } from '../lib/entityStore'
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

export function deleteLibraryItem(id: string): Promise<WriteResult> {
  return deleteEntity({ cacheKey: KEY, id, table: TABLE })
}

export function duplicateLibraryItem(id: string): Promise<WriteResult> {
  const source = getLibraryItem(id)
  if (!source) return Promise.resolve({ success: false, error: 'Library item not found.' })
  const suffix = Date.now().toString(36)
  const copy: LibraryItem = {
    ...source,
    id: `${source.id}-copy-${suffix}`,
    slug: `${source.slug}-copy-${suffix}`,
    title: `${source.title} (Copy)`,
    status: 'coming-soon',
    featured: false,
    createdAt: new Date().toISOString(),
  }
  return updateLibraryItem(copy)
}
