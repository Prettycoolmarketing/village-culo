import React from 'react'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  id?: string
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
  size = 'md',
  id,
}: SearchInputProps) {
  const sizeClasses = {
    sm: 'h-9 text-sm px-9',
    md: 'h-11 text-base px-11',
    lg: 'h-14 text-lg px-12',
  }

  const iconSize = {
    sm: 'w-4 h-4 left-2.5',
    md: 'w-5 h-5 left-3',
    lg: 'w-6 h-6 left-3.5',
  }

  return (
    <div className={`relative ${className}`}>
      <label htmlFor={id} className="sr-only">{placeholder}</label>
      <svg
        className={`absolute top-1/2 -translate-y-1/2 ${iconSize[size]} text-muted pointer-events-none`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        id={id}
        type="search"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`
          w-full rounded-2xl border border-border bg-surface text-charcoal
          placeholder:text-muted
          focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
          transition-shadow duration-150
          ${sizeClasses[size]}
        `}
      />
    </div>
  )
}
