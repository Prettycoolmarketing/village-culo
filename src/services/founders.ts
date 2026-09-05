import { readCache, writeEntity, writeEntityBatch, deleteEntity, deleteEntityBatch, type WriteResult } from '../lib/entityStore'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { Founder, FounderFilter } from '../types'

const KEY = 'founders'
const TABLE = 'founders'

function toRow(f: Founder, userId: string) {
  return {
    id: f.id,
    user_id: userId,
    status: f.status,
    featured: f.featured,
    slug: f.slug,
    profile_status: f.profileStatus ?? null,
    visibility: 'public',
    is_claimable: f.isClaimable ?? false,
    claimed_by_user_id: f.claimedByUserId ?? null,
    published_at: f.status === 'published' || f.status === 'featured' ? new Date().toISOString() : null,
    data: f,
  }
}

function live(): Founder[] {
  return readCache<Founder>(KEY)
}

export function getFounders(filter?: FounderFilter): Founder[] {
  let result = live()
  if (!filter) return result
  if (filter.ids)        result = result.filter(f => filter.ids!.includes(f.id))
  if (filter.locationId) result = result.filter(f => f.location.id === filter.locationId)
  if (filter.industryId) result = result.filter(f => f.industry.id === filter.industryId)
  if (filter.topicId)    result = result.filter(f => f.topics.some(t => t.id === filter.topicId))
  if (filter.publicOnly) result = result.filter(f => f.status === 'published' || f.status === 'featured')
  if (filter.featured !== undefined) result = result.filter(f => f.featured === filter.featured)
  if (filter.limit)      result = result.slice(0, filter.limit)
  return result
}

export function getFounder(id: string): Founder | undefined {
  return live().find(f => f.id === id)
}

export function getFounderBySlug(slug: string): Founder | undefined {
  return live().find(f => f.slug === slug)
}

export async function updateFounder(founder: Founder): Promise<WriteResult> {
  return writeEntity<Founder>({ cacheKey: KEY, item: founder, table: TABLE, toRow })
}

/** One Supabase upsert + one cache rewrite for the whole batch — see Sprint 19B-Fix audit. */
export function updateFoundersBatch(founders: Founder[]): Promise<WriteResult> {
  return writeEntityBatch<Founder>({ cacheKey: KEY, items: founders, table: TABLE, toRow })
}

export function duplicateFounder(id: string): Promise<WriteResult> {
  const source = getFounder(id)
  if (!source) return Promise.resolve({ success: false, error: 'Founder not found.' })
  const suffix = Date.now().toString(36)
  const copy: Founder = {
    ...source,
    id: `${source.id}-copy-${suffix}`,
    slug: `${source.slug}-copy-${suffix}`,
    name: `${source.name} (Copy)`,
    status: 'draft',
    featured: false,
    createdAt: new Date().toISOString(),
  }
  return updateFounder(copy)
}

export function deleteFounder(id: string): Promise<WriteResult> {
  return deleteEntity({ cacheKey: KEY, id, table: TABLE })
}

export function deleteFoundersBatch(ids: string[]): Promise<WriteResult> {
  return deleteEntityBatch({ cacheKey: KEY, ids, table: TABLE })
}

// Unlike deleteFounder (which only ever removes the founders row), this also
// deletes the underlying Supabase Auth login via the delete-founder-account
// Edge Function — see that function's header comment for why a hard account
// delete needs the service role and can't be a direct client call.
export async function deleteFounderAccount(founderId: string): Promise<WriteResult> {
  if (!isSupabaseConfigured || !supabase) {
    return deleteEntity({ cacheKey: KEY, id: founderId, table: TABLE })
  }
  const { data, error } = await supabase.functions.invoke<{ success?: boolean; error?: string }>(
    'delete-founder-account', { body: { founderId } },
  )
  if (error || data?.error) {
    return { success: false, error: data?.error || (error instanceof Error ? error.message : 'Could not delete this account.') }
  }
  return deleteEntity({ cacheKey: KEY, id: founderId, table: TABLE })
}
