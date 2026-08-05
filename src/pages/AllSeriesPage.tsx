import { Link } from 'react-router-dom'
import { usePageTitle } from '../utils/usePageTitle'
import { InnerContainer } from '../components/layout/PageContainer'
import { getSeriesList, getSeriesEpisodes } from '../services/series'
import { getFounder } from '../services/founders'

const NEW_WITHIN_DAYS = 7

export function AllSeriesPage() {
  usePageTitle('Series')

  const shelves = getSeriesList({ publicOnly: true })
    .map(series => ({
      series,
      founder: getFounder(series.founderId),
      episodes: getSeriesEpisodes(series.id).filter(ep => ep.status === 'published' || ep.status === 'featured'),
    }))
    .filter(s => s.episodes.length > 0)

  const now = Date.now()
  const isNew = (createdAt: string) => now - new Date(createdAt).getTime() < NEW_WITHIN_DAYS * 24 * 60 * 60 * 1000
  const newThisWeek = shelves.filter(s => s.episodes.some(ep => isNew(ep.createdAt)))

  return (
    <main className="min-h-screen bg-background" id="series-main">
      <section className="bg-surface border-b border-border pt-24 pb-12" aria-labelledby="series-heading">
        <InnerContainer>
          <div className="max-w-2xl">
            <p className="font-body text-xs font-semibold text-primary uppercase tracking-widest mb-3">
              CULO Village
            </p>
            <h1 id="series-heading" className="font-heading text-4xl sm:text-5xl font-bold text-charcoal mb-4 leading-tight">
              Series
            </h1>
            <p className="font-body text-lg text-muted leading-relaxed">
              Founders' stories, told in order — real chapters from real lives, one episode at a time.
              Start anywhere and binge from the beginning.
            </p>
          </div>
        </InnerContainer>
      </section>

      <section className="py-12 md:py-16" aria-label="All series">
        <InnerContainer>
          {shelves.length === 0 ? (
            <div className="text-center py-16 max-w-md mx-auto">
              <h2 className="font-heading text-2xl font-semibold text-charcoal mb-3">Nothing here yet</h2>
              <p className="font-body text-muted mb-8">
                The first founder series is on its way. Check back soon, or read individual stories in the meantime.
              </p>
              <Link to="/stories" className="px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-[#b05a35] transition-colors">
                Browse Stories
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-12">
              {newThisWeek.length > 0 && (
                <SeriesShelf title="New This Week" shelves={newThisWeek} />
              )}
              <SeriesShelf title={newThisWeek.length > 0 ? 'All Series' : 'All Series'} shelves={shelves} />
            </div>
          )}
        </InnerContainer>
      </section>
    </main>
  )
}

function SeriesShelf({ title, shelves }: {
  title: string
  shelves: { series: ReturnType<typeof getSeriesList>[number]; founder: ReturnType<typeof getFounder>; episodes: ReturnType<typeof getSeriesEpisodes> }[]
}) {
  return (
    <section aria-label={title}>
      <h2 className="font-heading text-2xl font-semibold text-charcoal mb-6">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {shelves.map(({ series, founder, episodes }) => (
          <Link key={series.id} to={`/series/${series.slug}`} className="group">
            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-charcoal">
              {series.coverImage || episodes[0]?.coverImage ? (
                <img
                  src={series.coverImage || episodes[0]?.coverImage}
                  alt=""
                  className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                />
              ) : null}
              <span className="absolute bottom-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/60 text-white backdrop-blur-sm">
                {episodes.length} episode{episodes.length === 1 ? '' : 's'}
              </span>
            </div>
            <p className="font-heading text-lg font-semibold text-charcoal mt-3 group-hover:text-primary transition-colors">
              {series.title}
            </p>
            {founder && <p className="font-body text-sm text-muted mt-0.5">by {founder.name}</p>}
          </Link>
        ))}
      </div>
    </section>
  )
}
