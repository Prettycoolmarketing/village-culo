-- staff_invites: lets an Owner grant a CAPO role to an email address before
-- that person has ever signed up. handle_new_user() (redefined below) checks
-- this table on every new signup and applies the pending role immediately,
-- instead of the previous flow where an Owner had to wait for the person to
-- sign up first, then search for them by email in the Team page.

CREATE TABLE IF NOT EXISTS staff_invites (
  email      TEXT PRIMARY KEY,
  role       TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'moderator')),
  invited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE staff_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_invites_owner_all" ON staff_invites;
CREATE POLICY "staff_invites_owner_all" ON staff_invites
  FOR ALL USING (is_owner()) WITH CHECK (is_owner());

-- Re-point handle_new_user() to consume a matching invite (by email, case-
-- insensitive) instead of always defaulting to 'founder'.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  invited_role TEXT;
BEGIN
  SELECT role INTO invited_role FROM staff_invites WHERE lower(email) = lower(NEW.email);

  INSERT INTO profiles (id, email, role)
  VALUES (NEW.id, NEW.email, COALESCE(invited_role, 'founder'))
  ON CONFLICT (id) DO NOTHING;

  IF invited_role IS NOT NULL THEN
    DELETE FROM staff_invites WHERE lower(email) = lower(NEW.email);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Owner-only RPC to create/replace a pending invite for an email.
CREATE OR REPLACE FUNCTION admin_invite_staff(target_email TEXT, new_role TEXT)
RETURNS void AS $$
BEGIN
  IF NOT is_owner() THEN
    RAISE EXCEPTION 'Only the Owner can invite staff.';
  END IF;
  IF new_role NOT IN ('admin', 'editor', 'moderator') THEN
    RAISE EXCEPTION 'Invalid role: %', new_role;
  END IF;

  INSERT INTO staff_invites (email, role, invited_by)
  VALUES (lower(target_email), new_role, auth.uid())
  ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role, invited_by = EXCLUDED.invited_by, created_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION admin_invite_staff(TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION admin_cancel_staff_invite(target_email TEXT)
RETURNS void AS $$
BEGIN
  IF NOT is_owner() THEN
    RAISE EXCEPTION 'Only the Owner can cancel invites.';
  END IF;
  DELETE FROM staff_invites WHERE lower(email) = lower(target_email);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION admin_cancel_staff_invite(TEXT) TO authenticated;
