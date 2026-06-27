import { Link } from 'react-router-dom'
import type { Founder, Business } from '../../types'
import { Badge } from '../ui/Badge'
import { Avatar } from '../ui/Avatar'

interface FounderCardProps {
  founder: Founder
  business?: Business
  variant?: 'default' | 'compact' | 'featured'
  className?: string
}

export function FounderCard({ founder, business, variant = 'default', className = '' }: FounderCardProps) {
  const founderUrl = `/founders/${founder.slug}`
  const businessUrl = business ? `/businesses/${business.slug}` : undefined

  // ─── Featured variant — hero row style ──────────────────────────────────────
  if (variant === 'featured') {
    return (
      <article
        className={`group relative bg-surface rounded-2xl overflow-hidden shadow-card hover:shadow-lg transition-all duration-300 ${className}`}
        aria-label={`Featured founder: ${founder.name}`}
      >
        {/* Cover image */}
        {founder.coverImage && (
          <div className="relative h-36 overflow-hidden">
            <img
              src={founder.coverImage}
              alt={`${founder.name}'s cover photo`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/50 to-transparent" aria-hidden="true" />
            {founder.featured && (
              <div className="absolute top-3 right-3">
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-accent text-charcoal">Featured</span>
              </div>
            )}
          </div>
        )}

        <div className="p-5">
          {/* Avatar + name */}
          <div className="flex items-start gap-3 -mt-10 mb-3" style={founder.coverImage ? { marginTop: '-2.5rem' } : {}}>
            <Link to={founderUrl} aria-label={`View ${founder.name}'s profile`}>
              <Avatar
                src={founder.avatar}
                alt={founder.name}
                size="xl"
                className="ring-4 ring-surface shadow-md"
              />
            </Link>
            <div className="pt-10 min-w-0">
              <h3 className="font-heading text-lg font-semibold text-charcoal leading-tight">
                <Link to={founderUrl} className="hover:text-primary transition-colors focus:outline-none focus-visible:underline">
                  {founder.name}
                </Link>
              </h3>
              {business && businessUrl && (
                <Link to={businessUrl} className="font-body text-sm text-muted hover:text-primary transition-colors line-clamp-1">
                  {business.name}
                </Link>
              )}
            </div>
          </div>

          {/* Bio */}
          <p className="font-body text-sm text-muted leading-relaxed line-clamp-3 mb-3">
            {founder.bio}
          </p>

          {/* Meta row */}
          <div className="flex items-center gap-3 text-xs text-muted mb-3">
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-primary/60" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <span>{founder.location.name}, {founder.location.state}</span>
            </span>
            <span className="text-border">·</span>
            <span>{founder.industry.name}</span>
          </div>

          {/* Topic tags */}
          <div className="flex flex-wrap gap-1.5 mb-4" aria-label="Topics this founder covers">
            {founder.topics.slice(0, 3).map(topic => (
              <Badge key={topic.id} label={topic.name} variant="secondary" />
            ))}
          </div>

          <Link
            to={founderUrl}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-[#b05a35] transition-colors"
          >
            View Profile →
          </Link>
        </div>
      </article>
    )
  }

  // ─── Compact variant — for sidebars / related panels ────────────────────────
  if (variant === 'compact') {
    return (
      <article
        className={`flex items-center gap-3 bg-surface rounded-xl p-3 shadow-card hover:shadow-md transition-all duration-200 ${className}`}
        aria-label={`Founder: ${founder.name}`}
      >
        <Link to={founderUrl} aria-label={`View ${founder.name}'s profile`} tabIndex={-1} aria-hidden="true">
          <Avatar src={founder.avatar} alt={founder.name} size="md" />
        </Link>
        <div className="min-w-0 flex-1">
          <h3 className="font-heading text-sm font-semibold text-charcoal leading-tight truncate">
            <Link to={founderUrl} className="hover:text-primary transition-colors focus:outline-none focus-visible:underline">
              {founder.name}
            </Link>
          </h3>
          <p className="font-body text-xs text-muted truncate">
            {business?.name ?? founder.industry.name} · {founder.location.name}
          </p>
          <div className="flex gap-1 mt-1">
            {founder.topics.slice(0, 2).map(t => (
              <Badge key={t.id} label={t.name} variant="neutral" />
            ))}
          </div>
        </div>
      </article>
    )
  }

  // ─── Default variant ─────────────────────────────────────────────────────────
  return (
    <article
      className={`group bg-surface rounded-2xl overflow-hidden shadow-card hover:shadow-md transition-all duration-300 ${className}`}
      aria-label={`Founder: ${founder.name}`}
    >
      <div className="p-5">
        {/* Avatar + name + meta */}
        <div className="flex items-start gap-4 mb-4">
          <Link to={founderUrl} aria-label={`View ${founder.name}'s profile`}>
            <Avatar
              src={founder.avatar}
              alt={founder.name}
              size="lg"
              className="ring-2 ring-border"
            />
          </Link>
          <div className="min-w-0 flex-1 pt-1">
            <h3 className="font-heading text-base font-semibold text-charcoal leading-tight">
              <Link to={founderUrl} className="hover:text-primary transition-colors focus:outline-none focus-visible:underline">
                {founder.name}
              </Link>
            </h3>
            {business && businessUrl && (
              <Link to={businessUrl} className="font-body text-sm text-primary hover:underline line-clamp-1 mt-0.5">
                {business.name}
              </Link>
            )}
            <p className="font-body text-xs text-muted mt-1 flex items-center gap-1">
              <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              {founder.location.name} · {founder.industry.name}
            </p>
          </div>
        </div>

        {/* Bio */}
        <p className="font-body text-sm text-muted leading-relaxed line-clamp-3 mb-3">
          {founder.bio}
        </p>

        {/* Topic tags */}
        <div className="flex flex-wrap gap-1.5 mb-4" aria-label="Topics">
          {founder.topics.slice(0, 4).map(topic => (
            <Badge key={topic.id} label={topic.name} variant="secondary" />
          ))}
        </div>

        <Link
          to={founderUrl}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-[#b05a35] transition-colors"
        >
          View Profile →
        </Link>
      </div>
    </article>
  )
}
