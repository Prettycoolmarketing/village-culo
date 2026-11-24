import { useParams, Link } from 'react-router-dom'
import { usePageMeta } from '../utils/usePageMeta'
import { StoryGrid } from '../widgets/StoryGrid'
import { InnerContainer } from '../components/layout/PageContainer'
import { getStories } from '../services/stories'
import { topics } from '../data/topics'
import { CULO_ORGANIZATION } from '../utils/seo'

// A topic page isn't backed by its own table — Topics live embedded on each
// Story, curated or founder-written alike (see createCustomTopic in
// data/topics.ts). This page just finds every published story carrying a
// matching topic slug, so a founder writing a brand new topic during Publish
// gets a real, working page the moment their story goes live.

// Was 3 — real per-topic counts checked against a growing page count showed
// most "live" topic pages sat right at that floor (3-6 stories), which reads
// as thin to a search engine rather than a genuine authority on the subject.
// Raised so a topic page only goes live once there's real depth behind it —
// confirmed against real data that Technology (26), Real Estate (19) and
// Sustainability (18) already clear this comfortably; raising the bar takes
// the thinner ones offline until they genuinely earn it back.
export const MIN_TOPIC_STORIES = 15

// Same questions on every topic page, not topic-specific — these are about
// the Village itself (who's behind it, what Shakas/Creatives are, why a
// founder's own content ended up here), the thing every visitor landing on
// an unfamiliar topic hub actually wants answered before the story grid
// below means anything to them.
function topicFaqs(name: string) {
  return [
    {
      q: 'Who is Shakas?',
      a: 'Shakas researches and writes the founder content published across The Culo Village, including the articles on this page.',
    },
    {
      q: 'What is The Culo Village?',
      a: 'A founder publishing platform — it republishes founders\' existing posts from across platforms as individual web articles, so their work is easier for people and AI tools to find.',
    },
    {
      q: 'What is Culo Creatives?',
      a: 'An editing app coming to Canva that turns raw footage into social media posts with hooks and captions. The Village republishing shown here is step one; Creatives is step two.',
    },
    {
      q: `What is this ${name} page?`,
      a: `A topic hub — every published Culo Village article about ${name}, gathered on one page, from the founders writing about it.`,
    },
    {
      q: 'Are these all Australian founders?',
      a: 'Mostly, though The Culo Village isn\'t limited to Australia — any founder with a real business and real content can be published here.',
    },
    {
      q: 'Can a founder edit or remove their own article?',
      a: 'Yes — every article carries a "Written by CULO" byline, and the founder it\'s about can claim their profile and edit or remove anything on it at any time.',
    },
  ]
}

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
  const faqs = name ? topicFaqs(name) : []

  usePageMeta({
    title: isRich ? name : undefined,
    description: isRich ? (description || `Founder stories in CULO Village about ${name}.`) : undefined,
    jsonLd: isRich ? {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(f => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
      publisher: CULO_ORGANIZATION,
    } : null,
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

      <section className="py-16 md:py-20 bg-surface border-t border-border" aria-labelledby="topic-faq-heading">
        <InnerContainer className="max-w-4xl">
          <h2 id="topic-faq-heading" className="font-heading text-2xl sm:text-3xl font-bold text-charcoal mb-10 text-left">
            Frequently asked
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-8 text-left">
            {faqs.map(f => (
              <div key={f.q}>
                <p className="font-heading font-semibold text-charcoal mb-1">{f.q}</p>
                <p className="font-body text-sm text-muted leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </InnerContainer>
      </section>
    </main>
  )
}
