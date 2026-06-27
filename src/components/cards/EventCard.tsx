import React from 'react'
import type { Event } from '../../types'
import { Badge } from '../ui/Badge'
import { noticeTypeLabel, formatDate } from '../../utils/slugify'

interface EventCardProps {
  event: Event
  variant?: 'default' | 'compact' | 'featured'
  className?: string
}

const typeVariant = {
  event:         'noticeboard',
  collaboration: 'secondary',
  opportunity:   'mercato',
  request:       'founders',
} as const

const typeIcon: Record<string, React.ReactNode> = {
  event: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  collaboration: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
    </svg>
  ),
  opportunity: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  request: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
  ),
}

export function EventCard({ event, variant = 'default', className = '' }: EventCardProps) {
  // Link to the event's own CTA URL (external booking/info page).
  // Fall back to /noticeboard only when no specific URL is set.
  const eventUrl = event.ctaUrl && event.ctaUrl !== '#' ? event.ctaUrl : '/noticeboard'
  const isExternal = eventUrl.startsWith('http')

  if (variant === 'featured') {
    return (
      <article
        className={`group relative bg-surface rounded-2xl overflow-hidden shadow-card hover:shadow-lg transition-all duration-300 ${className}`}
        aria-label={`${noticeTypeLabel(event.type)}: ${event.title}`}
      >
        {event.coverImage && (
          <div className="relative h-40 overflow-hidden">
            <img
              src={event.coverImage}
              alt={`Cover image for ${event.title}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 to-transparent" aria-hidden="true" />
            <div className="absolute top-3 left-3">
              <Badge label={noticeTypeLabel(event.type)} variant={typeVariant[event.type]} />
            </div>
            {event.date && (
              <time
                dateTime={event.date}
                className="absolute bottom-3 left-3 text-xs text-white/90 font-medium"
              >
                {formatDate(event.date)}
              </time>
            )}
          </div>
        )}
        <div className="p-5">
          <h3 className="font-heading text-lg font-semibold text-charcoal leading-snug mb-2">
            <a
              href={eventUrl}
              {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="hover:text-primary transition-colors focus:outline-none focus-visible:underline"
            >
              {event.title}
            </a>
          </h3>
          <p className="font-body text-sm text-muted leading-relaxed line-clamp-3 mb-4">
            {event.description}
          </p>
          <div className="flex items-center gap-3 text-xs text-muted mb-4">
            {event.location && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-primary/50" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                {event.location.name}
              </span>
            )}
          </div>
          <a
            href={eventUrl}
            {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-[#b05a35] transition-colors"
            aria-label={`${event.ctaLabel} — ${event.title}`}
          >
            {event.ctaLabel}
          </a>
        </div>
      </article>
    )
  }

  if (variant === 'compact') {
    return (
      <article
        className={`flex items-start gap-3 bg-surface rounded-xl p-3 shadow-card hover:shadow-md transition-all duration-200 ${className}`}
        aria-label={`${noticeTypeLabel(event.type)}: ${event.title}`}
      >
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary" aria-hidden="true">
          {typeIcon[event.type]}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-heading text-sm font-semibold text-charcoal leading-tight line-clamp-2">
              <a
                href={eventUrl}
                {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className="hover:text-primary transition-colors focus:outline-none focus-visible:underline"
              >
                {event.title}
              </a>
            </h3>
            <Badge label={noticeTypeLabel(event.type)} variant={typeVariant[event.type]} className="flex-shrink-0" />
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted">
            {event.date && <time dateTime={event.date}>{formatDate(event.date)}</time>}
            {event.date && event.location && <span className="text-border">·</span>}
            {event.location && <span>{event.location.name}</span>}
          </div>
        </div>
      </article>
    )
  }

  // Default
  return (
    <article
      className={`group bg-surface rounded-2xl p-5 shadow-card hover:shadow-md transition-all duration-200 ${className}`}
      aria-label={`${noticeTypeLabel(event.type)}: ${event.title}`}
    >
      {/* Type badge + icon */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-primary">
          {typeIcon[event.type]}
          <Badge label={noticeTypeLabel(event.type)} variant={typeVariant[event.type]} />
        </div>
        {event.featured && (
          <Badge label="Featured" variant="accent" />
        )}
      </div>

      <h3 className="font-heading text-lg font-semibold text-charcoal leading-snug mb-2">
        <a
          href={eventUrl}
          {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          className="hover:text-primary transition-colors focus:outline-none focus-visible:underline"
        >
          {event.title}
        </a>
      </h3>

      <p className="font-body text-sm text-muted leading-relaxed line-clamp-3 mb-4">
        {event.description}
      </p>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted mb-4">
        {event.date && (
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <time dateTime={event.date}>{formatDate(event.date)}</time>
          </span>
        )}
        {event.location && (
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            {event.location.name}, {event.location.state}
          </span>
        )}
      </div>

      <a
        href={event.ctaUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-[#b05a35] transition-colors"
        aria-label={`${event.ctaLabel} — ${event.title}`}
      >
        {event.ctaLabel} →
      </a>
    </article>
  )
}
