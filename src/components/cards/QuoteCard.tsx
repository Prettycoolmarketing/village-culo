import React from 'react'
import { Link } from 'react-router-dom'
import type { Idea, Founder } from '../../types'
import { Avatar } from '../ui/Avatar'

interface QuoteCardProps {
  idea: Idea
  founder?: Founder
  variant?: 'default' | 'large' | 'inline'
  className?: string
}

export function QuoteCard({ idea, founder, variant = 'default', className = '' }: QuoteCardProps) {
  const ideaUrl = `/ideas/${idea.slug}`
  const founderUrl = founder ? `/founders/${founder.slug}` : undefined

  if (!idea.quote) return null

  // ─── Large — hero quote, editorial style ────────────────────────────────────
  if (variant === 'large') {
    return (
      <figure
        className={`relative bg-charcoal text-white rounded-2xl p-8 md:p-10 ${className}`}
        aria-label={`Quote from ${founder?.name ?? 'a founder'}`}
      >
        {/* Decorative quotation mark */}
        <span
          className="absolute top-4 left-6 font-heading text-8xl text-primary/30 leading-none select-none pointer-events-none"
          aria-hidden="true"
        >
          "
        </span>

        <blockquote className="relative z-10">
          <p className="font-heading text-2xl md:text-3xl font-medium italic leading-snug text-white mb-6">
            "{idea.quote}"
          </p>

          {(founder || idea.topics.length > 0) && (
            <figcaption className="flex items-center justify-between gap-4 flex-wrap">
              {founder && (
                <div className="flex items-center gap-3">
                  <Avatar src={founder.avatar} alt={founder.name} size="sm" />
                  <div>
                    <cite className="not-italic font-body text-sm font-semibold text-white">
                      {founderUrl ? (
                        <Link to={founderUrl} className="hover:text-primary transition-colors focus:outline-none focus-visible:underline">
                          {founder.name}
                        </Link>
                      ) : founder.name}
                    </cite>
                    <p className="font-body text-xs text-white/60">{founder.industry.name} · {founder.location.name}</p>
                  </div>
                </div>
              )}
              <Link
                to={ideaUrl}
                className="text-sm font-medium text-primary hover:text-accent transition-colors"
              >
                Explore this idea →
              </Link>
            </figcaption>
          )}
        </blockquote>
      </figure>
    )
  }

  // ─── Inline — compact quote inside a story/idea ──────────────────────────────
  if (variant === 'inline') {
    return (
      <figure
        className={`border-l-4 border-secondary/50 pl-4 py-1 ${className}`}
        aria-label="Quote"
      >
        <blockquote>
          <p className="font-heading text-base italic text-charcoal/80 leading-relaxed">
            "{idea.quote}"
          </p>
        </blockquote>
        {founder && (
          <figcaption className="flex items-center gap-2 mt-2">
            <Avatar src={founder.avatar} alt={founder.name} size="xs" />
            <cite className="not-italic font-body text-xs text-muted">
              {founderUrl ? (
                <Link to={founderUrl} className="font-medium text-charcoal hover:text-primary transition-colors">
                  {founder.name}
                </Link>
              ) : founder.name}
            </cite>
          </figcaption>
        )}
      </figure>
    )
  }

  // ─── Default ────────────────────────────────────────────────────────────────
  return (
    <figure
      className={`group bg-surface rounded-2xl p-6 shadow-card hover:shadow-md transition-all duration-200 ${className}`}
      aria-label={`Quote from ${founder?.name ?? 'a founder'}: ${idea.quote.slice(0, 60)}`}
    >
      <div className="mb-4 text-secondary/40" aria-hidden="true">
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 32 32">
          <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
        </svg>
      </div>

      <blockquote className="mb-4">
        <p className="font-heading text-lg italic text-charcoal leading-snug">
          "{idea.quote}"
        </p>
      </blockquote>

      {founder && (
        <figcaption className="flex items-center gap-2.5 pt-4 border-t border-border">
          <Avatar src={founder.avatar} alt={founder.name} size="sm" />
          <div className="min-w-0">
            <cite className="not-italic font-body text-sm font-semibold text-charcoal block">
              {founderUrl ? (
                <Link to={founderUrl} className="hover:text-primary transition-colors focus:outline-none focus-visible:underline">
                  {founder.name}
                </Link>
              ) : founder.name}
            </cite>
            <Link
              to={ideaUrl}
              className="font-body text-xs text-muted hover:text-secondary transition-colors line-clamp-1"
            >
              {idea.title}
            </Link>
          </div>
        </figcaption>
      )}
    </figure>
  )
}
