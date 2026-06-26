import React, { useState } from 'react'
import { usePageTitle } from '../utils/usePageTitle'
import { IdeaGrid }         from '../widgets/IdeaGrid'
import { FilterBar }        from '../components/ui/FilterBar'
import { InnerContainer }   from '../components/layout/PageContainer'
import { topics }           from '../data/topics'
import { founders }         from '../data/founders'
import { businesses }       from '../data/businesses'
import { filterIdeas }      from '../utils/filters'
import type { IdeaFilter }  from '../types'

// ─── Filter option arrays ──────────────────────────────────────────────────────

const topicOptions = [
  { value: 'all', label: 'All Topics' },
  ...topics
    .filter(t => filterIdeas({ topicId: t.id }).length > 0)
    .map(t => ({ value: t.id, label: t.name })),
]

const founderOptions = [
  { value: 'all', label: 'All Founders' },
  ...founders
    .filter(f => filterIdeas({ founderId: f.id }).length > 0)
    .map(f => ({ value: f.id, label: f.name })),
]

const businessOptions = [
  { value: 'all', label: 'All Businesses' },
  ...businesses
    .filter(b => filterIdeas({ businessId: b.id }).length > 0)
    .map(b => ({ value: b.id, label: b.name })),
]

// ─── Ideas Directory ───────────────────────────────────────────────────────────

export function IdeasPage() {
  usePageTitle('Ideas')
  const [activeTopic,    setActiveTopic]    = useState('all')
  const [activeFounder,  setActiveFounder]  = useState('all')
  const [activeBusiness, setActiveBusiness] = useState('all')

  const filter: IdeaFilter = {
    ...(activeTopic    !== 'all' && { topicId:    activeTopic    }),
    ...(activeFounder  !== 'all' && { founderId:  activeFounder  }),
    ...(activeBusiness !== 'all' && { businessId: activeBusiness }),
  }

  const matchCount     = filterIdeas(filter).length
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
        className="bg-surface border-b border-border py-5 sticky top-16 z-30 shadow-sm"
        aria-label="Filter ideas"
      >
        <InnerContainer>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-4">
              <p className="font-body text-sm font-medium text-charcoal hidden sm:block">Filter</p>
              {hasActiveFilter && (
                <button
                  onClick={clearFilters}
                  className="text-sm font-medium text-muted hover:text-primary transition-colors ml-auto"
                >
                  Clear filters ×
                </button>
              )}
            </div>

            <FilterBar
              options={topicOptions}
              active={activeTopic}
              onChange={setActiveTopic}
              label="Filter by topic"
            />
            <div className="flex flex-wrap gap-3">
              <FilterBar
                options={founderOptions}
                active={activeFounder}
                onChange={setActiveFounder}
                label="Filter by founder"
              />
              <FilterBar
                options={businessOptions}
                active={activeBusiness}
                onChange={setActiveBusiness}
                label="Filter by business"
              />
            </div>

            <p
              className="font-body text-sm text-muted"
              aria-live="polite"
              aria-atomic="true"
            >
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
