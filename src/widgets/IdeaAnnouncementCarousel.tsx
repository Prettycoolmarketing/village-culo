import { Link } from 'react-router-dom'
import type { Idea } from '../types'
import { getIdeas } from '../services/ideas'
import { getFounder } from '../services/founders'
import { getStory } from '../services/stories'
import { Avatar } from '../components/ui/Avatar'
import { SectionHeading } from '../components/layout/PageContainer'

interface IdeaAnnouncementCarouselProps {
  heading?: string
  subheading?: string
  action?: { label: string; href: string }
  className?: string
  // How many real ideas to pull into the strip before it repeats — plenty
  // of variety without listing every idea on the homepage as a static grid.
  limit?: number
}

// One card's worth of resolved data — the founder the announcement is
// about, and one representative story to send a reader to the actual
// article, distinct from the founder-profile link the whole card carries.
function resolveCard(idea: Idea) {
  const founder = idea.relatedFounderIds[0] ? getFounder(idea.relatedFounderIds[0]) : undefined
  if (!founder) return undefined
  const story = idea.relatedStoryIds
    .map(id => getStory(id))
    .find((s): s is NonNullable<typeof s> => !!s && (s.status === 'published' || s.status === 'featured'))
  return { idea, founder, story }
}

function IdeaAnnouncementCard({ idea, founder, story, tabIndex }: {
  idea: Idea
  founder: NonNullable<ReturnType<typeof getFounder>>
  story: ReturnType<typeof getStory>
  tabIndex?: number
}) {
  return (
    <div className="w-80 shrink-0 bg-surface border border-border rounded-2xl p-5 flex flex-col gap-3">
      <Link
        to={`/founders/${founder.slug}`}
        tabIndex={tabIndex}
        className="group flex items-start gap-3"
        aria-label={`View ${founder.name}'s founder profile`}
      >
        <Avatar src={founder.avatar} alt={founder.name} size="md" />
        <p className="font-body text-sm text-charcoal leading-snug group-hover:text-primary transition-colors">
          {idea.title}
        </p>
      </Link>
      <p className="font-body text-xs text-muted leading-relaxed line-clamp-2">
        {idea.description}
      </p>
      {story && (
        <Link
          to={`/stories/${story.slug}`}
          tabIndex={tabIndex}
          className="font-body text-xs font-semibold text-primary hover:text-[#b05a35] transition-colors mt-auto"
        >
          Read the article →
        </Link>
      )}
    </div>
  )
}

/**
 * A continuously-scrolling strip of "so-and-so published an article about
 * X" cards, each linking through to that founder's own profile (with a
 * secondary link to the actual article) — recirculates a growing pool of
 * founder announcements through a small, tidy space instead of a static
 * grid that either shows too few or grows unbounded. Every card exists once
 * in real, accessible markup; the strip is that same set rendered a second
 * time, marked inert, purely so the CSS scroll loops seamlessly instead of
 * snapping back to the start — a crawler or screen reader only ever
 * encounters the first, real copy in the normal tab/reading order.
 */
export function IdeaAnnouncementCarousel({
  heading = 'From the Village',
  subheading = 'Founders publishing real knowledge, right now.',
  action,
  className = '',
  limit = 12,
}: IdeaAnnouncementCarouselProps) {
  const cards = getIdeas({ publicOnly: true })
    .slice(0, limit)
    .map(resolveCard)
    .filter((c): c is NonNullable<typeof c> => !!c)

  if (cards.length === 0) return null

  return (
    <section className={className} aria-label={heading}>
      {heading && <SectionHeading title={heading} subtitle={subheading} action={action} />}

      <div className="relative overflow-hidden">
        {/* Fade edges so cards don't feel like they're cut off mid-scroll */}
        <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" aria-hidden="true" />
        <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" aria-hidden="true" />

        <style>{`
          @keyframes idea-announcement-scroll {
            from { transform: translateX(0); }
            to   { transform: translateX(-50%); }
          }
          .idea-announcement-track {
            animation: idea-announcement-scroll ${Math.max(cards.length * 6, 30)}s linear infinite;
          }
          .idea-announcement-track:hover {
            animation-play-state: paused;
          }
          @media (prefers-reduced-motion: reduce) {
            .idea-announcement-track {
              animation: none;
              overflow-x: auto;
            }
          }
        `}</style>

        <div className="idea-announcement-track flex w-max gap-5">
          <div className="flex gap-5" role="list" aria-label={`${cards.length} recent founder announcements`}>
            {cards.map(({ idea, founder, story }) => (
              <div key={idea.id} role="listitem">
                <IdeaAnnouncementCard idea={idea} founder={founder} story={story} />
              </div>
            ))}
          </div>
          {/* Inert duplicate — same cards again, purely to make the loop
              seamless. Hidden from assistive tech and out of tab order so
              nobody tabs through the whole list twice. */}
          <div className="flex gap-5" aria-hidden="true">
            {cards.map(({ idea, founder, story }) => (
              <IdeaAnnouncementCard key={`dup-${idea.id}`} idea={idea} founder={founder} story={story} tabIndex={-1} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
