import { ideas as staticData } from '../data/ideas'
import { store } from '../lib/store'
import type { Idea, IdeaFilter } from '../types'

const KEY = 'ideas'

function live(): Idea[] {
  return store.get<Idea>(KEY) ?? staticData
}

export function getIdeas(filter?: IdeaFilter): Idea[] {
  let result = live()
  if (!filter) return result
  if (filter.topicId)    result = result.filter(i => i.topics.some(t => t.id === filter.topicId))
  if (filter.founderId)  result = result.filter(i => i.relatedFounderIds.includes(filter.founderId!))
  if (filter.businessId) result = result.filter(i => i.relatedBusinessIds.includes(filter.businessId!))
  if (filter.storyId)    result = result.filter(i => i.relatedStoryIds.includes(filter.storyId!))
  if (filter.publicOnly) result = result.filter(i => i.status === 'published' || i.status === 'featured')
  if (filter.featured !== undefined) result = result.filter(i => i.featured === filter.featured)
  if (filter.limit)      result = result.slice(0, filter.limit)
  return result
}

export function getIdea(id: string): Idea | undefined {
  return live().find(i => i.id === id)
}

export function getIdeaBySlug(slug: string): Idea | undefined {
  return live().find(i => i.slug === slug)
}

export function updateIdea(idea: Idea): void {
  store.update<Idea>(KEY, idea)
}
