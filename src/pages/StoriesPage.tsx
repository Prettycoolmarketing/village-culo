import { useState } from 'react'
import { usePageTitle } from '../utils/usePageTitle'
import { StoryGrid }         from '../widgets/StoryGrid'
import { FilterBar }         from '../components/ui/FilterBar'
import { InnerContainer }    from '../components/layout/PageContainer'
import { locations }         from '../data/locations'
import { industries }        from '../data/industries'
import { topics }            from '../data/topics'
import { getStories }        from '../services/stories'
import type { StoryFilter, ContentType } from '../types'

// ─── Filter option arrays ──────────────────────────────────────────────────────

const contentTypeOptions = [
  { value: 'all',       label: 'All Formats' },
  { value: 'reel',      label: 'Reels'       },
  { value: 'blog',      label: 'Blogs'       },
  { value: 'carousel',  label: 'Carousels'   },
]

const locationOptions = [
  { value: 'all', label: 'All Locations' },
  ...locations
    .filter(l => getStories({ locationId: l.id }).length > 0)
    .map(l => ({ value: l.id, label: l.name })),
]

const industryOptions = [
  { value: 'all', label: 'All Industries' },
  ...industries
    .filter(i => getStories({ industryId: i.id }).length > 0)
    .map(i => ({ value: i.id, label: i.name })),
]

const topicOptions = [
  { value: 'all', label: 'All Topics' },
  ...topics
    .filter(t => getStories({ topicId: t.id }).length > 0)
    .map(t => ({ value: t.id, label: t.name })),
]

// ─── Stories Page ──────────────────────────────────────────────────────────────

export function StoriesPage() {
  usePageTitle('Stories')
  const [activeFormat,   setActiveFormat]   = useState('all')
  const [activeLocation, setActiveLocation] = useState('all')
  const [activeIndustry, setActiveIndustry] = useState('all')
  const [activeTopic,    setActiveTopic]    = useState('all')
  const [filtersOpen,    setFiltersOpen]    = useState(false)

  const filter: StoryFilter = {
    ...(activeFormat   !== 'all' && { contentType: activeFormat as ContentType }),
    ...(activeLocation !== 'all' && { locationId:  activeLocation }),
    ...(activeIndustry !== 'all' && { industryId:  activeIndustry }),
    ...(activeTopic    !== 'all' && { topicId:     activeTopic    }),
  }

  const matchCount     = getStories(filter).length
  const hasActiveFilter = activeFormat !== 'all' || activeLocation !== 'all' || activeIndustry !== 'all' || activeTopic !== 'all'

  function clearFilters() {
    setActiveFormat('all')
    setActiveLocation('all')
    setActiveIndustry('all')
    setActiveTopic('all')
  }

  return (
    <main className="min-h-screen bg-background">

      {/* ── Page hero ───────────────────────────────────────────────────────── */}
      <section
        className="bg-surface border-b border-border pt-24 pb-12"
        aria-labelledby="stories-heading"
      >
        <InnerContainer>
          <div className="max-w-2xl">
            <p className="font-body text-xs font-semibold text-primary uppercase tracking-widest mb-3">
              CULO Village
            </p>
            <h1
              id="stories-heading"
              className="font-heading text-4xl sm:text-5xl font-bold text-charcoal mb-4 leading-tight"
            >
              Stories
            </h1>
            <p className="font-body text-lg text-muted leading-relaxed">
              Real founder experiences transformed into blogs, reels and carousels. Every story in
              the Village is a permanent digital asset — connected to a founder, a business, a
              location and a set of ideas that continue creating value long after they're published.
            </p>
          </div>
        </InnerContainer>
      </section>

      {/* ── Sticky filters ──────────────────────────────────────────────────── */}
      <section
        className="bg-surface border-b border-border py-4 sticky top-16 z-30 shadow-sm"
        aria-label="Filter stories"
      >
        <InnerContainer>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setFiltersOpen(o => !o)}
                aria-expanded={filtersOpen}
                aria-controls="stories-filter-panel"
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
              <div id="stories-filter-panel" className="flex flex-col gap-3">
                <FilterBar options={contentTypeOptions} active={activeFormat} onChange={setActiveFormat} label="Filter by content format" />
                <FilterBar options={topicOptions} active={activeTopic} onChange={setActiveTopic} label="Filter by topic" />
                <div className="flex flex-wrap gap-3">
                  <FilterBar options={locationOptions} active={activeLocation} onChange={setActiveLocation} label="Filter by location" />
                  <FilterBar options={industryOptions} active={activeIndustry} onChange={setActiveIndustry} label="Filter by industry" />
                </div>
              </div>
            )}

            <p className="font-body text-sm text-muted" aria-live="polite" aria-atomic="true">
              {hasActiveFilter
                ? `${matchCount} ${matchCount === 1 ? 'story' : 'stories'} match your filters`
                : `${matchCount} ${matchCount === 1 ? 'story' : 'stories'} in the Village`}
            </p>
          </div>
        </InnerContainer>
      </section>

      {/* ── Story grid ──────────────────────────────────────────────────────── */}
      <section
        className="py-12 md:py-16"
        aria-label={hasActiveFilter ? 'Filtered stories' : 'All stories'}
      >
        <InnerContainer>
          <StoryGrid
            filter={filter}
            columns={3}
            cardVariant="vertical"
            showSummary
            showFounder
            showTopics
            showCTA
            emptyTitle="No stories match these filters"
            emptyMessage="Try clearing one or more filters, or check back as more stories are published to the Village."
          />
        </InnerContainer>
      </section>

    </main>
  )
}
