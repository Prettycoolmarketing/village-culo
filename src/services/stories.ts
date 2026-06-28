import { stories as staticData } from '../data/stories'
import { store } from '../lib/store'
import type { Story, StoryFilter } from '../types'

const KEY = 'stories'

function live(): Story[] {
  return store.get<Story>(KEY) ?? staticData
}

export function getStories(filter?: StoryFilter): Story[] {
  let result = live()
  if (!filter) return result
  if (filter.ids)       result = result.filter(s => filter.ids!.includes(s.id))
  if (filter.founderId) result = result.filter(s => s.founderId === filter.founderId)
  if (filter.businessId) result = result.filter(s => s.businessId === filter.businessId)
  if (filter.locationId) result = result.filter(s => s.location.id === filter.locationId)
  if (filter.topicId)   result = result.filter(s => s.topics.some(t => t.id === filter.topicId))
  if (filter.industryId) result = result.filter(s => s.industry.id === filter.industryId)
  if (filter.contentType) result = result.filter(s => s.contentTypes.includes(filter.contentType!))
  if (filter.publicOnly) result = result.filter(s => s.status === 'published' || s.status === 'featured')
  if (filter.featured !== undefined) result = result.filter(s => s.featured === filter.featured)
  if (filter.status)    result = result.filter(s => s.status === filter.status)
  if (filter.limit)     result = result.slice(0, filter.limit)
  return result
}

export function getStory(id: string): Story | undefined {
  return live().find(s => s.id === id)
}

export function getStoryBySlug(slug: string): Story | undefined {
  return live().find(s => s.slug === slug)
}

export function updateStory(story: Story): void {
  store.update<Story>(KEY, story)
}
