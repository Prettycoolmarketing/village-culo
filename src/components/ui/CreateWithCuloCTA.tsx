import { useAuth } from '../../contexts/AuthContext'
import { getCurrentFounder } from '../../services/currentFounder'

interface Props {
  variant?: 'banner' | 'button' | 'inline'
  label?: string
}

// Every "Create/Continue with CULO in Canva" button across the app points
// here — one link to update, not a dozen. A visitor who isn't signed in
// yet gets sent to /joincanva (tagged source=canva, the $25/mo,
// 14-day-trial tier — see joinFlow.ts); a founder who's already a member
// doesn't need to join again, so they go straight to their own Content
// tab instead. Swap CULO_CANVA_URL for the real Canva app deep link once
// CULO in Canva ships, so this becomes "open the app" instead of "join
// and pay first" for founders who already have billing set up.
const CULO_CANVA_URL = 'https://www.culovillage.com/joincanva'
const MEMBER_CONTENT_URL = '/dashboard/profile?tab=content'

export function CreateWithCuloCTA({ variant = 'button', label }: Props) {
  const { user } = useAuth()
  const founder = getCurrentFounder(user)
  const isMember = !!founder
  const href = isMember ? MEMBER_CONTENT_URL : CULO_CANVA_URL
  // External join funnel opens in a new tab (don't lose the page a visitor
  // was reading); an existing member's own dashboard navigates in place.
  const linkProps = isMember ? {} : { target: '_blank', rel: 'noopener noreferrer' }

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
            {...linkProps}
            className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-[#C86A43] text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Create with CULO in Canva
          </a>
        </div>
      </div>
    )
  }

  if (variant === 'inline') {
    return (
      <a
        href={href}
        {...linkProps}
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
      {...linkProps}
      className="inline-flex items-center gap-2 px-4 py-2 bg-[#2D2A26] text-white text-sm font-semibold rounded-xl hover:bg-[#1a1815] transition-colors"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
      {label ?? 'Create with CULO in Canva'}
    </a>
  )
}
