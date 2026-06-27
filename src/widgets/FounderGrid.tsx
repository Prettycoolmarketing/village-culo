import type { FounderFilter } from '../types'
import { filterFounders } from '../utils/filters'
import { getBusiness } from '../data/businesses'
import { FounderCard } from '../components/cards/FounderCard'
import { EmptyState } from '../components/ui/EmptyState'
import { SectionHeading } from '../components/layout/PageContainer'

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
}: FounderGridProps) {
  const founders = filterFounders(filter)

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
