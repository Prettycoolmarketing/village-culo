import { useState } from 'react'
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
  // Puts a founder's own Feature picks first, then bubbles blog-type
  // stories ahead of reels/carousels/etc — for a founder's own profile
  // grid, the first thing a visitor sees. A written blog almost always has
  // a real, sharp cover image; a reel's thumbnail is a video-frame grab
  // that can come out soft or blurry, especially from an older import.
  sortBlogsFirst?: boolean
  // Render nothing at all when there's no content, instead of an empty
  // state with a CTA — for profile pages, where an unpublished section
  // reads as "this founder isn't active" rather than an invitation.
  hideEmpty?: boolean
  // Show at most this many, with a "View all N" button that expands the
  // rest in place — keeps long profile pages tight.
  limit?: number
  // "View all" jumps straight to the full list (fine for a founder's own
  // handful of stories in a profile preview). For the full /stories
  // directory, with 200+ entries, that means rendering every card — and
  // every card's cover image — at once. `incremental` makes "Load more"
  // reveal another `limit` each click instead, so the directory never
  // renders more than it needs to for however far someone's actually
  // scrolled.
  incremental?: boolean
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
  limit,
  incremental = false,
}: StoryGridProps) {
  const [expanded, setExpanded] = useState(false)
  const [shown, setShown] = useState(limit ?? 0)
  const fetched = explicitStories ?? getStories(filter)
  let stories = fetched
    .filter(s => !hideKey || !s.hiddenLocations?.includes(hideKey))
    .filter(s => !excludeIds?.includes(s.id))

  // Base order is always plain newest-published-first (an explicit `stories`
  // list, like a curated related-stories row, keeps whatever order it was
  // built in instead) — this used to fall back to raw Supabase fetch order,
  // whatever Postgres happens to return with no ORDER BY, not actually
  // "latest" despite every heading here saying so ("Latest Stories" on the
  // homepage, a topic/business/idea page's story list, etc). "View all"
  // reveals the rest in this same real chronological order.
  if (!explicitStories) {
    stories = [...stories].sort((a, b) => (b.publishedAt ?? b.createdAt).localeCompare(a.publishedAt ?? a.createdAt))
  }

  if (hideEmpty && stories.length === 0) return null

  const total = stories.length
  const effectiveLimit = incremental ? shown : limit
  const capped = effectiveLimit != null && !expanded && total > effectiveLimit && !incremental
  const incrementalCapped = incremental && limit != null && total > shown

  // sortBlogsFirst only reorders the capped preview, not the full "View
  // all" list — a founder's Feature picks and blogs (a real, sharp cover
  // image) lead the default few cards, but expanding shouldn't re-shuffle
  // everything out of chronological order to keep that same banding.
  let visible = incremental
    ? stories.slice(0, shown)
    : capped ? stories.slice(0, limit) : stories
  if (sortBlogsFirst && capped) {
    visible = [...stories].sort((a, b) => {
      const aFeatured = a.featured ? 1 : 0
      const bFeatured = b.featured ? 1 : 0
      if (aFeatured !== bFeatured) return bFeatured - aFeatured
      const aBlog = a.contentTypes.includes('blog') ? 1 : 0
      const bBlog = b.contentTypes.includes('blog') ? 1 : 0
      if (aBlog !== bBlog) return bBlog - aBlog
      return (b.publishedAt ?? b.createdAt).localeCompare(a.publishedAt ?? a.createdAt)
    }).slice(0, limit)
  }

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
          {visible.map(story => {
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

      {capped && (
        <div className="mt-8 text-center">
          <button
            onClick={() => setExpanded(true)}
            className="inline-flex items-center gap-2 px-6 py-3 border-2 border-primary text-primary text-sm font-semibold rounded-xl hover:bg-primary hover:text-white transition-colors"
          >
            View all {total} stories
          </button>
        </div>
      )}

      {incrementalCapped && (
        <div className="mt-8 text-center">
          <button
            onClick={() => setShown(s => s + (limit ?? 30))}
            className="inline-flex items-center gap-2 px-6 py-3 border-2 border-primary text-primary text-sm font-semibold rounded-xl hover:bg-primary hover:text-white transition-colors"
          >
            Load more ({total - shown} left)
          </button>
        </div>
      )}
    </section>
  )
}
