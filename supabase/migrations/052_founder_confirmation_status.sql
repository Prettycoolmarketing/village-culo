-- get_pending_signups() only ever covers someone with NO founder record yet
-- — once a founder row exists for them (whether created by the normal
-- confirm-click flow, or backfilled by staff directly, as happened for two
-- real accounts), Culo Members showed them as a plain confirmed member even
-- when auth.users.email_confirmed_at was still null. Confirmed real: two
-- backfilled accounts read as "Needs setup" with no indication they'd never
-- actually verified their email. This covers every founder-role profile,
-- not just the ones still missing a founder row, so the Unconfirmed tag and
-- resend action are accurate regardless of how the founder record got there.
CREATE OR REPLACE FUNCTION get_founder_confirmation_status()
RETURNS TABLE(founder_id uuid, email_confirmed boolean)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT p.founder_id, (u.email_confirmed_at IS NOT NULL) AS email_confirmed
  FROM profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE p.role = 'founder' AND p.founder_id IS NOT NULL AND is_village_admin()
$$;

GRANT EXECUTE ON FUNCTION get_founder_confirmation_status() TO authenticated;
