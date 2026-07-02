import React, { useState } from 'react'
import { useParams, Link }  from 'react-router-dom'
import { usePageMeta } from '../utils/usePageMeta'
import { getStories, getStoryBySlug, getStory } from '../services/stories'
import { getFounder, getFounders } from '../services/founders'
import { getBusiness } from '../services/businesses'
import { recommendationService } from '../services/partnership'
import { villageContentIntelligenceService } from '../services/villageIntelligence'
import { importedContentService } from '../services/importedContent'
import { IdeaGrid }         from '../widgets/IdeaGrid'
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
import type { ContentType } from '../types'
import { normalizeUrl } from '../utils/url'

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

// ─── Content format tab bar ─────────────────────────────────────────────────────

interface ContentTabsProps {
  available: ContentType[]
  active: ContentType
  onChange: (tab: ContentType) => void
}

function ContentTabs({ available, active, onChange }: ContentTabsProps) {
  return (
    <div
      className="flex gap-1 bg-background rounded-xl p-1 w-fit"
      role="tablist"
      aria-label="Story content formats"
    >
      {available.map(type => (
        <button
          key={type}
          role="tab"
          aria-selected={active === type}
          aria-controls={`tab-panel-${type}`}
          id={`tab-${type}`}
          onClick={() => onChange(type)}
          className={`
            px-4 py-2 rounded-lg text-sm font-medium font-body
            transition-all duration-150
            focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
            ${active === type
              ? 'bg-surface text-charcoal shadow-sm border border-border'
              : 'text-muted hover:text-charcoal'
            }
          `}
        >
          {contentTypeLabel(type)}
        </button>
      ))}
    </div>
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

// ─── Reel tab ───────────────────────────────────────────────────────────────────

function ReelContent({ reelUrl, title, summary }: { reelUrl?: string; title: string; summary: string }) {
  return (
    <div className="flex flex-col sm:flex-row gap-6 items-start" aria-label="Reel content">
      {/* Vertical phone frame */}
      <div
        className="flex-shrink-0 w-full sm:w-56 bg-charcoal rounded-2xl overflow-hidden relative"
        style={{ aspectRatio: '9/16' }}
        aria-label="Reel preview"
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <p className="font-body text-xs text-white/60 leading-relaxed">
            Watch on Instagram
          </p>
        </div>
        {reelUrl && (
          <a
            href={normalizeUrl(reelUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0"
            aria-label={`Watch "${title}" on Instagram`}
          />
        )}
      </div>

      {/* Reel context */}
      <div className="flex-1 min-w-0">
        <p className="font-body text-xs font-semibold text-primary uppercase tracking-widest mb-3">Reel</p>
        <h3 className="font-heading text-xl font-semibold text-charcoal leading-snug mb-3">{title}</h3>
        <p className="font-body text-base text-muted leading-relaxed mb-5">{summary}</p>
        {reelUrl && (
          <a
            href={normalizeUrl(reelUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-charcoal text-white text-sm font-medium rounded-xl hover:bg-charcoal/80 transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            Watch on Instagram
          </a>
        )}
      </div>
    </div>
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
  const [activeTab, setActiveTab] = useState<ContentType>(story?.contentTypes[0] ?? 'blog')

  usePageMeta({
    title:       story?.title,
    description: story?.summary?.slice(0, 160),
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
    } : undefined,
  })

  if (!story || (story.status !== 'published' && story.status !== 'featured')) return <StoryNotFound slug={slug ?? ''} />

  const business = getBusiness(story.businessId)
  const approvedRecs = recommendationService.getAll({ storyId: story.id, status: 'approved' })
    .filter(r => r.disclosureVisible)

  // Related stories: prefer relatedStoryIds, then intel relatedContentIds, fall back to same primary topic
  const related = (() => {
    if (story.relatedStoryIds.length > 0) {
      return getStories({ publicOnly: true })
        .filter(s => story.relatedStoryIds.includes(s.id) && s.id !== story.id)
        .slice(0, 3)
    }
    if (intel && intel.relatedContentIds.length > 0) {
      const fromIntel = intel.relatedContentIds
        .map(id => getStory(id))
        .filter((s): s is NonNullable<typeof s> => !!s && s.id !== story.id && (s.status === 'published' || s.status === 'featured'))
        .slice(0, 3)
      if (fromIntel.length > 0) return fromIntel
    }
    if (story.topics.length > 0) {
      return getStories({ topicId: story.topics[0].id, publicOnly: true, limit: 4 })
        .filter(s => s.id !== story.id)
        .slice(0, 3)
    }
    return []
  })()

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
            <li><Link to="/stories" className="hover:text-primary transition-colors">Stories</Link></li>
            <li aria-hidden="true" className="text-border">›</li>
            <li className="text-charcoal font-medium line-clamp-1" aria-current="page">{story.title}</li>
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

        {/* Hero content — overlaps cover slightly */}
        <div className="bg-surface border-b border-border pb-10">
          <InnerContainer>
            <div className="max-w-3xl -mt-10 relative z-10">
              {/* H1 */}
              <h1
                id="story-title"
                className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold text-charcoal leading-tight mb-4"
              >
                {story.title}
              </h1>

              {/* Summary */}
              <p className="font-body text-lg text-muted leading-relaxed mb-6 max-w-2xl">
                {story.summary}
              </p>

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
                  <Badge key={t.id} label={t.name} variant="secondary" />
                ))}
              </div>

              {/* CTA */}
              {story.ctaLabel && story.ctaUrl && (
                <a
                  href={normalizeUrl(story.ctaUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-medium rounded-xl hover:bg-[#b05a35] transition-colors shadow-sm"
                  aria-label={`${story.ctaLabel} — related to ${story.title}`}
                >
                  {story.ctaLabel}
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
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

              {/* Content format tabs + panel */}
              <section aria-label="Story content">
                <h2 className="font-heading text-2xl font-semibold text-charcoal mb-5">
                  {story.contentTypes.length > 1 ? 'Read or Watch' : contentTypeLabel(story.contentTypes[0])}
                </h2>

                {story.contentTypes.length > 1 && (
                  <ContentTabs
                    available={story.contentTypes}
                    active={activeTab}
                    onChange={setActiveTab}
                  />
                )}

                {/* Tab panels */}
                <div className="mt-6">
                  {/* Blog */}
                  <div
                    id="tab-panel-blog"
                    role="tabpanel"
                    aria-labelledby="tab-blog"
                    hidden={activeTab !== 'blog'}
                  >
                    {story.blog ? (
                      <BlogContent content={story.blog} />
                    ) : (
                      <p className="font-body text-muted text-sm italic">
                        Blog content will appear here once published.
                      </p>
                    )}
                  </div>

                  {/* Reel */}
                  <div
                    id="tab-panel-reel"
                    role="tabpanel"
                    aria-labelledby="tab-reel"
                    hidden={activeTab !== 'reel'}
                  >
                    <ReelContent
                      reelUrl={story.reelUrl}
                      title={story.title}
                      summary={story.summary}
                    />
                  </div>

                  {/* Carousel */}
                  <div
                    id="tab-panel-carousel"
                    role="tabpanel"
                    aria-labelledby="tab-carousel"
                    hidden={activeTab !== 'carousel'}
                  >
                    {story.carouselImages && story.carouselImages.length > 0 ? (
                      <CarouselContent images={story.carouselImages} title={story.title} />
                    ) : (
                      <p className="font-body text-muted text-sm italic">
                        Carousel slides will appear here once published.
                      </p>
                    )}
                  </div>

                  {/* Panels for extended content types */}
                  {([
                    ['podcast',          story.audioUrl],
                    ['talking-head',     story.reelUrl],
                    ['voice-over',       story.audioUrl],
                    ['photo-story',      undefined],
                    ['document',         story.ctaUrl],
                    ['external-article', story.ctaUrl],
                    ['youtube-video',    story.reelUrl],
                    ['social-post',      story.ctaUrl],
                  ] as [ContentType, string | undefined][])
                    .filter(([t]) => story.contentTypes.includes(t))
                    .map(([type, url]) => (
                      <div
                        key={type}
                        id={`tab-panel-${type}`}
                        role="tabpanel"
                        aria-labelledby={`tab-${type}`}
                        hidden={activeTab !== type}
                      >
                        {type === 'photo-story' ? (
                          story.carouselImages && story.carouselImages.length > 0
                            ? <CarouselContent images={story.carouselImages} title={story.title} />
                            : <p className="font-body text-muted text-sm italic">Photo gallery will appear here once published.</p>
                        ) : (type === 'talking-head' || type === 'youtube-video') ? (
                          <ReelContent reelUrl={story.reelUrl} title={story.title} summary={story.summary} />
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
                </div>
              </section>

              {/* Ideas extracted from this story */}
              <section aria-labelledby="story-ideas-heading">
                <h2
                  id="story-ideas-heading"
                  className="font-heading text-2xl font-semibold text-charcoal mb-6"
                >
                  Ideas inside this Story
                </h2>
                <IdeaGrid
                  filter={{ storyId: story.id, publicOnly: true }}
                  columns={2}
                  cardVariant="default"
                  emptyTitle="No ideas extracted yet"
                  emptyMessage="Ideas are connected to this story through the Village knowledge graph. Check back as the Village grows."
                />
              </section>

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

              {/* Questions this answers — from Village Intelligence */}
              {intel && (intel.searchQuestions.length > 0 || intel.geoQuestions.length > 0) && (
                <section aria-labelledby="story-questions-heading">
                  <h2
                    id="story-questions-heading"
                    className="font-heading text-2xl font-semibold text-charcoal mb-2"
                  >
                    Questions this answers
                  </h2>
                  <p className="font-body text-sm text-muted mb-6">
                    Common questions this story helps you think through.
                  </p>
                  <ul className="flex flex-col gap-3" role="list">
                    {[...new Set([...intel.searchQuestions, ...intel.geoQuestions])].slice(0, 6).map((q, i) => (
                      <li
                        key={i}
                        className="font-body text-sm text-charcoal/80 leading-relaxed px-4 py-3 bg-surface rounded-xl border border-border italic"
                      >
                        {q}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

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
                label="Have a story like this? Create with CULO in Canva"
              />

            </div>

            {/* ── Right: sidebar ─────────────────────────────────────────────── */}
            <aside className="lg:col-span-1 flex flex-col gap-8" aria-label="Story details">

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
                          <Badge key={t.id} label={t.name} variant="secondary" />
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
