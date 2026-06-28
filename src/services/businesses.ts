import { businesses as businessesData } from '../data/businesses'
import { filterBusinesses } from '../utils/filters'
import type { Business, BusinessFilter } from '../types'

export function getBusinesses(filter?: BusinessFilter): Business[] {
  if (!filter) return [...businessesData]
  return filterBusinesses(filter)
}

export function getBusiness(id: string): Business | undefined {
  return businessesData.find(b => b.id === id)
}

export function getBusinessBySlug(slug: string): Business | undefined {
  return businessesData.find(b => b.slug === slug)
}
