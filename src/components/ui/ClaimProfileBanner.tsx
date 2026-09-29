import { Link } from 'react-router-dom'
import type { Founder } from '../../types'
import { InnerContainer } from '../layout/PageContainer'

// Shown on both a curated founder's own profile page (just above the
// evidence strip) and on their auto-published articles (same spot, just
// above the article body) — a visitor reading the story is exactly the
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
            <Link
              to={`/claim/${founder.slug}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#3E6E92] text-white text-sm font-semibold rounded-xl hover:bg-[#345c7a] transition-colors"
            >
              Is this you? Claim this profile →
            </Link>
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
