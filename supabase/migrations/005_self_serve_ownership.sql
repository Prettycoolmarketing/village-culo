-- CULO Village — Sprint 21A: close the self-serve founder journey
-- A founder who creates their own profile (Onboarding) must own it immediately,
-- with no claim flow. Founder.user_id (already written on every Supabase write,
-- see migration 001) already lets RLS recognise self-publish ownership — the gap
-- was that `profiles.founder_id` (the fast-path the client checks first) had no
-- way to ever get populated, since `profiles` deliberately has no client UPDATE
-- policy (closing a self-promotion-to-admin risk, see migration 002).
--
-- This adds a narrow, SECURITY DEFINER RPC that links a profile to a founder
-- *only* the caller already owns (per founders.user_id) — it can never touch
-- `role`, and can never link a founder someone else owns.

CREATE OR REPLACE FUNCTION link_own_founder(p_founder_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM founders WHERE id = p_founder_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Founder % is not owned by the current user', p_founder_id;
  END IF;

  UPDATE profiles SET founder_id = p_founder_id, updated_at = now() WHERE id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION link_own_founder(TEXT) TO authenticated;
