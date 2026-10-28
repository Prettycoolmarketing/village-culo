import { supabase } from './supabase'
import { pullVisibleRows } from './entityStore'
import { villageSettingsService } from '../services/villageSettings'

// Public-read tables that should populate the cache for anonymous visitors too —
// scoped by each table's own public-read RLS policy (published/featured content,
// public trust profiles, public village content intelligence).
const PUBLIC_TABLES: Array<{ table: string; cacheKey: string }> = [
  { table: 'stories',                      cacheKey: 'stories' },
  { table: 'series',                       cacheKey: 'series' },
  // founders_safe, not the raw table — strips editorial-engine-internal
  // fields (evidenceLedger, researchStatus/*At, claimNotes) that RLS
  // alone can't hide, since RLS is row-level and founders.data is one
  // JSONB blob. See migration 042_founders_safe_view.sql.
  { table: 'founders_safe',                cacheKey: 'founders' },
  { table: 'businesses',                   cacheKey: 'businesses' },
  // Confirmed real, live: a founder's public profile page builds its
  // Articles Written by CULO section entirely from this cache
  // (FounderProfilePage's publicImports), client-side — this table was
  // simply never fetched for an anonymous/public session at all, so no
  // amount of the row itself being correctly published+public ever
  // mattered. The admin dashboard uses a separate, authenticated table
  // list (sync.ts) that does include it, which is why it could look fine
  // there while staying empty for every actual visitor.
  { table: 'imported_content',             cacheKey: 'imported_content' },
  { table: 'library_items',                cacheKey: 'library' },
  { table: 'services',                     cacheKey: 'services' },
  { table: 'ideas',                        cacheKey: 'ideas' },
  { table: 'events',                       cacheKey: 'events' },
  { table: 'village_content_intelligence', cacheKey: 'village_intelligence' },
  { table: 'trust_profiles',               cacheKey: 'partnership_trust_profiles' },
  { table: 'relationships',                cacheKey: 'relationships' },
  { table: 'village_sources',              cacheKey: 'village_sources' },
  { table: 'editorial_features',           cacheKey: 'editorial_features' },
]

async function runPublicSync(): Promise<void> {
  if (!supabase) return

  // Confirmed real, live, serious: pullVisibleRows itself only returns early
  // on a clean Supabase-reported error — it does nothing to stop the
  // underlying fetch throwing outright (a real network blip, far more
  // common on a mobile connection than wifi). An uncaught throw from ANY
  // ONE of these ~17 tables rejected the whole Promise.all, which rejected
  // this function, which meant App.tsx's `.then(() => setSyncTick(...))`
  // never ran — not just that one table staying stale, the ENTIRE public
  // cache (founders included) stayed empty for the rest of that visit, no
  // retry, no error shown, every public page reading "not found" until a
  // hard reload happened to retry at a better moment. Catching per-table
  // means one flaky request loses just that table's fresh data, not
  // everyone else's.
  await Promise.all(PUBLIC_TABLES.map(({ table, cacheKey }) =>
    pullVisibleRows(table, cacheKey).catch(() => { /* this table stays stale; others still land */ }),
  ))

  try {
    const { data, error } = await supabase.from('village_settings').select('data').eq('id', 'default').maybeSingle()
    if (!error && data) villageSettingsService.cacheFromRemote(data.data as Partial<import('../types/villageSettings').VillageSettings>)
  } catch {
    // Same reasoning — a failure here must never take the rest of the sync
    // (and App.tsx's re-render) down with it.
  }
}

// Both this (App.tsx, unconditional on every mount, for anonymous visitors
// and regular founders alike) and AuthContext's CAPO-only founders pull
// write to the same 'founders' cache key — one with founders_safe, one
// with the raw table — and pullVisibleRows does a full replace, so
// whichever settles LAST wins. Two independent calls racing on the
// network would make that non-deterministic: a CAPO session could end up
// with the stripped view depending on which network request happened to
// finish last. A single shared, memoized promise makes the ordering
// explicit instead: everyone awaits the exact same public-sync call, so
// AuthContext's admin pull (see src/lib/sync.ts) can simply await this
// first and then always be the one to write last when it applies.
let publicSyncPromise: Promise<void> | null = null
export function syncPublishedContent(): Promise<void> {
  if (!publicSyncPromise) publicSyncPromise = runPublicSync()
  return publicSyncPromise
}
