# RLS test plan

Manual test plan for the RLS policies added in migrations 002/003. Run these in
the Supabase SQL Editor against a database that has the migrations applied and
**some seed data** (a few founders/businesses/stories in mixed statuses, at least
one `profiles` row per role you're testing). Not yet executed against a live
project from this environment — see `MIGRATION_CHECKLIST.md`.

## How to impersonate a role in the SQL Editor

```sql
-- Anonymous visitor
set role anon;
-- run queries, then:
reset role;

-- A specific authenticated user (founder, admin, etc.)
set role authenticated;
select set_config('request.jwt.claim.sub', '<user-uuid-here>', true);
-- run queries, then:
reset role;
```

Get real UUIDs to test with:
```sql
select id, email, role, founder_id from profiles order by created_at;
select id, name, slug, status, user_id, claimed_by_user_id from founders order by created_at;
```

Before testing, set up at minimum:
- One `founders` row with `status = 'published'` (public) and one with `status = 'draft'` (private), owned by user A.
- One `imported_content` row owned by user A, `status = 'draft'`.
- One `founder_claim_requests` row.
- One `profiles` row with `role = 'admin'` (you'll need to set this directly — there's no UI yet, see migration 002's note that role changes are admin/service-role-only: `update profiles set role = 'admin' where id = '<uuid>';`).

---

## 1. Anonymous visitor (`set role anon`)

| # | Check | Query | Expected |
|---|---|---|---|
| 1.1 | Read published founder | `select * from founders where status = 'published';` | Rows returned |
| 1.2 | Cannot read draft founder | `select * from founders where status = 'draft';` | 0 rows |
| 1.3 | Read published business | `select * from businesses where status = 'published';` | Rows returned |
| 1.4 | Read published story | `select * from stories where status = 'published';` | Rows returned |
| 1.5 | Read public+published imported content | `select * from imported_content where visibility = 'public' and status = 'published';` | Rows if any exist |
| 1.6 | Cannot read private imported content | `select * from imported_content where visibility = 'private';` | 0 rows |
| 1.7 | Cannot write anything | `insert into founders (id, status, data) values ('test', 'draft', '{}');` | **Error** (RLS violation) |
| 1.8 | Cannot read founder_claim_requests | `select * from founder_claim_requests;` | 0 rows (no anon SELECT policy at all) |
| 1.9 | **Can** insert a claim request | `insert into founder_claim_requests (id, founder_id, requester_name, requester_email, status, data) values ('test-claim', '<a-published-founder-id>', 'Test', 'test@example.com', 'pending', '{}');` | Succeeds (claims are filed anonymously) |
| 1.10 | **Can** insert a tracking record | `insert into tracking_records (id, founder_id, business_id, link_type, redirect_url) values ('test-track', '<id>', '<id>', 'normal', 'https://example.com');` | Succeeds |
| 1.11 | Cannot read tracking_records | `select * from tracking_records;` | 0 rows |
| 1.12 | Can read village_settings | `select * from village_settings;` | Row returned (public, singleton) |
| 1.13 | Cannot write village_settings | `insert into village_settings (id, data) values ('default', '{}');` | **Error** |
| 1.14 | Can read trust_profiles | `select * from trust_profiles;` | Rows returned (fully public) |
| 1.15 | Cannot read import_batches | `select * from import_batches;` | 0 rows (admin-only) |

## 2. Founder, unclaimed-by-them content (`set role authenticated` as user A, who owns nothing yet)

| # | Check | Expected |
|---|---|---|
| 2.1 | Read own draft founder row (`user_id = A`) | Returned |
| 2.2 | Read another user's draft founder row | Not returned (only their published rows are, via the public policy) |
| 2.3 | Update own founder row | Succeeds |
| 2.4 | Update another user's founder row | **Error** |
| 2.5 | Insert imported_content with `founder_id` they own | Succeeds (`owns_founder()` matches `user_id`) |
| 2.6 | Insert imported_content with someone else's `founder_id` | **Error** |
| 2.7 | Read founder_claim_requests | 0 rows (founders can't see the admin queue) |
| 2.8 | Approve/update a claim request | **Error** — no UPDATE policy grants this to a non-admin |
| 2.9 | Read village_content_intelligence rows | All rows (public read) |
| 2.10 | Insert village_content_intelligence for own founder_id | Succeeds |
| 2.11 | Insert village_content_intelligence for someone else's founder_id | **Error** |

## 3. Claimed founder (user B, where `founders.claimed_by_user_id = B` on a profile NOT also `user_id = B`)

This is the scenario Sprint 19A's `getCurrentFounder()` resolver depends on —
ownership via `claimed_by_user_id`, not just `user_id`.

| # | Check | Expected |
|---|---|---|
| 3.1 | Read the claimed founder row | Returned (`owns_founder()` checks both `user_id` and `claimed_by_user_id`) |
| 3.2 | Update the claimed founder row | Succeeds |
| 3.3 | Insert imported_content for the claimed founder_id | Succeeds |
| 3.4 | Insert publisher_partner_profiles for the claimed founder_id | Succeeds (`ppp_owner_write` uses `owns_founder()`) |

## 4. Admin (`profiles.role = 'admin'`)

| # | Check | Expected |
|---|---|---|
| 4.1 | Read all founders regardless of status | All rows (`is_village_admin()` bypasses public/owner scoping where used — confirm via `founders` table: note founders currently has no explicit admin-read policy beyond public+own, see gap below) |
| 4.2 | Read all founder_claim_requests | All rows |
| 4.3 | Update a claim request (approve/reject) | Succeeds |
| 4.4 | Read import_batches | All rows |
| 4.5 | Insert import_batches | Succeeds |
| 4.6 | Update village_settings | Succeeds |
| 4.7 | Read imported_content for any founder | All rows (`imported_content_owner_read` includes `is_village_admin()`) |
| 4.8 | Write village_content_intelligence for any founder | Succeeds |
| 4.9 | Export emails (i.e. read founder_claim_requests + founders broadly) | Succeeds — this is enforced at the **route level** (`RoleProtectedRoute`) and the claims table RLS; founders/businesses themselves don't carry email addresses in real columns (email lives in `founder_claim_requests.requester_email` and inside the `data` JSONB), so "export emails" is really "admin can read founder_claim_requests + founders," both confirmed above. |

**Gap found while writing this plan, fixed in migration 004**: `founders`/`businesses`/`stories`/`library_items`/`services` tables only had `public_read` (status-based) and `auth_read_own` (`user_id`-based) SELECT policies — no `is_village_admin()` SELECT policy on any of them. An admin could only see published content plus whatever they personally owned via RLS, **not** other founders' draft/unpublished profiles — meaning Village HQ's local cache (populated by sync.ts, which relies entirely on RLS) would silently under-represent unpublished/draft content for admins, showing as "fewer founders than expected" rather than an error. `004_admin_read_core_tables.sql` adds `*_admin_read` policies (`USING (is_village_admin())`) to all five tables. Re-run §4.1 after applying 004 to confirm.

## 5. Editor / Moderator (`profiles.role = 'editor'` / `'moderator'`)

`is_village_admin()` currently treats `admin`, `editor`, and `moderator` as
equivalent for every RLS check in this schema — there is no policy anywhere that
distinguishes them. This matches route-level access (`RoleProtectedRoute allow={['admin','editor','moderator']}`
in `App.tsx` gates the same Village HQ routes to all three identically) — so
**RLS and route permissions are consistent with each other today**, but neither
actually differentiates editor/moderator capability from admin's. That's a known,
intentional simplification carried from Sprint 19A ("route-level gating only, by
design") — re-stated here because this sprint's brief specifically asked for a
mismatch check, and this is the mismatch: **the product's stated role model
(`VILLAGE_ROLE_CONFIGS` in `villageSettings.ts`, which gives editor/moderator
narrower permissions than admin — e.g. `canExport: false` for moderator) is not
enforced anywhere, neither in routes nor in RLS.** Both layers are equally
permissive for all three roles. This is real remaining work, not a bug introduced
by this sprint — flagging it because the test plan surfaces it concretely.

## 6. Cross-cutting checks

| # | Check | Expected |
|---|---|---|
| 6.1 | A founder cannot set their own `profiles.role` | `update profiles set role = 'admin' where id = auth.uid();` as a founder → **Error** (no UPDATE policy exists on `profiles` at all) |
| 6.2 | A founder cannot read another founder's `profiles` row | `select * from profiles where id != auth.uid();` → 0 rows |
| 6.3 | Recommendations: founder reads own | Returned |
| 6.4 | Recommendations: founder reads someone else's private rec | 0 rows |
| 6.5 | Recommendations: business owner reads recs naming their business | Returned (`owns_business(business_id)` in `recommendations_founder_read`) |
| 6.6 | Trust profiles are publicly readable | `set role anon; select * from trust_profiles;` → rows returned |

---

## Summary of gaps found while writing this plan (not fixed here — flagging for a follow-up)

1. **No admin SELECT policy on founders/businesses/stories/library_items/services** — admins can only see published content + their own via RLS today; Village HQ's local cache may under-represent other founders' unpublished content. See §4.1.
2. **Editor/moderator are not actually narrower than admin anywhere** (routes or RLS) despite `VILLAGE_ROLE_CONFIGS` modeling them as such. See §5.
