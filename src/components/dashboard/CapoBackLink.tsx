import { Link } from 'react-router-dom'

export function CapoBackLink() {
  return (
    <Link
      to="/dashboard/village"
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9CA3AF] hover:text-[#C86A43] transition-colors mb-4"
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      Back to Village Overview
    </Link>
  )
}
