import { useParams, Link } from 'react-router-dom'
import { usePageTitle } from '../utils/usePageTitle'
import { getExpertiseBySlug } from '../data/expertise'
import { getServicesForExpertise } from '../data/services'
import { getResourcesForExpertise } from '../data/resources'
import { getCaseStudiesForExpertise } from '../data/caseStudies'
import { getTalksForExpertise } from '../data/talks'
import { founders } from '../data/founders'
import { businesses } from '../data/businesses'
import { StoryGrid } from '../widgets/StoryGrid'
import { IdeaGrid } from '../widgets/IdeaGrid'
import { InnerContainer } from '../components/layout/PageContainer'

// ─── Resource type label ────────────────────────────────────────────────────────

const resourceTypeLabel: Record<string, string> = {
  guide:     'Guide',
  template:  'Template',
  tool:      'Tool',
  framework: 'Framework',
  video:     'Video',
  article:   'Article',
}

// ─── Not Found ──────────────────────────────────────────────────────────────────

function ExpertiseNotFound({ slug }: { slug: string }) {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="font-heading text-2xl font-semibold text-charcoal mb-3">
          Expertise not found
        </h1>
        <p className="font-body text-muted mb-8">
          No expertise page exists for <code className="text-sm bg-border px-1.5 py-0.5 rounded">{slug}</code>.
        </p>
        <Link to="/expertise" className="px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-[#b05a35] transition-colors">
          Browse All Expertise
        </Link>
      </div>
    </main>
  )
}

// ─── Expertise Detail ───────────────────────────────────────────────────────────

export function ExpertiseDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const expertise = getExpertiseBySlug(slug ?? '')
  usePageTitle(expertise ? [expertise.name, 'Expertise'] : 'Expertise')

  if (!expertise) return <ExpertiseNotFound slug={slug ?? ''} />

  const expertiseFounders = founders.filter(f => expertise.founderIds.includes(f.id))
  const expertiseBusinesses = businesses.filter(b => expertise.businessIds.includes(b.id))
  const expertiseServices = getServicesForExpertise(expertise.id)
  const expertiseResources = getResourcesForExpertise(expertise.id)
  const expertiseCaseStudies = getCaseStudiesForExpertise(expertise.id)
  const expertiseTalks = getTalksForExpertise(expertise.id)

  return (
    <main className="min-h-screen bg-background" id={`expertise-${expertise.slug}`}>

      {/* ── Breadcrumb ──────────────────────────────────────────────────────── */}
      <nav className="bg-surface border-b border-border pt-20 pb-4" aria-label="Breadcrumb">
        <InnerContainer>
          <ol className="flex items-center gap-2 text-sm font-body text-muted" role="list">
            <li><Link to="/" className="hover:text-primary transition-colors">Village</Link></li>
            <li aria-hidden="true" className="text-border">›</li>
            <li><Link to="/expertise" className="hover:text-primary transition-colors">Expertise</Link></li>
            <li aria-hidden="true" className="text-border">›</li>
            <li className="text-charcoal font-medium" aria-current="page">{expertise.name}</li>
          </ol>
        </InnerContainer>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="bg-surface border-b border-border pb-12" aria-labelledby="expertise-name">
        <InnerContainer>
          <div className="pt-10 max-w-3xl">
            <p className="font-body text-sm font-semibold text-primary uppercase tracking-widest mb-4">
              Expertise · {expertise.name}
            </p>
            <h1 id="expertise-name" className="font-heading text-4xl sm:text-5xl font-bold text-charcoal leading-tight mb-4">
              {expertise.tagline}
            </h1>
            <p className="font-body text-lg text-muted leading-relaxed">
              {expertise.description}
            </p>

            {/* Evidence bar */}
            <div className="mt-8 flex flex-wrap gap-5 font-body text-sm">
              {expertiseFounders.length > 0 && (
                <div className="flex flex-col">
                  <span className="font-heading text-2xl font-bold text-charcoal">{expertiseFounders.length}</span>
                  <span className="text-muted text-xs uppercase tracking-wide">Founders</span>
                </div>
              )}
              {expertiseBusinesses.length > 0 && (
                <div className="flex flex-col">
                  <span className="font-heading text-2xl font-bold text-charcoal">{expertiseBusinesses.length}</span>
                  <span className="text-muted text-xs uppercase tracking-wide">Businesses</span>
                </div>
              )}
              {expertiseServices.length > 0 && (
                <div className="flex flex-col">
                  <span className="font-heading text-2xl font-bold text-charcoal">{expertiseServices.length}</span>
                  <span className="text-muted text-xs uppercase tracking-wide">Services</span>
                </div>
              )}
              {expertiseResources.length > 0 && (
                <div className="flex flex-col">
                  <span className="font-heading text-2xl font-bold text-charcoal">{expertiseResources.length}</span>
                  <span className="text-muted text-xs uppercase tracking-wide">Resources</span>
                </div>
              )}
              {expertiseCaseStudies.length > 0 && (
                <div className="flex flex-col">
                  <span className="font-heading text-2xl font-bold text-charcoal">{expertiseCaseStudies.length}</span>
                  <span className="text-muted text-xs uppercase tracking-wide">Case Studies</span>
                </div>
              )}
              {expertiseTalks.length > 0 && (
                <div className="flex flex-col">
                  <span className="font-heading text-2xl font-bold text-charcoal">{expertiseTalks.length}</span>
                  <span className="text-muted text-xs uppercase tracking-wide">Talks</span>
                </div>
              )}
            </div>
          </div>
        </InnerContainer>
      </section>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <div className="py-14">
        <InnerContainer>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-14">

            {/* ── Left: aggregated entities ─────────────────────────────────── */}
            <div className="lg:col-span-2 flex flex-col gap-14">

              {/* Stories */}
              <StoryGrid
                heading={`Stories about ${expertise.name}`}
                subheading={`Published work from founders who practise ${expertise.name}.`}
                filter={{ ids: expertise.storyIds.length > 0 ? expertise.storyIds : undefined, topicId: expertise.topicIds[0] }}
                columns={2}
                cardVariant="vertical"
                showSummary
                showFounder
                showTopics
                showCTA
                emptyTitle="Stories coming soon"
                emptyMessage={`As founders publish stories tagged to ${expertise.name}, they will appear here.`}
              />

              {/* Ideas */}
              <IdeaGrid
                heading={`Ideas in ${expertise.name}`}
                subheading={`Extracted knowledge and insights from this expertise area.`}
                filter={{ topicId: expertise.topicIds[0] }}
                columns={2}
                cardVariant="default"
                emptyTitle="Ideas coming soon"
                emptyMessage={`Ideas are extracted from published stories. More will appear as founders publish.`}
              />

              {/* Case Studies */}
              {expertiseCaseStudies.length > 0 && (
                <section aria-labelledby="case-studies-heading">
                  <h2 id="case-studies-heading" className="font-heading text-2xl font-semibold text-charcoal mb-2">
                    Case Studies
                  </h2>
                  <p className="font-body text-sm text-muted mb-6">
                    Documented results from founders working in {expertise.name}.
                  </p>
                  <div className="flex flex-col gap-6">
                    {expertiseCaseStudies.map(cs => (
                      <article
                        key={cs.id}
                        className="bg-surface rounded-2xl border border-border p-6"
                        aria-label={cs.title}
                      >
                        <h3 className="font-heading text-lg font-semibold text-charcoal mb-3 leading-snug">
                          {cs.title}
                        </h3>
                        <p className="font-body text-sm text-muted leading-relaxed mb-4">
                          {cs.summary}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="font-body text-xs font-semibold text-muted uppercase tracking-wide mb-1">Challenge</p>
                            <p className="font-body text-sm text-charcoal/80 leading-relaxed">{cs.challenge}</p>
                          </div>
                          <div>
                            <p className="font-body text-xs font-semibold text-muted uppercase tracking-wide mb-1">Outcome</p>
                            <p className="font-body text-sm text-charcoal/80 leading-relaxed">{cs.outcome}</p>
                          </div>
                        </div>
                        {cs.result && (
                          <div className="bg-primary/5 border border-primary/15 rounded-xl px-4 py-3">
                            <p className="font-body text-sm font-semibold text-primary">
                              Result: {cs.result}
                            </p>
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                </section>
              )}

              {/* Talks */}
              {expertiseTalks.length > 0 && (
                <section aria-labelledby="talks-heading">
                  <h2 id="talks-heading" className="font-heading text-2xl font-semibold text-charcoal mb-2">
                    Talks
                  </h2>
                  <p className="font-body text-sm text-muted mb-6">
                    Presentations and speaking appearances on {expertise.name}.
                  </p>
                  <div className="flex flex-col gap-4">
                    {expertiseTalks.map(talk => (
                      <article
                        key={talk.id}
                        className="bg-surface rounded-xl border border-border p-5"
                        aria-label={talk.title}
                      >
                        <h3 className="font-heading text-base font-semibold text-charcoal mb-1">
                          {talk.title}
                        </h3>
                        <p className="font-body text-xs text-primary font-medium mb-2">
                          {talk.event}{talk.location ? ` · ${talk.location}` : ''}{talk.date ? ` · ${new Date(talk.date).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })}` : ''}
                        </p>
                        <p className="font-body text-sm text-muted leading-relaxed">
                          {talk.description}
                        </p>
                        {talk.videoUrl && (
                          <a
                            href={talk.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 inline-block text-sm font-medium text-primary hover:text-[#b05a35] transition-colors"
                          >
                            Watch recording →
                          </a>
                        )}
                      </article>
                    ))}
                  </div>
                </section>
              )}

            </div>

            {/* ── Right sidebar ─────────────────────────────────────────────── */}
            <aside className="lg:col-span-1 flex flex-col gap-8" aria-label={`${expertise.name} resources`}>

              {/* Founders */}
              {expertiseFounders.length > 0 && (
                <section aria-labelledby="expertise-founders-heading">
                  <h2 id="expertise-founders-heading" className="font-heading text-lg font-semibold text-charcoal mb-4">
                    Founders in {expertise.name}
                  </h2>
                  <div className="flex flex-col gap-3">
                    {expertiseFounders.map(founder => (
                      <Link
                        key={founder.id}
                        to={`/founders/${founder.slug}`}
                        className="flex items-center gap-3 bg-surface rounded-xl p-3 border border-border hover:border-primary hover:shadow-sm transition-all group"
                        aria-label={`View ${founder.name}'s profile`}
                      >
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-primary/10 ring-2 ring-border flex-shrink-0">
                          {founder.avatar ? (
                            <img src={founder.avatar} alt="" className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <span className="flex items-center justify-center h-full text-primary font-heading text-sm font-semibold">
                              {founder.name[0]}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-body text-sm font-semibold text-charcoal group-hover:text-primary transition-colors truncate">
                            {founder.name}
                          </p>
                          <p className="font-body text-xs text-muted truncate">{founder.industry.name} · {founder.location.name}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <Link to="/founders" className="mt-3 block text-sm font-medium text-primary hover:text-[#b05a35] transition-colors">
                    All founders →
                  </Link>
                </section>
              )}

              {/* Businesses */}
              {expertiseBusinesses.length > 0 && (
                <section aria-labelledby="expertise-businesses-heading">
                  <h2 id="expertise-businesses-heading" className="font-heading text-lg font-semibold text-charcoal mb-4">
                    Businesses
                  </h2>
                  <div className="flex flex-col gap-3">
                    {expertiseBusinesses.map(biz => (
                      <Link
                        key={biz.id}
                        to={`/businesses/${biz.slug}`}
                        className="flex items-center gap-3 bg-surface rounded-xl p-3 border border-border hover:border-primary hover:shadow-sm transition-all group"
                        aria-label={`View ${biz.name}`}
                      >
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-border flex-shrink-0">
                          <img src={biz.logo} alt="" className="w-full h-full object-cover" loading="lazy" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-body text-sm font-semibold text-charcoal group-hover:text-primary transition-colors truncate">
                            {biz.name}
                          </p>
                          <p className="font-body text-xs text-muted truncate">{biz.location.name}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Services */}
              {expertiseServices.length > 0 && (
                <section aria-labelledby="expertise-services-heading">
                  <h2 id="expertise-services-heading" className="font-heading text-lg font-semibold text-charcoal mb-4">
                    Services
                  </h2>
                  <div className="flex flex-col gap-3">
                    {expertiseServices.map(service => (
                      <div
                        key={service.id}
                        className="bg-surface rounded-xl border border-border p-4"
                      >
                        <h3 className="font-heading text-sm font-semibold text-charcoal mb-1">{service.name}</h3>
                        <p className="font-body text-xs text-muted leading-relaxed mb-2 line-clamp-2">{service.description}</p>
                        {service.price && (
                          <p className="font-body text-xs font-semibold text-primary mb-2">{service.price}</p>
                        )}
                        <a
                          href={service.ctaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium text-primary hover:text-[#b05a35] transition-colors"
                        >
                          {service.ctaLabel} →
                        </a>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Resources */}
              {expertiseResources.length > 0 && (
                <section aria-labelledby="expertise-resources-heading">
                  <h2 id="expertise-resources-heading" className="font-heading text-lg font-semibold text-charcoal mb-4">
                    Resources
                  </h2>
                  <div className="flex flex-col gap-3">
                    {expertiseResources.map(resource => (
                      <a
                        key={resource.id}
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex flex-col bg-surface rounded-xl border border-border p-4 hover:border-primary hover:shadow-sm transition-all"
                        aria-label={resource.title}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-body text-xs font-semibold text-muted uppercase tracking-wide">
                            {resourceTypeLabel[resource.type] ?? resource.type}
                          </span>
                          {resource.free && (
                            <span className="font-body text-xs font-semibold text-secondary bg-secondary/10 px-2 py-0.5 rounded-full">
                              Free
                            </span>
                          )}
                        </div>
                        <h3 className="font-heading text-sm font-semibold text-charcoal group-hover:text-primary transition-colors mb-1 leading-snug">
                          {resource.title}
                        </h3>
                        <p className="font-body text-xs text-muted leading-relaxed line-clamp-2">
                          {resource.description}
                        </p>
                      </a>
                    ))}
                  </div>
                </section>
              )}

              {/* Browse more expertise */}
              <div className="bg-surface rounded-2xl border border-border p-5">
                <h2 className="font-heading text-base font-semibold text-charcoal mb-3">
                  More Expertise Areas
                </h2>
                <Link
                  to="/expertise"
                  className="text-sm font-medium text-primary hover:text-[#b05a35] transition-colors block"
                >
                  Browse all expertise →
                </Link>
              </div>

            </aside>
          </div>
        </InnerContainer>
      </div>

    </main>
  )
}
