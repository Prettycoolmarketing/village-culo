import { Link } from 'react-router-dom'
import type { Business, Founder } from '../../types'
import { Badge } from '../ui/Badge'

interface BusinessCardProps {
  business: Business
  founder?: Founder
  variant?: 'default' | 'compact' | 'featured'
  className?: string
}

export function BusinessCard({ business, founder, variant = 'default', className = '' }: BusinessCardProps) {
  const businessUrl = `/businesses/${business.slug}`
  const founderUrl = founder ? `/founders/${founder.slug}` : undefined

  // ─── Featured ────────────────────────────────────────────────────────────────
  if (variant === 'featured') {
    return (
      <article
        className={`group relative bg-surface rounded-2xl overflow-hidden shadow-card hover:shadow-lg transition-all duration-300 ${className}`}
        aria-label={`Business: ${business.name}`}
      >
        {/* Cover */}
        <div className="relative h-40 overflow-hidden">
          <img
            src={business.coverImage}
            alt={`${business.name} cover image`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/50 to-transparent" aria-hidden="true" />
          {business.featured && (
            <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-medium bg-accent text-charcoal">
              Featured
            </span>
          )}
        </div>

        <div className="p-5">
          {/* Logo + name */}
          <div className="flex items-start gap-3 -mt-8 mb-3">
            <Link to={businessUrl} aria-label={`View ${business.name}`}>
              <div className="w-14 h-14 rounded-xl overflow-hidden ring-4 ring-surface shadow-sm bg-background flex-shrink-0">
                <img
                  src={business.logo}
                  alt={`${business.name} logo`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </Link>
            <div className="pt-8 min-w-0">
              <h3 className="font-heading text-base font-semibold text-charcoal leading-tight line-clamp-1">
                <Link to={businessUrl} className="hover:text-primary transition-colors focus:outline-none focus-visible:underline">
                  {business.name}
                </Link>
              </h3>
              <p className="font-body text-xs text-primary font-medium mt-0.5">{business.industry.name}</p>
            </div>
          </div>

          {/* Tagline */}
          <p className="font-body text-sm font-medium text-charcoal mb-1">{business.tagline}</p>
          <p className="font-body text-sm text-muted leading-relaxed line-clamp-2 mb-3">{business.description}</p>

          {/* Meta */}
          <div className="flex items-center gap-2 text-xs text-muted mb-3">
            <svg className="w-3.5 h-3.5 text-primary/50" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span>{business.location.name}, {business.location.state}</span>
            {founder && (
              <>
                <span className="text-border">·</span>
                <Link to={founderUrl ?? '#'} className="font-medium text-charcoal hover:text-primary transition-colors">
                  {founder.name}
                </Link>
              </>
            )}
          </div>

          {/* Topics */}
          <div className="flex flex-wrap gap-1.5 mb-4" aria-label="Topics">
            {business.topics.slice(0, 3).map(t => (
              <Badge key={t.id} label={t.name} variant="mercato" />
            ))}
          </div>

          {/* Top offer CTA */}
          {business.offers[0] && (
            <a
              href={business.offers[0].ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-accent text-charcoal text-sm font-medium rounded-xl hover:bg-[#c4963e] transition-colors"
              aria-label={`${business.offers[0].ctaLabel} — ${business.name}`}
            >
              {business.offers[0].ctaLabel}
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>
      </article>
    )
  }

  // ─── Compact ─────────────────────────────────────────────────────────────────
  if (variant === 'compact') {
    return (
      <article
        className={`flex items-center gap-3 bg-surface rounded-xl p-3 shadow-card hover:shadow-md transition-all duration-200 ${className}`}
        aria-label={`Business: ${business.name}`}
      >
        <Link to={businessUrl} tabIndex={-1} aria-hidden="true">
          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-background">
            <img src={business.logo} alt="" className="w-full h-full object-cover" loading="lazy" />
          </div>
        </Link>
        <div className="min-w-0 flex-1">
          <h3 className="font-heading text-sm font-semibold text-charcoal leading-tight line-clamp-1">
            <Link to={businessUrl} className="hover:text-primary transition-colors focus:outline-none focus-visible:underline">
              {business.name}
            </Link>
          </h3>
          <p className="font-body text-xs text-muted line-clamp-1">{business.tagline}</p>
          <p className="font-body text-xs text-muted mt-0.5">{business.location.name} · {business.industry.name}</p>
        </div>
      </article>
    )
  }

  // ─── Default ─────────────────────────────────────────────────────────────────
  return (
    <article
      className={`group bg-surface rounded-2xl overflow-hidden shadow-card hover:shadow-md transition-all duration-300 ${className}`}
      aria-label={`Business: ${business.name}`}
    >
      <div className="p-5">
        {/* Logo + header */}
        <div className="flex items-start gap-3 mb-4">
          <Link to={businessUrl} aria-label={`View ${business.name}`}>
            <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-background ring-2 ring-border">
              <img
                src={business.logo}
                alt={`${business.name} logo`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </Link>
          <div className="min-w-0 flex-1 pt-0.5">
            <h3 className="font-heading text-base font-semibold text-charcoal leading-tight">
              <Link to={businessUrl} className="hover:text-primary transition-colors focus:outline-none focus-visible:underline">
                {business.name}
              </Link>
            </h3>
            <p className="font-body text-xs text-primary font-medium">{business.industry.name}</p>
          </div>
        </div>

        {/* Tagline + description */}
        <p className="font-body text-sm font-medium text-charcoal mb-1">{business.tagline}</p>
        <p className="font-body text-sm text-muted leading-relaxed line-clamp-2 mb-3">{business.description}</p>

        {/* Meta */}
        <div className="flex items-center gap-2 text-xs text-muted mb-3">
          <svg className="w-3 h-3 text-primary/50" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          <span>{business.location.name}</span>
          {founder && founderUrl && (
            <>
              <span className="text-border">·</span>
              <Link to={founderUrl} className="font-medium text-charcoal hover:text-primary transition-colors">
                {founder.name}
              </Link>
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4" aria-label="Topics">
          {business.topics.slice(0, 3).map(t => (
            <Badge key={t.id} label={t.name} variant="mercato" />
          ))}
        </div>

        {business.offers[0] && (
          <a
            href={business.offers[0].ctaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-[#b05a35] transition-colors"
          >
            {business.offers[0].ctaLabel} →
          </a>
        )}
      </div>
    </article>
  )
}
