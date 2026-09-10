
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
      {src ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        // No photo yet — the Culo mark stands in, so a fresh/curated
        // founder profile reads as "in the Village" rather than a bare
        // initials circle.
        <img
          src="/culo_fav.png"
          alt={alt}
          className="w-3/5 h-3/5 object-contain opacity-80"
          loading="lazy"
        />
      )}
    </div>
  )
}
