import { ideas as ideasData } from '../data/ideas'
import { filterIdeas } from '../utils/filters'
import type { Idea, IdeaFilter } from '../types'

export function getIdeas(filter?: IdeaFilter): Idea[] {
  if (!filter) return [...ideasData]
  return filterIdeas(filter)
}

export function getIdea(id: string): Idea | undefined {
  return ideasData.find(i => i.id === id)
}

export function getIdeaBySlug(slug: string): Idea | undefined {
  return ideasData.find(i => i.slug === slug)
}
