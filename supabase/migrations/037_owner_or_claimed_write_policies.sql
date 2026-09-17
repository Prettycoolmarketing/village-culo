-- A curated founder is created under the admin's own session, so
-- founders.user_id/stories.user_id/businesses.user_id is the admin's uid,
-- not the founder's. Claiming a profile (link_claimed_founder, migration
-- 032) correctly sets claimed_by_user_id to the real founder's uid — but
-- the write policies below only ever checked user_id, never
-- claimed_by_user_id, unlike owns_founder() (migration used by
-- imported_content) which already checks both. Net effect: every claimed
-- founder was permanently unable to update/delete their own founder record,
-- their own stories, or their own businesses — the write would fail RLS,
-- and the generic error message wrongly reported it as an expired session.
-- This aligns founders/stories/businesses with the same ownership check
-- imported_content already uses correctly.

drop policy if exists founders_auth_update on founders;
create policy founders_auth_update on founders
  for update
  using (auth.uid() = user_id or auth.uid() = claimed_by_user_id);

drop policy if exists founders_auth_delete on founders;
create policy founders_auth_delete on founders
  for delete
  using (auth.uid() = user_id or auth.uid() = claimed_by_user_id);

drop policy if exists stories_auth_update on stories;
create policy stories_auth_update on stories
  for update
  using (owns_founder(founder_id));

drop policy if exists stories_auth_delete on stories;
create policy stories_auth_delete on stories
  for delete
  using (owns_founder(founder_id));

drop policy if exists businesses_auth_update on businesses;
create policy businesses_auth_update on businesses
  for update
  using (owns_founder(founder_id));

drop policy if exists businesses_auth_delete on businesses;
create policy businesses_auth_delete on businesses
  for delete
  using (owns_founder(founder_id));
