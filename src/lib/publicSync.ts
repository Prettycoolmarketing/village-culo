import { supabase } from './supabase'
import { pullVisibleRows } from './entityStore'
import { villageSettingsService } from '../services/villageSettings'

// Public-read tables that should populate the cache for anonymous visitors too —
// scoped by each table's own public-read RLS policy (published/featured content,
// public trust profiles, public village content intelligence).
const PUBLIC_TABLES: Array<{ table: string; cacheKey: string }> = [
  { table: 'stories',                      cacheKey: 'stories' },
  { table: 'founders',                     cacheKey: 'founders' },
  { table: 'businesses',                   cacheKey: 'businesses' },
  { table: 'library_items',                cacheKey: 'library' },
  { table: 'services',                     cacheKey: 'services' },
  { table: 'ideas',                        cacheKey: 'ideas' },
  { table: 'events',                       cacheKey: 'events' },
  { table: 'village_content_intelligence', cacheKey: 'village_intelligence' },
  { table: 'trust_profiles',               cacheKey: 'partnership_trust_profiles' },
]

// Called once on app init so Village public pages show real Supabase data, not just
// whatever was last cached locally. Never falls back to static seed data — an empty
// result here just means the public cache stays whatever it already was/empty.
export async function syncPublishedContent(): Promise<void> {
  if (!supabase) return

  await Promise.all(PUBLIC_TABLES.map(({ table, cacheKey }) => pullVisibleRows(table, cacheKey)))

  const { data, error } = await supabase.from('village_settings').select('data').eq('id', 'default').maybeSingle()
  if (!error && data) villageSettingsService.cacheFromRemote(data.data as Partial<import('../types/villageSettings').VillageSettings>)
}
