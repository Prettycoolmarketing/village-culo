
interface AvatarProps {
  src?: string
  alt: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-20 h-20 text-xl',
}

export function Avatar({ src, alt, size = 'md', className = '' }: AvatarProps) {
  // A founder with no real photo yet used to show the Culo brand mark in
  // its place — read as a logo placeholder sitting on a real person's
  // profile rather than "no photo yet." A claimed founder's own avatar
  // field can also still literally be the broken '/placeholders/...' SVG
  // path from before they ever touched Profile Photo (that file doesn't
  // exist on disk) — treated the same as no src at all, not rendered raw.
  const hasRealSrc = !!src && !src.includes('/placeholders/')
  return (
    <div
      className={`
        relative flex-shrink-0 rounded-full overflow-hidden
        bg-primary/10 text-primary font-medium
        flex items-center justify-center
        ${sizeClasses[size]}
        ${className}
      `}
      aria-hidden="true"
    >
      {hasRealSrc ? (
        <img
          src={src}
          alt={alt}
          // object-top, not center — a headshot/logo with generous space
          // below the subject was getting its top (the actual subject)
          // cropped off by the default centered crop in this round frame.
          className="w-full h-full object-cover object-top"
          loading="lazy"
        />
      ) : (
        // No photo yet — a plain neutral silhouette, not a brand mark, so
        // this reads as "nothing uploaded" rather than a logo standing in
        // for the person.
        <svg className="w-3/5 h-3/5 opacity-40" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-4.42 0-8 2.24-8 5v1a1 1 0 001 1h14a1 1 0 001-1v-1c0-2.76-3.58-5-8-5z" />
        </svg>
      )}
    </div>
  )
}
