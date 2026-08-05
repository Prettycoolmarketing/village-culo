import React from 'react'
import { useParams, Link }  from 'react-router-dom'
import { usePageMeta } from '../utils/usePageMeta'
import { deriveSeoTitle, deriveSeoDescription } from '../utils/seo'
import { getStories, getStoryBySlug, getStory } from '../services/stories'
import { getSeries, getSeriesEpisodes } from '../services/series'
import { getFounder, getFounders } from '../services/founders'
import { getBusiness } from '../services/businesses'
import { recommendationService, publisherPartnerProfileService, trackingService } from '../services/partnership'
import { partnerService } from '../services/partner'
import { villageContentIntelligenceService } from '../services/villageIntelligence'
import { getFeaturedIn, getConnectedTo } from '../services/relationships'
import { importedContentService, PLATFORM_LABELS, detectPlatform } from '../services/importedContent'
import { FeaturedInSection } from '../components/ui/FeaturedInSection'
import { ConnectedToWidget } from '../components/ui/ConnectedToWidget'
import { ReelContent } from '../components/ui/ReelContent'
import { FounderCard }      from '../components/cards/FounderCard'
import { BusinessCard }     from '../components/cards/BusinessCard'
import { StoryCard }        from '../components/cards/StoryCard'
import { ImportedContentCard } from '../components/cards/ImportedContentCard'
import { Badge }            from '../components/ui/Badge'
import { VillageIntelligenceBlock } from '../components/ui/VillageIntelligenceBlock'
import { CreateWithCuloCTA } from '../components/ui/CreateWithCuloCTA'
import { TrackedRecommendationLink } from '../components/ui/TrackedRecommendationLink'
import { InnerContainer }   from '../components/layout/PageContainer'
import { contentTypeLabel, formatDate } from '../utils/slugify'
import type { ContentType, Story } from '../types'
import { normalizeUrl, isDirectAudioUrl } from '../utils/url'

const DISCLOSURE_TYPE_LABELS: Record<string, string> = {
  affiliate:          'Affiliate Relationship',
  referral:           'Referral Partner',
  sponsored:          'Sponsored Content',
  gifted:             'Gifted Product',
  'paid-partnership': 'Paid Partnership',
  ambassador:         'Brand Ambassador',
  'creator-program':  'Creator Program',
  'community-partner':'Community Partner',
  none:               'Genuine Recommendation',
}

// ─── Not found ──────────────────────────────────────────────────────────────────

function StoryNotFound({ slug }: { slug: string }) {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div
          className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6"
          aria-hidden="true"
        >
          <svg className="w-8 h-8 text-primary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
        </div>
        <h1 className="font-heading text-2xl font-semibold text-charcoal mb-3">Story not found</h1>
        <p className="font-body text-muted mb-2">
          We couldn't find a story with the slug{' '}
          <code className="text-sm bg-border px-1.5 py-0.5 rounded">{slug}</code>.
        </p>
        <p className="font-body text-sm text-muted mb-8">
          It may not have been published yet, or the URL may have changed.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/stories"
            className="px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-[#b05a35] transition-colors"
          >
            Browse All Stories
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

// ─── Blog content renderer ──────────────────────────────────────────────────────

function BlogContent({ content }: { content: string }) {
  // Converts markdown-lite blog text into semantic HTML blocks.
  // Handles: ## headings, **bold**, - list items, plain paragraphs, blank lines.
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let listBuffer: string[] = []
  let key = 0

  const flushList = () => {
    if (listBuffer.length > 0) {
      elements.push(
        <ul key={key++} className="list-disc list-outside pl-5 space-y-1.5 my-4 font-body text-base text-charcoal/80 leading-relaxed">
          {listBuffer.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      )
      listBuffer = []
    }
  }

  for (const raw of lines) {
    const line = raw.trim()

    if (line.startsWith('## ')) {
      flushList()
      elements.push(
        <h2 key={key++} className="font-heading text-xl font-semibold text-charcoal mt-8 mb-3 leading-snug">
          {line.slice(3)}
        </h2>
      )
    } else if (line.startsWith('**') && line.endsWith('**')) {
      flushList()
      elements.push(
        <p key={key++} className="font-body text-base font-semibold text-charcoal mt-5 mb-1">
          {line.slice(2, -2)}
        </p>
      )
    } else if (line.startsWith('- ')) {
      listBuffer.push(line.slice(2))
    } else if (line === '') {
      flushList()
    } else {
      flushList()
      elements.push(
        <p key={key++} className="font-body text-base text-charcoal/80 leading-relaxed my-3">
          {line}
        </p>
      )
    }
  }
  flushList()

  return (
    <article
      aria-label="Blog content"
      className="max-w-prose"
    >
      {elements}
    </article>
  )
}

// ─── Carousel tab — simple accessible image grid ─────────────────────────────

function CarouselContent({ images, title }: { images: string[]; title: string }) {
  return (
    <div aria-label={`Carousel images for "${title}"`}>
      <ul
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
        role="list"
      >
        {images.map((src, i) => (
          <li key={i} role="listitem">
            <div className="rounded-xl overflow-hidden" style={{ aspectRatio: '1/1' }}>
              <img
                src={src}
                alt={`Carousel slide ${i + 1} of ${images.length} — ${title}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </li>
        ))}
      </ul>
      <p className="font-body text-xs text-muted mt-3">
        {images.length} {images.length === 1 ? 'slide' : 'slides'} · {title}
      </p>
    </div>
  )
}

// ─── Story Detail Page ──────────────────────────────────────────────────────────

export function StoryDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const story = getStoryBySlug(slug ?? '')

  // Pre-guard lookups — hooks must be called unconditionally before any early return
  const founder = story ? getFounder(story.founderId) : undefined
  const intel   = story ? (villageContentIntelligenceService.getByContent('story', story.id) ?? null) : null
  const jsonLdSource = story?.importedContentId ? importedContentService.get(story.importedContentId) : undefined
  const storyFeaturedIn = story ? getFeaturedIn('story', story.id) : []
  const storyConnectedTo = story ? getConnectedTo('story', story.id) : []
  const bookingUrl = founder ? publisherPartnerProfileService.get(founder.id)?.bookingUrl : undefined
  const partner = story?.partnerId ? partnerService.get(story.partnerId) : undefined

  function handleCtaClick() {
    if (!partner || !story) return
    void trackingService.record({
      founderId: story.founderId,
      businessId: partner.id,
      linkType: 'affiliate',
      sourcePage: 'story',
      storyId: story.id,
      redirectUrl: story.ctaUrl,
    })
  }
  // A video link pasted into the wrong wizard field (e.g. "Document/External
  // Link" instead of "YouTube/Video URL") shouldn't mean the video never
  // plays — fall back to ctaUrl when it's clearly a video source itself.
  const VIDEO_PLATFORMS = new Set(['youtube', 'vimeo', 'tiktok'])
  const effectiveReelUrl = story?.reelUrl
    || (story?.ctaUrl && VIDEO_PLATFORMS.has(detectPlatform(story.ctaUrl)) ? story.ctaUrl : undefined)

  // Base the tabs actually offered on what content is really there, not just
  // which formats were checked in the wizard — a founder who wrote a blog but
  // only selected "Reel" as the format shouldn't have that writing become
  // unreachable. The "reel" fallback below is only for a video URL that
  // landed somewhere with no matching contentType at all (e.g. pasted into
  // the wrong field) — if contentTypes already names the real format
  // (youtube-video, talking-head, reel), don't also synthesize a second,
  // identical tab pointing at the same video.
  const REEL_ALIASES = new Set<ContentType>(['reel', 'youtube-video', 'talking-head'])
  const availableTypes: ContentType[] = story ? [...new Set([
    ...(story.blog ? ['blog' as const] : []),
    ...(effectiveReelUrl && !story.contentTypes.some(t => REEL_ALIASES.has(t)) ? ['reel' as const] : []),
    ...(story.carouselImages && story.carouselImages.length > 0 ? ['carousel' as const] : []),
    ...story.contentTypes,
  ])] : []

  usePageMeta({
    title:       story ? deriveSeoTitle(story.title) : undefined,
    description: story ? deriveSeoDescription(story.summary, story.blog) : undefined,
    keywords:    intel?.seoKeywords.slice(0, 15),
    ogType:      'article',
    ogImage:     story?.coverImage,
    jsonLd:      story && (story.status === 'published' || story.status === 'featured') ? {
      '@context':      'https://schema.org',
      '@type':         'Article',
      headline:        story.title,
      description:     story.summary?.slice(0, 200) ?? '',
      ...(founder ? {
        author: {
          '@type': 'Person',
          name:    founder.name,
          url:     `${window.location.origin}/founders/${founder.slug}`,
        },
      } : {}),
      datePublished: story.createdAt,
      ...(story.coverImage ? { image: story.coverImage } : {}),
      ...(intel?.seoKeywords.length ? { keywords: intel.seoKeywords.join(', ') } : {}),
      ...(intel?.canonicalTopics.length ? {
        about: intel.canonicalTopics.map(t => ({ '@type': 'Thing', name: t })),
      } : {}),
      ...(intel && (intel.people.length > 0 || intel.businesses.length > 0) ? {
        mentions: [
          ...intel.people.map(p => ({ '@type': 'Person', name: p })),
          ...intel.businesses.map(b => ({ '@type': 'Organization', name: b })),
        ].slice(0, 10),
      } : {}),
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id':   `${window.location.origin}/stories/${story.slug}`,
      },
      publisher: {
        '@type': 'Organization',
        name:    'CULO Village',
        url:     window.location.origin,
      },
      ...(storyFeaturedIn.length > 0 ? { sameAs: storyFeaturedIn.map(f => f.source.url).filter(Boolean) } : {}),
      ...(jsonLdSource ? {
        isBasedOn: {
          '@type': 'CreativeWork',
          url: jsonLdSource.originalUrl,
          ...(jsonLdSource.originalAuthor ? { author: jsonLdSource.originalAuthor } : {}),
        },
      } : {}),
    } : undefined,
  })

  if (!story || (story.status !== 'published' && story.status !== 'featured')) return <StoryNotFound slug={slug ?? ''} />

  const business = getBusiness(story.businessId)

  // Series context — undefined for the vast majority of stories that aren't
  // part of one, in which case none of this renders and the page is
  // identical to how it's always worked.
  const series = story.seriesId ? getSeries(story.seriesId) : undefined
  const seriesEpisodes = series
    ? getSeriesEpisodes(series.id).filter(ep => ep.status === 'published' || ep.status === 'featured')
    : []
  const seriesIndex = seriesEpisodes.findIndex(ep => ep.id === story.id)
  const prevEpisode = seriesIndex > 0 ? seriesEpisodes[seriesIndex - 1] : undefined
  const nextEpisode = seriesIndex >= 0 && seriesIndex < seriesEpisodes.length - 1 ? seriesEpisodes[seriesIndex + 1] : undefined
  const sourceImport = story.importedContentId ? importedContentService.get(story.importedContentId) : undefined
  const approvedRecs = recommendationService.getAll({ storyId: story.id, status: 'approved' })
    .filter(r => r.disclosureVisible)

  // Related stories: prefer relatedStoryIds, then intel relatedContentIds, fall back to same primary topic
  const notHiddenFromRelated = (s: Story) => !s.hiddenLocations?.includes('related')
  const related = (() => {
    if (story.relatedStoryIds.length > 0) {
      return getStories({ publicOnly: true })
        .filter(s => story.relatedStoryIds.includes(s.id) && s.id !== story.id && notHiddenFromRelated(s))
        .slice(0, 3)
    }
    if (intel && intel.relatedContentIds.length > 0) {
      const fromIntel = intel.relatedContentIds
        .map(id => getStory(id))
        .filter((s): s is NonNullable<typeof s> => !!s && s.id !== story.id && (s.status === 'published' || s.status === 'featured') && notHiddenFromRelated(s))
        .slice(0, 3)
      if (fromIntel.length > 0) return fromIntel
    }
    if (story.topics.length > 0) {
      return getStories({ topicId: story.topics[0].id, publicOnly: true, limit: 4 })
        .filter(s => s.id !== story.id && notHiddenFromRelated(s))
        .slice(0, 3)
    }
    return []
  })()

  // Other published stories by the same founder — a reader who liked this one
  // is more likely to want more from this founder than an "Ideas" module that
  // usually has nothing in it yet.
  const otherStoriesByFounder = getStories({ founderId: story.founderId, publicOnly: true })
    .filter(s => s.id !== story.id && notHiddenFromRelated(s))
    .slice(0, 4)

  // Related imported content from intel
  const relatedImports = intel
    ? intel.relatedContentIds
        .map(id => importedContentService.get(id))
        .filter((c): c is NonNullable<typeof c> => !!c && (c.status === 'published' || c.status === 'featured') && (c.visibility === 'public' || c.visibility === 'discoverable'))
        .slice(0, 3)
    : []

  // Related founders from intel
  const intelRelatedFounders = intel
    ? intel.relatedFounderIds
        .map(id => getFounders({ publicOnly: true }).find(f => f.id === id))
        .filter((f): f is NonNullable<typeof f> => !!f && f.id !== story.founderId)
        .slice(0, 3)
    : []

  // Related businesses from intel
  const intelRelatedBusinesses = intel
    ? intel.relatedBusinessIds
        .map(id => getBusiness(id))
        .filter((b): b is NonNullable<typeof b> => !!b && (b.status === 'published' || b.status === 'featured'))
        .slice(0, 3)
    : []

  return (
    <main className="min-h-screen bg-background">

      {/* ── Breadcrumb ──────────────────────────────────────────────────────── */}
      <nav
        className="bg-surface border-b border-border pt-20 pb-4"
        aria-label="Breadcrumb"
      >
        <InnerContainer>
          <ol className="flex items-center gap-2 text-sm font-body text-muted flex-wrap" role="list">
            <li><Link to="/" className="hover:text-primary transition-colors">Village</Link></li>
            <li aria-hidden="true" className="text-border">›</li>
            {series ? (
              <>
                <li><Link to={`/series/${series.slug}`} className="hover:text-primary transition-colors">{series.title}</Link></li>
                <li aria-hidden="true" className="text-border">›</li>
                <li className="text-charcoal font-medium line-clamp-1" aria-current="page">
                  {seriesIndex >= 0 ? `Episode ${seriesIndex + 1}: ${story.title}` : story.title}
                </li>
              </>
            ) : (
              <>
                <li><Link to="/stories" className="hover:text-primary transition-colors">Stories</Link></li>
                <li aria-hidden="true" className="text-border">›</li>
                <li className="text-charcoal font-medium line-clamp-1" aria-current="page">{story.title}</li>
              </>
            )}
          </ol>
        </InnerContainer>
      </nav>

      {/* ── Story hero ──────────────────────────────────────────────────────── */}
      <section aria-labelledby="story-title">
        {/* Cover image */}
        <div className="relative h-64 sm:h-80 md:h-96 overflow-hidden bg-charcoal">
          <img
            src={story.coverImage}
            alt={`Cover image for "${story.title}"`}
            className="w-full h-full object-cover opacity-60"
            loading="eager"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/30 to-transparent"
            aria-hidden="true"
          />
          {/* Content type badges over image */}
          <div className="absolute top-4 left-4 flex flex-wrap gap-2" aria-label="Content formats">
            {story.contentTypes.map(type => (
              <span
                key={type}
                className="px-3 py-1 rounded-full text-xs font-medium bg-surface/90 backdrop-blur-sm text-charcoal"
              >
                {contentTypeLabel(type)}
              </span>
            ))}
            {story.featured && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-accent text-charcoal">
                Featured
              </span>
            )}
          </div>
        </div>

        {/* Hero content */}
        <div className="bg-surface border-b border-border pb-10">
          <InnerContainer>
            <div className="pt-12 sm:pt-16">
              {/* H1 — full-width across the page, not boxed to the reading column below */}
              <h1
                id="story-title"
                className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold text-charcoal leading-tight mb-3 max-w-4xl"
              >
                {story.title}
              </h1>

              {story.subtitle && (
                <p className="font-body text-lg sm:text-xl text-muted leading-relaxed mt-3 mb-8 max-w-2xl">
                  {story.subtitle}
                </p>
              )}

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-body text-muted mb-6">
                {founder && (
                  <Link
                    to={`/founders/${founder.slug}`}
                    className="flex items-center gap-2 hover:text-primary transition-colors font-medium text-charcoal"
                    aria-label={`View ${founder.name}'s profile`}
                  >
                    <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                      <img
                        src={founder.avatar}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {founder.name}
                  </Link>
                )}
                {business && (
                  <Link
                    to={`/businesses/${business.slug}`}
                    className="hover:text-primary transition-colors"
                    aria-label={`View ${business.name}`}
                  >
                    {business.name}
                  </Link>
                )}
                {bookingUrl && (
                  <a
                    href={normalizeUrl(bookingUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary/10 text-primary font-medium hover:bg-primary/15 transition-colors"
                    aria-label={`Book a call with ${founder?.name}`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Book a call
                  </a>
                )}
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-primary/50 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  {story.location.name}, {story.location.state}
                </span>
                <span>{story.industry.name}</span>
                <time
                  dateTime={story.createdAt}
                  className="text-muted"
                  aria-label={`Published ${formatDate(story.createdAt)}`}
                >
                  {formatDate(story.createdAt)}
                </time>
              </div>

              {/* Topic badges */}
              <div className="flex flex-wrap gap-2 mb-6" aria-label="Topics">
                {story.topics.map(t => (
                  <Link key={t.id} to={`/topics/${t.slug}`}>
                    <Badge label={t.name} variant="secondary" />
                  </Link>
                ))}
              </div>

              {/* Original source attribution */}
              {sourceImport && (
                <p className="text-sm text-muted mb-6">
                  Originally published on{' '}
                  <a
                    href={normalizeUrl(sourceImport.originalUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-medium"
                  >
                    {PLATFORM_LABELS[sourceImport.sourcePlatform] ?? sourceImport.sourcePlatform}
                  </a>
                  {sourceImport.originalAuthor ? ` by ${sourceImport.originalAuthor}` : ''}.
                </p>
              )}

              {/* CTA + any additional links + the standalone "join" CTA */}
              <div className="flex flex-wrap gap-3">
                {story.ctaLabel && story.ctaUrl && (
                  <a
                    href={normalizeUrl(story.ctaUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleCtaClick}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-medium rounded-xl hover:bg-[#b05a35] transition-colors shadow-sm"
                    aria-label={`${story.ctaLabel} — related to ${story.title}`}
                  >
                    {story.ctaLabel}
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
                {story.additionalLinks?.filter(l => l.label && l.url).map((link, i) => (
                  <a
                    key={i}
                    href={normalizeUrl(link.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 border border-border text-charcoal font-medium rounded-xl hover:border-primary hover:text-primary transition-colors"
                    aria-label={`${link.label} — related to ${story.title}`}
                  >
                    {link.label}
                  </a>
                ))}
                {/* Not story-specific — a standing invitation for any visitor
                    reading a founder's story to join and build their own. */}
                <Link
                  to="/onboarding"
                  className="inline-flex items-center gap-2 px-6 py-3 border border-border text-charcoal font-medium rounded-xl hover:border-primary hover:text-primary transition-colors"
                >
                  Feature in CULO Village
                </Link>
              </div>
            </div>
          </InnerContainer>
        </div>
      </section>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <div className="py-12 md:py-16">
        <InnerContainer>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-14">

            {/* ── Left: content + ideas + related ──────────────────────────── */}
            <div className="lg:col-span-2 flex flex-col gap-12">

              {/* Story content — always shown together (blog with its video
                  underneath), never behind a tab switcher. A founder who
                  wrote a blog AND has a video wants a visitor to see both,
                  not pick one and miss the other. */}
              <section aria-label="Story content" className="flex flex-col gap-10">
                {story.blog && (
                  <div>
                    <h2 className="font-heading text-2xl font-semibold text-charcoal mb-5">Blog</h2>
                    <BlogContent content={story.blog} />
                  </div>
                )}

                {effectiveReelUrl && (
                  <div>
                    <h2 className="font-heading text-2xl font-semibold text-charcoal mb-5">Video</h2>
                    <ReelContent
                      reelUrl={effectiveReelUrl}
                      title={story.title}
                      summary={story.blog ? '' : story.summary}
                      landscape={story.videoOrientation
                        ? story.videoOrientation === 'landscape'
                        : story.contentTypes.includes('youtube-video') || story.contentTypes.includes('talking-head')}
                    />
                    {story.additionalReelUrls && story.additionalReelUrls.length > 0 && (
                      <div className="mt-6">
                        <p className="font-heading text-sm font-semibold text-charcoal mb-3">More videos from this story</p>
                        <div className="flex gap-4 overflow-x-auto pb-1">
                          {story.additionalReelUrls.map((url, i) => (
                            <div key={i} className="shrink-0 w-40">
                              <ReelContent reelUrl={url} title={story.title} summary="" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {story.carouselImages && story.carouselImages.length > 0 && (
                  <div>
                    <h2 className="font-heading text-2xl font-semibold text-charcoal mb-5">Carousel</h2>
                    <CarouselContent images={story.carouselImages} title={story.title} />
                  </div>
                )}

                {/* Remaining content types with no dedicated section above (podcast, document, etc.) */}
                {([
                  ['podcast',          story.audioUrl],
                  ['voice-over',       story.audioUrl],
                  ['document',         story.ctaUrl],
                  ['external-article', story.ctaUrl],
                  ['social-post',      story.ctaUrl],
                ] as [ContentType, string | undefined][])
                  .filter(([t]) => story.contentTypes.includes(t))
                  .map(([type, url]) => (
                    <div key={type}>
                      <h2 className="font-heading text-2xl font-semibold text-charcoal mb-5">{contentTypeLabel(type)}</h2>
                      {(type === 'podcast' || type === 'voice-over') && isDirectAudioUrl(url) ? (
                        <audio src={url} controls className="w-full" />
                      ) : url ? (
                        <div className="py-2">
                          <a href={url} target="_blank" rel="noopener noreferrer"
                             className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-medium rounded-xl hover:bg-[#b05a35] transition-colors text-sm">
                            View {contentTypeLabel(type)} ↗
                          </a>
                        </div>
                      ) : (
                        <p className="font-body text-muted text-sm italic">
                          {contentTypeLabel(type)} content will appear here once published.
                        </p>
                      )}
                    </div>
                  ))}

                {!story.blog && !effectiveReelUrl && (!story.carouselImages || story.carouselImages.length === 0) && availableTypes.length === 0 && (
                  <p className="font-body text-muted text-sm italic">Content will appear here once published.</p>
                )}
              </section>

              {/* Next episode — the binge mechanic. Only renders when this
                  story actually belongs to a published series. */}
              {series && (
                <section aria-label="Series navigation" className="bg-surface border border-border rounded-2xl p-6 flex items-center justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <p className="font-body text-xs font-semibold text-primary uppercase tracking-widest mb-1">
                      {series.title} · Episode {seriesIndex + 1} of {seriesEpisodes.length}
                    </p>
                    {nextEpisode ? (
                      <p className="font-heading text-lg font-semibold text-charcoal truncate">Up next: {nextEpisode.title}</p>
                    ) : (
                      <p className="font-heading text-lg font-semibold text-charcoal">That's the whole series so far.</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {prevEpisode && (
                      <Link to={`/stories/${prevEpisode.slug}`}
                        className="px-4 py-2.5 border border-border text-charcoal text-sm font-medium rounded-xl hover:border-primary hover:text-primary transition-colors">
                        ← Previous
                      </Link>
                    )}
                    {nextEpisode ? (
                      <Link to={`/stories/${nextEpisode.slug}`}
                        className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] transition-colors">
                        Next Episode →
                      </Link>
                    ) : (
                      <Link to={`/series/${series.slug}`}
                        className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] transition-colors">
                        View Series →
                      </Link>
                    )}
                  </div>
                </section>
              )}

              {/* Other stories by this founder */}
              {otherStoriesByFounder.length > 0 && (
                <section aria-labelledby="other-stories-heading">
                  <h2
                    id="other-stories-heading"
                    className="font-heading text-2xl font-semibold text-charcoal mb-6"
                  >
                    Other stories by this village member
                  </h2>
                  <ul
                    className="grid grid-cols-1 sm:grid-cols-2 gap-5"
                    role="list"
                    aria-label={`Other stories by ${founder?.name ?? 'this founder'}`}
                  >
                    {otherStoriesByFounder.map(other => (
                      <li key={other.id}>
                        <StoryCard
                          story={other}
                          founder={founder}
                          business={business}
                          variant="compact"
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Approved recommendations disclosed in this story */}
              {approvedRecs.length > 0 && (
                <section aria-labelledby="story-recs-heading">
                  <h2 id="story-recs-heading" className="font-heading text-2xl font-semibold text-charcoal mb-2">
                    Recommended in this Story
                  </h2>
                  <p className="font-body text-sm text-muted mb-6">
                    These are genuine recommendations mentioned in this story. Each has been reviewed and approved by the author with a disclosure statement.
                  </p>
                  <ul className="flex flex-col gap-4" role="list">
                    {approvedRecs.map(rec => (
                      <li key={rec.id} className="bg-surface rounded-2xl border border-border p-5">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className="font-heading text-base font-semibold text-charcoal leading-snug">{rec.entityName}</h3>
                          {rec.disclosureType !== 'none' && (
                            <span className="flex-shrink-0 font-body text-xs font-semibold px-2.5 py-1 rounded-full bg-secondary/10 text-secondary">
                              {DISCLOSURE_TYPE_LABELS[rec.disclosureType] ?? rec.disclosureType}
                            </span>
                          )}
                        </div>
                        {rec.disclosureText && (
                          <p className="font-body text-sm text-muted leading-relaxed border-l-2 border-border pl-3 italic">
                            {rec.disclosureText}
                          </p>
                        )}
                        {rec.detectedInContext && (
                          <p className="font-body text-xs text-muted/70 mt-2 leading-relaxed">
                            Mentioned: "{rec.detectedInContext}"
                          </p>
                        )}
                        {rec.businessId && (
                          <div className="mt-3 pt-3 border-t border-border">
                            <TrackedRecommendationLink
                              founderId={rec.founderId}
                              businessId={rec.businessId}
                              recommendationId={rec.id}
                              storyId={story.id}
                              businessWebsite={getBusiness(rec.businessId)?.website}
                              sourcePage="story"
                              className="font-body text-xs font-semibold text-primary hover:text-[#b05a35] transition-colors"
                            />
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Frequently Asked Questions — the founder's own real, answered
                  FAQs, never an auto-generated question with no real answer
                  behind it. */}
              {(() => {
                // Founder.faqs is every FAQ across everything they've ever
                // published — without this filter, one founder's FAQs from a
                // totally different story all showed up here too.
                const answeredFaqs = (founder?.faqs ?? []).filter(
                  f => f.answer.trim().length > 0 && f.relatedStoryIds.includes(story.id)
                )
                if (answeredFaqs.length === 0) return null
                return (
                  <section aria-labelledby="story-faq-heading">
                    <h2 id="story-faq-heading" className="font-heading text-2xl font-semibold text-charcoal mb-6">
                      Frequently Asked Questions
                    </h2>
                    <ul className="flex flex-col gap-3" role="list">
                      {answeredFaqs.slice(0, 8).map(faq => (
                        <li key={faq.id} className="px-4 py-3 bg-surface rounded-xl border border-border">
                          <p className="font-body text-sm font-semibold text-charcoal">{faq.question}</p>
                          <p className="font-body text-sm text-muted leading-relaxed mt-1">{faq.answer}</p>
                        </li>
                      ))}
                    </ul>
                  </section>
                )
              })()}

              {/* Related Village Content — imported content from intel */}
              {relatedImports.length > 0 && (
                <section aria-labelledby="related-imports-heading">
                  <h2
                    id="related-imports-heading"
                    className="font-heading text-2xl font-semibold text-charcoal mb-2"
                  >
                    Related Village Content
                  </h2>
                  <p className="font-body text-sm text-muted mb-6">
                    Other content in the Village on similar topics.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {relatedImports.map(item => (
                      <ImportedContentCard key={item.id} content={item} />
                    ))}
                  </div>
                </section>
              )}

              {/* Related founders from intel */}
              {intelRelatedFounders.length > 0 && (
                <section aria-labelledby="related-founders-intel-heading">
                  <h2
                    id="related-founders-intel-heading"
                    className="font-heading text-2xl font-semibold text-charcoal mb-6"
                  >
                    Related Founders
                  </h2>
                  <div className="flex flex-col gap-3">
                    {intelRelatedFounders.map(f => {
                      const fBiz = getBusiness(f.businessId)
                      return (
                        <Link
                          key={f.id}
                          to={`/founders/${f.slug}`}
                          className="flex items-center gap-3 bg-surface rounded-xl p-3 border border-border hover:border-primary hover:shadow-sm transition-all group"
                          aria-label={`View ${f.name}'s profile`}
                        >
                          <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden bg-primary/10 ring-2 ring-border">
                            {f.avatar
                              ? <img src={f.avatar} alt="" className="w-full h-full object-cover" loading="lazy" />
                              : <span className="flex items-center justify-center h-full text-primary font-heading text-sm font-semibold">{f.name[0]}</span>
                            }
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-body text-sm font-semibold text-charcoal group-hover:text-primary transition-colors truncate">{f.name}</p>
                            <p className="font-body text-xs text-muted truncate">{fBiz?.name ?? f.industry.name}</p>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </section>
              )}

              {/* Related businesses from intel */}
              {intelRelatedBusinesses.length > 0 && (
                <section aria-labelledby="related-businesses-intel-heading">
                  <h2
                    id="related-businesses-intel-heading"
                    className="font-heading text-2xl font-semibold text-charcoal mb-6"
                  >
                    Related Businesses
                  </h2>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4" role="list">
                    {intelRelatedBusinesses.map(b => {
                      const bFounder = getFounder(b.founderId)
                      return (
                        <li key={b.id}>
                          <BusinessCard business={b} founder={bFounder} variant="default" />
                        </li>
                      )
                    })}
                  </ul>
                </section>
              )}

              <FeaturedInSection items={storyFeaturedIn} headingId="story-featured-in-heading" />

              <ConnectedToWidget items={storyConnectedTo} headingId="story-connected-to-heading" />

              {/* Related stories */}
              {related.length > 0 && (
                <section aria-labelledby="related-stories-heading">
                  <h2
                    id="related-stories-heading"
                    className="font-heading text-2xl font-semibold text-charcoal mb-6"
                  >
                    Related Stories
                  </h2>
                  <ul
                    className="grid grid-cols-1 sm:grid-cols-2 gap-5"
                    role="list"
                    aria-label="Related stories"
                  >
                    {related.map(rel => {
                      const relFounder  = getFounder(rel.founderId)
                      const relBusiness = getBusiness(rel.businessId)
                      return (
                        <li key={rel.id}>
                          <StoryCard
                            story={rel}
                            founder={relFounder}
                            business={relBusiness}
                            variant="compact"
                          />
                        </li>
                      )
                    })}
                  </ul>
                  <div className="mt-6">
                    <Link
                      to="/stories"
                      className="text-sm font-medium text-primary hover:text-[#b05a35] transition-colors"
                    >
                      Browse all stories →
                    </Link>
                  </div>
                </section>
              )}

              {/* Create with CULO CTA */}
              <CreateWithCuloCTA
                variant="banner"
                label="Create content from your messy thoughts and raw footage"
              />

            </div>

            {/* ── Right: sidebar ─────────────────────────────────────────────── */}
            <aside className="lg:col-span-1 flex flex-col gap-8" aria-label="Story details">

              <CreateWithCuloCTA variant="button" />

              {/* Founder */}
              {founder && (
                <section aria-labelledby="story-founder-heading">
                  <h2
                    id="story-founder-heading"
                    className="font-heading text-base font-semibold text-charcoal mb-4"
                  >
                    About the Founder
                  </h2>
                  <FounderCard
                    founder={founder}
                    business={business}
                    variant="default"
                  />
                </section>
              )}

              {/* Business */}
              {business && (
                <section aria-labelledby="story-business-heading">
                  <h2
                    id="story-business-heading"
                    className="font-heading text-base font-semibold text-charcoal mb-4"
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

              {/* Context panel — all story metadata, readable by humans and search engines */}
              <section
                className="bg-surface rounded-2xl p-5 border border-border"
                aria-labelledby="story-context-heading"
              >
                <h2
                  id="story-context-heading"
                  className="font-heading text-base font-semibold text-charcoal mb-4"
                >
                  Story Details
                </h2>
                <dl className="space-y-3 font-body text-sm">
                  {founder && (
                    <div>
                      <dt className="text-muted text-xs font-medium uppercase tracking-wide mb-1">Founder</dt>
                      <dd>
                        <Link
                          to={`/founders/${founder.slug}`}
                          className="text-charcoal font-medium hover:text-primary transition-colors"
                        >
                          {founder.name}
                        </Link>
                      </dd>
                    </div>
                  )}
                  {business && (
                    <div>
                      <dt className="text-muted text-xs font-medium uppercase tracking-wide mb-1">Business</dt>
                      <dd>
                        <Link
                          to={`/businesses/${business.slug}`}
                          className="text-charcoal hover:text-primary transition-colors"
                        >
                          {business.name}
                        </Link>
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-muted text-xs font-medium uppercase tracking-wide mb-1">Location</dt>
                    <dd className="text-charcoal">{story.location.name}, {story.location.state}</dd>
                  </div>
                  <div>
                    <dt className="text-muted text-xs font-medium uppercase tracking-wide mb-1">Industry</dt>
                    <dd className="text-charcoal">{story.industry.name}</dd>
                  </div>
                  <div>
                    <dt className="text-muted text-xs font-medium uppercase tracking-wide mb-1">Content formats</dt>
                    <dd className="flex flex-wrap gap-1.5">
                      {story.contentTypes.map(t => (
                        <Badge key={t} label={contentTypeLabel(t)} variant="neutral" />
                      ))}
                    </dd>
                  </div>
                  {story.topics.length > 0 && (
                    <div>
                      <dt className="text-muted text-xs font-medium uppercase tracking-wide mb-1">Topics</dt>
                      <dd className="flex flex-wrap gap-1.5">
                        {story.topics.map(t => (
                          <Link key={t.id} to={`/topics/${t.slug}`}>
                            <Badge label={t.name} variant="secondary" />
                          </Link>
                        ))}
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-muted text-xs font-medium uppercase tracking-wide mb-1">Published</dt>
                    <dd>
                      <time dateTime={story.createdAt} className="text-charcoal">
                        {formatDate(story.createdAt)}
                      </time>
                    </dd>
                  </div>
                  {story.ctaLabel && story.ctaUrl && (
                    <div className="pt-3 border-t border-border">
                      <a
                        href={normalizeUrl(story.ctaUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={handleCtaClick}
                        className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-[#b05a35] transition-colors"
                        aria-label={`${story.ctaLabel} — ${story.title}`}
                      >
                        {story.ctaLabel} →
                      </a>
                    </div>
                  )}
                </dl>
              </section>

              {/* Village Intelligence sidebar block */}
              {intel && <VillageIntelligenceBlock intel={intel} variant="sidebar" />}

            </aside>
          </div>
        </InnerContainer>
      </div>

    </main>
  )
}
