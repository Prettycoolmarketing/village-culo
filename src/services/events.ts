import { events as staticData } from '../data/events'
import { store } from '../lib/store'
import type { Event, EventFilter } from '../types'

const KEY = 'events'

function live(): Event[] {
  return store.get<Event>(KEY) ?? staticData
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
