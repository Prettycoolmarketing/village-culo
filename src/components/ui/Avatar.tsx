import React from 'react'

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
  const initials = alt
    .split(' ')
    .slice(0, 2)
    .map(word => word[0])
    .join('')
    .toUpperCase()

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
        <span className="font-heading select-none">{initials}</span>
      )}
    </div>
  )
}
