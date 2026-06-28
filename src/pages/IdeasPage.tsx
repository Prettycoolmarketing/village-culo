import { useState } from 'react'
import { usePageTitle } from '../utils/usePageTitle'
import { IdeaGrid }         from '../widgets/IdeaGrid'
import { FilterBar }        from '../components/ui/FilterBar'
import { InnerContainer }   from '../components/layout/PageContainer'
import { topics }           from '../data/topics'
import { founders }         from '../data/founders'
import { businesses }       from '../data/businesses'
import { getIdeas }         from '../services/ideas'
import type { IdeaFilter }  from '../types'

// ─── Filter option arrays ──────────────────────────────────────────────────────

const topicOptions = [
  { value: 'all', label: 'All Topics' },
  ...topics
    .filter(t => getIdeas({ topicId: t.id }).length > 0)
    .map(t => ({ value: t.id, label: t.name })),
]

const founderOptions = [
  { value: 'all', label: 'All Founders' },
  ...founders
    .filter(f => getIdeas({ founderId: f.id }).length > 0)
    .map(f => ({ value: f.id, label: f.name })),
]

const businessOptions = [
  { value: 'all', label: 'All Businesses' },
  ...businesses
    .filter(b => getIdeas({ businessId: b.id }).length > 0)
    .map(b => ({ value: b.id, label: b.name })),
]

// ─── Ideas Directory ───────────────────────────────────────────────────────────

export function IdeasPage() {
  usePageTitle('Ideas')
  const [activeTopic,    setActiveTopic]    = useState('all')
  const [activeFounder,  setActiveFounder]  = useState('all')
  const [activeBusiness, setActiveBusiness] = useState('all')
  const [filtersOpen,    setFiltersOpen]    = useState(false)

  const filter: IdeaFilter = {
    ...(activeTopic    !== 'all' && { topicId:    activeTopic    }),
    ...(activeFounder  !== 'all' && { founderId:  activeFounder  }),
    ...(activeBusiness !== 'all' && { businessId: activeBusiness }),
  }

  const matchCount     = getIdeas(filter).length
  const hasActiveFilter = activeTopic !== 'all' || activeFounder !== 'all' || activeBusiness !== 'all'

  function clearFilters() {
    setActiveTopic('all')
    setActiveFounder('all')
    setActiveBusiness('all')
  }

  return (
    <main className="min-h-screen bg-background">

      {/* ── Page hero ───────────────────────────────────────────────────────── */}
      <section
        className="bg-surface border-b border-border pt-24 pb-12"
        aria-labelledby="ideas-heading"
      >
        <InnerContainer>
          <div className="max-w-2xl">
            <p className="font-body text-xs font-semibold text-secondary uppercase tracking-widest mb-3">
              CULO Village
            </p>
            <h1
              id="ideas-heading"
              className="font-heading text-4xl sm:text-5xl font-bold text-charcoal mb-4 leading-tight"
            >
              Ideas
            </h1>
            <p className="font-body text-lg text-muted leading-relaxed">
              Ideas are the knowledge layer of CULO Village. Each idea is extracted from one or more
              founder stories and connects across multiple people, businesses and topics. They are not
              blog posts — they are reusable insights that keep creating value as more stories are published.
            </p>
          </div>
        </InnerContainer>
      </section>

      {/* ── Sticky filters ──────────────────────────────────────────────────── */}
      <section
        className="bg-surface border-b border-border py-4 sticky top-16 z-30 shadow-sm"
        aria-label="Filter ideas"
      >
        <InnerContainer>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setFiltersOpen(o => !o)}
                aria-expanded={filtersOpen}
                aria-controls="ideas-filter-panel"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  filtersOpen || hasActiveFilter
                    ? 'border-primary text-primary bg-primary/5'
                    : 'border-border text-muted hover:border-primary hover:text-primary'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M7 8h10M11 12h2" />
                </svg>
                Filters
                {hasActiveFilter && <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" aria-label="active filters" />}
              </button>
              {hasActiveFilter && (
                <button onClick={clearFilters} className="text-sm font-medium text-muted hover:text-primary transition-colors">
                  Clear ×
                </button>
              )}
            </div>

            {filtersOpen && (
              <div id="ideas-filter-panel" className="flex flex-col gap-3">
                <FilterBar options={topicOptions} active={activeTopic} onChange={setActiveTopic} label="Filter by topic" />
                <div className="flex flex-wrap gap-3">
                  <FilterBar options={founderOptions} active={activeFounder} onChange={setActiveFounder} label="Filter by founder" />
                  <FilterBar options={businessOptions} active={activeBusiness} onChange={setActiveBusiness} label="Filter by business" />
                </div>
              </div>
            )}

            <p className="font-body text-sm text-muted" aria-live="polite" aria-atomic="true">
              {hasActiveFilter
                ? `${matchCount} ${matchCount === 1 ? 'idea' : 'ideas'} match your filters`
                : `${matchCount} ${matchCount === 1 ? 'idea' : 'ideas'} in the Village`}
            </p>
          </div>
        </InnerContainer>
      </section>

      {/* ── Idea grid ───────────────────────────────────────────────────────── */}
      <section
        className="py-12 md:py-16"
        aria-label={hasActiveFilter ? 'Filtered ideas' : 'All ideas'}
      >
        <InnerContainer>
          <IdeaGrid
            filter={filter}
            columns={3}
            cardVariant="default"
            showQuotes
            emptyTitle="No ideas match these filters"
            emptyMessage="Try clearing one or more filters, or check back as more stories are published and new ideas are extracted."
          />
        </InnerContainer>
      </section>

    </main>
  )
}
