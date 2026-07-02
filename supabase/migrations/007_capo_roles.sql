-- CULO Village — CAPO role management
-- Converts the "architecture only, no auth wired yet" permission roles
-- (VillageSettingsPage's static display) into real enforcement: a fifth
-- role (Owner, reserved for the platform owner), a soft-suspend flag the
-- app itself checks (no Supabase Auth-level ban — that needs a service-role
-- backend which doesn't exist yet), and a narrow RPC that lets an Owner
-- change another user's role/suspension without opening a general
-- profiles UPDATE policy (profiles intentionally has none — see migration
-- 002 — to prevent client-side self-promotion to admin).

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('founder', 'moderator', 'editor', 'admin', 'owner'));

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended BOOLEAN NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION is_owner()
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner');
$$;

-- The Team page needs to search across all staff/founders by email — profiles
-- has no such policy today (only profiles_read_own). Owner-only, additive.
DROP POLICY IF EXISTS "profiles_owner_read_all" ON profiles;
CREATE POLICY "profiles_owner_read_all" ON profiles
  FOR SELECT USING (is_owner());

-- Narrow, single-purpose RPC — same pattern as link_own_founder (migration 005):
-- it can only do exactly one thing (set role + suspended on one target row),
-- gated to Owner, and can never be used to self-promote since is_owner() is
-- checked against the CALLER's existing row, not the target's.
CREATE OR REPLACE FUNCTION admin_set_role(target_user_id UUID, new_role TEXT, new_suspended BOOLEAN)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_owner() THEN
    RAISE EXCEPTION 'Only the Owner can change roles.';
  END IF;
  IF new_role NOT IN ('founder', 'moderator', 'editor', 'admin', 'owner') THEN
    RAISE EXCEPTION 'Invalid role: %', new_role;
  END IF;
  IF target_user_id = auth.uid() AND new_suspended THEN
    RAISE EXCEPTION 'You cannot suspend yourself.';
  END IF;

  UPDATE profiles
  SET role = new_role, suspended = new_suspended, updated_at = now()
  WHERE id = target_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_set_role(UUID, TEXT, BOOLEAN) TO authenticated;
