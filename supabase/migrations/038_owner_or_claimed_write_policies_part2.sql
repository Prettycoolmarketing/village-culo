-- Same gap as migration 037, found on a second pass: library_items,
-- media_uploads, series and services all had UPDATE/DELETE policies
-- checking only user_id (whoever's session created the row — the admin,
-- for anything built during curated founder setup), never
-- claimed_by_user_id (the real founder once they claim their profile).
-- media_uploads has no UPDATE policy at all (uploads are write-once), so
-- only its DELETE needs the fix.

drop policy if exists library_auth_update on library_items;
create policy library_auth_update on library_items
  for update
  using (owns_founder(founder_id));

drop policy if exists library_auth_delete on library_items;
create policy library_auth_delete on library_items
  for delete
  using (owns_founder(founder_id));

drop policy if exists media_uploads_auth_delete on media_uploads;
create policy media_uploads_auth_delete on media_uploads
  for delete
  using (owns_founder(founder_id));

drop policy if exists series_auth_update on series;
create policy series_auth_update on series
  for update
  using (owns_founder(founder_id));

drop policy if exists series_auth_delete on series;
create policy series_auth_delete on series
  for delete
  using (owns_founder(founder_id));

drop policy if exists services_auth_update on services;
create policy services_auth_update on services
  for update
  using (owns_founder(founder_id));

drop policy if exists services_auth_delete on services;
create policy services_auth_delete on services
  for delete
  using (owns_founder(founder_id));
