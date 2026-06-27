import { useState } from 'react'
import { usePageTitle } from '../utils/usePageTitle'
import { StoryGrid }         from '../widgets/StoryGrid'
import { FilterBar }         from '../components/ui/FilterBar'
import { InnerContainer }    from '../components/layout/PageContainer'
import { locations }         from '../data/locations'
import { industries }        from '../data/industries'
import { topics }            from '../data/topics'
import { filterStories }     from '../utils/filters'
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
    .filter(l => filterStories({ locationId: l.id }).length > 0)
    .map(l => ({ value: l.id, label: l.name })),
]

const industryOptions = [
  { value: 'all', label: 'All Industries' },
  ...industries
    .filter(i => filterStories({ industryId: i.id }).length > 0)
    .map(i => ({ value: i.id, label: i.name })),
]

const topicOptions = [
  { value: 'all', label: 'All Topics' },
  ...topics
    .filter(t => filterStories({ topicId: t.id }).length > 0)
    .map(t => ({ value: t.id, label: t.name })),
]

// ─── Stories Page ──────────────────────────────────────────────────────────────

export function StoriesPage() {
  usePageTitle('Stories')
  const [activeFormat,   setActiveFormat]   = useState('all')
  const [activeLocation, setActiveLocation] = useState('all')
  const [activeIndustry, setActiveIndustry] = useState('all')
  const [activeTopic,    setActiveTopic]    = useState('all')

  const filter: StoryFilter = {
    ...(activeFormat   !== 'all' && { contentType: activeFormat as ContentType }),
    ...(activeLocation !== 'all' && { locationId:  activeLocation }),
    ...(activeIndustry !== 'all' && { industryId:  activeIndustry }),
    ...(activeTopic    !== 'all' && { topicId:     activeTopic    }),
  }

  const matchCount     = filterStories(filter).length
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
        className="bg-surface border-b border-border py-5 sticky top-16 z-30 shadow-sm"
        aria-label="Filter stories"
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
              options={contentTypeOptions}
              active={activeFormat}
              onChange={setActiveFormat}
              label="Filter by content format"
            />
            <FilterBar
              options={topicOptions}
              active={activeTopic}
              onChange={setActiveTopic}
              label="Filter by topic"
            />
            <div className="flex flex-wrap gap-3">
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
            </div>

            <p
              className="font-body text-sm text-muted"
              aria-live="polite"
              aria-atomic="true"
            >
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
