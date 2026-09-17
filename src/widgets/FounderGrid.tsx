import type { FounderFilter } from '../types'
import { getFounders } from '../services/founders'
import { getBusiness } from '../services/businesses'
import { FounderCard } from '../components/cards/FounderCard'
import { EmptyState } from '../components/ui/EmptyState'
import { SectionHeading } from '../components/layout/PageContainer'
import { dailyRotatingSlice } from '../utils/rotation'

interface FounderGridProps {
  filter?: FounderFilter
  heading?: string
  subheading?: string
  action?: { label: string; href: string }
  columns?: 2 | 3 | 4
  cardVariant?: 'default' | 'compact' | 'featured'
  className?: string
  emptyTitle?: string
  emptyMessage?: string
  // Falls back to real published founders when nothing's been marked
  // Featured yet, instead of showing "nothing yet" while real, just-not-
  // featured founders already exist and are live elsewhere.
  fallbackToPublic?: boolean
  // Pass count via `limit` instead of `filter.limit` when using this — the
  // grid needs the whole matching pool before it can rotate through it.
  // Without this, a "Featured Founders" section always showed the same
  // fixed founders forever instead of cycling the spotlight around.
  rotate?: boolean
  limit?: number
}

const columnClasses = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
}

export function FounderGrid({
  filter = {},
  heading,
  subheading,
  action,
  columns = 3,
  cardVariant = 'default',
  className = '',
  emptyTitle,
  emptyMessage,
  fallbackToPublic = false,
  rotate = false,
  limit,
}: FounderGridProps) {
  let founders = getFounders(filter)
  if (fallbackToPublic && filter.featured && founders.length === 0) {
    founders = getFounders({ ...filter, featured: undefined })
  }
  if (rotate && limit) {
    founders = dailyRotatingSlice(founders, limit)
  } else if (limit) {
    founders = founders.slice(0, limit)
  }

  return (
    <section aria-label={heading ?? 'Founders'} className={className}>
      {heading && (
        <SectionHeading title={heading} subtitle={subheading} action={action} />
      )}

      {founders.length === 0 ? (
        <EmptyState
          title={emptyTitle ?? 'No founders yet'}
          message={emptyMessage ?? 'No founders match this filter yet.'}
        />
      ) : (
        <div
          className={`grid gap-5 md:gap-6 ${columnClasses[columns]}`}
          role="list"
          aria-label={`${founders.length} ${founders.length === 1 ? 'founder' : 'founders'}`}
        >
          {founders.map(founder => {
            const business = getBusiness(founder.businessId)
            return (
              <div key={founder.id} role="listitem">
                <FounderCard
                  founder={founder}
                  business={business}
                  variant={cardVariant}
                />
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
