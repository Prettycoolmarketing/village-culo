import React from 'react'
import { Link } from 'react-router-dom'
import { usePageMeta } from '../utils/usePageMeta'
import { useInstantJoin } from '../hooks/useInstantJoin'
import { HeroWidget }                from '../widgets/HeroWidget'
import { FeaturedWidget }            from '../widgets/FeaturedWidget'
import { StoryGrid }                 from '../widgets/StoryGrid'
import { IdeaAnnouncementCarousel }  from '../widgets/IdeaAnnouncementCarousel'
import { FounderGrid }               from '../widgets/FounderGrid'
import { BusinessGrid }              from '../widgets/BusinessGrid'
import { MapPreviewWidget }          from '../widgets/MapPreviewWidget'
import { NoticeboardPreviewWidget }  from '../widgets/NoticeboardPreviewWidget'
import { filterEvents }              from '../utils/filters'
import { InnerContainer }            from '../components/layout/PageContainer'
import { getStories } from '../services/stories'
import { dailyRotatingSlice } from '../utils/rotation'

// Compact inline variant of the same signup mechanic JoinVillagePage uses —
// no full-page takeover here, just inline feedback within this section's
// own space, since this is embedded partway down the homepage, not a
// dedicated page. Tagged source=canva — see the section comment above.
function HomeInstantJoin() {
  const { email, setEmail, submitting, error, checkEmail, alreadyMember, handleSubmit } = useInstantJoin('canva')

  if (alreadyMember) {
    return (
      <p className="font-body text-sm text-white/70 max-w-xl mx-auto lg:mx-0">
        <span className="font-medium text-white">{email}</span> already has a Culo Village account —{' '}
        <Link to="/dashboard/login" className="text-primary underline hover:text-white transition-colors">sign in</Link> to pick up where you left off.
      </p>
    )
  }

  if (checkEmail) {
    return (
      <p className="font-body text-sm text-white/70 max-w-xl mx-auto lg:mx-0">
        Check your email — we sent a confirmation link to <span className="font-medium text-white">{email}</span>.
      </p>
    )
  }

  return (
    <form onSubmit={e => void handleSubmit(e)} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto lg:mx-0">
      <input
        type="email"
        required
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="you@email.com"
        aria-label="Email address"
        className="flex-1 min-w-0 rounded-xl px-5 py-4 text-base bg-white/10 text-white placeholder:text-white/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 transition-colors"
      />
      <button
        type="submit"
        disabled={submitting}
        className="shrink-0 rounded-xl px-8 py-4 text-base font-semibold bg-primary text-white hover:bg-[#b05a35] disabled:opacity-60 transition-colors"
      >
        {submitting ? 'Joining…' : 'Join the Village'}
      </button>
      {error && <p className="font-body text-sm text-red-400 w-full">{error}</p>}
    </form>
  )
}

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

      {/* ── 1. CULO Creatives ────────────────────────────────────────────────
        Full-bleed and hero-scale (matching /how-culo-canva). Instant email
        capture right here — no click-through to /join needed first — so
        anyone landing on culovillage.com can start immediately. Tagged
        source=canva, since this whole section is specifically the Creatives
        pitch: it's the funnel into the Canva-first Welcome experience, same
        as the in-app "Continue in The Culo Village" button.
      */}
      <section className="bg-charcoal relative overflow-hidden" aria-labelledby="creatives-heading">
        <InnerContainer className="pt-20 pb-16 md:pt-28 md:pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <p className="font-body text-xs font-semibold text-primary uppercase tracking-widest mb-4">
                Coming soon · Exclusively in Canva
              </p>
              <h2 id="creatives-heading" className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
                CULO Creatives is coming to Canva.
              </h2>
              <p className="font-body text-lg md:text-xl text-white/70 leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0">
                Culo Creatives helps founders turn their messy thoughts and raw footage into
                social media content. CULO helps you create blogs, carousels and multiple reel formats from
                the stories, experiences and insights you already have.
              </p>
              <HomeInstantJoin />
              <Link to="/how-culo-canva" className="inline-block text-base sm:text-lg font-semibold text-white hover:text-primary transition-colors mt-5 underline underline-offset-4 decoration-white/30 hover:decoration-primary">
                Learn more about CULO Creatives in Canva →
              </Link>
            </div>
            <div className="relative hidden lg:block">
              <img
                src="/creatives/culo-canva-hero.png"
                alt="CULO Creatives inside Canva — turn your expertise into structured content in Canva, then publish in the Village for discovery"
                className="w-full h-auto rounded-3xl"
              />
            </div>
          </div>
        </InnerContainer>
      </section>

      {/* ── 2. Hero ─────────────────────────────────────────────────────────── */}
      {/*
        Headline, search bar and popular topic pills.
        The front door to the Village — sets the editorial tone.
      */}
      <HeroWidget />

      {/* ── 3. Today's Highlights ───────────────────────────────────────────── */}
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

      {/* ── 4. Latest Stories ───────────────────────────────────────────────── */}
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
          // A rotating window of the most recent stories, not a fixed top 6 —
          // otherwise this always showed the exact same stories, and clicking
          // "View All Stories" led straight back into the same items at the
          // top of /stories. /stories itself stays plain newest-first (best
          // for SEO/crawl consistency); only this homepage preview rotates.
          stories={dailyRotatingSlice(
            [...getStories({ publicOnly: true })].sort((a, b) => (b.publishedAt ?? b.createdAt).localeCompare(a.publishedAt ?? a.createdAt)).slice(0, 18),
            6
          )}
          hideKey="homepage"
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

      {/* ── 5. From the Village — founder announcement carousel ─────────────
          Replaces the old static "Trending Ideas" grid. A continuously
          scrolling strip gives variety (many founders cycle through a small
          space instead of a fixed 6-card grid) without cluttering the
          homepage, and renders nothing at all once there's nothing real to
          show — no "coming soon" placeholder needed here. */}
      <VillageSection surface>
        <IdeaAnnouncementCarousel
          heading="From the Village"
          subheading="Founders publishing real knowledge, right now."
          action={{ label: 'Explore Ideas', href: '/ideas' }}
        />
      </VillageSection>

      {/* ── 6. Featured Founders + Mercato preview ──────────────────────────── */}
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
            filter={{ publicOnly: true, featured: true }}
            limit={4}
            rotate
            fallbackToPublic
            columns={2}
            cardVariant="default"
            emptyTitle="The first Publisher is about to arrive."
            emptyMessage="Founders will appear here once they've published to the Village."
          />

          <BusinessGrid
            heading="Businesses"
            subheading="Discover businesses through the stories and ideas behind them."
            action={{ label: 'Browse Businesses', href: '/businesses' }}
            filter={{ publicOnly: true, featured: true }}
            limit={4}
            rotate
            fallbackToPublic
            columns={2}
            cardVariant="default"
            emptyTitle="Businesses are almost open."
            emptyMessage="Businesses will appear here once their founders begin publishing."
          />

        </div>
      </VillageSection>

      {/* ── 7. Explore by Location ──────────────────────────────────────────── */}
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

      {/* ── 8. Noticeboard ──────────────────────────────────────────────────── */}
      {/*
        Latest events, collaborations, opportunities and requests.
        Hidden entirely when there's nothing on the noticeboard yet, rather
        than showing an empty "check back soon" band on the homepage.
      */}
      {filterEvents({ limit: 3 }).length > 0 && (
        <VillageSection>
          <NoticeboardPreviewWidget
            heading="Noticeboard"
            subheading="Events, collaborations and opportunities from the Village."
            limit={3}
            hideWhenEmpty
          />
        </VillageSection>
      )}

    </main>
  )
}
