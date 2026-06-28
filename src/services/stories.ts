import { stories as storiesData } from '../data/stories'
import { filterStories } from '../utils/filters'
import type { Story, StoryFilter } from '../types'

export function getStories(filter?: StoryFilter): Story[] {
  if (!filter) return [...storiesData]
  return filterStories(filter)
}

export function getStory(id: string): Story | undefined {
  return storiesData.find(s => s.id === id)
}

export function getStoryBySlug(slug: string): Story | undefined {
  return storiesData.find(s => s.slug === slug)
}
