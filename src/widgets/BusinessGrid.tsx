import type { BusinessFilter } from '../types'
import { getBusinesses } from '../services/businesses'
import { getFounder } from '../services/founders'
import { BusinessCard } from '../components/cards/BusinessCard'
import { EmptyState } from '../components/ui/EmptyState'
import { SectionHeading } from '../components/layout/PageContainer'

interface BusinessGridProps {
  filter?: BusinessFilter
  heading?: string
  subheading?: string
  action?: { label: string; href: string }
  columns?: 2 | 3 | 4
  cardVariant?: 'default' | 'compact' | 'featured'
  className?: string
  emptyTitle?: string
  emptyMessage?: string
}

const columnClasses = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
}

export function BusinessGrid({
  filter = {},
  heading,
  subheading,
  action,
  columns = 3,
  cardVariant = 'default',
  className = '',
  emptyTitle,
  emptyMessage,
}: BusinessGridProps) {
  const businesses = getBusinesses(filter)

  return (
    <section aria-label={heading ?? 'Businesses'} className={className}>
      {heading && (
        <SectionHeading title={heading} subtitle={subheading} action={action} />
      )}

      {businesses.length === 0 ? (
        <EmptyState
          title={emptyTitle ?? 'No businesses yet'}
          message={emptyMessage ?? 'No businesses match this filter yet.'}
        />
      ) : (
        <div
          className={`grid gap-5 md:gap-6 ${columnClasses[columns]}`}
          role="list"
          aria-label={`${businesses.length} ${businesses.length === 1 ? 'business' : 'businesses'}`}
        >
          {businesses.map(business => {
            const founder = getFounder(business.founderId)
            return (
              <div key={business.id} role="listitem">
                <BusinessCard
                  business={business}
                  founder={founder}
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
