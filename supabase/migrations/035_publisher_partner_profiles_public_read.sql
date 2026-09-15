-- publisher_partner_profiles had no public read policy at all — only the
-- owning founder or a village admin could ever SELECT a row. That's the
-- founder's own "open to speaking/podcasts/etc, book a call here" profile
-- (see FounderCard.tsx's "Book a call" button, and FounderProfilePage.tsx's
-- bookingUrl), which was built to be shown to real visitors — it just
-- never actually reached an anonymous one. Confirmed live: Shakas's own
-- profile has enabled=true, a real Calendly link and openToSpeaking=true,
-- none of which any real visitor could ever see.
CREATE POLICY "ppp_public_read" ON publisher_partner_profiles
  FOR SELECT USING (enabled = true);
