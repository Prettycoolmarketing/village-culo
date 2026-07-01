import { readCache, writeEntity, type WriteResult } from '../lib/entityStore'
import type { Service } from '../types'

const KEY = 'services'
const TABLE = 'services'

function live(): Service[] {
  return readCache<Service>(KEY)
}

export function getServices(founderId?: string, businessId?: string): Service[] {
  let result = live()
  if (founderId)  result = result.filter(s => s.founderId === founderId)
  if (businessId) result = result.filter(s => s.businessId === businessId)
  return result
}

export function getService(id: string): Service | undefined {
  return live().find(s => s.id === id)
}

export async function updateService(service: Service): Promise<WriteResult> {
  return writeEntity<Service>({
    cacheKey: KEY,
    item: service,
    table: TABLE,
    toRow: (s, userId) => ({
      id: s.id,
      user_id: userId,
      founder_id: s.founderId,
      business_id: s.businessId,
      slug: s.slug,
      status: s.status ?? 'published',
      data: s,
    }),
  })
}
