import { businesses as staticData } from '../data/businesses'
import { store } from '../lib/store'
import type { Business, BusinessFilter } from '../types'

const KEY = 'businesses'

function live(): Business[] {
  return store.get<Business>(KEY) ?? staticData
}

export function getBusinesses(filter?: BusinessFilter): Business[] {
  let result = live()
  if (!filter) return result
  if (filter.ids)       result = result.filter(b => filter.ids!.includes(b.id))
  if (filter.locationId) result = result.filter(b => b.location.id === filter.locationId)
  if (filter.industryId) result = result.filter(b => b.industry.id === filter.industryId)
  if (filter.topicId)   result = result.filter(b => b.topics.some(t => t.id === filter.topicId))
  if (filter.featured !== undefined) result = result.filter(b => b.featured === filter.featured)
  if (filter.limit)     result = result.slice(0, filter.limit)
  return result
}

export function getBusiness(id: string): Business | undefined {
  return live().find(b => b.id === id)
}

export function getBusinessBySlug(slug: string): Business | undefined {
  return live().find(b => b.slug === slug)
}

export function updateBusiness(business: Business): void {
  store.update<Business>(KEY, business)
}
