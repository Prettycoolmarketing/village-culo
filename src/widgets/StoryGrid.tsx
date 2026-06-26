import React from 'react'
import type { StoryFilter } from '../types'
import { filterStories } from '../utils/filters'
import { getFounder } from '../data/founders'
import { getBusiness } from '../data/businesses'
import { StoryCard } from '../components/cards/StoryCard'
import { EmptyState } from '../components/ui/EmptyState'
import { SectionHeading } from '../components/layout/PageContainer'

interface StoryGridProps {
  filter?: StoryFilter
  heading?: string
  subheading?: string
  action?: { label: string; href: string }
  // Layout
  columns?: 2 | 3 | 4
  cardVariant?: 'vertical' | 'compact' | 'horizontal'
  showSummary?: boolean
  showFounder?: boolean
  showTopics?: boolean
  showCTA?: boolean
  className?: string
  // Empty state override
  emptyTitle?: string
  emptyMessage?: string
}

const columnClasses = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
}

export function StoryGrid({
  filter = {},
  heading,
  subheading,
  action,
  columns = 3,
  cardVariant = 'vertical',
  showSummary = true,
  showFounder = true,
  showTopics = true,
  showCTA = true,
  className = '',
  emptyTitle,
  emptyMessage,
}: StoryGridProps) {
  const stories = filterStories(filter)

  return (
    <section aria-label={heading ?? 'Stories'} className={className}>
      {heading && (
        <SectionHeading title={heading} subtitle={subheading} action={action} />
      )}

      {stories.length === 0 ? (
        <EmptyState
          title={emptyTitle ?? 'No stories yet'}
          message={emptyMessage ?? 'Be the first to publish a story here.'}
          action={{ label: 'Publish in Piazza', href: '/piazza' }}
        />
      ) : (
        <div
          className={`grid gap-5 md:gap-6 ${columnClasses[columns]}`}
          role="list"
          aria-label={`${stories.length} ${stories.length === 1 ? 'story' : 'stories'}`}
        >
          {stories.map(story => {
            const founder = getFounder(story.founderId)
            const business = getBusiness(story.businessId)
            return (
              <div key={story.id} role="listitem">
                <StoryCard
                  story={story}
                  founder={founder}
                  business={business}
                  variant={cardVariant}
                  showSummary={showSummary}
                  showFounder={showFounder}
                  showTopics={showTopics}
                  showCTA={showCTA}
                />
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
