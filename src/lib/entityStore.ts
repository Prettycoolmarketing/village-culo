import { supabase, isSupabaseConfigured } from './supabase'
import type { SupabaseClient } from '@supabase/supabase-js'
import { store } from './store'

export interface WriteResult {
  success: boolean
  error?: string
}

// Postgres's exact wording when an INSERT/UPDATE's row-level security check
// fails — almost always a stale/expired browser session (the access token
// went bad since page load) rather than a real ownership bug, since every
// write path already sets user_id from the live session. A raw Postgres
// error here is not actionable for a founder; tell them what to actually do.
function friendlyWriteError(message: string): string {
  if (/row-level security policy/i.test(message)) {
    return 'Your session may have expired. Please refresh the page and try again — if it keeps happening, sign out and back in.'
  }
  return message
}

export async function currentUserId(): Promise<string | null> {
  if (!supabase) return null
  // getSession() reads the local cached token — no network round-trip.
  // RLS enforces ownership server-side so session-level trust is sufficient here.
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user.id ?? null
}

// A flow that sits open for a while (e.g. Canva import — pick designs,
// wait through per-slide text extraction, then save) or a tab that's been
// backgrounded for a stretch (switched to another tab/app — browsers
// throttle supabase-js's background auto-refresh timer while a tab isn't
// visible) can outlast the access token's refresh cycle. The RLS failure
// that produces is real, but the fix is usually just a fresh token — retry
// once after forcing a refresh instead of making staff manually reload or
// sign out over what's actually a transient, self-healable blip.
// writeEntity already did this inline; deleteEntity and the raw
// editorial_items calls in editorialItems.ts didn't — confirmed real,
// live: a delete/rewrite kept failing with "session may have expired"
// repeatedly across completely different accounts and founders tonight,
// exactly the pattern this already-proven fix (just not applied
// everywhere) explains.
// Takes the live client as a parameter (rather than closing over the
// module-level `supabase` export directly) purely so TypeScript can
// actually narrow it to non-null inside the callback — every call site
// already null-checks `supabase` before calling this, but TS can't carry
// that narrowing through into the closure otherwise.
export async function withRlsRetry<T>(
  client: SupabaseClient,
  fn: (client: SupabaseClient) => PromiseLike<{ data: T | null; error: { message: string } | null }>,
): Promise<{ data: T | null; error: { message: string } | null }> {
  const first = await fn(client)
  if (first.error && /row-level security policy/i.test(first.error.message)) {
    const { data: refreshed } = await client.auth.refreshSession()
    if (refreshed.session) return await fn(client)
  }
  return first
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
    if (error) {
      // A flow that sits open for a while before its final save (e.g.
      // Canva import — pick designs, wait through per-slide text
      // extraction, then save) can outlast the access token's background
      // auto-refresh, especially if the tab was backgrounded meanwhile.
      // The RLS failure that produces is real, but the fix is usually just
      // a fresh token — retry once after forcing a refresh before making a
      // founder re-do the whole import over a confusing "session expired".
      if (/row-level security policy/i.test(error.message)) {
        const { data: refreshed } = await supabase.auth.refreshSession()
        if (refreshed.session) {
          const retryUid = refreshed.session.user.id
          const { error: retryError } = await supabase.from(table).upsert(toRow(item, retryUid), { onConflict: 'id' })
          if (!retryError) {
            store.update<T>(cacheKey, item)
            return { success: true }
          }
          return { success: false, error: friendlyWriteError(retryError.message) }
        }
      }
      return { success: false, error: friendlyWriteError(error.message) }
    }
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
    if (error) return { success: false, error: friendlyWriteError(error.message) }
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
    if (error) return { success: false, error: friendlyWriteError(error.message) }
  }

  store.updateMany<T>(cacheKey, items)
  return { success: true }
}

export async function deleteEntity(opts: {
  cacheKey: string
  id: string
  table?: string
}): Promise<WriteResult> {
  const { cacheKey, id, table } = opts

  if (isSupabaseConfigured && supabase && table) {
    const client = supabase
    // RLS silently filters rows outside a DELETE policy's USING clause —
    // Postgres returns success with zero rows affected, not an error, so
    // a denied delete looked identical to a real one here. The local
    // cache was then cleared unconditionally regardless, making a
    // blocked delete look like it worked until the row silently
    // reappeared on the next reload/refetch. .select('id') forces the
    // actually-deleted row(s) back so that case can be told apart from a
    // genuine delete and reported as a real failure instead.
    const { data, error } = await withRlsRetry(client, c => c.from(table).delete().eq('id', id).select('id'))
    if (error) return { success: false, error: friendlyWriteError(error.message) }
    if (!data || data.length === 0) {
      return { success: false, error: 'Could not delete this — you may not have permission, or it was already removed.' }
    }
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
const SYNC_PAGE_SIZE = 1000

// Confirmed real, repeatedly, across different staff and different tables
// (Gia/Darryl's Editorial Queue showing "no founders match", then 17 draft
// founders silently missing from this exact page for Mitchell): a single
// page of this fetch erroring — a network blip, a token hiccup, anything
// transient — used to just `return` immediately, leaving the OLD cache in
// place with zero signal to the caller or the user that anything went
// wrong. The page then renders completely normally, just quietly short a
// page's worth of rows, which reads as "random" missing data with no error
// anywhere to explain it. Retries each page a couple of times before
// giving up, and now reports back whether it actually succeeded so a
// caller can show a real "couldn't load, try again" state instead of
// silently trusting a cache that was never actually updated.
const PULL_RETRIES = 2

export async function pullVisibleRows<T extends { id: string }>(table: string, cacheKey: string): Promise<boolean> {
  if (!supabase) return false
  // PostgREST caps an unbounded select at 1000 rows by default — confirmed
  // real and live: imported_content alone has 3,099 rows, so a single
  // `.select('data')` with no `.range()` silently truncated to an
  // arbitrary (no ORDER BY) ~1000 of them. Any founder whose articles
  // didn't happen to land in that arbitrary slice saw "no articles" in
  // both the admin Articles tab and their own public profile — not
  // deleted, not an RLS/visibility issue, just never fetched at all. Pages
  // through every row RLS says is visible instead of trusting one request
  // to return all of them.
  const rows: T[] = []
  for (let from = 0; ; from += SYNC_PAGE_SIZE) {
    let data: { data: unknown }[] | null = null
    let lastError: string | undefined
    for (let attempt = 0; attempt <= PULL_RETRIES; attempt++) {
      const result = await supabase.from(table).select('data').range(from, from + SYNC_PAGE_SIZE - 1)
      if (!result.error && result.data) { data = result.data; break }
      lastError = result.error?.message
      if (attempt < PULL_RETRIES) await new Promise(r => setTimeout(r, 400 * (attempt + 1)))
    }
    if (!data) {
      console.error(`pullVisibleRows: giving up on ${table} after ${PULL_RETRIES + 1} attempts — ${lastError ?? 'no data returned'}`)
      return false
    }
    rows.push(...data.map(r => r.data as T))
    if (data.length < SYNC_PAGE_SIZE) break
  }
  // Full replace, not merge: this is every row RLS currently says is visible
  // to this session, so anything cached locally that's missing from it has
  // been deleted or is no longer visible (e.g. unpublished) and must not
  // survive in the cache — an upsert-only merge left stale rows (like an
  // old published copy of a since-unpublished story) stuck in localStorage
  // forever, since a row that's gone from the source never has a chance to
  // overwrite the stale one still sitting there.
  replaceCache<T>(cacheKey, rows)
  return true
}

export function replaceCache<T extends { id: string }>(cacheKey: string, remote: T[]): void {
  store.set<T>(cacheKey, remote)
}
