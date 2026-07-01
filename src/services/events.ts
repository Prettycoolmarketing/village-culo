import { readCache, writeEntity, type WriteResult } from '../lib/entityStore'
import type { Event, EventFilter } from '../types'

const KEY = 'events'
const TABLE = 'events'

function live(): Event[] {
  return readCache<Event>(KEY)
}

export function getEvents(filter?: EventFilter): Event[] {
  let result = live()
  if (!filter) return result
  if (filter.type)       result = result.filter(e => e.type === filter.type)
  if (filter.locationId) result = result.filter(e => e.location?.id === filter.locationId)
  if (filter.founderId)  result = result.filter(e => e.founderId === filter.founderId)
  if (filter.featured !== undefined) result = result.filter(e => e.featured === filter.featured)
  if (filter.limit)      result = result.slice(0, filter.limit)
  return result
}

export function getEvent(id: string): Event | undefined {
  return live().find(e => e.id === id)
}

// No write UI calls this yet (events has always been read-only in the dashboard) —
// added for parity with the new `events` table (migration 003) so a future
// event-creation flow has a real Supabase-backed write path from day one.
export function updateEvent(event: Event): Promise<WriteResult> {
  return writeEntity<Event>({
    cacheKey: KEY,
    item: event,
    table: TABLE,
    toRow: (e, userId) => ({
      id: e.id,
      user_id: userId,
      slug: e.slug,
      founder_id: e.founderId ?? null,
      business_id: e.businessId ?? null,
      status: e.status,
      featured: e.featured,
      data: e,
    }),
  })
}
