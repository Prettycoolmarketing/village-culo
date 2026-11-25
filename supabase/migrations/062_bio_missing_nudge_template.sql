-- Template for send-nudges' new condition 6 (RESEARCH SUCCEEDED, NO BIO) —
-- see supabase/functions/send-nudges/index.ts. Same data-jsonb pattern as
-- every other row in 046_email_nudge_templates.sql.

INSERT INTO email_nudge_templates (id, data) VALUES
  ('bioMissingNudgeSentAt', jsonb_build_object(
    'id', 'bioMissingNudgeSentAt',
    'title', 'Research succeeded, no bio',
    'subject', 'Your research is done — one click left to write your bio',
    'bodyHtml', '<p>Hey {{name}},</p><p>We already found and verified your sources, but your bio hasn''t been written yet — that last step needs you to press one button.</p><p><a href="https://www.culovillage.com/dashboard/profile">Go write it from research →</a></p><p>Having trouble? Just reply to this email.</p><p>With love,<br/>Shakas</p>'
  ))
ON CONFLICT (id) DO NOTHING;
