import { readCache, writeEntity, deleteEntity, type WriteResult } from '../lib/entityStore'
import type { EditorialFeature, EditorialFeatureFilter } from '../types/editorial'

const KEY = 'editorial_features'
const TABLE = 'editorial_features'

function now() { return new Date().toISOString() }

export const editorialService = {
  getAll(filter?: EditorialFeatureFilter): EditorialFeature[] {
    let items = readCache<EditorialFeature>(KEY)
    if (filter?.status)   items = items.filter(f => f.status === filter.status)
    if (filter?.template) items = items.filter(f => f.template === filter.template)
    return items
  },

  get(id: string): EditorialFeature | undefined {
    return readCache<EditorialFeature>(KEY).find(f => f.id === id)
  },

  getBySlug(slug: string): EditorialFeature | undefined {
    return readCache<EditorialFeature>(KEY).find(f => f.slug === slug)
  },

  upsert(item: EditorialFeature): Promise<WriteResult> {
    return writeEntity<EditorialFeature>({
      cacheKey: KEY,
      item,
      table: TABLE,
      // No user_id column — editorial_features is platform-owned (RLS gates
      // writes on is_village_admin(), not row ownership), unlike every other
      // entity table in this app. writeEntity still requires a signed-in
      // caller before it will write at all, which is enough here.
      toRow: (f) => ({
        id: f.id,
        slug: f.slug,
        template: f.template,
        status: f.status,
        published_at: f.status === 'published' ? (f.publishedAt ?? now()) : null,
        data: f,
      }),
    })
  },

  delete(id: string): Promise<WriteResult> {
    return deleteEntity({ cacheKey: KEY, id, table: TABLE })
  },
}

export function newEditorialFeature(template: EditorialFeature['template']): EditorialFeature {
  const ts = now()
  return {
    id: crypto.randomUUID(),
    slug: '',
    template,
    status: 'draft',
    title: '',
    intro: '',
    picks: [],
    topicIds: [],
    createdAt: ts,
    updatedAt: ts,
  }
}
