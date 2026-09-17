import type { IdeaFilter } from '../types'
import { getIdeas } from '../services/ideas'
import { getFounder } from '../services/founders'
import { IdeaCard } from '../components/cards/IdeaCard'
import { QuoteCard } from '../components/cards/QuoteCard'
import { EmptyState } from '../components/ui/EmptyState'
import { SectionHeading } from '../components/layout/PageContainer'

interface IdeaGridProps {
  filter?: IdeaFilter
  heading?: string
  subheading?: string
  action?: { label: string; href: string }
  columns?: 2 | 3
  cardVariant?: 'default' | 'compact' | 'featured'
  // Show quote cards interspersed in the grid
  showQuotes?: boolean
  className?: string
  emptyTitle?: string
  emptyMessage?: string
  hideEmpty?: boolean
  // Falls back to real published ideas when nothing's been marked Featured
  // yet, instead of showing "nothing yet" while real, just-not-featured
  // ideas already exist and are live elsewhere.
  fallbackToPublic?: boolean
  // Show at most this many, with the rest tucked into a native <details>
  // "View all N" — same pattern as the imports list on a founder profile.
  // A plain JS-conditional slice would drop the rest from the DOM entirely
  // until a click toggled React state, which crawlers never do; a <details>
  // keeps every idea's real content and link present and indexable even
  // while visually collapsed, so trimming what a visitor sees by default
  // doesn't also trim what search/AI systems can find.
  limit?: number
}

const columnClasses = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
}

export function IdeaGrid({
  filter = {},
  heading,
  subheading,
  action,
  columns = 3,
  cardVariant = 'default',
  showQuotes = false,
  className = '',
  emptyTitle,
  emptyMessage,
  hideEmpty = false,
  fallbackToPublic = false,
  limit,
}: IdeaGridProps) {
  let ideas = getIdeas(filter)
  if (fallbackToPublic && filter.featured && ideas.length === 0) {
    ideas = getIdeas({ ...filter, featured: undefined })
  }

  if (hideEmpty && ideas.length === 0) return null

  const capped = limit != null && ideas.length > limit
  const visible = capped ? ideas.slice(0, limit) : ideas
  const rest    = capped ? ideas.slice(limit) : []

  function renderCard(idea: typeof ideas[number], index: number) {
    const hasQuote = idea.quote && idea.quoteFounderId
    const quotedFounder = hasQuote ? getFounder(idea.quoteFounderId!) : undefined

    // Every 4th card becomes a quote card when showQuotes is true
    const showAsQuote = showQuotes && hasQuote && index % 4 === 1

    return (
      <div
        key={idea.id}
        role="listitem"
        // Span full width for quote cards in a 3-col grid
        className={showAsQuote && columns === 3 ? 'sm:col-span-2 lg:col-span-3' : ''}
      >
        {showAsQuote && quotedFounder ? (
          <QuoteCard idea={idea} founder={quotedFounder} variant="large" />
        ) : (
          <IdeaCard idea={idea} variant={cardVariant} />
        )}
      </div>
    )
  }

  return (
    <section aria-label={heading ?? 'Ideas'} className={className}>
      {heading && (
        <SectionHeading title={heading} subtitle={subheading} action={action} />
      )}

      {ideas.length === 0 ? (
        <EmptyState
          title={emptyTitle ?? 'No ideas yet'}
          message={emptyMessage ?? 'Ideas are extracted from published stories. Publish a story to generate ideas.'}
          action={{ label: 'Become a Publisher', href: '/onboarding' }}
        />
      ) : (
        <>
          <div
            className={`grid gap-5 md:gap-6 ${columnClasses[columns]}`}
            role="list"
            aria-label={`${ideas.length} ${ideas.length === 1 ? 'idea' : 'ideas'}`}
          >
            {visible.map((idea, index) => renderCard(idea, index))}
          </div>
          {rest.length > 0 && (
            <details className="group mt-4">
              <summary className="cursor-pointer list-none text-sm font-semibold text-primary hover:underline">
                <span className="group-open:hidden">View all {ideas.length} →</span>
                <span className="hidden group-open:inline">Show fewer</span>
              </summary>
              <div className={`grid gap-5 md:gap-6 mt-4 ${columnClasses[columns]}`} role="list">
                {rest.map((idea, index) => renderCard(idea, visible.length + index))}
              </div>
            </details>
          )}
        </>
      )}
    </section>
  )
}
