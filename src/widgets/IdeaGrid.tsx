import React from 'react'
import type { IdeaFilter } from '../types'
import { filterIdeas } from '../utils/filters'
import { getFounder } from '../data/founders'
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
}: IdeaGridProps) {
  const ideas = filterIdeas(filter)

  return (
    <section aria-label={heading ?? 'Ideas'} className={className}>
      {heading && (
        <SectionHeading title={heading} subtitle={subheading} action={action} />
      )}

      {ideas.length === 0 ? (
        <EmptyState
          title={emptyTitle ?? 'No ideas yet'}
          message={emptyMessage ?? 'Ideas are extracted from published stories. Publish a story to generate ideas.'}
          action={{ label: 'Publish in Piazza', href: '/piazza' }}
        />
      ) : (
        <div
          className={`grid gap-5 md:gap-6 ${columnClasses[columns]}`}
          role="list"
          aria-label={`${ideas.length} ${ideas.length === 1 ? 'idea' : 'ideas'}`}
        >
          {ideas.map((idea, index) => {
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
          })}
        </div>
      )}
    </section>
  )
}
