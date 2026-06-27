import { useState } from 'react'
import { usePageTitle } from '../utils/usePageTitle'
import { FounderGrid }       from '../widgets/FounderGrid'
import { FilterBar }         from '../components/ui/FilterBar'
import { SearchInput }       from '../components/ui/SearchInput'
import { InnerContainer }    from '../components/layout/PageContainer'
import { locations }         from '../data/locations'
import { industries }        from '../data/industries'
import { topics }            from '../data/topics'
import { filterFounders }    from '../utils/filters'
import type { FounderFilter } from '../types'

// ─── Build filter option arrays from data ──────────────────────────────────────

const locationOptions = [
  { value: 'all', label: 'All Locations' },
  ...locations.map(l => ({ value: l.id, label: l.name })),
]

const industryOptions = [
  { value: 'all', label: 'All Industries' },
  ...industries.map(i => ({ value: i.id, label: i.name })),
]

const topicOptions = [
  { value: 'all', label: 'All Topics' },
  // Only show topics that at least one founder covers
  ...topics
    .filter(t => filterFounders({ topicId: t.id }).length > 0)
    .map(t => ({ value: t.id, label: t.name })),
]

// ─── Founders Directory ────────────────────────────────────────────────────────

export function FoundersPage() {
  usePageTitle('Founders')
  const [activeLocation, setActiveLocation] = useState('all')
  const [activeIndustry, setActiveIndustry] = useState('all')
  const [activeTopic,    setActiveTopic]    = useState('all')
  const [searchQuery,    setSearchQuery]    = useState('')

  // Build the filter object — only include active (non-'all') values
  const filter: FounderFilter = {
    ...(activeLocation !== 'all' && { locationId: activeLocation }),
    ...(activeIndustry !== 'all' && { industryId: activeIndustry }),
    ...(activeTopic    !== 'all' && { topicId:    activeTopic    }),
  }

  // Count how many founders match, for the results label
  const matchCount = filterFounders(filter).length
  const hasActiveFilter = activeLocation !== 'all' || activeIndustry !== 'all' || activeTopic !== 'all'

  function clearFilters() {
    setActiveLocation('all')
    setActiveIndustry('all')
    setActiveTopic('all')
    setSearchQuery('')
  }

  return (
    <main className="min-h-screen bg-background" id="founders-main">

      {/* ── Page hero ───────────────────────────────────────────────────────── */}
      <section
        className="bg-surface border-b border-border pt-24 pb-12"
        aria-labelledby="founders-heading"
      >
        <InnerContainer>
          <div className="max-w-2xl">
            <p className="font-body text-xs font-semibold text-primary uppercase tracking-widest mb-3">
              CULO Village
            </p>
            <h1
              id="founders-heading"
              className="font-heading text-4xl sm:text-5xl font-bold text-charcoal mb-4 leading-tight"
            >
              Founders
            </h1>
            <p className="font-body text-lg text-muted leading-relaxed">
              Founders are the people behind every story in the Village. Each profile connects their
              real experiences to the knowledge they've published — stories, ideas, businesses and
              the expertise that makes them worth discovering.
            </p>
          </div>
        </InnerContainer>
      </section>

      {/* ── Filters ─────────────────────────────────────────────────────────── */}
      <section
        className="bg-surface border-b border-border py-5 sticky top-16 z-30 shadow-sm"
        aria-label="Filter founders"
      >
        <InnerContainer>
          <div className="flex flex-col gap-4">

            {/* Search */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <SearchInput
                id="founders-search"
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search by name, business or topic…"
                size="sm"
                className="w-full sm:max-w-xs"
              />
              {hasActiveFilter && (
                <button
                  onClick={clearFilters}
                  className="text-sm font-medium text-muted hover:text-primary transition-colors self-start sm:self-auto"
                >
                  Clear filters ×
                </button>
              )}
            </div>

            {/* Filter rows — stacked on mobile, row on desktop */}
            <div className="flex flex-col gap-3">
              <FilterBar
                options={locationOptions}
                active={activeLocation}
                onChange={setActiveLocation}
                label="Filter by location"
              />
              <FilterBar
                options={industryOptions}
                active={activeIndustry}
                onChange={setActiveIndustry}
                label="Filter by industry"
              />
              <FilterBar
                options={topicOptions}
                active={activeTopic}
                onChange={setActiveTopic}
                label="Filter by topic"
              />
            </div>

            {/* Result count */}
            <p className="font-body text-sm text-muted" aria-live="polite" aria-atomic="true">
              {hasActiveFilter
                ? `${matchCount} ${matchCount === 1 ? 'founder' : 'founders'} match your filters`
                : `${matchCount} ${matchCount === 1 ? 'founder' : 'founders'} in the Village`
              }
            </p>
          </div>
        </InnerContainer>
      </section>

      {/* ── Founder grid ────────────────────────────────────────────────────── */}
      <section
        className="py-12 md:py-16"
        aria-label={hasActiveFilter ? 'Filtered founders' : 'All founders'}
      >
        <InnerContainer>
          <FounderGrid
            filter={filter}
            columns={3}
            cardVariant="featured"
            emptyTitle="No founders match these filters"
            emptyMessage="Try clearing one or more filters to see more founders, or check back as new founders join the Village."
          />
        </InnerContainer>
      </section>

    </main>
  )
}
