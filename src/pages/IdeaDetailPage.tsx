import { useParams, Link }      from 'react-router-dom'
import { usePageTitle } from '../utils/usePageTitle'
import { getIdeas, getIdeaBySlug } from '../services/ideas'
import { getFounder }              from '../services/founders'
import { getStories }              from '../services/stories'
import { getBusinesses }           from '../services/businesses'
import { StoryGrid }            from '../widgets/StoryGrid'
import { FounderGrid }          from '../widgets/FounderGrid'
import { BusinessGrid }         from '../widgets/BusinessGrid'
import { IdeaCard }             from '../components/cards/IdeaCard'
import { QuoteCard }            from '../components/cards/QuoteCard'
import { Badge }                from '../components/ui/Badge'
import { InnerContainer }       from '../components/layout/PageContainer'
import { formatDate }           from '../utils/slugify'

// ─── Not found ──────────────────────────────────────────────────────────────────

function IdeaNotFound({ slug }: { slug: string }) {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div
          className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-6"
          aria-hidden="true"
        >
          <svg className="w-8 h-8 text-secondary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <h1 className="font-heading text-2xl font-semibold text-charcoal mb-3">Idea not found</h1>
        <p className="font-body text-muted mb-2">
          We couldn't find an idea with the slug{' '}
          <code className="text-sm bg-border px-1.5 py-0.5 rounded">{slug}</code>.
        </p>
        <p className="font-body text-sm text-muted mb-8">
          It may not have been extracted yet, or the URL may have changed.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/ideas"
            className="px-5 py-2.5 bg-secondary text-white text-sm font-medium rounded-xl hover:bg-[#4d5a3a] transition-colors"
          >
            Browse All Ideas
          </Link>
          <Link
            to="/"
            className="px-5 py-2.5 border border-border text-charcoal text-sm font-medium rounded-xl hover:border-secondary hover:text-secondary transition-colors"
          >
            Back to Village
          </Link>
        </div>
      </div>
    </main>
  )
}

// ─── Connection stat pill ────────────────────────────────────────────────────────

function StatPill({ count, label }: { count: number; label: string }) {
  return (
    <div className="flex items-center gap-2 bg-background rounded-xl px-4 py-2.5 border border-border">
      <span className="font-heading text-2xl font-bold text-secondary leading-none">{count}</span>
      <span className="font-body text-sm text-muted leading-tight">{label}</span>
    </div>
  )
}

// ─── Idea Detail Page ────────────────────────────────────────────────────────────

export function IdeaDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const idea = getIdeaBySlug(slug ?? '')
  usePageTitle(idea ? [idea.title, 'Ideas'] : 'Ideas')

  if (!idea || idea.status === 'archived') return <IdeaNotFound slug={slug ?? ''} />

  const quoteFounder = idea.quoteFounderId ? getFounder(idea.quoteFounderId) : undefined

  // Related ideas: share at least one topic, public only, exclude current
  const topicIds = new Set(idea.topics.map(t => t.id))
  const relatedIdeas = getIdeas({ publicOnly: true })
    .filter(i => i.id !== idea.id && i.topics.some(t => topicIds.has(t.id)))
    .slice(0, 3)

  return (
    <main className="min-h-screen bg-background">

      {/* ── Breadcrumb ──────────────────────────────────────────────────────── */}
      <nav
        className="bg-surface border-b border-border pt-20 pb-4"
        aria-label="Breadcrumb"
      >
        <InnerContainer>
          <ol className="flex items-center gap-2 text-sm font-body text-muted flex-wrap" role="list">
            <li><Link to="/" className="hover:text-secondary transition-colors">Village</Link></li>
            <li aria-hidden="true" className="text-border">›</li>
            <li><Link to="/ideas" className="hover:text-secondary transition-colors">Ideas</Link></li>
            <li aria-hidden="true" className="text-border">›</li>
            <li className="text-charcoal font-medium line-clamp-1" aria-current="page">{idea.title}</li>
          </ol>
        </InnerContainer>
      </nav>

      {/* ── Idea hero ───────────────────────────────────────────────────────── */}
      <section
        className="bg-surface border-b border-border pb-10"
        aria-labelledby="idea-title"
      >
        <InnerContainer>
          <div className="max-w-3xl pt-10">

            {/* Label */}
            <p className="font-body text-xs font-semibold text-secondary uppercase tracking-widest mb-4">
              Idea · Extracted from founder stories
            </p>

            {/* H1 */}
            <h1
              id="idea-title"
              className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold text-charcoal leading-tight mb-5"
            >
              {idea.title}
            </h1>

            {/* Description */}
            <p className="font-body text-lg text-muted leading-relaxed mb-6 max-w-2xl">
              {idea.description}
            </p>

            {/* Topic badges */}
            {idea.topics.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8" aria-label="Topics">
                {idea.topics.map(t => (
                  <Badge key={t.id} label={t.name} variant="secondary" />
                ))}
              </div>
            )}

            {/* Connection stats */}
            <div
              className="flex flex-wrap gap-3 mb-8"
              aria-label="Knowledge graph connections"
            >
              <StatPill count={idea.relatedStoryIds.length}   label={idea.relatedStoryIds.length   === 1 ? 'story'    : 'stories'}    />
              <StatPill count={idea.relatedFounderIds.length} label={idea.relatedFounderIds.length === 1 ? 'founder'  : 'founders'}   />
              <StatPill count={idea.relatedBusinessIds.length} label={idea.relatedBusinessIds.length === 1 ? 'business' : 'businesses'} />
            </div>

            {/* Quote */}
            {idea.quote && (
              <QuoteCard
                idea={idea}
                founder={quoteFounder}
                variant="inline"
              />
            )}

            {/* Published date */}
            <p className="font-body text-xs text-muted mt-5">
              First extracted{' '}
              <time dateTime={idea.createdAt}>{formatDate(idea.createdAt)}</time>
            </p>
          </div>
        </InnerContainer>
      </section>

      {/* ── Main body ───────────────────────────────────────────────────────── */}
      <div className="py-12 md:py-16">
        <InnerContainer>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-14">

            {/* ── Left: knowledge graph ─────────────────────────────────────── */}
            <div className="lg:col-span-2 flex flex-col gap-14">

              {/* Stories connected to this Idea */}
              {idea.relatedStoryIds.length > 0 && (
                <section aria-labelledby="idea-stories-heading">
                  <h2
                    id="idea-stories-heading"
                    className="font-heading text-2xl font-semibold text-charcoal mb-2"
                  >
                    Stories connected to this Idea
                  </h2>
                  <p className="font-body text-sm text-muted mb-6">
                    These are the founder stories this idea was extracted from.
                  </p>
                  <StoryGrid
                    filter={{ ids: idea.relatedStoryIds }}
                    columns={2}
                    cardVariant="compact"
                    showSummary
                    showFounder
                    showTopics={false}
                    showCTA={false}
                    emptyTitle="No stories linked yet"
                    emptyMessage="Stories will appear here as they are published and connected to this idea."
                  />
                </section>
              )}

              {/* Founders talking about this Idea */}
              {idea.relatedFounderIds.length > 0 && (
                <section aria-labelledby="idea-founders-heading">
                  <h2
                    id="idea-founders-heading"
                    className="font-heading text-2xl font-semibold text-charcoal mb-2"
                  >
                    Founders talking about this
                  </h2>
                  <p className="font-body text-sm text-muted mb-6">
                    Founders whose stories and experiences connect to this idea.
                  </p>
                  <FounderGrid
                    filter={{ ids: idea.relatedFounderIds }}
                    columns={2}
                    cardVariant="default"
                    emptyTitle="No founders linked yet"
                    emptyMessage="Founders will appear here as they publish stories connected to this idea."
                  />
                </section>
              )}

              {/* Businesses connected to this Idea */}
              {idea.relatedBusinessIds.length > 0 && (
                <section aria-labelledby="idea-businesses-heading">
                  <h2
                    id="idea-businesses-heading"
                    className="font-heading text-2xl font-semibold text-charcoal mb-2"
                  >
                    Businesses connected to this Idea
                  </h2>
                  <p className="font-body text-sm text-muted mb-6">
                    Businesses whose founders have explored or demonstrated this idea.
                  </p>
                  <BusinessGrid
                    filter={{ ids: idea.relatedBusinessIds }}
                    columns={2}
                    cardVariant="default"
                    emptyTitle="No businesses linked yet"
                    emptyMessage="Businesses will appear here as founders publish stories connected to this idea."
                  />
                </section>
              )}

              {/* Related Ideas */}
              {relatedIdeas.length > 0 && (
                <section aria-labelledby="related-ideas-heading">
                  <h2
                    id="related-ideas-heading"
                    className="font-heading text-2xl font-semibold text-charcoal mb-2"
                  >
                    Related Ideas
                  </h2>
                  <p className="font-body text-sm text-muted mb-6">
                    Other ideas that share topics with this one.
                  </p>
                  <ul
                    className="grid grid-cols-1 sm:grid-cols-2 gap-5"
                    role="list"
                    aria-label="Related ideas"
                  >
                    {relatedIdeas.map(rel => (
                      <li key={rel.id}>
                        <IdeaCard idea={rel} variant="default" />
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6">
                    <Link
                      to="/ideas"
                      className="text-sm font-medium text-secondary hover:text-[#4d5a3a] transition-colors"
                    >
                      Browse all ideas →
                    </Link>
                  </div>
                </section>
              )}

            </div>

            {/* ── Right: context sidebar ────────────────────────────────────── */}
            <aside className="lg:col-span-1" aria-label="Idea context">
              <div className="sticky top-24 flex flex-col gap-6">

                {/* Context panel */}
                <section
                  className="bg-surface rounded-2xl p-5 border border-border"
                  aria-labelledby="idea-context-heading"
                >
                  <h2
                    id="idea-context-heading"
                    className="font-heading text-base font-semibold text-charcoal mb-4"
                  >
                    Knowledge Graph
                  </h2>
                  <dl className="space-y-4 font-body text-sm">

                    {idea.topics.length > 0 && (
                      <div>
                        <dt className="text-muted text-xs font-medium uppercase tracking-wide mb-1.5">Topics</dt>
                        <dd className="flex flex-wrap gap-1.5">
                          {idea.topics.map(t => (
                            <Badge key={t.id} label={t.name} variant="secondary" />
                          ))}
                        </dd>
                      </div>
                    )}

                    {idea.relatedStoryIds.length > 0 && (
                      <div>
                        <dt className="text-muted text-xs font-medium uppercase tracking-wide mb-1.5">Connected Stories</dt>
                        <dd className="space-y-1">
                          {idea.relatedStoryIds.map(id => {
                            const s = getStories().find(x => x.id === id)
                            return s ? (
                              <div key={id}>
                                <Link
                                  to={`/stories/${s.slug}`}
                                  className="text-charcoal hover:text-secondary transition-colors leading-snug block"
                                >
                                  {s.title}
                                </Link>
                              </div>
                            ) : null
                          })}
                        </dd>
                      </div>
                    )}

                    {idea.relatedFounderIds.length > 0 && (
                      <div>
                        <dt className="text-muted text-xs font-medium uppercase tracking-wide mb-1.5">Connected Founders</dt>
                        <dd className="space-y-1">
                          {idea.relatedFounderIds.map(id => {
                            const f = getFounder(id)
                            return f ? (
                              <div key={id}>
                                <Link
                                  to={`/founders/${f.slug}`}
                                  className="text-charcoal hover:text-secondary transition-colors"
                                >
                                  {f.name}
                                </Link>
                              </div>
                            ) : null
                          })}
                        </dd>
                      </div>
                    )}

                    {idea.relatedBusinessIds.length > 0 && (
                      <div>
                        <dt className="text-muted text-xs font-medium uppercase tracking-wide mb-1.5">Connected Businesses</dt>
                        <dd className="space-y-1">
                          {idea.relatedBusinessIds.map(id => {
                            const b = getBusinesses().find(x => x.id === id)
                            return b ? (
                              <div key={id}>
                                <Link
                                  to={`/businesses/${b.slug}`}
                                  className="text-charcoal hover:text-secondary transition-colors"
                                >
                                  {b.name}
                                </Link>
                              </div>
                            ) : null
                          })}
                        </dd>
                      </div>
                    )}

                    <div>
                      <dt className="text-muted text-xs font-medium uppercase tracking-wide mb-1.5">First extracted</dt>
                      <dd>
                        <time dateTime={idea.createdAt} className="text-charcoal">
                          {formatDate(idea.createdAt)}
                        </time>
                      </dd>
                    </div>
                  </dl>
                </section>

                {/* CTA panel */}
                <div className="bg-secondary/5 rounded-2xl p-5 border border-secondary/20">
                  <p className="font-body text-sm text-charcoal leading-relaxed mb-4">
                    This idea came from real founder stories. Explore more in the Village, or discover all ideas.
                  </p>
                  <div className="flex flex-col gap-2">
                    <Link
                      to="/stories"
                      className="block text-center px-4 py-2.5 bg-secondary text-white text-sm font-medium rounded-xl hover:bg-[#4d5a3a] transition-colors"
                    >
                      Browse all Stories
                    </Link>
                    <Link
                      to="/ideas"
                      className="block text-center px-4 py-2.5 border border-secondary/30 text-secondary text-sm font-medium rounded-xl hover:border-secondary hover:bg-secondary/5 transition-colors"
                    >
                      Back to Ideas
                    </Link>
                  </div>
                </div>

              </div>
            </aside>

          </div>
        </InnerContainer>
      </div>

    </main>
  )
}
