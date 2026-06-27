import { useState } from 'react'
import { usePageTitle } from '../utils/usePageTitle'
import { EventGrid }       from '../widgets/EventGrid'
import { FilterBar }       from '../components/ui/FilterBar'
import { InnerContainer }  from '../components/layout/PageContainer'
import { locations }       from '../data/locations'
import { filterEvents }    from '../utils/filters'
import type { EventFilter, NoticeType } from '../types'

// ─── Filter option arrays ──────────────────────────────────────────────────────

const typeOptions = [
  { value: 'all',            label: 'All Types'      },
  { value: 'event',          label: 'Events'         },
  { value: 'collaboration',  label: 'Collaborations' },
  { value: 'opportunity',    label: 'Opportunities'  },
  { value: 'request',        label: 'Requests'       },
]

const locationOptions = [
  { value: 'all', label: 'All Locations' },
  ...locations
    .filter(l => filterEvents({ locationId: l.id }).length > 0)
    .map(l => ({ value: l.id, label: l.name })),
]

// ─── Noticeboard Page ──────────────────────────────────────────────────────────

export function NoticeboardPage() {
  usePageTitle('Noticeboard')
  const [activeType,     setActiveType]     = useState('all')
  const [activeLocation, setActiveLocation] = useState('all')
  const [filtersOpen,    setFiltersOpen]    = useState(false)

  const filter: EventFilter = {
    ...(activeType     !== 'all' && { type:       activeType as NoticeType }),
    ...(activeLocation !== 'all' && { locationId: activeLocation           }),
  }

  const matchCount      = filterEvents(filter).length
  const hasActiveFilter = activeType !== 'all' || activeLocation !== 'all'

  function clearFilters() {
    setActiveType('all')
    setActiveLocation('all')
  }

  return (
    <main className="min-h-screen bg-background">

      {/* ── Page hero ───────────────────────────────────────────────────────── */}
      <section
        className="bg-surface border-b border-border pt-24 pb-12"
        aria-labelledby="noticeboard-heading"
      >
        <InnerContainer>
          <div className="max-w-2xl">
            <p className="font-body text-xs font-semibold text-primary uppercase tracking-widest mb-3">
              CULO Village
            </p>
            <h1
              id="noticeboard-heading"
              className="font-heading text-4xl sm:text-5xl font-bold text-charcoal mb-4 leading-tight"
            >
              Noticeboard
            </h1>
            <p className="font-body text-lg text-muted leading-relaxed">
              Noticeboard is where Village opportunities are posted. Discover upcoming events,
              open collaborations, community requests and opportunities connected to founders,
              businesses and locations across the Village. Everything here is real and relevant.
            </p>
          </div>
        </InnerContainer>
      </section>

      {/* ── Sticky filters ──────────────────────────────────────────────────── */}
      <section
        className="bg-surface border-b border-border py-4 sticky top-16 z-30 shadow-sm"
        aria-label="Filter notices"
      >
        <InnerContainer>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setFiltersOpen(o => !o)}
                aria-expanded={filtersOpen}
                aria-controls="noticeboard-filter-panel"
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
              <div id="noticeboard-filter-panel" className="flex flex-col gap-3">
                <FilterBar options={typeOptions} active={activeType} onChange={setActiveType} label="Filter by notice type" />
                <FilterBar options={locationOptions} active={activeLocation} onChange={setActiveLocation} label="Filter by location" />
              </div>
            )}

            <p className="font-body text-sm text-muted" aria-live="polite" aria-atomic="true">
              {hasActiveFilter
                ? `${matchCount} ${matchCount === 1 ? 'notice' : 'notices'} match your filters`
                : `${matchCount} ${matchCount === 1 ? 'notice' : 'notices'} on the board`}
            </p>
          </div>
        </InnerContainer>
      </section>

      {/* ── Event grid ──────────────────────────────────────────────────────── */}
      <section
        className="py-12 md:py-16"
        aria-label={hasActiveFilter ? 'Filtered notices' : 'All notices'}
      >
        <InnerContainer>
          <EventGrid
            filter={filter}
            columns={3}
            cardVariant="featured"
            emptyTitle="No notices match these filters"
            emptyMessage="Try clearing one or more filters, or check back as founders post new events and opportunities."
          />
        </InnerContainer>
      </section>

    </main>
  )
}
