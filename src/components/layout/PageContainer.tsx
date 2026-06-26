import React from 'react'

interface PageContainerProps {
  children: React.ReactNode
  className?: string
  narrow?: boolean   // for single-column text-heavy pages
  flush?: boolean    // removes horizontal padding (for full-width hero sections)
}

export function PageContainer({ children, className = '', narrow = false, flush = false }: PageContainerProps) {
  return (
    <main
      className={`
        min-h-screen
        ${flush ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}
        ${narrow ? 'max-w-3xl' : ''}
        ${className}
      `}
    >
      {children}
    </main>
  )
}

// Full-width section wrapper — used to break out of container
interface SectionProps {
  children: React.ReactNode
  className?: string
  as?: 'section' | 'div' | 'article' | 'aside'
}

export function Section({ children, className = '', as: Tag = 'section' }: SectionProps) {
  return (
    <Tag className={`py-12 md:py-16 ${className}`}>
      {children}
    </Tag>
  )
}

// Constrained inner container — use inside full-width Section
export function InnerContainer({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  )
}

// Section heading with optional subtitle and link
interface SectionHeadingProps {
  title: string
  subtitle?: string
  action?: { label: string; href: string }
  as?: 'h1' | 'h2' | 'h3'
}

export function SectionHeading({ title, subtitle, action, as: Tag = 'h2' }: SectionHeadingProps) {
  return (
    <div className="flex items-end justify-between mb-8 gap-4">
      <div>
        <Tag className="font-heading text-2xl md:text-3xl font-semibold text-charcoal">
          {title}
        </Tag>
        {subtitle && (
          <p className="mt-2 font-body text-muted text-base">{subtitle}</p>
        )}
      </div>
      {action && (
        <a
          href={action.href}
          className="flex-shrink-0 text-sm font-medium text-primary hover:text-[#b05a35] transition-colors"
        >
          {action.label} →
        </a>
      )}
    </div>
  )
}
