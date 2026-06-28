import { events as eventsData } from '../data/events'
import { filterEvents } from '../utils/filters'
import type { Event, EventFilter } from '../types'

export function getEvents(filter?: EventFilter): Event[] {
  if (!filter) return [...eventsData]
  return filterEvents(filter)
}

export function getEvent(id: string): Event | undefined {
  return eventsData.find(e => e.id === id)
}
