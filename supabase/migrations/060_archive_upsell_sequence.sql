-- Sequence D — Archive Unlock upsell. Fires for a founder the moment they
-- publish their 10th imported piece (the free Archive Unlock quota) without
-- having paid for any tier yet — see the enrollment call in
-- src/services/publishStory.ts and the stop-on-purchase hook in
-- stripe-archive-unlock-webhook. {{name}}, {{remainingCount}} and
-- {{tierPrice}} are substituted per-recipient by send-sequence-emails from
-- values set at enrollment time (see enroll-email-sequence), the same
-- {{...}} convention email_nudge_templates already uses.
INSERT INTO email_sequences (id, data) VALUES (
  'D',
  jsonb_build_object(
    'name', 'Archive Unlock upsell (5-day)',
    'steps', jsonb_build_array(
      jsonb_build_object(
        'day', 0,
        'subject', 'You published your first 10 🎉',
        'bodyHtml', '<p>Hey {{name}},</p><p>You''re amazing for importing and publishing your content, your first 10 pieces are now live, individual web pages in The Culo Village.</p><p>Here''s why that actually matters: AI tools like ChatGPT and Perplexity answer questions by pulling from pages that are already indexed and built in a way they can actually read. Most personal content, an Instagram caption, a LinkedIn post, never gets indexed at all, so it''s invisible to search and to AI the moment it scrolls past.</p><p>The Village republishes your content as real, structured pages built specifically to be found by both.</p><p>This is day 1 of a 5-day series on why it''s worth unlocking the rest of your archive, {{remainingCount}} more pieces are sitting there ready to go.</p><p><a href="https://www.culovillage.com/dashboard/archive-found">Unlock your remaining {{remainingCount}} pieces &rarr;</a></p>'
      ),
      jsonb_build_object(
        'day', 1,
        'subject', 'Your links are worth sharing',
        'bodyHtml', '<p>Hey {{name}},</p><p>Quick one today: every piece you publish in the Village is a real, shareable link, your own URL, your own page.</p><p>When you share one on social media or link to it from your own website, that''s a backlink, a real signal to Google (and to AI tools reading the web) that your work is credible and connected elsewhere.</p><p>The more of your content that''s published as its own page, the more of these links you can put to work for you.</p><p><a href="https://www.culovillage.com/dashboard/content">See your published links &rarr;</a></p>'
      ),
      jsonb_build_object(
        'day', 2,
        'subject', 'What''s next after publishing',
        'bodyHtml', '<p>Hey {{name}},</p><p>Publishing in The Culo Village is step 1. We recommend publishing all your old posts so they have a new life online that''s visible with AI.</p><p>Step 2 is our editing app coming to Canva, called Culo Creatives!</p><p>Culo in Canva will let you turn your raw footage directly into social media posts with hooks relevant to your target audience and captions, for an easy, all-in-one manageable workspace.</p><p>Members who''ve already got an import history (like you) will be first in line when it''s ready.</p><p><a href="https://www.culovillage.com/dashboard/archive-found">Unlock your archive now, so it''s all ready to go &rarr;</a></p>'
      ),
      jsonb_build_object(
        'day', 3,
        'subject', 'What unlocking your archive actually costs',
        'bodyHtml', '<p>Hey {{name}},</p><p>You''ve got {{remainingCount}} more pieces imported and ready. Unlocking them is a one-off fee of {{tierPrice}}, not a subscription, pay once, publish all of it, forever.</p><p>You can boost your presence with AI and benefit your business and your authority!</p><p>That''s {{remainingCount}} more real, indexable pages working for you with zero extra content to create, it''s already sitting in your account.</p><p><a href="https://www.culovillage.com/dashboard/archive-found">Unlock your remaining {{remainingCount}} pieces for {{tierPrice}} &rarr;</a></p>'
      ),
      jsonb_build_object(
        'day', 4,
        'subject', 'Your archive''s still there',
        'bodyHtml', '<p>Hey {{name}},</p><p>Quick recap of this week: your content is genuinely more findable once it''s published as its own page, your published links double as real backlinks, and Culo Creatives is coming to make publishing part of one continuous workflow.</p><p>Your {{remainingCount}} remaining pieces aren''t going anywhere, there''s no deadline on this, it''s ready whenever you are.</p><p><a href="https://www.culovillage.com/dashboard/archive-found">Unlock your archive &rarr;</a></p>'
      )
    )
  )
) ON CONFLICT (id) DO NOTHING;
