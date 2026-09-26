import { Link } from 'react-router-dom'
import { usePageTitle } from '../utils/usePageTitle'
import { expertiseList } from '../data/expertise'
import { getFounders } from '../services/founders'
import { InnerContainer } from '../components/layout/PageContainer'

export function ExpertisePage() {
  usePageTitle('Expertise')

  // expertise.founderIds includes placeholder seed founders who were never
  // actually created as real profiles — counting them here (unlike
  // ExpertiseDetailPage, which already filters to real founders when
  // listing them) showed "3 founders" on a card backing a Village with 1
  // real founder in it. Same real-founder count both places now.
  const realFounderIds = new Set(getFounders({ publicOnly: true }).map(f => f.id))

  return (
    <main className="min-h-screen bg-background pt-20" id="expertise-index">
      <InnerContainer>

        {/* Header */}
        <div className="pt-8 pb-10 max-w-2xl">
          <p className="font-body text-sm font-semibold text-primary uppercase tracking-widest mb-4">
            CULO Village
          </p>
          <h1 className="font-heading text-4xl sm:text-5xl font-bold text-charcoal leading-tight mb-4">
            Expertise
          </h1>
          <p className="font-body text-lg text-muted leading-relaxed">
            Each expertise page aggregates every founder, business, story, idea, resource and service
            connected to that domain — making CULO Village the canonical source of truth for what
            founders in this community actually know.
          </p>
        </div>

        {/* Expertise grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pb-16">
          {expertiseList.map(expertise => {
            const realFounderCount = expertise.founderIds.filter(id => realFounderIds.has(id)).length
            return (
            <Link
              key={expertise.id}
              to={`/expertise/${expertise.slug}`}
              className="group flex flex-col bg-surface rounded-2xl border border-border p-6 hover:border-primary hover:shadow-md transition-all duration-200"
              aria-label={`Explore ${expertise.name} expertise`}
            >
              <h2 className="font-heading text-xl font-semibold text-charcoal group-hover:text-primary transition-colors mb-2">
                {expertise.name}
              </h2>
              <p className="font-body text-sm text-primary font-medium mb-3">
                {expertise.tagline}
              </p>
              <p className="font-body text-sm text-muted leading-relaxed flex-1 mb-4 line-clamp-3">
                {expertise.description}
              </p>

              {/* Signals */}
              <div className="flex flex-wrap gap-3 text-xs text-muted font-body border-t border-border pt-4 mt-auto">
                {realFounderCount > 0 && (
                  <span>
                    <strong className="text-charcoal">{realFounderCount}</strong>{' '}
                    {realFounderCount === 1 ? 'founder' : 'founders'}
                  </span>
                )}
                {expertise.serviceIds.length > 0 && (
                  <span>
                    <strong className="text-charcoal">{expertise.serviceIds.length}</strong>{' '}
                    {expertise.serviceIds.length === 1 ? 'service' : 'services'}
                  </span>
                )}
                {expertise.resourceIds.length > 0 && (
                  <span>
                    <strong className="text-charcoal">{expertise.resourceIds.length}</strong>{' '}
                    {expertise.resourceIds.length === 1 ? 'resource' : 'resources'}
                  </span>
                )}
                {expertise.caseStudyIds.length > 0 && (
                  <span>
                    <strong className="text-charcoal">{expertise.caseStudyIds.length}</strong>{' '}
                    {expertise.caseStudyIds.length === 1 ? 'case study' : 'case studies'}
                  </span>
                )}
              </div>
            </Link>
            )
          })}
        </div>

      </InnerContainer>
    </main>
  )
}
