import React from 'react'
import { usePageMeta } from '../utils/usePageMeta'
import { HeroWidget }                from '../widgets/HeroWidget'
import { FeaturedWidget }            from '../widgets/FeaturedWidget'
import { StoryGrid }                 from '../widgets/StoryGrid'
import { IdeaGrid }                  from '../widgets/IdeaGrid'
import { FounderGrid }               from '../widgets/FounderGrid'
import { BusinessGrid }              from '../widgets/BusinessGrid'
import { MapPreviewWidget }          from '../widgets/MapPreviewWidget'
import { NoticeboardPreviewWidget }  from '../widgets/NoticeboardPreviewWidget'
import { ArchiveCTAWidget }          from '../widgets/ArchiveCTAWidget'
import { InnerContainer }            from '../components/layout/PageContainer'

// ─── Section wrapper ───────────────────────────────────────────────────────────
// Alternates between surface white and warm background to create visual rhythm.
interface VillageSectionProps {
  children: React.ReactNode
  surface?: boolean // true = white card bg, false = warm cream bg
  tight?: boolean   // less vertical padding for visual flow
}

function VillageSection({ children, surface = false, tight = false }: VillageSectionProps) {
  return (
    <section className={`${surface ? 'bg-surface' : 'bg-background'} ${tight ? 'py-10 md:py-12' : 'py-14 md:py-20'}`}>
      <InnerContainer>
        {children}
      </InnerContainer>
    </section>
  )
}

// ─── Village Homepage ──────────────────────────────────────────────────────────

export function VillagePage() {
  usePageMeta({
    title:       'Discover Australian Founders',
    description: 'CULO Village — a curated directory of Australian founder stories, businesses, and content. Discover real people building real things.',
    keywords:    ['Australian founders', 'small business stories', 'founder directory', 'business content', 'CULO Village', 'Australian entrepreneurs'],
    ogType:      'website',
    jsonLd: {
      '@context':   'https://schema.org',
      '@type':      'WebSite',
      name:         'CULO Village',
      description:  'A curated directory of Australian founder stories, businesses, and content.',
      url:          window.location.origin,
    },
  })
  return (
    <main id="main-content">
      {/* Skip to main content — accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-20 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-xl focus:text-sm font-medium"
      >
        Skip to main content
      </a>

      {/* ── 1. Hero ─────────────────────────────────────────────────────────── */}
      {/*
        Headline, search bar and popular topic pills.
        The front door to the Village — sets the editorial tone.
      */}
      <HeroWidget />

      {/* ── 2. Today's Highlights ───────────────────────────────────────────── */}
      {/*
        Story of the Day, Founder of the Day, Idea of the Day,
        Featured Business, Upcoming Event.
        Pulled from featured: true objects across the data layer.
      */}
      <VillageSection surface>
        <FeaturedWidget
          heading="Today's Highlights"
          subheading="The best of the Village, updated as new stories are published."
        />
      </VillageSection>

      {/* ── 3. Latest Stories ───────────────────────────────────────────────── */}
      {/*
        Six reel-sized vertical story cards.
        The primary content format — blogs, reels and carousels from real founders.
        Schema-visible: title, summary, founder, location, topic, CTA all in readable text.
      */}
      <VillageSection>
        <StoryGrid
          heading="Latest Stories"
          subheading="Real founder experiences transformed into blogs, reels and carousels."
          action={{ label: 'View All Stories', href: '/stories' }}
          filter={{ publicOnly: true, limit: 6 }}
          columns={3}
          cardVariant="vertical"
          showSummary
          showFounder
          showTopics
          showCTA
          emptyTitle="The Village is about to come alive."
          emptyMessage="The first stories will appear here as founders begin publishing. Real experiences, real businesses, real ideas — all permanent."
        />
      </VillageSection>

      {/* ── 4. Trending Ideas ───────────────────────────────────────────────── */}
      {/*
        Knowledge extracted from stories.
        IdeaGrid with showQuotes enabled — every 4th card becomes a full-width
        editorial quote from a real founder, breaking the grid rhythm intentionally.
      */}
      <VillageSection surface>
        <IdeaGrid
          heading="Trending Ideas"
          subheading="Knowledge extracted from stories across the Village."
          action={{ label: 'Explore Ideas', href: '/ideas' }}
          filter={{ publicOnly: true, featured: true, limit: 6 }}
          columns={3}
          showQuotes
          emptyTitle="The first ideas are waiting to be discovered."
          emptyMessage="Ideas are extracted from published founder stories. As founders publish, the knowledge layer of the Village will grow here."
        />
      </VillageSection>

      {/* ── 5. Featured Founders + Mercato preview ──────────────────────────── */}
      {/*
        Two grids side by side on desktop — people and businesses together.
        Keeps the human + commercial ecosystem visible in one section.
      */}
      <VillageSection>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">

          <FounderGrid
            heading="Featured Founders"
            subheading="Meet the people behind the knowledge."
            action={{ label: 'All Founders', href: '/founders' }}
            filter={{ publicOnly: true, featured: true, limit: 3 }}
            columns={2}
            cardVariant="default"
            emptyTitle="The first Publisher is about to arrive."
            emptyMessage="Featured founders will appear here once they've published to the Village."
          />

          <BusinessGrid
            heading="Mercato"
            subheading="Discover businesses through the stories and ideas behind them."
            action={{ label: 'Browse Mercato', href: '/mercato' }}
            filter={{ publicOnly: true, featured: true, limit: 3 }}
            columns={2}
            cardVariant="default"
            emptyTitle="The Mercato is almost open."
            emptyMessage="Featured businesses will appear here once their founders begin publishing."
          />

        </div>
      </VillageSection>

      {/* ── 6. Explore by Location ──────────────────────────────────────────── */}
      {/*
        Six location cards, portrait orientation.
        Each shows story count — incentivises publishing from underrepresented cities.
      */}
      <VillageSection surface>
        <MapPreviewWidget
          heading="Explore by Location"
          subheading="Discover founders, businesses and stories from across Australia."
          action={{ label: 'Open Map', href: '/map' }}
          limit={6}
        />
      </VillageSection>

      {/* ── 7. Noticeboard ──────────────────────────────────────────────────── */}
      {/*
        Latest events, collaborations, opportunities and requests.
        Community pulse — keeps the Village feeling alive and active.
      */}
      <VillageSection>
        <NoticeboardPreviewWidget
          heading="Noticeboard"
          subheading="Events, collaborations and opportunities from the Village."
          limit={3}
        />
      </VillageSection>

      {/* ── 8. Archive CTA ──────────────────────────────────────────────────── */}
      {/*
        Dark search-led CTA block. Closes every homepage visit with a discovery prompt.
        Reinforces the Village's core promise: knowledge lives here permanently.
      */}
      <VillageSection surface tight>
        <ArchiveCTAWidget variant="dark" />
      </VillageSection>

    </main>
  )
}
