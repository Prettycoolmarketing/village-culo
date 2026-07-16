import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { getCurrentFounder } from '../../services/currentFounder'

interface Props {
  variant?: 'banner' | 'button' | 'inline'
  label?: string
}

const DASHBOARD_PUBLISH_PATH = '/dashboard/publish'
const ONBOARDING_PATH = '/onboarding'

/**
 * Destination logic — never sends an anonymous visitor into a route gated by
 * ProtectedRoute (it would just redirect to /dashboard/login with no context):
 *   signed out             → /onboarding (the one entry point that's public)
 *   signed in, no founder  → /onboarding (resume/finish creating their profile)
 *   signed in, has founder → /dashboard/publish
 */
function useCreateWithCuloHref(): string {
  const { user } = useAuth()
  if (!user) return ONBOARDING_PATH
  const founder = getCurrentFounder(user)
  return founder ? DASHBOARD_PUBLISH_PATH : ONBOARDING_PATH
}

export function CreateWithCuloCTA({ variant = 'button', label }: Props) {
  const href = useCreateWithCuloHref()

  if (variant === 'banner') {
    return (
      <div className="bg-[#2D2A26] rounded-2xl px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="font-heading text-base font-semibold text-white leading-snug">
            {label ?? 'Turn your experience into content'}
          </p>
          <p className="font-body text-sm text-white/60 mt-0.5">
            Exclusively in CULO in Canva — publish directly to the Village to be discovered.
          </p>
        </div>
        <Link
          to={href}
          className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-[#C86A43] text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Create with CULO
        </Link>
      </div>
    )
  }

  if (variant === 'inline') {
    return (
      <Link
        to={href}
        className="inline-flex items-center gap-1.5 font-body text-sm font-semibold text-primary hover:text-[#b05a35] transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        {label ?? 'Create with CULO in Canva'}
      </Link>
    )
  }

  return (
    <Link
      to={href}
      className="inline-flex items-center gap-2 px-4 py-2 bg-[#2D2A26] text-white text-sm font-semibold rounded-xl hover:bg-[#1a1815] transition-colors"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
      {label ?? 'Create with CULO in Canva'}
    </Link>
  )
}
