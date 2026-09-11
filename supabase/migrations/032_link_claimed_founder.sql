-- Finishes the claim -> real account transfer that was only ever half wired.
-- getCurrentFounder() could already RESOLVE ownership for a claimant who
-- signs in with the email they claimed with (Founder.claimEmail === user.email),
-- but nothing ever converged that onto real, permanent ownership — it just
-- relied on that string match forever, on every single page load, and
-- profiles.founder_id (the fast path everything else uses) never got set for
-- this case. link_own_founder() can't be reused as-is: it only checks
-- founders.user_id = auth.uid(), which is the self-publish path, not this one.
--
-- claimEmail only lives inside founders.data (jsonb) today, not as a first-
-- class column, so this reads it from there.

CREATE OR REPLACE FUNCTION link_claimed_founder(p_founder_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT := auth.email();
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM founders
    WHERE id = p_founder_id
      AND (
        claimed_by_user_id = auth.uid()
        OR (claimed_by_user_id IS NULL AND v_email IS NOT NULL AND lower(data->>'claimEmail') = lower(v_email))
      )
  ) THEN
    RAISE EXCEPTION 'Founder % was not claimed by the current user', p_founder_id;
  END IF;

  UPDATE founders
  SET claimed_by_user_id = auth.uid(),
      data = jsonb_set(data, '{claimedByUserId}', to_jsonb(auth.uid()::text))
  WHERE id = p_founder_id;

  UPDATE profiles SET founder_id = p_founder_id, updated_at = now() WHERE id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION link_claimed_founder(TEXT) TO authenticated;
