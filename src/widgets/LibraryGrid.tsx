import { getLibraryItems } from '../services/library'
import { LibraryCard } from '../components/cards/LibraryCard'
import type { LibraryFilter } from '../types'

interface LibraryGridProps {
  heading?: string
  subheading?: string
  filter?: LibraryFilter
  columns?: 2 | 3 | 4
  variant?: 'default' | 'compact'
  emptyTitle?: string
  emptyMessage?: string
}


const colClass: Record<2 | 3 | 4, string> = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
}

export function LibraryGrid({
  heading,
  subheading,
  filter = {},
  columns = 3,
  variant = 'default',
  emptyTitle = 'Nothing here yet',
  emptyMessage = 'Library items will appear here as founders publish them.',
}: LibraryGridProps) {
  const items = getLibraryItems(filter)

  return (
    <section aria-label={heading ?? 'Library items'}>
      {heading && (
        <div className="mb-6">
          <h2 className="font-heading text-2xl font-semibold text-charcoal">{heading}</h2>
          {subheading && <p className="font-body text-sm text-muted mt-1">{subheading}</p>}
        </div>
      )}

      {items.length === 0 ? (
        <div className="py-10 text-center bg-surface rounded-2xl border border-border">
          <p className="font-heading text-base font-semibold text-charcoal mb-2">{emptyTitle}</p>
          <p className="font-body text-sm text-muted">{emptyMessage}</p>
        </div>
      ) : variant === 'compact' ? (
        <ul className="flex flex-col gap-3" role="list">
          {items.map(item => (
            <li key={item.id}>
              <LibraryCard item={item} variant="compact" />
            </li>
          ))}
        </ul>
      ) : (
        <ul className={`grid ${colClass[columns]} gap-5`} role="list">
          {items.map(item => (
            <li key={item.id}>
              <LibraryCard item={item} variant="default" />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
