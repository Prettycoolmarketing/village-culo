-- Nudge email content used to live hardcoded inside send-nudges/index.ts —
-- moved to its own table, same data-jsonb pattern email_sequences (029)
-- already uses, so staff can edit subject/body from the dashboard the same
-- way a sequence step is edited, instead of needing a code deploy to
-- change a single sentence. {{name}} and {{bioBlock}} are the only
-- supported placeholders — send-nudges substitutes them before sending.

CREATE TABLE IF NOT EXISTS email_nudge_templates (
  id          TEXT        PRIMARY KEY,
  data        JSONB       NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE email_nudge_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "email_nudge_templates_admin_all" ON email_nudge_templates;
CREATE POLICY "email_nudge_templates_admin_all" ON email_nudge_templates
  FOR ALL USING (is_village_admin()) WITH CHECK (is_village_admin());

-- pullVisibleRows (the client cache sync every other data-jsonb table uses)
-- only selects the data column and requires `id` to live inside it too —
-- same reason email_sequences' own data blob repeats its id.
INSERT INTO email_nudge_templates (id, data) VALUES
  ('needsSetupNudgeSentAt', jsonb_build_object(
    'id', 'needsSetupNudgeSentAt',
    'title', 'Needs setup',
    'subject', 'One thing left to finish setting up',
    'bodyHtml', '<p>Hey {{name}},</p><p>You''re almost there — we just need one link (a video, a podcast, an Instagram post, anywhere your content already lives) and we''ll write your first real bio and article from it. Takes two minutes.</p><p><a href="https://www.culovillage.com/join/setup">Finish setting up →</a></p><p>With love,<br/>Shakas</p>'
  )),
  ('readyNudgeSentAt', jsonb_build_object(
    'id', 'readyNudgeSentAt',
    'title', 'Ready to confirm',
    'subject', 'Your profile is ready and waiting',
    'bodyHtml', '<p>Hey {{name}},</p><p>The link you gave us when you signed up has already been researched — your bio is written and your first article is drafted, both waiting for you.</p>{{bioBlock}}<p>Here''s what to do next: have a read, fix anything that''s not quite right, then import the rest of what you''ve already posted — every post you''ve ever created gets turned into its own web article, so it stops disappearing into the feed.</p><p><a href="https://www.culovillage.com/dashboard/import-content">Import your content →</a></p><p>If you''re actually here for Culo Creatives in Canva, that''s okay too — just reply to this email, I read every single one.</p><p>With love,<br/>Shakas</p>'
  )),
  ('importNudgeSentAt', jsonb_build_object(
    'id', 'importNudgeSentAt',
    'title', 'Imported nothing',
    'subject', 'Your old posts are still sitting there, disappearing',
    'bodyHtml', '<p>Hey {{name}},</p><p>Your profile''s live, but none of your old content has been brought in yet. This is the part that actually matters most — your previous posts, turned into individual web articles that stay findable long after the feed moves on.</p><p><a href="https://www.culovillage.com/dashboard/import-content">Import your content →</a></p><p>With love,<br/>Shakas</p>'
  )),
  ('publishNudgeSentAt', jsonb_build_object(
    'id', 'publishNudgeSentAt',
    'title', 'Ready to publish, untouched',
    'subject', 'You''ve got articles ready to go live',
    'bodyHtml', '<p>Hey {{name}},</p><p>You''ve got pieces sitting ready to publish and nobody''s seeing them yet. Takes one click each to go live.</p><p><a href="https://www.culovillage.com/dashboard/profile?tab=content&contentSubTab=ready">Review and publish →</a></p><p>Having trouble? Just reply to this email.</p><p>With love,<br/>Shakas</p>'
  ))
ON CONFLICT (id) DO NOTHING;
