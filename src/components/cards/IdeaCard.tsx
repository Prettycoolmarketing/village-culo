import React from 'react'
import { Link } from 'react-router-dom'
import type { Idea } from '../../types'
import { Badge } from '../ui/Badge'

interface IdeaCardProps {
  idea: Idea
  variant?: 'default' | 'featured' | 'compact'
  className?: string
}

export function IdeaCard({ idea, variant = 'default', className = '' }: IdeaCardProps) {
  const ideaUrl = `/ideas/${idea.slug}`

  // ─── Featured variant — full-width editorial style ────────────────────────────
  if (variant === 'featured') {
    return (
      <article
        className={`group bg-secondary/5 border border-secondary/15 rounded-2xl p-6 hover:bg-secondary/8 transition-colors duration-200 ${className}`}
        aria-label={`Featured idea: ${idea.title}`}
      >
        {idea.featured && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary/15 text-secondary mb-4">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Trending Idea
          </span>
        )}

        <h3 className="font-heading text-2xl font-semibold text-charcoal leading-snug mb-3">
          <Link to={ideaUrl} className="hover:text-secondary transition-colors focus:outline-none focus-visible:underline">
            {idea.title}
          </Link>
        </h3>

        <p className="font-body text-base text-muted leading-relaxed mb-4">
          {idea.description}
        </p>

        {idea.quote && (
          <blockquote className="border-l-4 border-secondary/40 pl-4 my-4">
            <p className="font-heading text-lg italic text-charcoal/80 leading-relaxed">"{idea.quote}"</p>
          </blockquote>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted mt-4 mb-4">
          <span>
            <strong className="text-charcoal font-semibold">{idea.relatedStoryIds.length}</strong> stories
          </span>
          <span>
            <strong className="text-charcoal font-semibold">{idea.relatedFounderIds.length}</strong> founders
          </span>
          <span>
            <strong className="text-charcoal font-semibold">{idea.relatedBusinessIds.length}</strong> businesses
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-5" aria-label="Topics">
          {idea.topics.map(t => (
            <Badge key={t.id} label={t.name} variant="ideas" />
          ))}
        </div>

        <Link
          to={ideaUrl}
          className="inline-flex items-center gap-1 text-sm font-medium text-secondary hover:text-[#4e5a3c] transition-colors"
        >
          Explore this idea →
        </Link>
      </article>
    )
  }

  // ─── Compact variant ────────────────────────────────────────────────────────
  if (variant === 'compact') {
    return (
      <article
        className={`group bg-surface rounded-xl p-4 shadow-card hover:shadow-md transition-all duration-200 ${className}`}
        aria-label={`Idea: ${idea.title}`}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center" aria-hidden="true">
            <svg className="w-4 h-4 text-secondary" fill="currentColor" viewBox="0 0 20 20">
              <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.099.022-.2.022-.3a4 4 0 10-8 0c0 .1.007.2.022.3H12z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-heading text-sm font-semibold text-charcoal leading-snug line-clamp-2">
              <Link to={ideaUrl} className="hover:text-secondary transition-colors focus:outline-none focus-visible:underline">
                {idea.title}
              </Link>
            </h3>
            <p className="font-body text-xs text-muted mt-1">
              {idea.relatedStoryIds.length} stories · {idea.relatedFounderIds.length} founders
            </p>
          </div>
        </div>
      </article>
    )
  }

  // ─── Default ────────────────────────────────────────────────────────────────
  return (
    <article
      className={`group bg-surface rounded-2xl p-5 shadow-card hover:shadow-md transition-all duration-200 ${className}`}
      aria-label={`Idea: ${idea.title}`}
    >
      {/* Lightbulb icon */}
      <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center mb-4" aria-hidden="true">
        <svg className="w-5 h-5 text-secondary" fill="currentColor" viewBox="0 0 20 20">
          <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.099.022-.2.022-.3a4 4 0 10-8 0c0 .1.007.2.022.3H12z" />
        </svg>
      </div>

      <h3 className="font-heading text-lg font-semibold text-charcoal leading-snug mb-2">
        <Link to={ideaUrl} className="hover:text-secondary transition-colors focus:outline-none focus-visible:underline">
          {idea.title}
        </Link>
      </h3>

      <p className="font-body text-sm text-muted leading-relaxed line-clamp-2 mb-3">
        {idea.description}
      </p>

      {/* Stats */}
      <div className="flex items-center gap-3 text-xs text-muted mb-3">
        <span><strong className="text-charcoal">{idea.relatedStoryIds.length}</strong> stories</span>
        <span><strong className="text-charcoal">{idea.relatedFounderIds.length}</strong> founders</span>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4" aria-label="Topics">
        {idea.topics.slice(0, 3).map(t => (
          <Badge key={t.id} label={t.name} variant="ideas" />
        ))}
      </div>

      <Link
        to={ideaUrl}
        className="inline-flex items-center gap-1 text-sm font-medium text-secondary hover:text-[#4e5a3c] transition-colors"
      >
        Explore →
      </Link>
    </article>
  )
}
