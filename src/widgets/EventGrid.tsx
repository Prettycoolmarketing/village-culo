import type { EventFilter } from '../types'
import { filterEvents } from '../utils/filters'
import { EventCard } from '../components/cards/EventCard'
import { EmptyState } from '../components/ui/EmptyState'
import { SectionHeading } from '../components/layout/PageContainer'

interface EventGridProps {
  filter?: EventFilter
  heading?: string
  subheading?: string
  action?: { label: string; href: string }
  columns?: 2 | 3
  cardVariant?: 'default' | 'compact' | 'featured'
  className?: string
  emptyTitle?: string
  emptyMessage?: string
}

const columnClasses = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
}

export function EventGrid({
  filter = {},
  heading,
  subheading,
  action,
  columns = 3,
  cardVariant = 'default',
  className = '',
  emptyTitle,
  emptyMessage,
}: EventGridProps) {
  const events = filterEvents(filter)

  return (
    <section aria-label={heading ?? 'Events and notices'} className={className}>
      {heading && (
        <SectionHeading title={heading} subtitle={subheading} action={action} />
      )}

      {events.length === 0 ? (
        <EmptyState
          title={emptyTitle ?? 'Nothing here yet'}
          message={emptyMessage ?? 'No events or opportunities in this area yet. Check back soon.'}
        />
      ) : (
        <div
          className={`grid gap-5 md:gap-6 ${columnClasses[columns]}`}
          role="list"
          aria-label={`${events.length} ${events.length === 1 ? 'notice' : 'notices'}`}
        >
          {events.map(event => (
            <div key={event.id} role="listitem">
              <EventCard event={event} variant={cardVariant} />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
