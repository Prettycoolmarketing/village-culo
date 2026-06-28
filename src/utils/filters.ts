import type { Story, Founder, Business, Idea, Event, StoryFilter, FounderFilter, BusinessFilter, IdeaFilter, EventFilter } from '../types'
import { stories } from '../data/stories'
import { founders } from '../data/founders'
import { businesses } from '../data/businesses'
import { ideas } from '../data/ideas'
import { events } from '../data/events'

export function filterStories(filter: StoryFilter = {}): Story[] {
  let result = stories.filter(s => s.status !== 'archived')
  if (filter.ids) result = result.filter(s => filter.ids!.includes(s.id))
  if (filter.founderId) result = result.filter(s => s.founderId === filter.founderId)
  if (filter.businessId) result = result.filter(s => s.businessId === filter.businessId)
  if (filter.locationId) result = result.filter(s => s.location.id === filter.locationId)
  if (filter.topicId) result = result.filter(s => s.topics.some(t => t.id === filter.topicId))
  if (filter.industryId) result = result.filter(s => s.industry.id === filter.industryId)
  if (filter.contentType) result = result.filter(s => s.contentTypes.includes(filter.contentType!))
  if (filter.featured !== undefined) result = result.filter(s => s.featured === filter.featured)
  if (filter.status) result = result.filter(s => s.status === filter.status)
  if (filter.limit) result = result.slice(0, filter.limit)
  return result
}

export function filterFounders(filter: FounderFilter = {}): Founder[] {
  let result = founders.filter(f => f.status !== 'archived')
  if (filter.ids) result = result.filter(f => filter.ids!.includes(f.id))
  if (filter.locationId) result = result.filter(f => f.location.id === filter.locationId)
  if (filter.industryId) result = result.filter(f => f.industry.id === filter.industryId)
  if (filter.topicId) result = result.filter(f => f.topics.some(t => t.id === filter.topicId))
  if (filter.featured !== undefined) result = result.filter(f => f.featured === filter.featured)
  if (filter.limit) result = result.slice(0, filter.limit)
  return result
}

export function filterBusinesses(filter: BusinessFilter = {}): Business[] {
  let result = businesses.filter(b => b.status !== 'archived')
  if (filter.ids) result = result.filter(b => filter.ids!.includes(b.id))
  if (filter.locationId) result = result.filter(b => b.location.id === filter.locationId)
  if (filter.industryId) result = result.filter(b => b.industry.id === filter.industryId)
  if (filter.topicId) result = result.filter(b => b.topics.some(t => t.id === filter.topicId))
  if (filter.featured !== undefined) result = result.filter(b => b.featured === filter.featured)
  if (filter.limit) result = result.slice(0, filter.limit)
  return result
}

export function filterIdeas(filter: IdeaFilter = {}): Idea[] {
  let result = [...ideas]
  if (filter.topicId)   result = result.filter(i => i.topics.some(t => t.id === filter.topicId))
  if (filter.founderId) result = result.filter(i => i.relatedFounderIds.includes(filter.founderId!))
  if (filter.businessId) result = result.filter(i => i.relatedBusinessIds.includes(filter.businessId!))
  if (filter.storyId)   result = result.filter(i => i.relatedStoryIds.includes(filter.storyId!))
  if (filter.featured !== undefined) result = result.filter(i => i.featured === filter.featured)
  if (filter.limit) result = result.slice(0, filter.limit)
  return result
}

export function filterEvents(filter: EventFilter = {}): Event[] {
  let result = [...events]
  if (filter.type) result = result.filter(e => e.type === filter.type)
  if (filter.locationId) result = result.filter(e => e.location?.id === filter.locationId)
  if (filter.founderId) result = result.filter(e => e.founderId === filter.founderId)
  if (filter.featured !== undefined) result = result.filter(e => e.featured === filter.featured)
  if (filter.limit) result = result.slice(0, filter.limit)
  return result
}
