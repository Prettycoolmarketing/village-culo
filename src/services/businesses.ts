import { readCache, writeEntity, deleteEntity, type WriteResult } from '../lib/entityStore'
import type { Business, BusinessFilter } from '../types'

const KEY = 'businesses'
const TABLE = 'businesses'

function live(): Business[] {
  return readCache<Business>(KEY)
}

export function getBusinesses(filter?: BusinessFilter): Business[] {
  let result = live()
  if (!filter) return result
  if (filter.ids)        result = result.filter(b => filter.ids!.includes(b.id))
  if (filter.locationId) result = result.filter(b => b.location.id === filter.locationId)
  if (filter.industryId) result = result.filter(b => b.industry.id === filter.industryId)
  if (filter.topicId)    result = result.filter(b => b.topics.some(t => t.id === filter.topicId))
  if (filter.publicOnly) result = result.filter(b => b.status === 'published' || b.status === 'featured')
  if (filter.featured !== undefined) result = result.filter(b => b.featured === filter.featured)
  if (filter.limit)      result = result.slice(0, filter.limit)
  return result
}

export function getBusiness(id: string): Business | undefined {
  return live().find(b => b.id === id)
}

export function getBusinessBySlug(slug: string): Business | undefined {
  return live().find(b => b.slug === slug)
}

export async function updateBusiness(business: Business): Promise<WriteResult> {
  return writeEntity<Business>({
    cacheKey: KEY,
    item: business,
    table: TABLE,
    toRow: (b, userId) => ({
      id: b.id,
      user_id: userId,
      founder_id: b.founderId,
      status: b.status,
      featured: b.featured,
      slug: b.slug,
      visibility: 'public',
      published_at: b.status === 'published' || b.status === 'featured' ? new Date().toISOString() : null,
      data: b,
    }),
  })
}

export function deleteBusiness(id: string): Promise<WriteResult> {
  return deleteEntity({ cacheKey: KEY, id, table: TABLE })
}

export function duplicateBusiness(id: string): Promise<WriteResult> {
  const source = getBusiness(id)
  if (!source) return Promise.resolve({ success: false, error: 'Business not found.' })
  const suffix = Date.now().toString(36)
  const copy: Business = {
    ...source,
    id: `${source.id}-copy-${suffix}`,
    slug: `${source.slug}-copy-${suffix}`,
    name: `${source.name} (Copy)`,
    status: 'draft',
    featured: false,
    createdAt: new Date().toISOString(),
  }
  return updateBusiness(copy)
}
