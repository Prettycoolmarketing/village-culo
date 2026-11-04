import { supabase } from './supabase'
import { pullVisibleRows } from './entityStore'

// Every entity table that should be pulled into the local cache once a user is
// signed in. pullVisibleRows relies entirely on RLS (no explicit user_id filter),
// so this list works uniformly for user_id-owned tables (founders, stories, ...)
// and function-scoped tables (owns_founder()/owns_business(), used throughout the
// Partnership Operating System) — RLS returns only what this session can see for
// each table, whether that's "my own rows", "my own + public rows", or (for an
// admin) the full Village HQ queue.
// founders is intentionally NOT in this fixed list — see
// syncUserDataFromSupabase, which picks the raw table or founders_safe
// per-call depending on whether this session is CAPO staff.
const SYNCED_TABLES: Array<{ table: string; cacheKey: string }> = [
  { table: 'businesses',                     cacheKey: 'businesses' },
  { table: 'stories',                        cacheKey: 'stories' },
  { table: 'series',                         cacheKey: 'series' },
  { table: 'library_items',                  cacheKey: 'library' },
  { table: 'services',                       cacheKey: 'services' },
  { table: 'ideas',                          cacheKey: 'ideas' },
  { table: 'events',                         cacheKey: 'events' },
  { table: 'imported_content',               cacheKey: 'imported_content' },
  { table: 'connected_sources',              cacheKey: 'connected_sources' },
  { table: 'editorial_features',             cacheKey: 'editorial_features' },
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
  { table: 'media_uploads',                  cacheKey: 'media_uploads' },
  { table: 'partners',                       cacheKey: 'partners' },
  { table: 'partner_flags',                  cacheKey: 'partner_flags' },
  { table: 'partner_conversions',            cacheKey: 'partner_conversions' },
  { table: 'founder_stripe_accounts',        cacheKey: 'founder_stripe_accounts' },
  { table: 'partner_payouts',                cacheKey: 'partner_payouts' },
]

// RLS scopes every table's result to what this session can see, so no userId param
// is needed — see the SYNCED_TABLES comment above.
//
// founders is the one exception: it needs to know the caller's own role,
// not just RLS. A regular founder — even reading their OWN claimed
// record — must never see evidenceLedger/researchStatus/claimNotes; those
// are CAPO-internal, not something a founder manages or should even know
// exists. Only CAPO staff (is_village_admin()) read the raw table; every
// other signed-in session reads founders_safe, same as an anonymous
// visitor (see publicSync.ts and migration 042_founders_safe_view.sql).
// Same fix as publicSync.ts's runPublicSync, same reason: pullVisibleRows
// only returns early on a clean Supabase-reported error, it does nothing
// about the underlying fetch throwing outright (a real network blip). An
// uncaught throw from any ONE of these ~31 tables rejected the whole
// Promise.all — and since this whole function is called fire-and-forget
// (`void syncUserDataFromSupabase(...)` in AuthContext, nothing awaits or
// retries it), that rejection just vanished as an unhandled promise
// rejection, leaving every single table — founders included — stuck on
// whatever was cached from a previous, smaller/older sync. Confirmed
// real: a CAPO session reading "8 members" when the database has 20.
// Catching per-table means one flaky request loses just that table.
// This function can now legitimately fire more than once in close
// succession for the same session — AuthContext calls it again whenever a
// late profile correction lands, on top of the original SIGNED_IN call —
// and pullVisibleRows does a blind full-replace of the cache with
// whatever it fetches. If an earlier call started with a wrong provisional
// role (the 'founder' fallback, while the real profiles row was still
// loading) and happens to resolve AFTER a later call that started once the
// real staff role was known, that earlier, wrong-permission pull would
// overwrite the correct one with the stripped founders_safe view — a pure
// timing accident, not something "last call wins" can be trusted to avoid.
// Confirmed real: a CAPO member's Editorial Queue went empty again even
// after a fresh sign-out/sign-in, with the fix that should have corrected
// it already live. Latching true the first time any call in this page
// load establishes real staff access, and never pulling founders_safe
// again for the rest of that load, makes this safe regardless of which
// call actually finishes last.
let knownCapoStaffThisLoad = false

// Must be called on sign-out — otherwise a different, non-staff person
// signing in on the same tab afterward (no full page reload in between)
// would incorrectly inherit this latch and get pulled the full founders
// table, CAPO-internal fields included, instead of founders_safe.
export function resetKnownCapoStaff(): void {
  knownCapoStaffThisLoad = false
}

export async function syncUserDataFromSupabase(isCapoStaff: boolean): Promise<void> {
  if (!supabase) return
  if (isCapoStaff) knownCapoStaffThisLoad = true
  await Promise.all([
    (async () => {
      // The latch above only stops a call that HASN'T started yet from
      // picking founders_safe — it does nothing for a call that already
      // started with founders_safe (staff status wasn't known yet when IT
      // began) and simply takes longer to resolve than a later, correct
      // call. replaceCache is a blind full-replace, so whichever finishes
      // LAST wins the cache, not whichever was right. Confirmed real,
      // twice now (see this function's own prior fix, and Mitchell's
      // Editorial Queue going empty again after a fresh sign-out/sign-in
      // with that fix already live): re-checking the latch fresh right
      // before the fetch, not just once at the top, closes most of the
      // gap — and if staff status becomes known WHILE this particular
      // founders_safe fetch is still in flight, immediately re-pulling the
      // real table afterward corrects the cache regardless of which call
      // technically finished last.
      const table = knownCapoStaffThisLoad ? 'founders' : 'founders_safe'
      const ok = await pullVisibleRows(table, 'founders').catch(() => false)
      if (ok && table === 'founders_safe' && knownCapoStaffThisLoad) {
        await pullVisibleRows('founders', 'founders').catch(() => {})
      }
    })(),
    ...SYNCED_TABLES.map(({ table, cacheKey }) => pullVisibleRows(table, cacheKey).catch(() => {})),
  ])
}
