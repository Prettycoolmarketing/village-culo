import React from 'react'
import { Link } from 'react-router-dom'
import { getFeaturedStories } from '../data/stories'
import { getFeaturedFounders } from '../data/founders'
import { getFeaturedBusinesses } from '../data/businesses'
import { getFeaturedIdeas } from '../data/ideas'
import { getFeaturedEvents } from '../data/events'
import { getFounder } from '../data/founders'
import { getBusiness } from '../data/businesses'
import { Badge } from '../components/ui/Badge'
import { Avatar } from '../components/ui/Avatar'
import { SectionHeading } from '../components/layout/PageContainer'
import { contentTypeLabel, formatDate } from '../utils/slugify'

interface FeaturedWidgetProps {
  heading?: string
  subheading?: string
  className?: string
}

export function FeaturedWidget({
  heading = "Today's Highlights",
  subheading = 'The best of the Village, updated as new stories are published.',
  className = '',
}: FeaturedWidgetProps) {
  const featuredStory = getFeaturedStories()[0]
  const featuredFounder = getFeaturedFounders()[0]
  const featuredBusiness = getFeaturedBusinesses()[0]
  const featuredIdea = getFeaturedIdeas()[0]
  const featuredEvent = getFeaturedEvents()[0]

  const storyFounder = featuredStory ? getFounder(featuredStory.founderId) : undefined
  const storyBusiness = featuredStory ? getBusiness(featuredStory.businessId) : undefined

  return (
    <section aria-label={heading} className={className}>
      <SectionHeading title={heading} subtitle={subheading} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6">

        {/* ── Story of the Day — spans 2 cols on large screens ─────────────── */}
        {featuredStory && (
          <article
            className="lg:col-span-2 group relative bg-surface rounded-2xl overflow-hidden shadow-card hover:shadow-lg transition-all duration-300"
            aria-label={`Story of the Day: ${featuredStory.title}`}
          >
            <Link
              to={`/stories/${featuredStory.slug}`}
              className="block relative overflow-hidden"
              style={{ aspectRatio: '16/9' }}
              aria-label={`Read ${featuredStory.title}`}
            >
              <img
                src={featuredStory.coverImage}
                alt={`Cover for "${featuredStory.title}"`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/20 to-transparent" aria-hidden="true" />

              <div className="absolute inset-0 flex flex-col justify-end p-6">
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-accent text-charcoal">Story of the Day</span>
                  {featuredStory.contentTypes.map(t => (
                    <span key={t} className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white backdrop-blur-sm">
                      {contentTypeLabel(t)}
                    </span>
                  ))}
                </div>
                <h3 className="font-heading text-2xl md:text-3xl font-semibold text-white leading-snug mb-3">
                  {featuredStory.title}
                </h3>
                <p className="font-body text-sm text-white/80 line-clamp-2 mb-4 hidden sm:block">
                  {featuredStory.summary}
                </p>
                {storyFounder && (
                  <div className="flex items-center gap-2.5">
                    <Avatar src={storyFounder.avatar} alt={storyFounder.name} size="sm" />
                    <div>
                      <p className="font-body text-sm font-semibold text-white">{storyFounder.name}</p>
                      <p className="font-body text-xs text-white/70">
                        {storyBusiness?.name} · {featuredStory.location.name}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Link>
          </article>
        )}

        {/* ── Right column: Founder + Idea ─────────────────────────────────── */}
        <div className="flex flex-col gap-5">
          {/* Founder of the Day */}
          {featuredFounder && (
            <article
              className="group flex-1 bg-surface rounded-2xl p-5 shadow-card hover:shadow-md transition-all duration-200"
              aria-label={`Founder of the Day: ${featuredFounder.name}`}
            >
              <p className="font-body text-xs font-semibold text-primary uppercase tracking-widest mb-3">Founder of the Day</p>
              <div className="flex items-start gap-3 mb-3">
                <Link to={`/founders/${featuredFounder.slug}`} aria-label={`View ${featuredFounder.name}'s profile`}>
                  <Avatar src={featuredFounder.avatar} alt={featuredFounder.name} size="lg" className="ring-2 ring-border" />
                </Link>
                <div className="min-w-0 flex-1">
                  <h3 className="font-heading text-base font-semibold text-charcoal leading-tight">
                    <Link to={`/founders/${featuredFounder.slug}`} className="hover:text-primary transition-colors focus:outline-none focus-visible:underline">
                      {featuredFounder.name}
                    </Link>
                  </h3>
                  <p className="font-body text-xs text-primary font-medium">{featuredFounder.industry.name}</p>
                  <p className="font-body text-xs text-muted">{featuredFounder.location.name}</p>
                </div>
              </div>
              <p className="font-body text-sm text-muted leading-relaxed line-clamp-2 mb-3">
                {featuredFounder.bio}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {featuredFounder.topics.slice(0, 2).map(t => (
                  <Badge key={t.id} label={t.name} variant="secondary" />
                ))}
              </div>
            </article>
          )}

          {/* Idea of the Day */}
          {featuredIdea && (
            <article
              className="group bg-secondary/5 border border-secondary/15 rounded-2xl p-5 hover:bg-secondary/8 transition-colors duration-200"
              aria-label={`Idea of the Day: ${featuredIdea.title}`}
            >
              <p className="font-body text-xs font-semibold text-secondary uppercase tracking-widest mb-3">Idea of the Day</p>
              <h3 className="font-heading text-base font-semibold text-charcoal leading-snug mb-2">
                <Link to={`/ideas/${featuredIdea.slug}`} className="hover:text-secondary transition-colors focus:outline-none focus-visible:underline">
                  {featuredIdea.title}
                </Link>
              </h3>
              <p className="font-body text-sm text-muted line-clamp-2 mb-3">
                {featuredIdea.description}
              </p>
              <p className="font-body text-xs text-muted">
                <strong className="text-charcoal">{featuredIdea.relatedStoryIds.length}</strong> stories &nbsp;·&nbsp;
                <strong className="text-charcoal">{featuredIdea.relatedFounderIds.length}</strong> founders
              </p>
            </article>
          )}
        </div>

        {/* ── Bottom row: Business + Event ─────────────────────────────────── */}
        {featuredBusiness && (
          <article
            className="group bg-surface rounded-2xl p-5 shadow-card hover:shadow-md transition-all duration-200"
            aria-label={`Featured business: ${featuredBusiness.name}`}
          >
            <p className="font-body text-xs font-semibold text-[#8a6a1e] uppercase tracking-widest mb-3">Featured Business</p>
            <div className="flex items-start gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-background ring-2 ring-border">
                <img src={featuredBusiness.logo} alt={`${featuredBusiness.name} logo`} className="w-full h-full object-cover" loading="lazy" />
              </div>
              <div className="min-w-0">
                <h3 className="font-heading text-base font-semibold text-charcoal leading-tight">
                  <Link to={`/businesses/${featuredBusiness.slug}`} className="hover:text-primary transition-colors focus:outline-none focus-visible:underline">
                    {featuredBusiness.name}
                  </Link>
                </h3>
                <p className="font-body text-xs text-muted">{featuredBusiness.location.name} · {featuredBusiness.industry.name}</p>
              </div>
            </div>
            <p className="font-body text-sm text-muted line-clamp-2 mb-3">{featuredBusiness.tagline}</p>
            {featuredBusiness.offers[0] && (
              <a
                href={featuredBusiness.offers[0].ctaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-primary hover:text-[#b05a35] transition-colors"
                aria-label={`${featuredBusiness.offers[0].ctaLabel} — ${featuredBusiness.name}`}
              >
                {featuredBusiness.offers[0].ctaLabel} →
              </a>
            )}
          </article>
        )}

        {featuredEvent && (
          <article
            className="group bg-surface rounded-2xl p-5 shadow-card hover:shadow-md transition-all duration-200"
            aria-label={`Upcoming event: ${featuredEvent.title}`}
          >
            <p className="font-body text-xs font-semibold text-[#B85C3A] uppercase tracking-widest mb-3">Upcoming Event</p>
            <h3 className="font-heading text-base font-semibold text-charcoal leading-snug mb-2">
              {featuredEvent.title}
            </h3>
            {featuredEvent.date && (
              <time dateTime={featuredEvent.date} className="font-body text-sm text-primary font-medium block mb-2">
                {formatDate(featuredEvent.date)}
              </time>
            )}
            {featuredEvent.location && (
              <p className="font-body text-xs text-muted mb-3 flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                {featuredEvent.location.name}
              </p>
            )}
            <p className="font-body text-sm text-muted line-clamp-2 mb-3">{featuredEvent.description}</p>
            <a
              href={featuredEvent.ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-primary hover:text-[#b05a35] transition-colors"
            >
              {featuredEvent.ctaLabel} →
            </a>
          </article>
        )}
      </div>
    </section>
  )
}
