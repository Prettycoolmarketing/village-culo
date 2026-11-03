import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { usePageMeta } from '../utils/usePageMeta'
import { syncPublishedContent } from '../lib/publicSync'
import { importedContentService } from '../services/importedContent'
import { getFounders } from '../services/founders'
import { getBusiness } from '../services/businesses'
import { buildStoryFromImport } from '../services/publishStory'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { CoverImage } from '../components/ui/CoverImage'
import { FounderCard } from '../components/cards/FounderCard'
import { BusinessCard } from '../components/cards/BusinessCard'
import { FounderSocialLinks } from '../components/ui/FounderSocialLinks'
import { InnerContainer } from '../components/layout/PageContainer'
import { formatDate } from '../utils/slugify'
import { deriveSeoDescription, CULO_ORGANIZATION } from '../utils/seo'
import type { ImportedContent } from '../types/importedContent'

// The public reading page for a CULO-written source_article/imported_content
// piece that hasn't (yet, or ever) been promoted into a formal Story row.
//
// Confirmed real, live, serious: every "Read the story"/"Read the article"
// link on a published founder's page for one of these pieces pointed at
// /dashboard/preview/:importId — a route wrapped in <ProtectedRoute>, built
// for a founder/staff member previewing their OWN unpublished draft before
// hitting Publish. A real visitor (or an AI crawler, though the bot
// middleware never covered this route either) clicking through from a
// published founder's page hit a login wall and could never actually read
// the article. This is the genuine public equivalent — same rendering
// (buildStoryFromImport, same hero/sidebar layout as StoryDetailPage) but
// public, gated on the item actually being published, and with the
// founder's own social links attached (see FounderSocialLinks) so a reader
// who lands here first — the common case for an article cited by an AI
// engine — isn't stranded without any way to find the founder elsewhere.
export function ArticlePage() {
  const { importId } = useParams<{ importId: string }>()

  // Same cold-cache race as FounderProfilePage — a first-ever visitor can
  // hit this page before the startup sync has landed anything locally.
  // Await the same shared, already-in-flight promise rather than guessing.
  const [hasSynced, setHasSynced] = useState(false)
  useEffect(() => { void syncPublishedContent().then(() => setHasSynced(true)) }, [])

  const cachedItem = importId ? importedContentService.get(importId) : undefined
  const [fetchedItem, setFetchedItem] = useState<ImportedContent | null>(null)
  const [fetchDone, setFetchDone] = useState(false)
  useEffect(() => {
    if (cachedItem || !importId || !isSupabaseConfigured || !supabase) { setFetchDone(true); return }
    setFetchDone(false)
    void supabase.from('imported_content').select('data').eq('id', importId).maybeSingle().then(({ data }) => {
      setFetchedItem(data ? (data.data as ImportedContent) : null)
      setFetchDone(true)
    })
  }, [importId, cachedItem])

  const item = cachedItem ?? fetchedItem ?? undefined
  const founder = item ? getFounders().find(f => f.id === item.founderId) : undefined
  const business = item?.businessId ? getBusiness(item.businessId) : undefined
  const isPublic = item && (item.status === 'published' || item.status === 'featured')
    && founder && (founder.status === 'published' || founder.status === 'featured')
  const story = item && founder && isPublic ? buildStoryFromImport(item, founder) : undefined

  usePageMeta({
    title:       story?.title,
    description: story ? deriveSeoDescription(item?.description, item?.description) : undefined,
    ogType:      'article',
    ogImage:     story?.coverImage,
    jsonLd:      story && founder ? {
      '@context':    'https://schema.org',
      '@type':       'Article',
      headline:      story.title,
      description:   (item?.description ?? '').slice(0, 200),
      datePublished: item?.publishedAt ?? item?.importedAt,
      ...(story.coverImage ? { image: story.coverImage } : {}),
      author: { '@type': 'Person', name: founder.name, url: `${window.location.origin}/founders/${founder.slug}` },
      publisher: CULO_ORGANIZATION,
      mainEntityOfPage: `${window.location.origin}/articles/${item?.id}`,
    } : undefined,
  })

  if (!cachedItem && !fetchDone) return null
  if (!hasSynced && !item) return null

  if (!item || !founder || !story || !isPublic) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="font-heading text-2xl font-semibold text-charcoal mb-3">Article not found</h1>
          <p className="font-body text-muted mb-8">This article may not be published yet, or the link may have changed.</p>
          <Link to="/founders" className="px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-[#b05a35] transition-colors">
            Browse Founders
          </Link>
        </div>
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <nav aria-label="Breadcrumb" className="border-b border-border">
        <InnerContainer className="py-4">
          <ol className="flex items-center gap-2 text-sm font-body text-muted">
            <li><Link to="/founders" className="hover:text-primary transition-colors">Founders</Link></li>
            <li aria-hidden="true" className="text-border">›</li>
            <li><Link to={`/founders/${founder.slug}`} className="hover:text-primary transition-colors">{founder.name}</Link></li>
            <li aria-hidden="true" className="text-border">›</li>
            <li className="text-charcoal font-medium line-clamp-1" aria-current="page">{story.title}</li>
          </ol>
        </InnerContainer>
      </nav>

      <section aria-labelledby="article-title">
        {story.coverImage && !story.coverImage.includes('/placeholders/') && (
          <div className="relative h-64 sm:h-80 md:h-96 overflow-hidden bg-charcoal">
            <CoverImage
              src={story.coverImage}
              alt={`Cover image for "${story.title}"`}
              className="w-full h-full object-cover opacity-60"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/30 to-transparent" aria-hidden="true" />
          </div>
        )}

        <div className="bg-surface border-b border-border pb-10">
          <InnerContainer>
            <div className="pt-12 sm:pt-16">
              <h1 id="article-title" className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold text-charcoal leading-tight mb-3 max-w-4xl">
                {story.title}
              </h1>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-body text-muted mb-6">
                <Link to={`/founders/${founder.slug}`} className="flex items-center gap-2 hover:text-primary transition-colors font-medium text-charcoal">
                  <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                    <img src={founder.avatar} alt="" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-muted font-normal">Written by Culo</span> about {founder.name}
                </Link>
                {business && (
                  <Link to={`/businesses/${business.slug}`} className="hover:text-primary transition-colors">
                    {business.name}
                  </Link>
                )}
                <time dateTime={item.publishedAt ?? item.importedAt} className="text-muted">
                  {formatDate(item.publishedAt ?? item.importedAt)}
                </time>
              </div>
            </div>
          </InnerContainer>
        </div>
      </section>

      <div className="py-12 md:py-16">
        <InnerContainer>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-14">
            <div className="lg:col-span-2 flex flex-col gap-10">
              {story.blog && (
                <div className="font-body text-charcoal leading-relaxed whitespace-pre-wrap">
                  {story.blog}
                </div>
              )}

              <div className="pt-6 border-t border-border">
                <p className="font-body text-sm font-semibold text-charcoal mb-3">Find {founder.name}</p>
                <FounderSocialLinks founder={founder} />
              </div>

              <p className="font-body text-xs text-muted">
                Part of <Link to="/how-culo-works" className="text-primary hover:underline">CULO Village</Link> — founder stories researched and written by CULO.
              </p>
            </div>

            <aside className="lg:col-span-1 flex flex-col gap-8" aria-label="Article details">
              <section aria-labelledby="article-founder-heading">
                <h2 id="article-founder-heading" className="font-heading text-base font-semibold text-charcoal mb-4">About the Founder</h2>
                <FounderCard founder={founder} business={business} variant="default" />
              </section>

              {business && (
                <section aria-labelledby="article-business-heading">
                  <h2 id="article-business-heading" className="font-heading text-base font-semibold text-charcoal mb-4">Business</h2>
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
