import { useParams, Link } from 'react-router-dom'
import { usePageMeta } from '../utils/usePageMeta'
import { StoryGrid } from '../widgets/StoryGrid'
import { InnerContainer } from '../components/layout/PageContainer'
import { getStories } from '../services/stories'
import { topics } from '../data/topics'

// A topic page isn't backed by its own table — Topics live embedded on each
// Story, curated or founder-written alike (see createCustomTopic in
// data/topics.ts). This page just finds every published story carrying a
// matching topic slug, so a founder writing a brand new topic during Publish
// gets a real, working page the moment their story goes live.

export const MIN_TOPIC_STORIES = 3

function storiesForTopic(slug: string) {
  return getStories({ publicOnly: true }).filter(s => s.topics.some(t => t.slug === slug))
}

function NotFound() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="font-heading text-2xl font-semibold text-charcoal mb-3">Nothing here yet</h1>
        <p className="font-body text-muted mb-8">
          This topic doesn't have enough published stories yet to be worth a page of its own.
        </p>
        <Link to="/stories" className="px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-[#b05a35] transition-colors">
          Browse All Stories
        </Link>
      </div>
    </main>
  )
}

export function TopicPage() {
  const { slug } = useParams<{ slug: string }>()
  const stories = slug ? storiesForTopic(slug) : []
  const isRich = stories.length >= MIN_TOPIC_STORIES
  // A curated topic has a fixed description; a founder-written one won't be in
  // data/topics.ts at all — fall back to its name as it appears on a real story.
  const curated = slug ? topics.find(t => t.slug === slug) : undefined
  const name = curated?.name ?? stories[0]?.topics.find(t => t.slug === slug)?.name ?? ''
  const description = curated?.description

  usePageMeta({
    title: isRich ? name : undefined,
    description: isRich ? (description || `Founder stories in CULO Village about ${name}.`) : undefined,
  })

  if (!slug || !isRich) return <NotFound />

  return (
    <main className="min-h-screen bg-background">
      <section className="bg-surface border-b border-border pt-24 pb-12" aria-labelledby="topic-heading">
        <InnerContainer>
          <div className="max-w-2xl">
            <p className="font-body text-xs font-semibold text-primary uppercase tracking-widest mb-3">Topic</p>
            <h1 id="topic-heading" className="font-heading text-4xl sm:text-5xl font-bold text-charcoal mb-4 leading-tight">
              {name}
            </h1>
            {description && (
              <p className="font-body text-lg text-muted leading-relaxed">{description}</p>
            )}
          </div>
        </InnerContainer>
      </section>

      <section className="py-12 md:py-16" aria-label={`Stories about ${name}`}>
        <InnerContainer>
          <StoryGrid
            stories={stories}
            columns={3}
            cardVariant="vertical"
            showSummary
            showFounder
            showTopics
            showCTA
            emptyTitle="Nothing here yet"
            emptyMessage="Check back soon."
          />
        </InnerContainer>
      </section>
    </main>
  )
}
