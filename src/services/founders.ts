import { founders as foundersData } from '../data/founders'
import { filterFounders } from '../utils/filters'
import type { Founder, FounderFilter } from '../types'

export function getFounders(filter?: FounderFilter): Founder[] {
  if (!filter) return [...foundersData]
  return filterFounders(filter)
}

export function getFounder(id: string): Founder | undefined {
  return foundersData.find(f => f.id === id)
}

export function getFounderBySlug(slug: string): Founder | undefined {
  return foundersData.find(f => f.slug === slug)
}
