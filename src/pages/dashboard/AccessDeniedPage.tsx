import { Link } from 'react-router-dom'

export function AccessDeniedPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-5" aria-hidden="true">
          <svg className="w-7 h-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h1 className="font-heading text-xl font-bold text-[#2D2A26] mb-2">Village HQ access required</h1>
        <p className="text-sm text-[#6B7280] leading-relaxed mb-6">
          This area is for Village HQ admins. Your founder dashboard is still available.
        </p>
        <Link
          to="/dashboard/home"
          className="inline-flex items-center px-5 py-2.5 bg-[#C86A43] text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] transition-colors"
        >
          Back to my dashboard
        </Link>
      </div>
    </div>
  )
}
