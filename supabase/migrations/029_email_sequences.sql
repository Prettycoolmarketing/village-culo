-- Email drip sequences — a named sequence (A/B/C) is a list of {day, subject,
-- bodyHtml} steps. An enrollment ties one email address to one sequence,
-- starting the clock at enrollment time; a daily cron-invoked Edge Function
-- (send-sequence-emails) sends any step whose day has arrived and hasn't
-- been sent yet. Both tables follow the same data-jsonb pattern as
-- email_campaigns — CAPO admins manage sequences and enrollments from the
-- dashboard; enrollment itself happens server-side (service role) from
-- submit-pcm-lead / submit-waitlist, so there's no public insert policy.

CREATE TABLE IF NOT EXISTS email_sequences (
  id          TEXT        PRIMARY KEY,
  data        JSONB       NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "email_sequences_admin_all" ON email_sequences;
CREATE POLICY "email_sequences_admin_all" ON email_sequences
  FOR ALL USING (is_village_admin()) WITH CHECK (is_village_admin());

CREATE TABLE IF NOT EXISTS email_sequence_enrollments (
  id            TEXT        PRIMARY KEY,
  sequence_id   TEXT        NOT NULL,
  email         TEXT        NOT NULL,
  data          JSONB       NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS email_sequence_enrollments_sequence_idx ON email_sequence_enrollments (sequence_id);
CREATE INDEX IF NOT EXISTS email_sequence_enrollments_email_idx ON email_sequence_enrollments (email);

ALTER TABLE email_sequence_enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "email_sequence_enrollments_admin_all" ON email_sequence_enrollments;
CREATE POLICY "email_sequence_enrollments_admin_all" ON email_sequence_enrollments
  FOR ALL USING (is_village_admin()) WITH CHECK (is_village_admin());

-- Seed sequence C (Pretty Cool Marketing leads) with the two drafted steps —
-- Day 3 and Day 7. Staff can add/edit steps (including earlier days) from
-- the Sequences tab in Email Lists.
INSERT INTO email_sequences (id, data) VALUES (
  'C',
  jsonb_build_object(
    'name', 'Pretty Cool Marketing leads',
    'steps', jsonb_build_array(
      jsonb_build_object(
        'day', 3,
        'subject', 'The Pretty Cool Frame Work',
        'bodyHtml', '<p>Here is how we actually do it.</p><p>Every 4 weeks a content creator captures a fresh batch of content with you.</p><p>Your whole archive gets published and managed inside The Culo Village, so search and AI find you as the authority in your field.</p><p>A social media manager runs the posting across every platform.</p><p>That is the full loop. Captured, published, distributed, without you touching the calendar.</p><p>From $3,000 a month.</p><p>If you want to talk it through first, grab a time here: <a href="https://calendly.com/prettycoolmarketing_/30min">https://calendly.com/prettycoolmarketing_/30min</a></p><p>Or read the whole thing: <a href="https://www.culovillage.com/marketing">https://www.culovillage.com/marketing</a></p><p>With love,<br/>Shakas</p>'
      ),
      jsonb_build_object(
        'day', 7,
        'subject', 'Ready to start being seen',
        'bodyHtml', '<p>Two ways in.</p><p>Social media management with content captured for you every 4 weeks. That is the Social Media Service.</p><p>Your archive published and managed for you inside the Village. That is the Village Service.</p><p>You can start either one here: <a href="https://www.culovillage.com/marketing">https://www.culovillage.com/marketing</a></p><p>Or if you would rather build it yourself, the Village is open: <a href="https://www.culovillage.com/join">https://www.culovillage.com/join</a></p><p>Reply to this email and tell me what you are working on. I read every one.</p><p>With love,<br/>Shakas</p>'
      )
    )
  )
) ON CONFLICT (id) DO NOTHING;
