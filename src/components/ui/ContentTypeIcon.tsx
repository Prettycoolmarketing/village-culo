import type { ContentType } from '../../types'

interface ContentTypeIconProps {
  type: ContentType
  className?: string
}

/* Tall phone-proportioned SVG icons (20×32 viewBox) — one per content type.
   Reel:     phone + play arrow      → video/Instagram format
   Blog:     phone + text lines      → long-form reading
   Carousel: stacked portrait pages  → multi-slide format            */

function ReelIcon() {
  return (
    <svg viewBox="0 0 20 32" fill="none" aria-hidden="true" className="w-full h-full">
      <rect x="1.5" y="1.5" width="17" height="29" rx="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8.5 12.5l6 3.5-6 3.5v-7z" fill="currentColor" />
    </svg>
  )
}

function BlogIcon() {
  return (
    <svg viewBox="0 0 20 32" fill="none" aria-hidden="true" className="w-full h-full">
      <rect x="1.5" y="1.5" width="17" height="29" rx="3.5" stroke="currentColor" strokeWidth="1.5" />
      <line x1="5" y1="11" x2="15" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="5" y1="15.5" x2="15" y2="15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="5" y1="20" x2="11" y2="20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function CarouselIcon() {
  return (
    <svg viewBox="0 0 20 32" fill="none" aria-hidden="true" className="w-full h-full">
      <rect x="4" y="4" width="15" height="25" rx="3" stroke="currentColor" strokeWidth="1.5" opacity="0.35" />
      <rect x="1.5" y="6.5" width="15" height="25" rx="3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

const icons: Record<ContentType, () => JSX.Element> = {
  reel:     ReelIcon,
  blog:     BlogIcon,
  carousel: CarouselIcon,
}

const labels: Record<ContentType, string> = {
  reel:     'Reel',
  blog:     'Blog',
  carousel: 'Carousel',
}

export function ContentTypeIcon({ type, className = '' }: ContentTypeIconProps) {
  const Icon = icons[type] ?? ReelIcon

  return (
    <span
      className={`inline-flex items-center justify-center w-[14px] h-[22px] ${className}`}
      title={labels[type]}
      aria-label={labels[type]}
    >
      <Icon />
    </span>
  )
}
