import type { Story, StoryFilter } from '../types'
import { getStories } from '../services/stories'
import { getFounder } from '../services/founders'
import { getBusiness } from '../services/businesses'
import { StoryCard } from '../components/cards/StoryCard'
import { EmptyState } from '../components/ui/EmptyState'
import { SectionHeading } from '../components/layout/PageContainer'

interface StoryGridProps {
  filter?: StoryFilter
  // Pre-filtered list, for callers whose filter logic isn't expressible as a
  // StoryFilter (e.g. filtering by an imported item's source platform). When
  // set, `filter` is ignored and this list is rendered as-is.
  stories?: Story[]
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
  // A story that opted out of this particular location (see AppearsOnPanel's
  // "Turn off" control) is excluded here even though it still matches
  // `filter` otherwise — stays published everywhere else, just not this grid.
  hideKey?: string
  // Stories to leave out even though they match `filter` — e.g. a founder's
  // own Featured Video picks, so the same story doesn't show up twice on
  // one profile page (once as the featured video, once again in this grid).
  excludeIds?: string[]
  // Bubbles blog-type stories to the front, ahead of reels/carousels/etc —
  // for a founder's own profile grid, the first thing a visitor sees. A
  // written blog almost always has a real, sharp cover image; a reel's
  // thumbnail is a video-frame grab that can come out soft or blurry,
  // especially from an older import. Order within each group (blog vs.
  // everything else) is otherwise left as fetched.
  sortBlogsFirst?: boolean
  // Render nothing at all when there's no content, instead of an empty
  // state with a CTA — for profile pages, where an unpublished section
  // reads as "this founder isn't active" rather than an invitation.
  hideEmpty?: boolean
}

const columnClasses = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
}

export function StoryGrid({
  filter = {},
  stories: explicitStories,
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
  hideKey,
  excludeIds,
  sortBlogsFirst = false,
  hideEmpty = false,
}: StoryGridProps) {
  const fetched = explicitStories ?? getStories(filter)
  let stories = fetched
    .filter(s => !hideKey || !s.hiddenLocations?.includes(hideKey))
    .filter(s => !excludeIds?.includes(s.id))

  if (sortBlogsFirst) {
    stories = [...stories].sort((a, b) => {
      const aBlog = a.contentTypes.includes('blog') ? 1 : 0
      const bBlog = b.contentTypes.includes('blog') ? 1 : 0
      return bBlog - aBlog
    })
  }

  if (hideEmpty && stories.length === 0) return null

  return (
    <section aria-label={heading ?? 'Stories'} className={className}>
      {heading && (
        <SectionHeading title={heading} subtitle={subheading} action={action} />
      )}

      {stories.length === 0 ? (
        <EmptyState
          title={emptyTitle ?? 'No stories yet'}
          message={emptyMessage ?? 'Be the first to publish a story here.'}
          action={{ label: 'Become a Publisher', href: '/onboarding' }}
        />
      ) : (
        <div
          className={`grid items-start gap-5 md:gap-6 ${columnClasses[columns]}`}
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
