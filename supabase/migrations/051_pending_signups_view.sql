-- Culo Members only ever showed a signup once ensureJoinedFounder() had run
-- (i.e. after they clicked the email confirm link and a founders row
-- existed) — anyone who signed up but never confirmed was invisible to
-- staff entirely, with no way to even know they'd tried. profiles rows are
-- created immediately at signup (independent of confirmation), so this
-- surfaces anyone with a profile but no founder yet, tagged by whether
-- their email is actually confirmed. SECURITY DEFINER because auth.users
-- itself has no client-readable RLS policy — gated on is_village_admin()
-- internally instead, same bar as every other staff-only CAPO read.
CREATE OR REPLACE FUNCTION get_pending_signups()
RETURNS TABLE(id uuid, email text, created_at timestamptz, email_confirmed boolean)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, u.email, u.created_at, (u.email_confirmed_at IS NOT NULL) AS email_confirmed
  FROM profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE p.role = 'founder' AND p.founder_id IS NULL AND is_village_admin()
$$;

GRANT EXECUTE ON FUNCTION get_pending_signups() TO authenticated;
