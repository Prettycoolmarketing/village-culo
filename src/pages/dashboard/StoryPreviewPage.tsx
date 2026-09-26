import { Link, useParams } from 'react-router-dom'
import { importedContentService } from '../../services/importedContent'
import { buildStoryFromImport } from '../../services/publishStory'
import { getFounder } from '../../services/founders'
import { getBusiness } from '../../services/businesses'
import { normalizeUrl, isDirectAudioUrl } from '../../utils/url'
import { CoverImage } from '../../components/ui/CoverImage'
import { ReelContent } from '../../components/ui/ReelContent'
import { FounderCard } from '../../components/cards/FounderCard'
import { BusinessCard } from '../../components/cards/BusinessCard'
import { Badge } from '../../components/ui/Badge'
import { InnerContainer } from '../../components/layout/PageContainer'
import { contentTypeLabel, formatDate } from '../../utils/slugify'

// A real preview of what an imported piece will look like as a published
// story — built the exact same way publishing does (buildStoryFromImport),
// just never saved. Exists because a founder had no way to see a piece with
// no external link (a raw Instagram archive file, for example) until after
// actually publishing it live.
//
// Deliberately mirrors StoryDetailPage's actual hero + two-column layout
// (same components: CoverImage, ReelContent, FounderCard, BusinessCard) —
// this used to be a completely different, much plainer card mockup, so a
// founder previewing a piece had no real idea what it would actually look
// like once published. What it can't show: anything that only exists once
// a story is a real persisted row (FAQ, related content, Village
// Intelligence, recommendations) — none of that exists yet for an unsaved
// preview, so those sections are left out rather than faked.
export function StoryPreviewPage() {
  const { importId } = useParams<{ importId: string }>()
  const item = importId ? importedContentService.get(importId) : undefined
  const founder = item ? getFounder(item.founderId) : undefined
  const business = item?.businessId ? getBusiness(item.businessId) : undefined
  const story = item && founder ? buildStoryFromImport(item, founder) : undefined

  if (!item || !founder || !story) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <p className="text-sm font-semibold text-[#2D2A26]">Couldn't load a preview for this.</p>
        <Link to="/dashboard/profile?tab=content" className="text-sm text-[#C86A43] hover:underline mt-2 inline-block">
          ← Back to Content
        </Link>
      </div>
    )
  }

  const isVerticalVideo = !!story.reelUrl && !(story.videoOrientation
    ? story.videoOrientation === 'landscape'
    : story.contentTypes.includes('youtube-video') || story.contentTypes.includes('talking-head'))

  const contentBadges = (
    <>
      {story.contentTypes.map(type => (
        <span
          key={type}
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            isVerticalVideo ? 'bg-primary/10 text-primary' : 'bg-surface/90 backdrop-blur-sm text-charcoal'
          }`}
        >
          {contentTypeLabel(type)}
        </span>
      ))}
    </>
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-charcoal text-white text-center text-xs font-semibold py-2 px-4">
        Preview — not published. This is exactly how it'll look on the Village once you publish.
      </div>

      <nav aria-label="Breadcrumb" className="border-b border-border">
        <InnerContainer className="py-4">
          <ol className="flex items-center gap-2 text-sm font-body text-muted">
            <li><Link to="/dashboard/profile?tab=content" className="hover:text-primary transition-colors">Content</Link></li>
            <li aria-hidden="true" className="text-border">›</li>
            <li className="text-charcoal font-medium line-clamp-1" aria-current="page">{story.title}</li>
          </ol>
        </InnerContainer>
      </nav>

      {/* ── Story hero — same treatment as the real published page ──────────── */}
      <section aria-labelledby="preview-story-title">
        {!isVerticalVideo && story.coverImage && !story.coverImage.includes('/placeholders/') && (
          <div className="relative h-64 sm:h-80 md:h-96 overflow-hidden bg-charcoal">
            <CoverImage
              src={story.coverImage}
              alt={`Cover image for "${story.title}"`}
              className="w-full h-full object-cover opacity-60"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/30 to-transparent" aria-hidden="true" />
            <div className="absolute top-4 left-4 flex flex-wrap gap-2" aria-label="Content formats">
              {contentBadges}
            </div>
          </div>
        )}

        <div className="bg-surface border-b border-border pb-10">
          <InnerContainer>
            <div className="pt-12 sm:pt-16">
              {isVerticalVideo && (
                <div className="flex flex-wrap gap-2 mb-4" aria-label="Content formats">
                  {contentBadges}
                </div>
              )}
              <h1
                id="preview-story-title"
                className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold text-charcoal leading-tight mb-3 max-w-4xl"
              >
                {story.title}
              </h1>

              {story.subtitle && (
                <p className="font-body text-lg sm:text-xl text-muted leading-relaxed mt-3 mb-8 max-w-2xl">
                  {story.subtitle}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-body text-muted mb-6">
                <Link
                  to={`/founders/${founder.slug}`}
                  className="flex items-center gap-2 hover:text-primary transition-colors font-medium text-charcoal"
                  aria-label={`View ${founder.name}'s profile`}
                >
                  <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                    <img src={founder.avatar} alt="" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-muted font-normal">By</span> {founder.name}
                </Link>
                {business && (
                  <Link to={`/businesses/${business.slug}`} className="hover:text-primary transition-colors">
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
                <time dateTime={story.createdAt} className="text-muted">{formatDate(story.createdAt)}</time>
              </div>

              {story.topics.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6" aria-label="Topics">
                  {story.topics.map(t => <Badge key={t.id} label={t.name} variant="secondary" />)}
                </div>
              )}

              {story.ctaLabel && story.ctaUrl && (
                <div className="flex flex-wrap gap-3">
                  <a
                    href={normalizeUrl(story.ctaUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-medium rounded-xl hover:bg-[#b05a35] transition-colors shadow-sm"
                  >
                    {story.ctaLabel}
                  </a>
                </div>
              )}
            </div>
          </InnerContainer>
        </div>
      </section>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <div className="py-12 md:py-16">
        <InnerContainer>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-14">

            <div className="lg:col-span-2 flex flex-col gap-12">
              {story.blog && (
                <div>
                  <h2 className="font-heading text-2xl font-semibold text-charcoal mb-5">Blog</h2>
                  <div className="font-body text-charcoal leading-relaxed whitespace-pre-wrap">
                    {story.blog}
                  </div>
                </div>
              )}

              {story.reelUrl && (
                <div>
                  <h2 className="font-heading text-2xl font-semibold text-charcoal mb-5">Video</h2>
                  <ReelContent
                    reelUrl={story.reelUrl}
                    title={story.title}
                    summary={story.blog ? '' : story.summary}
                    landscape={!isVerticalVideo}
                  />
                </div>
              )}

              {story.carouselImages && story.carouselImages.length > 0 && (
                <div>
                  <h2 className="font-heading text-2xl font-semibold text-charcoal mb-5">Carousel</h2>
                  <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3" role="list">
                    {story.carouselImages.map((src, i) => (
                      <li key={i} role="listitem">
                        <div className="rounded-xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
                          <img src={src} alt={`Carousel slide ${i + 1} of ${story.carouselImages!.length}`} className="w-full h-full object-cover" loading="lazy" />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {story.audioUrl && (
                <div>
                  <h2 className="font-heading text-2xl font-semibold text-charcoal mb-5">{contentTypeLabel('podcast')}</h2>
                  {isDirectAudioUrl(story.audioUrl) ? (
                    <audio src={story.audioUrl} controls className="w-full" />
                  ) : (
                    <a href={normalizeUrl(story.audioUrl)} target="_blank" rel="noopener noreferrer"
                       className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-medium rounded-xl hover:bg-[#b05a35] transition-colors text-sm">
                      View Podcast ↗
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* ── Right: sidebar — same cards a visitor would actually see ── */}
            <aside className="lg:col-span-1 flex flex-col gap-8" aria-label="Story details">
              <section aria-labelledby="preview-founder-heading">
                <h2 id="preview-founder-heading" className="font-heading text-base font-semibold text-charcoal mb-4">About the Founder</h2>
                <FounderCard founder={founder} business={business} variant="default" />
              </section>

              {business && (
                <section aria-labelledby="preview-business-heading">
                  <h2 id="preview-business-heading" className="font-heading text-base font-semibold text-charcoal mb-4">Business</h2>
                  <BusinessCard business={business} founder={founder} variant="default" />
                </section>
              )}
            </aside>
          </div>
        </InnerContainer>
      </div>
    </div>
  )
}
