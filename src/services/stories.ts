import { readCache, writeEntity, deleteEntity, type WriteResult } from '../lib/entityStore'
import type { Story, StoryFilter } from '../types'

const KEY = 'stories'
const TABLE = 'stories'

function live(): Story[] {
  return readCache<Story>(KEY)
}

export function getStories(filter?: StoryFilter): Story[] {
  let result = live()
  if (!filter) return result
  if (filter.ids)        result = result.filter(s => filter.ids!.includes(s.id))
  if (filter.founderId)  result = result.filter(s => s.founderId === filter.founderId)
  if (filter.businessId) result = result.filter(s => s.businessId === filter.businessId)
  if (filter.locationId) result = result.filter(s => s.location.id === filter.locationId)
  if (filter.topicId)    result = result.filter(s => s.topics.some(t => t.id === filter.topicId))
  if (filter.industryId) result = result.filter(s => s.industry.id === filter.industryId)
  if (filter.contentType) result = result.filter(s => s.contentTypes.includes(filter.contentType!))
  if (filter.publicOnly) result = result.filter(s => s.status === 'published' || s.status === 'featured')
  if (filter.featured !== undefined) result = result.filter(s => s.featured === filter.featured)
  if (filter.status)     result = result.filter(s => s.status === filter.status)
  if (filter.limit)      result = result.slice(0, filter.limit)
  return result
}

export function getStory(id: string): Story | undefined {
  return live().find(s => s.id === id)
}

export function getStoryBySlug(slug: string): Story | undefined {
  return live().find(s => s.slug === slug)
}

export async function updateStory(story: Story): Promise<WriteResult> {
  return writeEntity<Story>({
    cacheKey: KEY,
    item: story,
    table: TABLE,
    toRow: (s, userId) => ({
      id: s.id,
      user_id: userId,
      founder_id: s.founderId,
      business_id: s.businessId,
      status: s.status,
      featured: s.featured,
      slug: s.slug,
      visibility: 'public',
      published_at: s.status === 'published' || s.status === 'featured' ? new Date().toISOString() : null,
      data: s,
    }),
  })
}

export function deleteStory(id: string): Promise<WriteResult> {
  return deleteEntity({ cacheKey: KEY, id, table: TABLE })
}

export function duplicateStory(id: string): Promise<WriteResult> {
  const source = getStory(id)
  if (!source) return Promise.resolve({ success: false, error: 'Story not found.' })
  const suffix = Date.now().toString(36)
  const copy: Story = {
    ...source,
    id: `${source.id}-copy-${suffix}`,
    slug: `${source.slug}-copy-${suffix}`,
    title: `${source.title} (Copy)`,
    status: 'draft',
    featured: false,
    createdAt: new Date().toISOString(),
  }
  return updateStory(copy)
}
