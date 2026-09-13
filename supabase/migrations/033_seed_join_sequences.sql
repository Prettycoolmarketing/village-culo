-- Seed sequence A (Village joiners, /join) and sequence B (Canva Creatives
-- joiners, /joincanva) with real content. Both rows already existed with an
-- empty steps array (created by some earlier runtime path, not a
-- migration), so this is UPDATE not INSERT ... ON CONFLICT DO NOTHING —
-- that would have silently no-opped against the existing empty rows, which
-- is exactly what happened on the first attempt at this migration.
--
-- Matches sequence C's voice/format (Shakas, personal sign-off, real
-- links) and day spacing. send-sequence-emails catches up existing
-- enrollments automatically on its next daily run — anyone already
-- enrolled with 3+ or 7+ days elapsed since signup gets those steps sent
-- as soon as this seeds, not just new signups going forward.

UPDATE email_sequences SET data = jsonb_build_object(
  'name', 'Village joiners',
  'steps', jsonb_build_array(
    jsonb_build_object(
      'day', 1,
      'subject', 'Welcome to The Culo Village',
      'bodyHtml', '<p>You are in.</p><p>Here is the one thing worth doing first: import whatever you have already posted, anywhere. YouTube, a podcast, Instagram, a blog you half-forgot about.</p><p>Village Intelligence reads through it, finds the topics, questions and ideas already hiding inside your own work, and restructures each piece as its own webpage built for AI and search to actually find you.</p><p>Start here: <a href="https://www.culovillage.com/dashboard/import-content">https://www.culovillage.com/dashboard/import-content</a></p><p>Your first 10 articles are on us, no card required.</p><p>With love,<br/>Shakas</p>'
    ),
    jsonb_build_object(
      'day', 3,
      'subject', 'What actually happens to what you import',
      'bodyHtml', '<p>A few people have asked what "restructured as an article" actually means, so here it is straight.</p><p>You do not need to write anything new. The Village takes what you already said, on camera or in text, and turns it into a proper webpage: your own words, structured with headings, linked back to where you originally said it, discoverable by search and AI instead of buried in a feed that buries everything after 48 hours.</p><p>Every piece stays editable by you before it goes live. Nothing publishes without you seeing it first.</p><p>See a real example: <a href="https://www.culovillage.com/founders/shakas-designer">https://www.culovillage.com/founders/shakas-designer</a></p><p>With love,<br/>Shakas</p>'
    ),
    jsonb_build_object(
      'day', 7,
      'subject', 'Still have raw footage sitting there?',
      'bodyHtml', '<p>If you have not imported anything yet, that is normal — most people join, mean to come back to it, then get busy.</p><p>So here is the shortest path back in: <a href="https://www.culovillage.com/dashboard/import-content">https://www.culovillage.com/dashboard/import-content</a></p><p>One import is enough to see the shape of it. You do not need a full archive ready, just one thing you have already posted somewhere.</p><p>And if you also want to turn new raw footage into content instead of just republishing old posts, Culo Creatives does that part, inside Canva: <a href="https://www.culovillage.com/joincanva">https://www.culovillage.com/joincanva</a></p><p>Reply to this email if you get stuck on anything. I read every one.</p><p>With love,<br/>Shakas</p>'
    )
  )
) WHERE id = 'A';

UPDATE email_sequences SET data = jsonb_build_object(
  'name', 'Canva Creatives joiners',
  'steps', jsonb_build_array(
    jsonb_build_object(
      'day', 1,
      'subject', 'Welcome to Culo Creatives',
      'bodyHtml', '<p>You are in.</p><p>Here is the one thing worth doing first: open the app in Canva and drop a few clips into your Media Library — B-roll, a talking-head clip, a voice memo, whatever you have on your phone right now.</p><p>Answer a couple of quick questions about your business under About You, and Culo starts shaping hooks, captions and structure around your actual raw material, not a generic template.</p><p>From there, one click turns that footage into a Vlog-style reel, a Talking Head reel, a Voice Over reel, a Quick Rhythm cut, or a Carousel — subtitled, hooked and captioned, ready to post straight out of Canva.</p><p>Your 14-day trial has already started, no charge yet.</p><p>With love,<br/>Shakas</p>'
    ),
    jsonb_build_object(
      'day', 3,
      'subject', 'The formats, so you know what to reach for',
      'bodyHtml', '<p>Quick rundown of what each format is actually for, since the six options can look like a lot at first:</p><p><strong>Talking Head</strong> — you facing the camera, POV hooks and timed captions.<br/><strong>Voice Over</strong> — your voice narrating over B-roll footage.<br/><strong>Vlog Style</strong> — behind-the-scenes, the in-between moments most people never post.<br/><strong>Quick Rhythm</strong> — fast cuts through your B-roll library, paired with music.<br/><strong>Photo Reel</strong> — a slideshow built from your photos.<br/><strong>Carousel</strong> — your strongest idea turned into swipeable slides.</p><p>You do not need footage for all six to get started. One good clip in the right library is enough for your first post.</p><p>With love,<br/>Shakas</p>'
    ),
    jsonb_build_object(
      'day', 7,
      'subject', 'One week in — how is it going?',
      'bodyHtml', '<p>You are about halfway through your trial.</p><p>If you have already posted something made in Culo, genuinely — reply and tell me what you made. I read every one.</p><p>If you have not opened the app since day one, that is worth fixing before the trial runs out: <a href="https://www.culovillage.com/joincanva">https://www.culovillage.com/joincanva</a></p><p>And once you are creating regularly, remember the other half of this: everything you publish can also live inside The Culo Village, structured so search and AI find you as the authority in your field, not just another post in a feed. <a href="https://www.culovillage.com/join">https://www.culovillage.com/join</a></p><p>With love,<br/>Shakas</p>'
    )
  )
) WHERE id = 'B';
