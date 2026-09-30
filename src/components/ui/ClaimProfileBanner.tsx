import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Founder } from '../../types'
import { InnerContainer } from '../layout/PageContainer'

// This page (and especially a curated founder's auto-published articles)
// is seen by plenty of people who aren't the founder — the claim button
// used to assume they were and send everyone straight to the claim form.
// Clicking now asks first: yes routes to claim the existing profile, no
// routes to start a brand-new one instead of landing on someone else's
// claim form. Shared by both the hero CTA (FounderProfilePage) and
// ClaimProfileBanner's own button below, so the ask-first behaviour can't
// drift between the two.
export function AreYouThisFounderCTA({ founder, initialLabel, initialClassName }: {
  founder: Founder
  initialLabel: string
  initialClassName: string
}) {
  const [asked, setAsked] = useState(false)

  if (!asked) {
    return (
      <button onClick={() => setAsked(true)} className={initialClassName}>
        {initialLabel}
      </button>
    )
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 max-w-md">
      <p className="font-body text-sm font-semibold text-charcoal mb-3">
        Are you {founder.name}?
      </p>
      <div className="flex flex-wrap gap-3">
        <Link
          to={`/claim/${founder.slug}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] transition-colors"
        >
          Yes, claim my free profile
        </Link>
        <Link
          to="/onboarding"
          className="inline-flex items-center gap-2 px-5 py-2.5 border border-border text-charcoal text-sm font-semibold rounded-xl hover:border-primary hover:text-primary transition-colors"
        >
          No, publish my story free
        </Link>
      </div>
    </div>
  )
}

// Shown on both a curated founder's own profile page (just above the
// evidence strip) and on their auto-published articles (same spot, right
// above the site footer) — a visitor reading the story is exactly the
// person likely to recognise themselves and want to claim it, so the CTA
// shouldn't only live on the profile page.
export function ClaimProfileBanner({ founder }: { founder: Founder }) {
  if (founder.profileStatus !== 'village-curated' || founder.userId) return null
  return (
    <div className="bg-[#3E6E92]/10 border-y border-[#3E6E92]/20" role="note" aria-label="Curated profile notice">
      <InnerContainer>
        <div className="py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-2.5">
            <svg className="w-4 h-4 text-[#3E6E92] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <p className="font-body text-sm text-[#2D4E66] leading-relaxed">
              This profile has been curated by CULO Village using publicly available content and original source links.{' '}
              <span className="text-[#3E6E92]">
                If this is your profile and you would like changes, you can claim it or request removal.
              </span>
            </p>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-2.5 flex-shrink-0">
            <AreYouThisFounderCTA
              founder={founder}
              initialLabel="Is this you? Claim this profile →"
              initialClassName="inline-flex items-center gap-2 px-6 py-3 bg-[#3E6E92] text-white text-sm font-semibold rounded-xl hover:bg-[#345c7a] transition-colors"
            />
            {/* The banner text above already promises "claim it or request
                removal" — this is that actual link, not just a claim to
                have one. Pre-fills the message so CAPO gets the founder's
                name and slug without the person having to explain it. */}
            <Link
              to={`/culocontact?source=profile-removal-request&message=${encodeURIComponent(
                `Please remove my curated profile from The Culo Village.\n\nName: ${founder.name}\nProfile: ${typeof window !== 'undefined' ? window.location.origin : ''}/founders/${founder.slug}`,
              )}`}
              className="text-[11px] text-[#3E6E92] hover:underline"
            >
              Not you, or don't want to be listed? Request removal
            </Link>
          </div>
        </div>
      </InnerContainer>
    </div>
  )
}

// The black-box pitch — embedded INLINE within the same content column as
// the founder's own content (the article body on a story page, the "From
// Around the Web" cards on the founder page), inside a light-blue card
// sized to match that content, not as its own full-page-width section.
// ClaimProfileBanner (above) is the separate, plain banner further down
// the page near the footer.
export function ClaimPitchBox({ founder }: { founder: Founder }) {
  if (founder.profileStatus !== 'village-curated' || founder.userId) return null
  return (
    <div className="bg-charcoal rounded-2xl px-6 py-10 sm:px-10 sm:py-14 text-center">
      <p className="font-body text-xs font-semibold text-primary uppercase tracking-widest mb-4">
        Is this your profile?
      </p>
      <h2 className="font-heading text-2xl sm:text-3xl font-bold text-white mb-5 leading-tight max-w-xl mx-auto">
        Publish your previously posted content across platforms as individual web articles for AI discovery
        instantly, thanks to CULO.
      </h2>
      <p className="font-body text-base text-white/70 leading-relaxed mb-8 max-w-xl mx-auto">
        Your first 10 articles are on us! Optional upgrade to edit your raw footage with Culo Creatives in Canva!
      </p>
      <div className="flex justify-center">
        <AreYouThisFounderCTA
          founder={founder}
          initialLabel="Claim your profile to publish instantly"
          initialClassName="inline-flex items-center justify-center px-7 py-3.5 bg-primary text-white text-base font-semibold rounded-xl hover:bg-[#b05a35] transition-colors"
        />
      </div>
    </div>
  )
}
