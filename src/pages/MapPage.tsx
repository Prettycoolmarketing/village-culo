import { useState } from 'react'
import { usePageTitle } from '../utils/usePageTitle'
import { Link }             from 'react-router-dom'
import { locations }        from '../data/locations'
import { filterStories }    from '../utils/filters'
import { filterFounders }   from '../utils/filters'
import { filterBusinesses } from '../utils/filters'
import { filterEvents }     from '../utils/filters'
import { FilterBar }        from '../components/ui/FilterBar'
import { InnerContainer }   from '../components/layout/PageContainer'
import type { Location }    from '../types'

// ─── Per-location activity counts ────────────────────────────────────────────────

interface LocationStats {
  stories:    number
  founders:   number
  businesses: number
  events:     number
  total:      number
}

function getLocationStats(locationId: string): LocationStats {
  const stories    = filterStories   ({ locationId }).length
  const founders   = filterFounders  ({ locationId }).length
  const businesses = filterBusinesses({ locationId }).length
  const events     = filterEvents    ({ locationId }).length
  return { stories, founders, businesses, events, total: stories + founders + businesses + events }
}

// Pre-compute all stats once at module level (pure data, no side effects)
const locationData = locations.map(l => ({ location: l, stats: getLocationStats(l.id) }))
const maxActivity  = Math.max(...locationData.map(d => d.stats.total))

// ─── State filter options ─────────────────────────────────────────────────────────

const stateOptions = [
  { value: 'all', label: 'All States' },
  ...Array.from(new Set(locations.map(l => l.state))).map(s => ({ value: s, label: s })),
]

// ─── Location card ────────────────────────────────────────────────────────────────

interface LocationCardProps {
  location: Location
  stats: LocationStats
  isMostActive: boolean
  featured?: boolean
}

function StatChip({ value, label }: { value: number; label: string }) {
  return (
    <span className="flex flex-col items-center gap-0.5">
      <span className="font-heading text-lg font-bold text-charcoal leading-none">{value}</span>
      <span className="font-body text-xs text-muted">{label}</span>
    </span>
  )
}

function LocationCard({ location, stats, isMostActive, featured = false }: LocationCardProps) {
  const archiveUrl = `/archive?q=${encodeURIComponent(location.name)}`
  const hasContent = stats.total > 0

  return (
    <article
      className={`
        group relative bg-surface rounded-2xl overflow-hidden shadow-card
        hover:shadow-lg transition-all duration-300
        ${featured ? 'sm:col-span-2' : ''}
      `}
      aria-label={`${location.name}, ${location.state} — ${stats.total} items in the Village`}
    >
      {/* Cover image */}
      <div
        className={`relative overflow-hidden ${featured ? 'h-64 sm:h-72' : 'h-48'}`}
      >
        <img
          src={location.image}
          alt={`${location.name}, ${location.state}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/20 to-transparent"
          aria-hidden="true"
        />

        {/* Location name over image */}
        <div className="absolute bottom-0 left-0 p-5">
          <div className="flex items-end gap-2">
            <div>
              <p className="font-body text-xs font-semibold text-white/70 uppercase tracking-widest mb-0.5">
                {location.state} · {location.country}
              </p>
              <h2 className="font-heading text-2xl font-bold text-white leading-tight">
                {location.name}
              </h2>
            </div>
          </div>
        </div>

        {/* Most active badge */}
        {isMostActive && hasContent && (
          <div className="absolute top-3 right-3">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-accent text-charcoal">
              Most active
            </span>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-5">
        <p className="font-body text-sm text-muted leading-relaxed mb-5">
          {location.description}
        </p>

        {/* Stats row */}
        {hasContent ? (
          <div
            className="flex items-start justify-between gap-2 pb-5 mb-5 border-b border-border"
            aria-label={`Activity in ${location.name}`}
          >
            {stats.stories    > 0 && <StatChip value={stats.stories}    label="stories"    />}
            {stats.founders   > 0 && <StatChip value={stats.founders}   label="founders"   />}
            {stats.businesses > 0 && <StatChip value={stats.businesses} label="businesses" />}
            {stats.events     > 0 && <StatChip value={stats.events}     label="events"     />}
            {/* Fill empty slots so layout stays consistent */}
            {stats.stories    === 0 && <span className="flex-1" aria-hidden="true" />}
            {stats.founders   === 0 && <span className="flex-1" aria-hidden="true" />}
            {stats.businesses === 0 && <span className="flex-1" aria-hidden="true" />}
            {stats.events     === 0 && <span className="flex-1" aria-hidden="true" />}
          </div>
        ) : (
          <p className="font-body text-xs text-muted italic mb-5">
            No Village content here yet — be the first to publish from {location.name}.
          </p>
        )}

        {/* CTA */}
        <Link
          to={archiveUrl}
          className={`
            inline-flex items-center gap-1.5 text-sm font-medium transition-colors
            ${hasContent
              ? 'text-primary hover:text-[#b05a35]'
              : 'text-muted cursor-default pointer-events-none'
            }
          `}
          aria-label={`Explore ${location.name} in the Village Archive`}
          tabIndex={hasContent ? 0 : -1}
          aria-disabled={!hasContent}
        >
          Explore {location.name} →
        </Link>
      </div>
    </article>
  )
}

// ─── Map Page ─────────────────────────────────────────────────────────────────────

export function MapPage() {
  usePageTitle('Map')
  const [activeState, setActiveState] = useState('all')

  const filtered = activeState === 'all'
    ? locationData
    : locationData.filter(d => d.location.state === activeState)

  // Sort by activity descending so the most populated locations appear first
  const sorted = [...filtered].sort((a, b) => b.stats.total - a.stats.total)

  const totalItems = locationData.reduce((sum, d) => sum + d.stats.total, 0)

  return (
    <main className="min-h-screen bg-background">

      {/* ── Page hero ───────────────────────────────────────────────────────── */}
      <section
        className="bg-surface border-b border-border pt-24 pb-12"
        aria-labelledby="map-heading"
      >
        <InnerContainer>
          <div className="max-w-2xl">
            <p className="font-body text-xs font-semibold text-primary uppercase tracking-widest mb-3">
              CULO Village
            </p>
            <h1
              id="map-heading"
              className="font-heading text-4xl sm:text-5xl font-bold text-charcoal mb-4 leading-tight"
            >
              Map
            </h1>
            <p className="font-body text-lg text-muted leading-relaxed">
              Knowledge, stories, founders and businesses belong to places. The Village Map lets
              you explore everything published by location — discover what founders in your city
              are building, sharing and creating across the knowledge graph.
            </p>
          </div>
        </InnerContainer>
      </section>

      {/* ── State filter ────────────────────────────────────────────────────── */}
      <section
        className="bg-surface border-b border-border py-5 sticky top-16 z-30 shadow-sm"
        aria-label="Filter by state"
      >
        <InnerContainer>
          <div className="flex flex-col gap-3">
            <FilterBar
              options={stateOptions}
              active={activeState}
              onChange={setActiveState}
              label="Filter by state"
            />
            <p
              className="font-body text-sm text-muted"
              aria-live="polite"
              aria-atomic="true"
            >
              {activeState === 'all'
                ? `${sorted.length} locations · ${totalItems} items across the Village`
                : `${sorted.length} ${sorted.length === 1 ? 'location' : 'locations'} in ${activeState}`}
            </p>
          </div>
        </InnerContainer>
      </section>

      {/* ── Location grid ───────────────────────────────────────────────────── */}
      <section
        className="py-12 md:py-16"
        aria-label="Village locations"
      >
        <InnerContainer>
          {sorted.length === 0 ? (
            <div className="py-20 text-center">
              <p className="font-heading text-xl text-charcoal mb-2">No locations in {activeState} yet</p>
              <p className="font-body text-muted">Check back as more founders join the Village.</p>
            </div>
          ) : (
            <ul
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6"
              role="list"
              aria-label={`${sorted.length} Village locations`}
            >
              {sorted.map(({ location, stats }, index) => (
                <li
                  key={location.id}
                  // First card spans 2 cols on sm+ when it's the most active and there are 3+ locations
                  className={index === 0 && sorted.length >= 3 ? 'sm:col-span-2 lg:col-span-1' : ''}
                >
                  <LocationCard
                    location={location}
                    stats={stats}
                    isMostActive={stats.total === maxActivity && stats.total > 0}
                  />
                </li>
              ))}
            </ul>
          )}
        </InnerContainer>
      </section>

      {/* ── Village reach strip ─────────────────────────────────────────────── */}
      <section
        className="bg-surface border-t border-border py-10"
        aria-label="Village reach summary"
      >
        <InnerContainer>
          <div className="max-w-2xl">
            <h2 className="font-heading text-lg font-semibold text-charcoal mb-2">
              The Village is growing across Australia
            </h2>
            <p className="font-body text-sm text-muted leading-relaxed mb-5">
              Every founder who publishes a story adds to the knowledge graph of their city. As the
              Village grows, each location becomes richer — more stories, more ideas, more
              connections between the people building real things in real places.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/onboarding"
                className="px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-[#b05a35] transition-colors"
              >
                Become a Publisher
              </Link>
              <Link
                to="/archive"
                className="px-5 py-2.5 border border-border text-charcoal text-sm font-medium rounded-xl hover:border-primary hover:text-primary transition-colors"
              >
                Search the Archive
              </Link>
            </div>
          </div>
        </InnerContainer>
      </section>

    </main>
  )
}
