import { useParams, Link } from 'react-router-dom'
import { usePageMeta } from '../utils/usePageMeta'
import { StoryGrid } from '../widgets/StoryGrid'
import { InnerContainer } from '../components/layout/PageContainer'
import { getStories } from '../services/stories'
import { importedContentService, PLATFORM_LABELS } from '../services/importedContent'
import type { ImportedContentPlatform } from '../types/importedContent'

// A Collection page, not an article — it organises existing published
// stories by where they originally came from (see the Import Engine /
// Village Content Principles). Not to be confused with VillageSource
// (external press/citation sources behind "Featured In") — this is about
// ImportedContent.sourcePlatform instead.

// Collections should never go publicly indexable while thin — see the
// matching threshold in supabase/functions/sitemap/index.ts.
export const MIN_SOURCE_PLATFORM_STORIES = 3

const VALID_PLATFORMS = new Set<ImportedContentPlatform>([
  'youtube', 'vimeo', 'instagram', 'linkedin', 'tiktok', 'podcast', 'website',
])

function storiesFromPlatform(platform: ImportedContentPlatform) {
  return getStories({ publicOnly: true }).filter(s => {
    if (!s.importedContentId) return false
    const source = importedContentService.get(s.importedContentId)
    return source?.sourcePlatform === platform
  })
}

function NotFound() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="font-heading text-2xl font-semibold text-charcoal mb-3">Nothing here yet</h1>
        <p className="font-body text-muted mb-8">
          This collection doesn't have enough published stories yet to be worth a page of its own.
        </p>
        <Link to="/stories" className="px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-[#b05a35] transition-colors">
          Browse All Stories
        </Link>
      </div>
    </main>
  )
}

export function SourcePlatformPage() {
  const { platform } = useParams<{ platform: string }>()
  const valid = platform && VALID_PLATFORMS.has(platform as ImportedContentPlatform)
  const stories = valid ? storiesFromPlatform(platform as ImportedContentPlatform) : []
  const isRich = stories.length >= MIN_SOURCE_PLATFORM_STORIES
  const label = valid ? PLATFORM_LABELS[platform as ImportedContentPlatform] : ''

  usePageMeta({
    title: isRich ? `Stories originally from ${label}` : undefined,
    description: isRich ? `Founder stories preserved in CULO Village, originally published on ${label}.` : undefined,
  })

  if (!valid || !isRich) return <NotFound />

  return (
    <main className="min-h-screen bg-background">
      <section className="bg-surface border-b border-border pt-24 pb-12" aria-labelledby="source-platform-heading">
        <InnerContainer>
          <div className="max-w-2xl">
            <p className="font-body text-xs font-semibold text-primary uppercase tracking-widest mb-3">CULO Village</p>
            <h1 id="source-platform-heading" className="font-heading text-4xl sm:text-5xl font-bold text-charcoal mb-4 leading-tight">
              Stories originally from {label}
            </h1>
            <p className="font-body text-lg text-muted leading-relaxed">
              Founders brought this work into the Village so it stays searchable, connected and discoverable — every story here links back to where it was first published.
            </p>
          </div>
        </InnerContainer>
      </section>

      <section className="py-12 md:py-16" aria-label={`Stories from ${label}`}>
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
