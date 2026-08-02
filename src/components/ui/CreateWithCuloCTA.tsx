import { WaitlistForm } from './WaitlistForm'

interface Props {
  variant?: 'banner' | 'button' | 'inline'
  label?: string
  // Tags where this waitlist signup came from — only meaningful for
  // variant="banner", which is the one with a capture form attached.
  waitlistSource?: string
}

// www.prettycoolmarketing.com/culo is a placeholder landing page — swap for
// the real Canva app link once CULO in Canva ships. Every "Create/Continue
// with CULO in Canva" button across the app points here, not into the
// dashboard, so it's one link to update later, not a dozen.
const CULO_CANVA_URL = 'https://www.prettycoolmarketing.com/culo'

export function CreateWithCuloCTA({ variant = 'button', label, waitlistSource }: Props) {
  const href = CULO_CANVA_URL

  if (variant === 'banner') {
    return (
      <div className="bg-[#2D2A26] rounded-2xl px-6 py-5 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-heading text-base font-semibold text-white leading-snug">
              {label ?? 'Turn your experience into content'}
            </p>
            <p className="font-body text-sm text-white/60 mt-0.5">
              CULO Creatives helps founders edit content into different formats, exclusively in Canva.
            </p>
          </div>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-[#C86A43] text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Create with CULO in Canva
          </a>
        </div>
        {/* Canva approval is still pending — a real waitlist to join while
            it's not yet live, instead of only a link to a placeholder page. */}
        <div className="border-t border-white/10 pt-4">
          <p className="font-body text-xs text-white/50 mb-2">Not live yet — join the waitlist to be first in:</p>
          <WaitlistForm source={waitlistSource ?? 'canva-banner'} dark />
        </div>
      </div>
    )
  }

  if (variant === 'inline') {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 font-body text-sm font-semibold text-primary hover:text-[#b05a35] transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        {label ?? 'Create with CULO in Canva'}
      </a>
    )
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-4 py-2 bg-[#2D2A26] text-white text-sm font-semibold rounded-xl hover:bg-[#1a1815] transition-colors"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
      {label ?? 'Create with CULO in Canva'}
    </a>
  )
}
