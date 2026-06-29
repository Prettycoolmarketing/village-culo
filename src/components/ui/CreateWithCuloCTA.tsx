import { Link } from 'react-router-dom'

interface Props {
  variant?: 'banner' | 'button' | 'inline'
  label?: string
}

const CANVA_PUBLISH_PATH = '/dashboard/publish'

export function CreateWithCuloCTA({ variant = 'button', label }: Props) {
  if (variant === 'banner') {
    return (
      <div className="bg-[#2D2A26] rounded-2xl px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="font-heading text-base font-semibold text-white leading-snug">
            {label ?? 'Turn your experience into content'}
          </p>
          <p className="font-body text-sm text-white/60 mt-0.5">
            Create with CULO in Canva and publish to the Village.
          </p>
        </div>
        <Link
          to={CANVA_PUBLISH_PATH}
          className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-[#C86A43] text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Create with CULO
        </Link>
      </div>
    )
  }

  if (variant === 'inline') {
    return (
      <Link
        to={CANVA_PUBLISH_PATH}
        className="inline-flex items-center gap-1.5 font-body text-sm font-semibold text-primary hover:text-[#b05a35] transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        {label ?? 'Create with CULO in Canva'}
      </Link>
    )
  }

  return (
    <Link
      to={CANVA_PUBLISH_PATH}
      className="inline-flex items-center gap-2 px-4 py-2 bg-[#2D2A26] text-white text-sm font-semibold rounded-xl hover:bg-[#1a1815] transition-colors"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
      {label ?? 'Create with CULO in Canva'}
    </Link>
  )
}
