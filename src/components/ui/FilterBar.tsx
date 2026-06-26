import React from 'react'

export interface FilterOption {
  value: string
  label: string
}

interface FilterBarProps {
  options: FilterOption[]
  active: string
  onChange: (value: string) => void
  className?: string
  label?: string
}

export function FilterBar({ options, active, onChange, className = '', label }: FilterBarProps) {
  return (
    <nav className={`flex flex-wrap gap-2 ${className}`} aria-label={label ?? 'Filter options'}>
      {options.map(option => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          aria-pressed={active === option.value}
          className={`
            px-4 py-2 rounded-full text-sm font-medium font-body
            transition-all duration-150
            focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
            ${active === option.value
              ? 'bg-primary text-white shadow-sm'
              : 'bg-surface text-charcoal border border-border hover:border-primary hover:text-primary'
            }
          `}
        >
          {option.label}
        </button>
      ))}
    </nav>
  )
}
