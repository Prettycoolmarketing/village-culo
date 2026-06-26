import React, { useState } from 'react'
import { usePageTitle } from '../utils/usePageTitle'
import { BusinessGrid }      from '../widgets/BusinessGrid'
import { FilterBar }         from '../components/ui/FilterBar'
import { InnerContainer }    from '../components/layout/PageContainer'
import { locations }         from '../data/locations'
import { industries }        from '../data/industries'
import { topics }            from '../data/topics'
import { filterBusinesses }  from '../utils/filters'
import type { BusinessFilter } from '../types'

// ─── Filter option arrays ──────────────────────────────────────────────────────

const locationOptions = [
  { value: 'all', label: 'All Locations' },
  ...locations
    .filter(l => filterBusinesses({ locationId: l.id }).length > 0)
    .map(l => ({ value: l.id, label: l.name })),
]

const industryOptions = [
  { value: 'all', label: 'All Industries' },
  ...industries
    .filter(i => filterBusinesses({ industryId: i.id }).length > 0)
    .map(i => ({ value: i.id, label: i.name })),
]

const topicOptions = [
  { value: 'all', label: 'All Topics' },
  ...topics
    .filter(t => filterBusinesses({ topicId: t.id }).length > 0)
    .map(t => ({ value: t.id, label: t.name })),
]

// ─── Mercato Page ──────────────────────────────────────────────────────────────

export function MercatoPage() {
  usePageTitle('Mercato')
  const [activeLocation, setActiveLocation] = useState('all')
  const [activeIndustry, setActiveIndustry] = useState('all')
  const [activeTopic,    setActiveTopic]    = useState('all')

  const filter: BusinessFilter = {
    ...(activeLocation !== 'all' && { locationId: activeLocation }),
    ...(activeIndustry !== 'all' && { industryId: activeIndustry }),
    ...(activeTopic    !== 'all' && { topicId:    activeTopic    }),
  }

  const matchCount      = filterBusinesses(filter).length
  const hasActiveFilter = activeLocation !== 'all' || activeIndustry !== 'all' || activeTopic !== 'all'

  function clearFilters() {
    setActiveLocation('all')
    setActiveIndustry('all')
    setActiveTopic('all')
  }

  return (
    <main className="min-h-screen bg-background">

      {/* ── Page hero ───────────────────────────────────────────────────────── */}
      <section
        className="bg-surface border-b border-border pt-24 pb-12"
        aria-labelledby="mercato-heading"
      >
        <InnerContainer>
          <div className="max-w-2xl">
            <p className="font-body text-xs font-semibold text-accent uppercase tracking-widest mb-3">
              CULO Village
            </p>
            <h1
              id="mercato-heading"
              className="font-heading text-4xl sm:text-5xl font-bold text-charcoal mb-4 leading-tight"
            >
              Mercato
            </h1>
            <p className="font-body text-lg text-muted leading-relaxed">
              Mercato is the Village business directory — but businesses here are not just listings.
              Every business is connected to the founder behind it, the stories they've shared, and
              the ideas they've contributed to the Village knowledge graph. Discover businesses
              through their knowledge, not just their category.
            </p>
          </div>
        </InnerContainer>
      </section>

      {/* ── Sticky filters ──────────────────────────────────────────────────── */}
      <section
        className="bg-surface border-b border-border py-5 sticky top-16 z-30 shadow-sm"
        aria-label="Filter businesses"
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
              options={industryOptions}
              active={activeIndustry}
              onChange={setActiveIndustry}
              label="Filter by industry"
            />
            <div className="flex flex-wrap gap-3">
              <FilterBar
                options={locationOptions}
                active={activeLocation}
                onChange={setActiveLocation}
                label="Filter by location"
              />
              <FilterBar
                options={topicOptions}
                active={activeTopic}
                onChange={setActiveTopic}
                label="Filter by topic"
              />
            </div>

            <p
              className="font-body text-sm text-muted"
              aria-live="polite"
              aria-atomic="true"
            >
              {hasActiveFilter
                ? `${matchCount} ${matchCount === 1 ? 'business' : 'businesses'} match your filters`
                : `${matchCount} ${matchCount === 1 ? 'business' : 'businesses'} in Mercato`}
            </p>
          </div>
        </InnerContainer>
      </section>

      {/* ── Business grid ───────────────────────────────────────────────────── */}
      <section
        className="py-12 md:py-16"
        aria-label={hasActiveFilter ? 'Filtered businesses' : 'All businesses'}
      >
        <InnerContainer>
          <BusinessGrid
            filter={filter}
            columns={3}
            cardVariant="featured"
            emptyTitle="No businesses match these filters"
            emptyMessage="Try clearing one or more filters, or check back as more businesses join the Village."
          />
        </InnerContainer>
      </section>

    </main>
  )
}
