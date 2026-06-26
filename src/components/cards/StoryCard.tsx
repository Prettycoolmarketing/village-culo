import React from 'react'
import { Link } from 'react-router-dom'
import type { Story, Founder, Business } from '../../types'
import { Badge } from '../ui/Badge'
import { Avatar } from '../ui/Avatar'
import { contentTypeLabel } from '../../utils/slugify'

interface StoryCardProps {
  story: Story
  founder?: Founder
  business?: Business
  variant?: 'vertical' | 'compact' | 'horizontal'
  className?: string
  // Show/hide sections for different widget contexts
  showSummary?: boolean
  showFounder?: boolean
  showTopics?: boolean
  showCTA?: boolean
}

// Content type → badge variant colour
const contentTypeBadgeVariant = {
  reel:      'stories',
  blog:      'piazza',
  carousel:  'mercato',
} as const

export function StoryCard({
  story,
  founder,
  business,
  variant = 'vertical',
  className = '',
  showSummary = true,
  showFounder = true,
  showTopics = true,
  showCTA = true,
}: StoryCardProps) {
  const storyUrl = `/stories/${story.slug}`
  const founderUrl = founder ? `/founders/${founder.slug}` : undefined
  const businessUrl = business ? `/businesses/${business.slug}` : undefined

  if (variant === 'vertical') {
    return (
      <article
        className={`group relative bg-surface rounded-2xl overflow-hidden shadow-card hover:shadow-md transition-all duration-300 flex flex-col ${className}`}
        aria-label={`Story: ${story.title}`}
      >
        {/* Cover image — reel-sized (3:4 portrait) */}
        <Link
          to={storyUrl}
          className="block relative overflow-hidden"
          aria-label={`Read ${story.title}`}
          style={{ aspectRatio: '3/4' }}
          tabIndex={0}
        >
          <img
            src={story.coverImage}
            alt={`Cover image for "${story.title}" by ${founder?.name ?? 'Unknown founder'}`}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-transparent to-transparent" aria-hidden="true" />

          {/* Content type badges — on the image */}
          {story.contentTypes.length > 0 && (
            <div className="absolute top-3 left-3 flex flex-wrap gap-1.5" aria-label="Content formats">
              {story.contentTypes.map(type => (
                <span
                  key={type}
                  className="px-2 py-0.5 rounded-full text-xs font-medium bg-surface/90 backdrop-blur-sm text-charcoal"
                >
                  {contentTypeLabel(type)}
                </span>
              ))}
            </div>
          )}

          {/* Featured badge */}
          {story.featured && (
            <div className="absolute top-3 right-3">
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-accent text-charcoal">
                Featured
              </span>
            </div>
          )}

          {/* Location — bottom of image */}
          <div className="absolute bottom-3 left-3">
            <span className="inline-flex items-center gap-1 text-xs text-white/90 font-medium">
              <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <span>{story.location.name}, {story.location.state}</span>
            </span>
          </div>
        </Link>

        {/* Card content */}
        <div className="flex flex-col flex-1 p-4 gap-3">
          {/* Title */}
          <h3 className="font-heading text-lg font-semibold text-charcoal leading-snug">
            <Link
              to={storyUrl}
              className="hover:text-primary transition-colors focus:outline-none focus-visible:underline"
            >
              {story.title}
            </Link>
          </h3>

          {/* Summary */}
          {showSummary && story.summary && (
            <p className="font-body text-sm text-muted leading-relaxed line-clamp-2">
              {story.summary}
            </p>
          )}

          {/* Topic tags */}
          {showTopics && story.topics.length > 0 && (
            <div className="flex flex-wrap gap-1.5" aria-label="Topics">
              {story.topics.slice(0, 3).map(topic => (
                <Badge key={topic.id} label={topic.name} variant="secondary" />
              ))}
            </div>
          )}

          {/* Founder / Business meta */}
          {showFounder && founder && (
            <div className="flex items-center gap-2.5 pt-1 border-t border-border">
              <Avatar src={founder.avatar} alt={founder.name} size="sm" />
              <div className="min-w-0 flex-1">
                <Link
                  to={founderUrl ?? '#'}
                  className="block font-body text-sm font-medium text-charcoal truncate hover:text-primary transition-colors"
                >
                  {founder.name}
                </Link>
                {business && businessUrl && (
                  <Link
                    to={businessUrl}
                    className="block font-body text-xs text-muted truncate hover:text-primary transition-colors"
                  >
                    {business.name}
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* CTA */}
          {showCTA && story.ctaLabel && story.ctaUrl && (
            <a
              href={story.ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-[#b05a35] transition-colors"
              aria-label={`${story.ctaLabel} — related to ${story.title}`}
            >
              {story.ctaLabel}
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>
      </article>
    )
  }

  // ─── Compact variant — for sidebars, related content ───────────────────────
  if (variant === 'compact') {
    return (
      <article
        className={`group flex gap-3 bg-surface rounded-xl p-3 shadow-card hover:shadow-md transition-all duration-200 ${className}`}
        aria-label={`Story: ${story.title}`}
      >
        <Link
          to={storyUrl}
          className="flex-shrink-0 rounded-lg overflow-hidden w-20 h-20"
          tabIndex={-1}
          aria-hidden="true"
        >
          <img
            src={story.coverImage}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </Link>
        <div className="flex flex-col justify-between min-w-0 flex-1">
          <div>
            {story.contentTypes.length > 0 && (
              <span className="text-xs text-muted font-medium">
                {story.contentTypes.map(contentTypeLabel).join(' · ')}
              </span>
            )}
            <h3 className="font-heading text-sm font-semibold text-charcoal leading-snug mt-0.5 line-clamp-2">
              <Link to={storyUrl} className="hover:text-primary transition-colors focus:outline-none focus-visible:underline">
                {story.title}
              </Link>
            </h3>
          </div>
          {founder && (
            <p className="font-body text-xs text-muted truncate">{founder.name} · {story.location.name}</p>
          )}
        </div>
      </article>
    )
  }

  // ─── Horizontal variant — for featured rows ─────────────────────────────────
  return (
    <article
      className={`group flex gap-5 bg-surface rounded-2xl overflow-hidden shadow-card hover:shadow-md transition-all duration-300 ${className}`}
      aria-label={`Story: ${story.title}`}
    >
      <Link
        to={storyUrl}
        className="flex-shrink-0 w-40 sm:w-56 relative overflow-hidden"
        style={{ aspectRatio: '3/4' }}
        tabIndex={-1}
        aria-hidden="true"
      >
        <img
          src={story.coverImage}
          alt=""
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-charcoal/10" aria-hidden="true" />
      </Link>

      <div className="flex flex-col justify-between py-5 pr-5 flex-1 min-w-0">
        <div>
          {story.contentTypes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3" aria-label="Content formats">
              {story.contentTypes.map(type => (
                <Badge key={type} label={contentTypeLabel(type)} variant="neutral" />
              ))}
            </div>
          )}
          <h3 className="font-heading text-xl font-semibold text-charcoal leading-snug mb-2">
            <Link to={storyUrl} className="hover:text-primary transition-colors focus:outline-none focus-visible:underline">
              {story.title}
            </Link>
          </h3>
          {showSummary && (
            <p className="font-body text-sm text-muted line-clamp-3 leading-relaxed">{story.summary}</p>
          )}
        </div>

        <div className="mt-4 space-y-3">
          {showTopics && (
            <div className="flex flex-wrap gap-1.5" aria-label="Topics">
              {story.topics.slice(0, 3).map(topic => (
                <Badge key={topic.id} label={topic.name} variant="secondary" />
              ))}
            </div>
          )}
          {founder && (
            <div className="flex items-center gap-2">
              <Avatar src={founder.avatar} alt={founder.name} size="xs" />
              <span className="font-body text-xs text-muted">
                <Link to={founderUrl ?? '#'} className="font-medium text-charcoal hover:text-primary transition-colors">
                  {founder.name}
                </Link>
                {business && <> · {business.name}</>}
                {' · '}{story.location.name}
              </span>
            </div>
          )}
          {showCTA && story.ctaLabel && (
            <a
              href={story.ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-[#b05a35] transition-colors"
            >
              {story.ctaLabel} →
            </a>
          )}
        </div>
      </div>
    </article>
  )
}
