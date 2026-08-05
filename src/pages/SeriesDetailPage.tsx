import { useParams, Link } from 'react-router-dom'
import { usePageMeta } from '../utils/usePageMeta'
import { InnerContainer } from '../components/layout/PageContainer'
import { getSeriesBySlug, getSeriesEpisodes } from '../services/series'
import { getFounder } from '../services/founders'

function NotFound() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="font-heading text-2xl font-semibold text-charcoal mb-3">Series not found</h1>
        <p className="font-body text-muted mb-8">This series doesn't exist, or isn't published yet.</p>
        <Link to="/" className="px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-[#b05a35] transition-colors">
          Back to Village
        </Link>
      </div>
    </main>
  )
}

export function SeriesDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const series = slug ? getSeriesBySlug(slug) : undefined
  const founder = series ? getFounder(series.founderId) : undefined
  const episodes = series
    ? getSeriesEpisodes(series.id).filter(ep => ep.status === 'published' || ep.status === 'featured')
    : []

  usePageMeta({
    title: series ? `${series.title} — a series by ${founder?.name ?? 'a Village founder'}` : undefined,
    description: series?.description || (series ? `Follow ${series.title}, episode by episode.` : undefined),
    ogImage: series?.coverImage,
  })

  if (!series || series.status !== 'published' || episodes.length === 0) return <NotFound />

  return (
    <main className="min-h-screen bg-background">
      <nav className="bg-surface border-b border-border pt-20 pb-4" aria-label="Breadcrumb">
        <InnerContainer>
          <ol className="flex items-center gap-2 text-sm font-body text-muted flex-wrap" role="list">
            <li><Link to="/" className="hover:text-primary transition-colors">Village</Link></li>
            {founder && (
              <>
                <li aria-hidden="true" className="text-border">›</li>
                <li><Link to={`/founders/${founder.slug}`} className="hover:text-primary transition-colors">{founder.name}</Link></li>
              </>
            )}
            <li aria-hidden="true" className="text-border">›</li>
            <li className="text-charcoal font-medium line-clamp-1" aria-current="page">{series.title}</li>
          </ol>
        </InnerContainer>
      </nav>

      <section className="bg-surface border-b border-border pb-12" aria-labelledby="series-title">
        <InnerContainer>
          <div className="flex flex-col sm:flex-row gap-6 items-start pt-6">
            {series.coverImage && (
              <img src={series.coverImage} alt="" className="w-32 h-32 rounded-2xl object-cover shrink-0 bg-charcoal" />
            )}
            <div className="max-w-2xl">
              <p className="font-body text-xs font-semibold text-primary uppercase tracking-widest mb-3">
                Series {founder && <>· {founder.name}</>}
              </p>
              <h1 id="series-title" className="font-heading text-4xl sm:text-5xl font-bold text-charcoal mb-4 leading-tight">
                {series.title}
              </h1>
              {series.description && (
                <p className="font-body text-lg text-muted leading-relaxed">{series.description}</p>
              )}
              <p className="font-body text-sm text-muted mt-3">{episodes.length} episode{episodes.length === 1 ? '' : 's'}</p>
            </div>
          </div>
        </InnerContainer>
      </section>

      <section className="py-12 md:py-16" aria-label={`Episodes in ${series.title}`}>
        <InnerContainer>
          <div className="flex flex-col divide-y divide-border max-w-3xl">
            {episodes.map((ep, i) => (
              <Link
                key={ep.id}
                to={`/stories/${ep.slug}`}
                className="flex items-center gap-5 py-5 group"
              >
                <span className="font-heading text-2xl font-bold text-border shrink-0 w-10 text-center group-hover:text-primary transition-colors">
                  {i + 1}
                </span>
                <img src={ep.coverImage} alt="" className="w-20 h-14 rounded-lg object-cover shrink-0 bg-charcoal" />
                <div className="min-w-0 flex-1">
                  <p className="font-heading text-lg font-semibold text-charcoal group-hover:text-primary transition-colors truncate">
                    {ep.title}
                  </p>
                  {ep.summary && <p className="font-body text-sm text-muted line-clamp-1 mt-0.5">{ep.summary}</p>}
                </div>
                <span className="text-muted shrink-0 group-hover:text-primary transition-colors">→</span>
              </Link>
            ))}
          </div>
        </InnerContainer>
      </section>
    </main>
  )
}
