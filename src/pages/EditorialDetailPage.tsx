import { useParams, Link } from 'react-router-dom'
import { usePageMeta } from '../utils/usePageMeta'
import { editorialService } from '../services/editorial'
import { getFounder } from '../services/founders'
import { getStory } from '../services/stories'
import { InnerContainer } from '../components/layout/PageContainer'
import { normalizeUrl } from '../utils/url'

function NotFound() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="font-heading text-2xl font-semibold text-charcoal mb-3">Feature not found</h1>
        <Link to="/stories" className="px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-[#b05a35] transition-colors">
          Browse Stories
        </Link>
      </div>
    </main>
  )
}

export function EditorialDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const feature = editorialService.getBySlug(slug ?? '')

  usePageMeta({
    title: feature?.title,
    description: feature?.dek ?? feature?.intro?.slice(0, 160),
    ogType: 'article',
    ogImage: feature?.coverImage,
    jsonLd: feature && feature.status === 'published' ? {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: feature.title,
      description: feature.dek ?? feature.intro.slice(0, 200),
      author: { '@type': 'Organization', name: 'Pretty Cool Marketing' },
      publisher: { '@type': 'Organization', name: 'CULO Village', url: window.location.origin },
      ...(feature.coverImage ? { image: feature.coverImage } : {}),
      datePublished: feature.publishedAt ?? feature.createdAt,
    } : undefined,
  })

  if (!feature || feature.status !== 'published') return <NotFound />

  return (
    <main className="min-h-screen bg-background">
      <section className="bg-surface border-b border-border pt-24 pb-12">
        <InnerContainer>
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="font-body text-xs font-semibold text-primary uppercase tracking-widest">
                Editorial
              </span>
              <span className="text-muted text-xs">·</span>
              <span className="font-body text-xs text-muted">Written by Pretty Cool Marketing</span>
            </div>
            <h1 className="font-heading text-4xl sm:text-5xl font-bold text-charcoal mb-4 leading-tight">
              {feature.title}
            </h1>
            {feature.dek && (
              <p className="font-body text-lg text-muted leading-relaxed">{feature.dek}</p>
            )}
          </div>
        </InnerContainer>
      </section>

      {feature.coverImage && (
        <div className="w-full h-64 sm:h-96 bg-charcoal overflow-hidden">
          <img src={feature.coverImage} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      <section className="py-12 md:py-16">
        <InnerContainer>
          <div className="max-w-2xl mx-auto">
            <p className="font-body text-base text-charcoal/80 leading-relaxed whitespace-pre-line mb-10">
              {feature.intro}
            </p>

            {feature.picks.length > 0 && (
              <div className="flex flex-col gap-5">
                {feature.picks.map((pick, i) => {
                  const founder = pick.founderId ? getFounder(pick.founderId) : undefined
                  const story = pick.storyId ? getStory(pick.storyId) : undefined
                  return (
                    <div key={i} className="bg-surface rounded-2xl border border-border p-6">
                      <p className="font-body text-sm text-charcoal/80 leading-relaxed mb-3">{pick.note}</p>
                      <div className="flex flex-wrap gap-3">
                        {founder && (
                          <Link to={`/founders/${founder.slug}`} className="text-sm font-semibold text-primary hover:underline">
                            {founder.name}'s profile →
                          </Link>
                        )}
                        {story && (
                          <Link to={`/stories/${story.slug}`} className="text-sm font-semibold text-primary hover:underline">
                            Read "{story.title}" →
                          </Link>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <p className="font-body text-xs text-muted mt-10 pt-6 border-t border-border">
              This is an independent editorial feature by{' '}
              <a href={normalizeUrl('https://prettycoolmarketing.com')} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Pretty Cool Marketing
              </a>
              . It references and links to founders' own original work — it doesn't replace or rewrite it.
            </p>
          </div>
        </InnerContainer>
      </section>
    </main>
  )
}
