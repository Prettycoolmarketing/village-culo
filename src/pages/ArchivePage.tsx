import { useCallback } from 'react'
import { usePageTitle } from '../utils/usePageTitle'
import { useSearchParams, Link } from 'react-router-dom'
import { searchVillage, totalResults } from '../utils/search'
import type { SearchResults }          from '../utils/search'
import { getFounder }                  from '../data/founders'
import { getBusiness }                 from '../data/businesses'
import { SearchInput }                 from '../components/ui/SearchInput'
import { EmptyState }                  from '../components/ui/EmptyState'
import { StoryCard }                   from '../components/cards/StoryCard'
import { FounderCard }                 from '../components/cards/FounderCard'
import { IdeaCard }                    from '../components/cards/IdeaCard'
import { BusinessCard }                from '../components/cards/BusinessCard'
import { EventCard }                   from '../components/cards/EventCard'
import { InnerContainer }              from '../components/layout/PageContainer'

// ─── Types ───────────────────────────────────────────────────────────────────────

type ActiveTab = 'all' | 'stories' | 'founders' | 'ideas' | 'businesses' | 'events'

// ─── Tab bar ─────────────────────────────────────────────────────────────────────

interface TabBarProps {
  active: ActiveTab
  onChange: (tab: ActiveTab) => void
  counts: Record<ActiveTab, number>
}

function TabBar({ active, onChange, counts }: TabBarProps) {
  const tabs: { key: ActiveTab; label: string }[] = [
    { key: 'all',        label: 'All'        },
    { key: 'stories',    label: 'Stories'    },
    { key: 'founders',   label: 'Founders'   },
    { key: 'ideas',      label: 'Ideas'      },
    { key: 'businesses', label: 'Businesses' },
    { key: 'events',     label: 'Events'     },
  ]

  return (
    <div
      className="flex flex-wrap gap-1"
      role="tablist"
      aria-label="Filter results by type"
    >
      {tabs.map(({ key, label }) => {
        const isActive = active === key
        const count    = counts[key]
        return (
          <button
            key={key}
            role="tab"
            id={`tab-${key}`}
            aria-selected={isActive}
            aria-controls={`tabpanel-${key}`}
            onClick={() => onChange(key)}
            className={`
              flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium font-body
              transition-all duration-150
              focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
              ${isActive
                ? 'bg-primary text-white shadow-sm'
                : 'bg-background text-muted hover:text-charcoal hover:bg-border/60 border border-border'
              }
            `}
          >
            {label}
            <span
              className={`
                text-xs rounded-full px-1.5 py-0.5 font-semibold leading-none
                ${isActive ? 'bg-white/20 text-white' : 'bg-border text-muted'}
              `}
              aria-label={`${count} ${label.toLowerCase()}`}
            >
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ─── Section heading used in the All tab ─────────────────────────────────────────

function GroupHeading({
  title,
  count,
  tabKey,
  onViewAll,
}: {
  title: string
  count: number
  tabKey: ActiveTab
  onViewAll: (tab: ActiveTab) => void
}) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h2 className="font-heading text-xl font-semibold text-charcoal flex items-center gap-2">
        {title}
        <span className="font-body text-sm font-normal text-muted">({count})</span>
      </h2>
      {count > 4 && (
        <button
          onClick={() => onViewAll(tabKey)}
          className="font-body text-sm font-medium text-primary hover:text-[#b05a35] transition-colors"
        >
          View all {count} →
        </button>
      )}
    </div>
  )
}

// ─── All tab: grouped results ─────────────────────────────────────────────────────

interface AllResultsProps {
  results: SearchResults
  query: string
  onViewAll: (tab: ActiveTab) => void
}

function AllResults({ results, query, onViewAll }: AllResultsProps) {
  const total = totalResults(results)

  if (total === 0) {
    return (
      <EmptyState
        title={query ? `No results for "${query}"` : 'Nothing in the Village yet'}
        message={
          query
            ? 'Try a different search — names, topics, locations and industries all work.'
            : 'Content will appear here as founders publish stories to the Village.'
        }
      />
    )
  }

  return (
    <div className="flex flex-col gap-14">

      {/* Stories */}
      {results.stories.length > 0 && (
        <section aria-labelledby="group-stories">
          <GroupHeading title="Stories" count={results.stories.length} tabKey="stories" onViewAll={onViewAll} />
          <ul
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            role="list"
            aria-labelledby="group-stories"
            id="group-stories"
          >
            {results.stories.slice(0, 4).map(s => (
              <li key={s.id}>
                <StoryCard
                  story={s}
                  founder={getFounder(s.founderId)}
                  business={getBusiness(s.businessId)}
                  variant="compact"
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Founders */}
      {results.founders.length > 0 && (
        <section aria-labelledby="group-founders">
          <GroupHeading title="Founders" count={results.founders.length} tabKey="founders" onViewAll={onViewAll} />
          <ul
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            role="list"
            aria-labelledby="group-founders"
            id="group-founders"
          >
            {results.founders.slice(0, 4).map(f => (
              <li key={f.id}>
                <FounderCard
                  founder={f}
                  business={getBusiness(f.businessId)}
                  variant="compact"
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Ideas */}
      {results.ideas.length > 0 && (
        <section aria-labelledby="group-ideas">
          <GroupHeading title="Ideas" count={results.ideas.length} tabKey="ideas" onViewAll={onViewAll} />
          <ul
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            role="list"
            aria-labelledby="group-ideas"
            id="group-ideas"
          >
            {results.ideas.slice(0, 4).map(i => (
              <li key={i.id}>
                <IdeaCard idea={i} variant="compact" />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Businesses */}
      {results.businesses.length > 0 && (
        <section aria-labelledby="group-businesses">
          <GroupHeading title="Businesses" count={results.businesses.length} tabKey="businesses" onViewAll={onViewAll} />
          <ul
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            role="list"
            aria-labelledby="group-businesses"
            id="group-businesses"
          >
            {results.businesses.slice(0, 4).map(b => (
              <li key={b.id}>
                <BusinessCard
                  business={b}
                  founder={getFounder(b.founderId)}
                  variant="compact"
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Events */}
      {results.events.length > 0 && (
        <section aria-labelledby="group-events">
          <GroupHeading title="Events & Notices" count={results.events.length} tabKey="events" onViewAll={onViewAll} />
          <ul
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            role="list"
            aria-labelledby="group-events"
            id="group-events"
          >
            {results.events.slice(0, 4).map(e => (
              <li key={e.id}>
                <EventCard event={e} variant="compact" />
              </li>
            ))}
          </ul>
        </section>
      )}

    </div>
  )
}

// ─── Type-specific tab results ─────────────────────────────────────────────────────

interface TypeResultsProps {
  activeTab: ActiveTab
  results: SearchResults
  query: string
}

function TypeResults({ activeTab, results, query }: TypeResultsProps) {
  const emptyMessage = query
    ? `No ${activeTab} match "${query}". Try a different search term.`
    : `No ${activeTab} have been published to the Village yet.`

  const emptyTitle = query
    ? `No ${activeTab} found`
    : `No ${activeTab} yet`

  return (
    <div
      role="tabpanel"
      id={`tabpanel-${activeTab}`}
      aria-labelledby={`tab-${activeTab}`}
    >
      {/* Stories */}
      {activeTab === 'stories' && (
        results.stories.length === 0 ? (
          <EmptyState title={emptyTitle} message={emptyMessage} />
        ) : (
          <ul
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            role="list"
            aria-label={`${results.stories.length} stories`}
          >
            {results.stories.map(s => (
              <li key={s.id}>
                <StoryCard
                  story={s}
                  founder={getFounder(s.founderId)}
                  business={getBusiness(s.businessId)}
                  variant="vertical"
                  showSummary
                  showFounder
                  showTopics
                  showCTA
                />
              </li>
            ))}
          </ul>
        )
      )}

      {/* Founders */}
      {activeTab === 'founders' && (
        results.founders.length === 0 ? (
          <EmptyState title={emptyTitle} message={emptyMessage} />
        ) : (
          <ul
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            role="list"
            aria-label={`${results.founders.length} founders`}
          >
            {results.founders.map(f => (
              <li key={f.id}>
                <FounderCard
                  founder={f}
                  business={getBusiness(f.businessId)}
                  variant="default"
                />
              </li>
            ))}
          </ul>
        )
      )}

      {/* Ideas */}
      {activeTab === 'ideas' && (
        results.ideas.length === 0 ? (
          <EmptyState title={emptyTitle} message={emptyMessage} />
        ) : (
          <ul
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            role="list"
            aria-label={`${results.ideas.length} ideas`}
          >
            {results.ideas.map(i => (
              <li key={i.id}>
                <IdeaCard idea={i} variant="default" />
              </li>
            ))}
          </ul>
        )
      )}

      {/* Businesses */}
      {activeTab === 'businesses' && (
        results.businesses.length === 0 ? (
          <EmptyState title={emptyTitle} message={emptyMessage} />
        ) : (
          <ul
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            role="list"
            aria-label={`${results.businesses.length} businesses`}
          >
            {results.businesses.map(b => (
              <li key={b.id}>
                <BusinessCard
                  business={b}
                  founder={getFounder(b.founderId)}
                  variant="featured"
                />
              </li>
            ))}
          </ul>
        )
      )}

      {/* Events */}
      {activeTab === 'events' && (
        results.events.length === 0 ? (
          <EmptyState title={emptyTitle} message={emptyMessage} />
        ) : (
          <ul
            className="grid grid-cols-1 sm:grid-cols-2 gap-5"
            role="list"
            aria-label={`${results.events.length} events and notices`}
          >
            {results.events.map(e => (
              <li key={e.id}>
                <EventCard event={e} variant="default" />
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  )
}

// ─── Archive Page ─────────────────────────────────────────────────────────────────

export function ArchivePage() {
  usePageTitle('Archive')
  const [searchParams, setSearchParams] = useSearchParams()

  const query     = searchParams.get('q')   ?? ''
  const activeTab = (searchParams.get('tab') ?? 'all') as ActiveTab

  const results = searchVillage(query)
  const total   = totalResults(results)

  const setQuery = useCallback((q: string) => {
    setSearchParams(prev => {
      if (q) prev.set('q', q); else prev.delete('q')
      return prev
    }, { replace: true })
  }, [setSearchParams])

  const setTab = useCallback((tab: ActiveTab) => {
    setSearchParams(prev => {
      if (tab === 'all') prev.delete('tab'); else prev.set('tab', tab)
      return prev
    }, { replace: true })
  }, [setSearchParams])

  // Counts per tab — All shows the total
  const counts: Record<ActiveTab, number> = {
    all:        total,
    stories:    results.stories.length,
    founders:   results.founders.length,
    ideas:      results.ideas.length,
    businesses: results.businesses.length,
    events:     results.events.length,
  }

  // Active count label for aria-live
  const activeCount = activeTab === 'all' ? total : counts[activeTab]
  const activeLabel = activeTab === 'all' ? 'results' : activeTab

  return (
    <main className="min-h-screen bg-background">

      {/* ── Page hero + search ──────────────────────────────────────────────── */}
      <section
        className="bg-surface border-b border-border pt-24 pb-10"
        aria-labelledby="archive-heading"
      >
        <InnerContainer>
          <div className="max-w-2xl mb-8">
            <p className="font-body text-xs font-semibold text-primary uppercase tracking-widest mb-3">
              CULO Village
            </p>
            <h1
              id="archive-heading"
              className="font-heading text-4xl sm:text-5xl font-bold text-charcoal mb-4 leading-tight"
            >
              Archive
            </h1>
            <p className="font-body text-lg text-muted leading-relaxed">
              Everything published into the Village lives here. Search across stories, founders,
              ideas, businesses and events — or browse by type. The Archive is the safety net:
              if it exists in the Village, you can find it here.
            </p>
          </div>

          {/* Search input */}
          <SearchInput
            id="archive-search"
            value={query}
            onChange={setQuery}
            placeholder="Search stories, founders, ideas, businesses, topics, locations…"
            size="lg"
            className="max-w-2xl"
          />

          {/* Live result summary */}
          <p
            className="font-body text-sm text-muted mt-3"
            aria-live="polite"
            aria-atomic="true"
          >
            {query
              ? `${total} ${total === 1 ? 'result' : 'results'} for "${query}"`
              : `${total} items across the Village`}
          </p>
        </InnerContainer>
      </section>

      {/* ── Tab bar ─────────────────────────────────────────────────────────── */}
      <div className="bg-surface border-b border-border py-4 sticky top-16 z-30 shadow-sm">
        <InnerContainer>
          <TabBar active={activeTab} onChange={setTab} counts={counts} />
        </InnerContainer>
      </div>

      {/* ── Results ─────────────────────────────────────────────────────────── */}
      <section className="py-12 md:py-16">
        <InnerContainer>

          {/* Secondary aria-live for type-specific counts */}
          <p
            className="sr-only"
            aria-live="polite"
            aria-atomic="true"
          >
            {activeCount} {activeLabel} {query ? `matching "${query}"` : 'in the Village'}
          </p>

          {activeTab === 'all' ? (
            <AllResults
              results={results}
              query={query}
              onViewAll={setTab}
            />
          ) : (
            <TypeResults
              activeTab={activeTab}
              results={results}
              query={query}
            />
          )}

        </InnerContainer>
      </section>

      {/* ── Browse by type strip ────────────────────────────────────────────── */}
      {!query && (
        <section
          className="bg-surface border-t border-border py-10"
          aria-label="Browse the Village by section"
        >
          <InnerContainer>
            <h2 className="font-heading text-lg font-semibold text-charcoal mb-5">
              Browse the Village
            </h2>
            <nav aria-label="Village sections" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {[
                { to: '/stories',   label: 'Stories',    count: results.stories.length,    color: 'text-primary',   bg: 'bg-primary/8'   },
                { to: '/founders',  label: 'Founders',   count: results.founders.length,   color: 'text-secondary', bg: 'bg-secondary/8' },
                { to: '/ideas',     label: 'Ideas',      count: results.ideas.length,      color: 'text-secondary', bg: 'bg-secondary/8' },
                { to: '/mercato',   label: 'Mercato',    count: results.businesses.length, color: 'text-accent',    bg: 'bg-accent/8'    },
                { to: '/noticeboard', label: 'Noticeboard', count: results.events.length,  color: 'text-primary',   bg: 'bg-primary/8'   },
              ].map(({ to, label, count, color, bg }) => (
                <Link
                  key={to}
                  to={to}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl ${bg} border border-border hover:border-primary/30 transition-colors text-center`}
                >
                  <span className={`font-heading text-2xl font-bold ${color}`}>{count}</span>
                  <span className="font-body text-sm text-charcoal font-medium">{label}</span>
                </Link>
              ))}
            </nav>
          </InnerContainer>
        </section>
      )}

    </main>
  )
}
