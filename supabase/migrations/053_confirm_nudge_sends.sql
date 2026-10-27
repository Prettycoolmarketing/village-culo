-- Tracks the last time a confirm-and-import nudge went to a given address —
-- lets Culo Members hide the "Resend confirm email" button for 3 days after
-- it's used, so staff on different devices/sessions don't double-send to
-- the same person right after each other. Written by send-transactional-
-- email itself (service role) right after a successful send; staff-only
-- read, same bar as everything else in this area.
CREATE TABLE IF NOT EXISTS confirm_nudge_sends (
  email   TEXT PRIMARY KEY,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE confirm_nudge_sends ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "confirm_nudge_sends_admin_read" ON confirm_nudge_sends;
CREATE POLICY "confirm_nudge_sends_admin_read" ON confirm_nudge_sends
  FOR SELECT USING (is_village_admin());
