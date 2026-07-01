# Migration verification checklist

No Supabase CLI is available in the environment these migrations were written in
(no `supabase` binary, no linked project, no `VITE_SUPABASE_URL` configured — the
app runs in dev/localStorage mode here). **None of the SQL in `supabase/migrations/`
has been executed against a real Postgres database.** Run this checklist before
trusting the migration in any environment that matters.

## Option A — Supabase CLI (preferred if installed)

```bash
# From repo root, with the CLI installed and a project linked:
supabase db push          # applies 001-004 in order against the linked project
# or, against a fresh local Postgres via Docker:
supabase start
supabase db reset         # replays all migrations from scratch
```

Then open the SQL Editor (or `supabase db execute < supabase/verification/verify_schema.sql`)
and run `verify_schema.sql`. Every row should read `PASS`. Any `FAIL` row names
exactly what's missing (table/index/policy/function) so it's fixable without
re-reading the whole migration.

## Option B — Supabase SQL Editor (no CLI)

1. **Fresh project**: run, in order, `001_initial_schema.sql`,
   `002_village_data_foundation.sql`, `003_ideas_events_media.sql`,
   `004_admin_read_core_tables.sql`, `005_self_serve_ownership.sql`.
2. **Existing project that already has 001 applied**: run `002` through `005` —
   all idempotent (`IF NOT EXISTS`, `OR REPLACE`, `DROP POLICY IF EXISTS` before
   every `CREATE POLICY`), so this is safe even if some objects already exist.
3. Paste and run `verify_schema.sql`. Scroll the result — every `status` column
   should say `PASS`.
4. Run the commented-out summary query at the bottom of `verify_schema.sql` for a
   one-row pass/fail count if you don't want to scroll the full list.

## What `verify_schema.sql` checks

- All 27 expected tables exist (`information_schema.tables`)
- The 5 shared helper functions exist (`is_village_admin`, `owns_founder`,
  `owns_business`, `set_updated_at`, `handle_new_user`)
- A representative set of indexes exist, including every slug uniqueness index
- RLS is enabled on every table (`pg_class.relrowsecurity`)
- A representative set of RLS policies exist by name (one or two per table —
  covering the public-read / owner-write / admin-only shapes used throughout)
- Slug-uniqueness indexes are actually `UNIQUE`, not just present

## What it does NOT check (do these manually before launch)

- **Behavioural correctness of RLS** — that a policy *exists* doesn't mean it
  grants/denies access correctly for the right rows. Use
  `supabase/verification/rls_test_plan.md` for that — it has copy-pasteable SQL
  for each role/scenario.
- **The backfill UPDATE statements** in migration 002 (slug, profile_status,
  is_claimable, claimed_by_user_id) — run a manual spot-check after migrating an
  environment with real data:
  ```sql
  SELECT id, slug, (data->>'slug') AS json_slug FROM founders WHERE slug IS DISTINCT FROM (data->>'slug') LIMIT 20;
  ```
  An empty result means the backfill matched the JSONB for every row.
- **Storage bucket policies** (bottom of 001) — buckets must be created via the
  Dashboard/Storage API first; the SQL only adds policies to buckets that already
  exist, and will error if you run it before creating `media`/`videos`/`audio`/
  `documents`.
- **Trigger firing** — `handle_new_user` only proves it exists; confirm it
  actually fires by signing up a test user and checking a `profiles` row appears:
  ```sql
  SELECT * FROM profiles ORDER BY created_at DESC LIMIT 5;
  ```

## Known gap carried from Sprint 19B

Media (the `Media` entity — image/video/audio assets) has no Supabase table.
See the comment block at the bottom of `003_ideas_events_media.sql` for why, and
what needs deciding before it gets one.
