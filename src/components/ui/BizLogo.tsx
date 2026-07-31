import { useState } from 'react'

interface BizLogoProps {
  logo?: string
  name: string
  className?: string
}

// A business with no logo uploaded yet (empty string) or a logo URL that's
// gone dead (deleted from storage, upload never actually finished) used to
// render as a plain broken-image icon everywhere this ran — Founder page
// business pills, BusinessCard, the Business profile hero. Same fallback
// pattern as Avatar: fall back to an initial instead of a broken image.
export function BizLogo({ logo, name, className = '' }: BizLogoProps) {
  const [failed, setFailed] = useState(false)

  if (!logo || failed) {
    return (
      <span className={`flex items-center justify-center h-full w-full font-heading font-semibold text-muted ${className}`} aria-hidden="true">
        {name[0]?.toUpperCase() ?? '?'}
      </span>
    )
  }

  return (
    <img
      src={logo}
      alt={`${name} logo`}
      className={`w-full h-full object-contain ${className}`}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  )
}
