// Thin wrapper around the real services (not demo data) — kept for existing
// callers (MapPage, EventGrid, NoticeboardPreviewWidget) that expect this
// shape. Archived items are excluded here rather than passed down, since a
// filter's `limit` needs to apply after that exclusion, not before it.
import type { Story, Founder, Business, Idea, Event, StoryFilter, FounderFilter, BusinessFilter, IdeaFilter, EventFilter } from '../types'
import { getStories } from '../services/stories'
import { getFounders } from '../services/founders'
import { getBusinesses } from '../services/businesses'
import { getIdeas } from '../services/ideas'
import { getEvents } from '../services/events'

export function filterStories(filter: StoryFilter = {}): Story[] {
  const { limit, ...rest } = filter
  const result = getStories(rest).filter(s => s.status !== 'archived')
  return limit ? result.slice(0, limit) : result
}

export function filterFounders(filter: FounderFilter = {}): Founder[] {
  const { limit, ...rest } = filter
  const result = getFounders(rest).filter(f => f.status !== 'archived')
  return limit ? result.slice(0, limit) : result
}

export function filterBusinesses(filter: BusinessFilter = {}): Business[] {
  const { limit, ...rest } = filter
  const result = getBusinesses(rest).filter(b => b.status !== 'archived')
  return limit ? result.slice(0, limit) : result
}

export function filterIdeas(filter: IdeaFilter = {}): Idea[] {
  return getIdeas(filter)
}

export function filterEvents(filter: EventFilter = {}): Event[] {
  return getEvents(filter)
}
