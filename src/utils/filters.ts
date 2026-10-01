// Thin wrapper around the real services (not demo data) — kept for existing
// callers (MapPage, EventGrid, NoticeboardPreviewWidget) that expect this
// shape. Archived items are excluded here rather than passed down, since a
// filter's `limit` needs to apply after that exclusion, not before it.
// Every caller of these three is a public-facing page (MapPage is the only
// current one) — publicOnly is forced on regardless of what's passed in, so
// a draft/unpublished founder, business or story (including an unclaimed
// curated one still being worked on in CAPO) can never surface in a public
// count or listing here just because a caller forgot to ask for it.
import type { Story, Founder, Business, Idea, Event, StoryFilter, FounderFilter, BusinessFilter, IdeaFilter, EventFilter } from '../types'
import { getStories } from '../services/stories'
import { getFounders } from '../services/founders'
import { getBusinesses } from '../services/businesses'
import { getIdeas } from '../services/ideas'
import { getEvents } from '../services/events'

export function filterStories(filter: StoryFilter = {}): Story[] {
  const { limit, ...rest } = filter
  const result = getStories({ ...rest, publicOnly: true }).filter(s => s.status !== 'archived')
  return limit ? result.slice(0, limit) : result
}

export function filterFounders(filter: FounderFilter = {}): Founder[] {
  const { limit, ...rest } = filter
  const result = getFounders({ ...rest, publicOnly: true }).filter(f => f.status !== 'archived')
  return limit ? result.slice(0, limit) : result
}

export function filterBusinesses(filter: BusinessFilter = {}): Business[] {
  const { limit, ...rest } = filter
  const result = getBusinesses({ ...rest, publicOnly: true }).filter(b => b.status !== 'archived')
  return limit ? result.slice(0, limit) : result
}

export function filterIdeas(filter: IdeaFilter = {}): Idea[] {
  return getIdeas(filter)
}

export function filterEvents(filter: EventFilter = {}): Event[] {
  return getEvents(filter)
}
