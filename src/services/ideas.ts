import { readCache, writeEntity, deleteEntity, type WriteResult } from '../lib/entityStore'
import type { Idea, IdeaFilter } from '../types'

const KEY = 'ideas'
const TABLE = 'ideas'

function live(): Idea[] {
  return readCache<Idea>(KEY)
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

// Admin-write, public-read (see migration 003) — there is no founder-facing idea
// editing UI today, so this requires an admin session when Supabase is configured.
export function updateIdea(idea: Idea): Promise<WriteResult> {
  return writeEntity<Idea>({
    cacheKey: KEY,
    item: idea,
    table: TABLE,
    toRow: i => ({ id: i.id, slug: i.slug, status: i.status ?? 'published', featured: i.featured, data: i }),
  })
}

// Admin-write per migration 003 RLS — delete/duplicate follow the same restriction
// as updateIdea above. A signed-in founder can call these, but Supabase will reject
// the write with an RLS error surfaced through WriteResult.error, same as any other
// save failure in this app.
export function deleteIdea(id: string): Promise<WriteResult> {
  return deleteEntity({ cacheKey: KEY, id, table: TABLE })
}

export function duplicateIdea(id: string): Promise<WriteResult> {
  const source = getIdea(id)
  if (!source) return Promise.resolve({ success: false, error: 'Idea not found.' })
  const suffix = Date.now().toString(36)
  const copy: Idea = {
    ...source,
    id: `${source.id}-copy-${suffix}`,
    slug: `${source.slug}-copy-${suffix}`,
    title: `${source.title} (Copy)`,
    status: 'draft',
    featured: false,
    createdAt: new Date().toISOString(),
  }
  return updateIdea(copy)
}
