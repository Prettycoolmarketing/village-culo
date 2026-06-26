import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { usePageTitle } from '../utils/usePageTitle'
import { founders, getFounder }   from '../data/founders'
import { getBusiness }            from '../data/businesses'
import { StoryGrid }              from '../widgets/StoryGrid'
import { IdeaGrid }               from '../widgets/IdeaGrid'
import { EventGrid }              from '../widgets/EventGrid'
import { FounderGrid }            from '../widgets/FounderGrid'
import { BusinessCard }           from '../components/cards/BusinessCard'
import { Badge }                  from '../components/ui/Badge'
import { Avatar }                 from '../components/ui/Avatar'
import { InnerContainer }         from '../components/layout/PageContainer'

// ─── Social link icons ──────────────────────────────────────────────────────────

function WebIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  )
}

function LinkedInIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  )
}

// ─── Not Found ──────────────────────────────────────────────────────────────────

function FounderNotFound({ slug }: { slug: string }) {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4" id="founder-not-found">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6" aria-hidden="true">
          <svg className="w-8 h-8 text-primary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h1 className="font-heading text-2xl font-semibold text-charcoal mb-3">
          Founder not found
        </h1>
        <p className="font-body text-muted mb-2">
          We couldn't find a founder with the slug <code className="text-sm bg-border px-1.5 py-0.5 rounded">{slug}</code>.
        </p>
        <p className="font-body text-sm text-muted mb-8">
          They may not have published yet, or the URL may have changed.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/founders"
            className="px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-[#b05a35] transition-colors"
          >
            Browse All Founders
          </Link>
          <Link
            to="/"
            className="px-5 py-2.5 border border-border text-charcoal text-sm font-medium rounded-xl hover:border-primary hover:text-primary transition-colors"
          >
            Back to Village
          </Link>
        </div>
      </div>
    </main>
  )
}

// ─── Related Founders logic ─────────────────────────────────────────────────────
// Score each other founder by shared attributes and take the top 3.

function getRelatedFounders(founderId: string, industryId: string, locationId: string, topicIds: string[]) {
  return founders
    .filter(f => f.id !== founderId)
    .map(f => {
      let score = 0
      if (f.industry.id === industryId)                                    score += 3
      if (f.location.id === locationId)                                     score += 2
      if (f.topics.some(t => topicIds.includes(t.id)))                     score += 1
      return { founder: f, score }
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ founder }) => founder)
}

// ─── Founder Profile ────────────────────────────────────────────────────────────

export function FounderProfilePage() {
  const { slug } = useParams<{ slug: string }>()

  const founder = founders.find(f => f.slug === slug)
  usePageTitle(founder ? [founder.name, 'Founders'] : 'Founders')

  if (!founder) {
    return <FounderNotFound slug={slug ?? ''} />
  }

  const business      = getBusiness(founder.businessId)
  const relatedIds    = getRelatedFounders(
    founder.id,
    founder.industry.id,
    founder.location.id,
    founder.topics.map(t => t.id)
  ).map(f => f.id)

  // FounderGrid filter by explicit IDs — we pass them one at a time via topicId
  // Instead, we render using a custom filter that matches our related IDs.
  // The cleanest approach: pass featured:false + topicId from the primary topic,
  // then filter out the current founder. We handle this by using the relatedFounders
  // list directly rather than FounderGrid, since FounderGrid doesn't accept an id list.
  const relatedFounders = founders.filter(f => relatedIds.includes(f.id))

  const pageTitle = `${founder.name} — ${founder.industry.name} Founder in ${founder.location.name}`

  return (
    <main className="min-h-screen bg-background" id="founder-profile">

      {/* ── Breadcrumb ──────────────────────────────────────────────────────── */}
      <nav
        className="bg-surface border-b border-border pt-20 pb-4"
        aria-label="Breadcrumb"
      >
        <InnerContainer>
          <ol className="flex items-center gap-2 text-sm font-body text-muted" role="list">
            <li><Link to="/" className="hover:text-primary transition-colors">Village</Link></li>
            <li aria-hidden="true" className="text-border">›</li>
            <li><Link to="/founders" className="hover:text-primary transition-colors">Founders</Link></li>
            <li aria-hidden="true" className="text-border">›</li>
            <li className="text-charcoal font-medium truncate" aria-current="page">{founder.name}</li>
          </ol>
        </InnerContainer>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      {/*
        One H1. Cover image where available.
        All relationship metadata visible in readable text for SEO/GEO.
      */}
      <section aria-labelledby="founder-name">
        {/* Cover image */}
        {founder.coverImage ? (
          <div className="relative h-56 sm:h-72 md:h-80 overflow-hidden bg-charcoal">
            <img
              src={founder.coverImage}
              alt={`${founder.name}'s cover photo`}
              className="w-full h-full object-cover opacity-70"
              loading="eager"
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/20 to-transparent"
              aria-hidden="true"
            />
          </div>
        ) : (
          <div className="h-32 bg-gradient-to-br from-primary/20 to-secondary/10" aria-hidden="true" />
        )}

        {/* Hero content */}
        <div className="bg-surface border-b border-border pb-10">
          <InnerContainer>
            <div className="flex flex-col sm:flex-row sm:items-end gap-6 -mt-12 sm:-mt-16">

              {/* Avatar */}
              <Avatar
                src={founder.avatar}
                alt={founder.name}
                size="xl"
                className="ring-4 ring-surface shadow-lg flex-shrink-0 w-24 h-24 sm:w-28 sm:h-28 text-2xl"
              />

              {/* Name + quick meta */}
              <div className="flex-1 min-w-0 pt-2">
                <h1
                  id="founder-name"
                  className="font-heading text-3xl sm:text-4xl font-bold text-charcoal leading-tight"
                >
                  {founder.name}
                </h1>
                <p className="font-body text-base text-primary font-medium mt-1" aria-label="Industry">
                  {founder.industry.name}
                </p>
                <p className="font-body text-sm text-muted mt-0.5 flex items-center gap-1.5" aria-label="Location">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  {founder.location.name}, {founder.location.state}, Australia
                </p>
              </div>

              {/* Social links — top right on desktop */}
              {(founder.website || founder.instagram || founder.linkedin) && (
                <div className="flex items-center gap-2 flex-shrink-0 pb-1">
                  {founder.website && (
                    <a
                      href={founder.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-charcoal text-sm font-medium hover:border-primary hover:text-primary transition-colors"
                      aria-label={`Visit ${founder.name}'s website`}
                    >
                      <WebIcon />
                      <span className="hidden sm:inline">Website</span>
                    </a>
                  )}
                  {founder.instagram && (
                    <a
                      href={founder.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-charcoal text-sm hover:border-primary hover:text-primary transition-colors"
                      aria-label={`${founder.name} on Instagram`}
                    >
                      <InstagramIcon />
                    </a>
                  )}
                  {founder.linkedin && (
                    <a
                      href={founder.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-charcoal text-sm hover:border-primary hover:text-primary transition-colors"
                      aria-label={`${founder.name} on LinkedIn`}
                    >
                      <LinkedInIcon />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Bio */}
            <div className="mt-6 max-w-2xl">
              <p className="font-body text-base text-charcoal/80 leading-relaxed">
                {founder.bio}
              </p>
            </div>

            {/* Topic badges */}
            {founder.topics.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2" aria-label="Topics this founder covers">
                {founder.topics.map(topic => (
                  <Badge key={topic.id} label={topic.name} variant="secondary" />
                ))}
              </div>
            )}

            {/* Business pill — quick link */}
            {business && (
              <div className="mt-5">
                <Link
                  to={`/businesses/${business.slug}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-background rounded-xl border border-border text-sm font-medium text-charcoal hover:border-primary hover:text-primary transition-colors"
                  aria-label={`View ${business.name} business profile`}
                >
                  <div className="w-6 h-6 rounded overflow-hidden flex-shrink-0 bg-border">
                    <img src={business.logo} alt="" className="w-full h-full object-cover" />
                  </div>
                  {business.name}
                  <span className="text-muted text-xs">→</span>
                </Link>
              </div>
            )}
          </InnerContainer>
        </div>
      </section>

      {/* ── Main content + sidebar layout ────────────────────────────────────── */}
      <div className="py-14 md:py-16">
        <InnerContainer>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-14">

            {/* ── Left: Primary content ─────────────────────────────────────── */}
            <div className="lg:col-span-2 flex flex-col gap-14">

              {/* Stories */}
              <StoryGrid
                heading={`Stories by ${founder.name}`}
                subheading={`Blogs, reels and carousels published by ${founder.name} through CULO Village.`}
                filter={{ founderId: founder.id }}
                columns={2}
                cardVariant="vertical"
                showSummary
                showFounder={false}
                showTopics
                showCTA
                emptyTitle={`No stories yet from ${founder.name}`}
                emptyMessage="This founder hasn't published their first story yet. Check back soon."
              />

              {/* Ideas */}
              <IdeaGrid
                heading={`Ideas ${founder.name} talks about`}
                subheading={`Knowledge and insights connected to ${founder.name}'s stories and experiences.`}
                filter={{ founderId: founder.id }}
                columns={2}
                cardVariant="default"
                emptyTitle="No ideas linked yet"
                emptyMessage={`Ideas are extracted from published stories. Check back once ${founder.name} publishes more.`}
              />

              {/* Events */}
              <EventGrid
                heading="Events &amp; Opportunities"
                subheading={`Events, collaborations and opportunities from ${founder.name}.`}
                filter={{ founderId: founder.id }}
                columns={2}
                cardVariant="default"
                emptyTitle="Nothing on the board yet"
                emptyMessage={`${founder.name} hasn't posted any events or opportunities yet.`}
              />

            </div>

            {/* ── Right: Sidebar ─────────────────────────────────────────────── */}
            <aside className="lg:col-span-1 flex flex-col gap-8" aria-label="Founder details">

              {/* Business card */}
              {business && (
                <section aria-labelledby="founder-business-heading">
                  <h2
                    id="founder-business-heading"
                    className="font-heading text-lg font-semibold text-charcoal mb-4"
                  >
                    Business
                  </h2>
                  <BusinessCard
                    business={business}
                    founder={founder}
                    variant="default"
                  />
                </section>
              )}

              {/* About this founder — structured metadata, SEO-readable */}
              <section
                className="bg-surface rounded-2xl p-5 border border-border"
                aria-labelledby="founder-about-heading"
              >
                <h2
                  id="founder-about-heading"
                  className="font-heading text-base font-semibold text-charcoal mb-4"
                >
                  About {founder.name}
                </h2>
                <dl className="space-y-3 font-body text-sm">
                  <div>
                    <dt className="text-muted text-xs font-medium uppercase tracking-wide mb-1">Location</dt>
                    <dd className="text-charcoal">
                      {founder.location.name}, {founder.location.state}, Australia
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted text-xs font-medium uppercase tracking-wide mb-1">Industry</dt>
                    <dd className="text-charcoal">{founder.industry.name}</dd>
                  </div>
                  {founder.topics.length > 0 && (
                    <div>
                      <dt className="text-muted text-xs font-medium uppercase tracking-wide mb-1">Topics</dt>
                      <dd>
                        <ul className="flex flex-wrap gap-1.5" role="list">
                          {founder.topics.map(t => (
                            <li key={t.id}>
                              <Badge label={t.name} variant="secondary" />
                            </li>
                          ))}
                        </ul>
                      </dd>
                    </div>
                  )}
                  {founder.website && (
                    <div>
                      <dt className="text-muted text-xs font-medium uppercase tracking-wide mb-1">Website</dt>
                      <dd>
                        <a
                          href={founder.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline break-all"
                        >
                          {founder.website.replace(/^https?:\/\//, '')}
                        </a>
                      </dd>
                    </div>
                  )}
                </dl>
              </section>

              {/* Related founders */}
              {relatedFounders.length > 0 && (
                <section aria-labelledby="related-founders-heading">
                  <h2
                    id="related-founders-heading"
                    className="font-heading text-lg font-semibold text-charcoal mb-4"
                  >
                    Related Founders
                  </h2>
                  <div className="flex flex-col gap-3" role="list">
                    {relatedFounders.map(related => {
                      const relatedBiz = getBusiness(related.businessId)
                      // Shared attribute label
                      const sharedLocation = related.location.id === founder.location.id
                      const sharedIndustry = related.industry.id === founder.industry.id
                      const sharedLabel = sharedIndustry
                        ? related.industry.name
                        : sharedLocation
                          ? related.location.name
                          : related.topics.find(t => founder.topics.some(ft => ft.id === t.id))?.name ?? ''

                      return (
                        <div key={related.id} role="listitem">
                          <Link
                            to={`/founders/${related.slug}`}
                            className="flex items-center gap-3 bg-surface rounded-xl p-3 border border-border hover:border-primary hover:shadow-card transition-all group"
                            aria-label={`View ${related.name}'s profile`}
                          >
                            <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden bg-primary/10 ring-2 ring-border">
                              {related.avatar ? (
                                <img src={related.avatar} alt="" className="w-full h-full object-cover" loading="lazy" />
                              ) : (
                                <span className="flex items-center justify-center h-full text-primary font-heading text-sm font-semibold">
                                  {related.name[0]}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-body text-sm font-semibold text-charcoal group-hover:text-primary transition-colors truncate">
                                {related.name}
                              </p>
                              <p className="font-body text-xs text-muted truncate">
                                {relatedBiz?.name ?? related.industry.name}
                              </p>
                            </div>
                            {sharedLabel && (
                              <Badge label={sharedLabel} variant="neutral" className="flex-shrink-0 text-xs" />
                            )}
                          </Link>
                        </div>
                      )
                    })}
                  </div>
                  <Link
                    to="/founders"
                    className="mt-4 block text-center text-sm font-medium text-primary hover:text-[#b05a35] transition-colors"
                  >
                    Browse all founders →
                  </Link>
                </section>
              )}

            </aside>
          </div>
        </InnerContainer>
      </div>

    </main>
  )
}
