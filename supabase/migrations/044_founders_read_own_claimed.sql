-- founders_auth_read_own (migration 001) only ever checked auth.uid() =
-- user_id, never claimed_by_user_id — migration 037 fixed this same gap for
-- UPDATE/DELETE but missed SELECT. Net effect: a founder who claims a
-- profile while it's still status = 'draft' (not yet published) can't read
-- their own founder row at all once signed in — founders_public_read only
-- covers published/featured, and claimed_by_user_id = auth.uid() matched
-- nothing here. Their dashboard would resolve to no founder at all despite
-- a successful claim. Aligns with owns_founder() (migration 002), which
-- already checks both columns correctly for every other table.

drop policy if exists founders_auth_read_own on founders;
create policy founders_auth_read_own on founders
  for select
  using (auth.uid() = user_id or auth.uid() = claimed_by_user_id);
