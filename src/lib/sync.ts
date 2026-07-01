import { supabase } from './supabase'
import { pullVisibleRows } from './entityStore'

// Every entity table that should be pulled into the local cache once a user is
// signed in. pullVisibleRows relies entirely on RLS (no explicit user_id filter),
// so this list works uniformly for user_id-owned tables (founders, stories, ...)
// and function-scoped tables (owns_founder()/owns_business(), used throughout the
// Partnership Operating System) — RLS returns only what this session can see for
// each table, whether that's "my own rows", "my own + public rows", or (for an
// admin) the full Village HQ queue.
const SYNCED_TABLES: Array<{ table: string; cacheKey: string }> = [
  { table: 'founders',                       cacheKey: 'founders' },
  { table: 'businesses',                     cacheKey: 'businesses' },
  { table: 'stories',                        cacheKey: 'stories' },
  { table: 'library_items',                  cacheKey: 'library' },
  { table: 'services',                       cacheKey: 'services' },
  { table: 'ideas',                          cacheKey: 'ideas' },
  { table: 'events',                         cacheKey: 'events' },
  { table: 'imported_content',               cacheKey: 'imported_content' },
  { table: 'founder_claim_requests',         cacheKey: 'founder_claims' },
  { table: 'import_batches',                 cacheKey: 'village_import_batches' },
  { table: 'village_content_intelligence',   cacheKey: 'village_intelligence' },
  { table: 'partner_programs',               cacheKey: 'partnership_programs' },
  { table: 'publisher_partner_profiles',     cacheKey: 'partnership_publisher_profiles' },
  { table: 'business_partner_profiles',      cacheKey: 'partnership_business_profiles' },
  { table: 'recommendations',                cacheKey: 'partnership_recommendations' },
  { table: 'opportunities',                  cacheKey: 'partnership_opportunities' },
  { table: 'trust_profiles',                 cacheKey: 'partnership_trust_profiles' },
  { table: 'campaigns',                      cacheKey: 'partnership_campaigns' },
  { table: 'campaign_applications',          cacheKey: 'partnership_campaign_applications' },
  { table: 'publisher_partnership_settings', cacheKey: 'partnership_publisher_settings' },
  { table: 'business_partnership_settings',  cacheKey: 'partnership_business_settings' },
  { table: 'founder_program_enrollments',    cacheKey: 'partnership_enrollments' },
  { table: 'founder_affiliate_links',        cacheKey: 'partnership_affiliate_links' },
]

// RLS scopes every table's result to what this session can see, so no userId param
// is needed — see the SYNCED_TABLES comment above.
export async function syncUserDataFromSupabase(): Promise<void> {
  if (!supabase) return
  await Promise.all(SYNCED_TABLES.map(({ table, cacheKey }) => pullVisibleRows(table, cacheKey)))
}
