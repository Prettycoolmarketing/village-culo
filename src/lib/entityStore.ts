import { supabase, isSupabaseConfigured } from './supabase'
import { store } from './store'

export interface WriteResult {
  success: boolean
  error?: string
}

export async function currentUserId(): Promise<string | null> {
  if (!supabase) return null
  // getSession() reads the local cached token — no network round-trip.
  // RLS enforces ownership server-side so session-level trust is sufficient here.
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user.id ?? null
}

/**
 * Writes one entity to its Supabase table (when configured) and only updates the
 * localStorage cache once that write is confirmed successful. On failure, the cache
 * is left untouched and the error is returned — callers must check `.success` rather
 * than assume a write succeeded just because the call resolved without throwing.
 *
 * In dev mode (no Supabase configured), this is just the localStorage cache write —
 * the cache is the only store, not a cache of anything.
 */
export async function writeEntity<T extends { id: string }>(opts: {
  cacheKey: string
  item: T
  table?: string
  toRow?: (item: T, userId: string) => Record<string, unknown>
}): Promise<WriteResult> {
  const { cacheKey, item, table, toRow } = opts

  if (isSupabaseConfigured && supabase && table && toRow) {
    const uid = await currentUserId()
    if (!uid) return { success: false, error: 'You must be signed in to save changes.' }
    const { error } = await supabase.from(table).upsert(toRow(item, uid), { onConflict: 'id' })
    if (error) return { success: false, error: error.message }
  }

  store.update<T>(cacheKey, item)
  return { success: true }
}

/** Same contract as writeEntity, for rows that don't require an authenticated owner (e.g. public claim submissions, anonymous click tracking). */
export async function writeEntityUnowned<T extends { id: string }>(opts: {
  cacheKey: string
  item: T
  table?: string
  toRow?: (item: T) => Record<string, unknown>
}): Promise<WriteResult> {
  const { cacheKey, item, table, toRow } = opts

  if (isSupabaseConfigured && supabase && table && toRow) {
    const { error } = await supabase.from(table).upsert(toRow(item), { onConflict: 'id' })
    if (error) return { success: false, error: error.message }
  }

  store.update<T>(cacheKey, item)
  return { success: true }
}

/**
 * Bulk counterpart to writeEntity: one Supabase upsert call for the whole batch
 * (Supabase/Postgrest accepts an array of rows) and one cache rewrite via
 * store.updateMany, instead of N round-trips and N full-array cache rewrites.
 * This is what Village HQ bulk founder actions (mark curated/publish/hide) use —
 * see Sprint 19B-Fix audit for the O(n²) bug this replaces.
 */
export async function writeEntityBatch<T extends { id: string }>(opts: {
  cacheKey: string
  items: T[]
  table?: string
  toRow?: (item: T, userId: string) => Record<string, unknown>
}): Promise<WriteResult> {
  const { cacheKey, items, table, toRow } = opts
  if (items.length === 0) return { success: true }

  if (isSupabaseConfigured && supabase && table && toRow) {
    const uid = await currentUserId()
    if (!uid) return { success: false, error: 'You must be signed in to save changes.' }
    const { error } = await supabase.from(table).upsert(items.map(item => toRow(item, uid)), { onConflict: 'id' })
    if (error) return { success: false, error: error.message }
  }

  store.updateMany<T>(cacheKey, items)
  return { success: true }
}

export async function deleteEntityBatch(opts: {
  cacheKey: string
  ids: string[]
  table?: string
}): Promise<WriteResult> {
  const { cacheKey, ids, table } = opts
  if (ids.length === 0) return { success: true }

  if (isSupabaseConfigured && supabase && table) {
    const { error } = await supabase.from(table).delete().in('id', ids)
    if (error) return { success: false, error: error.message }
  }

  const idSet = new Set(ids)
  const items = (store.get<{ id: string }>(cacheKey) ?? []).filter(i => !idSet.has(i.id))
  store.set(cacheKey, items)
  return { success: true }
}

export async function deleteEntity(opts: {
  cacheKey: string
  id: string
  table?: string
}): Promise<WriteResult> {
  const { cacheKey, id, table } = opts

  if (isSupabaseConfigured && supabase && table) {
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) return { success: false, error: error.message }
  }

  const items = (store.get<{ id: string }>(cacheKey) ?? []).filter(i => i.id !== id)
  store.set(cacheKey, items)
  return { success: true }
}

/**
 * The read-side counterpart to writeEntity: every service's live()/get*() should
 * call this instead of `store.get(key) ?? staticSeedData`. Never falls back to
 * static seed data — an empty cache means an empty result, not demo content
 * silently reappearing in production (see Sprint 19B audit).
 */
export function readCache<T>(cacheKey: string): T[] {
  return store.get<T>(cacheKey) ?? []
}

/**
 * Fetches every row of `table` visible to the current session and merges it into
 * the matching localStorage cache. Relies entirely on RLS to scope results — no
 * explicit user_id/founder_id filter needed, so this works uniformly whether a
 * table's ownership is `user_id`-based (founders, stories) or function-based
 * (owns_founder()/owns_business(), used by the Partnership Operating System
 * tables). For an unauthenticated/anonymous caller, RLS naturally limits this to
 * whatever each table's public-read policy allows (often nothing).
 */
export async function pullVisibleRows<T extends { id: string }>(table: string, cacheKey: string): Promise<void> {
  if (!supabase) return
  const { data, error } = await supabase.from(table).select('data')
  if (error || !data) return
  mergeIntoCache<T>(cacheKey, data.map(r => r.data as T))
}

export function mergeIntoCache<T extends { id: string }>(cacheKey: string, remote: T[]): void {
  store.updateMany<T>(cacheKey, remote)
}
