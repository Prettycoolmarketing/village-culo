import { founders as staticData } from '../data/founders'
import { store } from '../lib/store'
import { isSupabaseConfigured } from '../lib/supabase'
import { dbUpsertFounder } from '../lib/db'
import type { Founder, FounderFilter } from '../types'

const KEY = 'founders'

function live(): Founder[] {
  return store.get<Founder>(KEY) ?? staticData
}

export function getFounders(filter?: FounderFilter): Founder[] {
  let result = live()
  if (!filter) return result
  if (filter.ids)        result = result.filter(f => filter.ids!.includes(f.id))
  if (filter.locationId) result = result.filter(f => f.location.id === filter.locationId)
  if (filter.industryId) result = result.filter(f => f.industry.id === filter.industryId)
  if (filter.topicId)    result = result.filter(f => f.topics.some(t => t.id === filter.topicId))
  if (filter.publicOnly) result = result.filter(f => f.status === 'published' || f.status === 'featured')
  if (filter.featured !== undefined) result = result.filter(f => f.featured === filter.featured)
  if (filter.limit)      result = result.slice(0, filter.limit)
  return result
}

export function getFounder(id: string): Founder | undefined {
  return live().find(f => f.id === id)
}

export function getFounderBySlug(slug: string): Founder | undefined {
  return live().find(f => f.slug === slug)
}

export function updateFounder(founder: Founder): void {
  store.update<Founder>(KEY, founder)
  if (isSupabaseConfigured) void dbUpsertFounder(founder)
}
