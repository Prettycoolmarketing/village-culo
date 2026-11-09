import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { usePageMeta } from '../utils/usePageMeta'
import { syncPublishedContent } from '../lib/publicSync'
import { normalizeUrl } from '../utils/url'
import { getFounders } from '../services/founders'
import { getBusiness, getBusinesses } from '../services/businesses'
import { recommendationService, publisherPartnerProfileService } from '../services/partnership'
import { importedContentService } from '../services/importedContent'
import { getStories } from '../services/stories'
import { getSeriesList, getSeriesEpisodes } from '../services/series'
import { villageContentIntelligenceService } from '../services/villageIntelligence'
import { getFeaturedIn, getConnectedTo } from '../services/relationships'
import { ImportedContentCard } from '../components/cards/ImportedContentCard'
import { CreateWithCuloCTA } from '../components/ui/CreateWithCuloCTA'
import { FeaturedInSection } from '../components/ui/FeaturedInSection'
import { ConnectedToWidget } from '../components/ui/ConnectedToWidget'
import { ReelContent } from '../components/ui/ReelContent'
import { BizLogo } from '../components/ui/BizLogo'
import { StoryGrid } from '../widgets/StoryGrid'
import { CoverImage } from '../components/ui/CoverImage'
import { IdeaGrid } from '../widgets/IdeaGrid'
import { LibraryGrid } from '../widgets/LibraryGrid'
import { EventGrid } from '../widgets/EventGrid'
import { BusinessCard } from '../components/cards/BusinessCard'
import { Badge } from '../components/ui/Badge'
import { Avatar } from '../components/ui/Avatar'
import { InnerContainer } from '../components/layout/PageContainer'
import { AreYouThisFounderCTA, ClaimPitchBox, ClaimProfileBanner } from '../components/ui/ClaimProfileBanner'
import { ExitIntentClaimPopup } from '../components/ui/ExitIntentClaimPopup'
import { TrackedRecommendationLink } from '../components/ui/TrackedRecommendationLink'
import { FounderSocialLinks } from '../components/ui/FounderSocialLinks'
import { formatLocationFull } from '../utils/location'
import { slugify } from '../utils/slugify'
import { CULO_ORGANIZATION } from '../utils/seo'
import { MIN_TOPIC_STORIES } from './TopicPage'

// ─── Not Found ──────────────────────────────────────────────────────────────────

function FounderNotFound({ slug }: { slug: string }) {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4" id="founder-not-found">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6" aria-hidden="true">
          <svg className="w-8 h-8 text-primary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h1 className="font-heading text-2xl font-semibold text-charcoal mb-3">Founder not found</h1>
        <p className="font-body text-muted mb-2">
          We couldn't find a founder with the slug <code className="text-sm bg-border px-1.5 py-0.5 rounded">{slug}</code>.
        </p>
        <p className="font-body text-sm text-muted mb-8">They may not have published yet, or the URL may have changed.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/founders" className="px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-[#b05a35] transition-colors">Browse All Founders</Link>
          <Link to="/" className="px-5 py-2.5 border border-border text-charcoal text-sm font-medium rounded-xl hover:border-primary hover:text-primary transition-colors">Back to Village</Link>
        </div>
      </div>
    </main>
  )
}

// ─── Founder Profile ─────────────────────────────────────────────────────────────

const VISITED_FOUNDERS_KEY = 'culo_v1_visited_founders'

function hasVisitedFounder(founderId: string): boolean {
  try {
    const raw = localStorage.getItem(VISITED_FOUNDERS_KEY)
    return raw ? (JSON.parse(raw) as string[]).includes(founderId) : false
  } catch {
    return false
  }
}

function markFounderVisited(founderId: string): void {
  try {
    const raw = localStorage.getItem(VISITED_FOUNDERS_KEY)
    const ids: string[] = raw ? JSON.parse(raw) : []
    if (!ids.includes(founderId)) localStorage.setItem(VISITED_FOUNDERS_KEY, JSON.stringify([...ids, founderId]))
  } catch {
    // localStorage unavailable (private browsing, etc.) — binge-redirect just
    // won't persist across visits, nothing else depends on this.
  }
}

export function FounderProfilePage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const founder = getFounders().find(f => f.slug === slug)

  // A first-ever visitor (empty local cache, no prior visit to this site)
  // hits this page before App.tsx's own startup sync has had a chance to
  // land anything — getFounders() legitimately returns nothing yet, so
  // "not found" was true for a moment. The bug: nothing ever re-checked.
  // syncPublishedContent() returns the SAME shared, already-in-flight
  // promise App.tsx kicked off on mount (see publicSync.ts) — awaiting it
  // again here is free, not a second fetch — but until this resolved,
  // this page had no way to know "founder genuinely doesn't exist" from
  // "founder not loaded yet," and rendered the first as if it were the
  // second. Confirmed real, live: a freshly published founder's own first
  // share of her profile link, opened in a browser with no prior visit to
  // the site, showed "Founder not found" and silently never corrected
  // itself — only a manual reload (which now has a warm cache available
  // on the very first render) fixed it. A visitor has no reason to know
  // to reload a page that confidently told them the link was dead.
  const [hasSynced, setHasSynced] = useState(false)
  useEffect(() => { void syncPublishedContent().then(() => setHasSynced(true)) }, [])

  // Binge-on-first-click: the very first time anyone lands on this founder's
  // profile, and they have at least one published series with episodes, send
  // them straight into Episode 1 instead of the profile overview. Every
  // subsequent visit (or a direct link to a specific episode/series) behaves
  // exactly as it always has.
  useEffect(() => {
    if (!founder || (founder.status !== 'published' && founder.status !== 'featured')) return
    if (hasVisitedFounder(founder.id)) return
    markFounderVisited(founder.id)
    const firstSeries = getSeriesList({ founderId: founder.id, publicOnly: true })[0]
    if (!firstSeries) return
    const firstEpisode = getSeriesEpisodes(firstSeries.id)
      .filter(ep => ep.status === 'published' || ep.status === 'featured')[0]
    if (firstEpisode) navigate(`/stories/${firstEpisode.slug}`, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [founder?.id])

  // Pre-guard lookups — hooks must be called unconditionally before any early return
  // Business.founderId is the real ownership FK (one founder can own many
  // businesses); Founder.businessId is only a "primary business" convenience
  // pointer, and can be stale for a founder's second/third business — so the
  // real owned set comes first, with the pointer used only to pick which one
  // is primary when it's still valid.
  // A business with no name yet (still "Untitled business" mid-setup in the
  // dashboard) must never render publicly — filtered here, at the source,
  // rather than in each place this list gets rendered, so nothing downstream
  // can accidentally re-introduce a blank card.
  // An unclaimed curated profile's businessId/business associations come
  // from whatever external dataset seeded it, not from the founder
  // actually telling us about a real business they run — confirmed real:
  // dozens of curated founders ended up pointing at the same generic
  // placeholder "CULO" business. Never show business info for one of
  // these until a real person actually claims the profile and sets their
  // own business up properly.
  const founderOwnedBusinesses = founder && !(founder.profileStatus === 'village-curated' && !founder.userId)
    ? getBusinesses({ founderId: founder.id }).filter(b => b.name.trim().length > 0)
    : []
  const business           = founder
    ? founderOwnedBusinesses.find(b => b.id === founder.businessId) ?? founderOwnedBusinesses[0]
    : undefined
  const founderIntelRecords = founder ? villageContentIntelligenceService.getByFounder(founder.id) : []
  const founderFeaturedIn  = founder ? getFeaturedIn('founder', founder.id) : []
  const founderConnectedTo = founder ? getConnectedTo('founder', founder.id) : []
  const bookingUrl         = founder ? publisherPartnerProfileService.get(founder.id)?.bookingUrl : undefined
  const isVillagePartner   = founder ? (publisherPartnerProfileService.get(founder.id)?.enabled ?? false) : false

  usePageMeta({
    title:       founder && founder.seoTitle && founder.seoTitle !== founder.name
                   ? `${founder.seoTitle} — ${founder.name}`
                   : founder?.name,
    description: founder?.seoDescription || founder?.bio?.slice(0, 160),
    keywords:    [
      ...(founder?.topics.map(t => t.name) ?? []),
      ...[...new Set(founderIntelRecords.flatMap(r => r.seoKeywords))].slice(0, 8),
    ].slice(0, 15),
    ogType:  'profile',
    ogImage: founder?.coverImage ?? founder?.avatar,
    jsonLd:  founder && (founder.status === 'published' || founder.status === 'featured') ? {
      '@context':   'https://schema.org',
      '@type':      'Person',
      name:         founder.name,
      ...(founder.alternateName ? { alternateName: founder.alternateName } : {}),
      description:  founder.bio ?? '',
      url:          `${window.location.origin}/founders/${founder.slug}`,
      ...(founder.avatar ? { image: founder.avatar } : {}),
      sameAs:       [
        founder.website, founder.instagram, founder.linkedin, founder.youtube, founder.tiktok, founder.podcast, founder.newsletter,
        ...founderFeaturedIn.map(f => f.source.url),
      ].filter(Boolean),
      knowsAbout:   [
        ...founder.topics.map(t => t.name),
        ...[...new Set(founderIntelRecords.flatMap(r => r.primaryTopics))].slice(0, 5),
      ].slice(0, 10),
      ...(founder.industry?.name ? { jobTitle: founder.industry.name } : {}),
      ...(business ? { worksFor: { '@type': 'Organization', name: business.name, ...(business.website ? { url: business.website } : {}) } } : {}),
      homeLocation: {
        '@type': 'Place',
        name: formatLocationFull(founder.location),
      },
      // Ties every founder's Person entity back to the one real,
      // consistently-shaped CULO Organization (see utils/seo.ts) — this is
      // what lets a knowledge graph actually treat these as published,
      // sourced profiles rather than disconnected, unverifiable pages.
      publisher: CULO_ORGANIZATION,
      isPartOf: { '@type': 'WebSite', name: CULO_ORGANIZATION.name, url: CULO_ORGANIZATION.url },
    } : undefined,
  })

  // No separate "is this founder public" check here — RLS is what actually
  // decides that: a draft founder only ever reaches this browser's local
  // cache at all if the signed-in session is authorized to see it (its own
  // owner, or CAPO staff via is_village_admin()). A real anonymous visitor
  // hitting a draft's URL gets nothing back from Supabase in the first
  // place, so `founder` is genuinely undefined for them — this used to
  // additionally require status === published/featured, which blocked the
  // dashboard's own "Preview (not public yet)" link for every draft, the
  // one case this branch exists to serve.
  // Not synced yet — this is genuinely unknown, not genuinely missing.
  // Render nothing rather than a confident false "not found" (matches the
  // app's own Suspense fallback={null} elsewhere) until the real answer is in.
  if (!founder) return hasSynced ? <FounderNotFound slug={slug ?? ''} /> : null
  // Same minimum bar as getFounders({ publicOnly: true }) (see
  // services/founders.ts) — a published founder with no real bio at all
  // (never wrote/connected/imported anything) shouldn't have a working
  // public page just because status reached published/featured somehow.
  // Doesn't affect previewing your own still-draft profile — draft status
  // means RLS already kept this from reaching an anonymous visitor at all.
  //
  // Scoped to unclaimed curated founders only — that's the actual scenario
  // this guards against (an auto-published stub nobody's ever personalized).
  // Previously applied to EVERY published founder regardless of claim
  // status, which meant a real claimed/verified founder's live public page
  // would go dead with a confusing "Founder not found" the moment their
  // bio field was empty for any reason (mid-edit, a stray-whitespace save
  // bug, etc.) — confirmed real: Sunita Patil's bio had saved as a single
  // newline character, and her own claimed, account-holding profile
  // disappeared behind this exact message.
  if ((founder.status === 'published' || founder.status === 'featured')
    && founder.profileStatus === 'village-curated' && !founder.userId
    && !founder.bio?.trim()) {
    return <FounderNotFound slug={slug ?? ''} />
  }
  // Real FAQs the founder actually wrote (Profile > FAQ tab) — this used to
  // read from a parallel fake FAQ system that had no connection to what
  // founders could edit, so answering FAQs in the dashboard never showed up
  // here at all.
  const faqs              = (founder.faqs ?? []).filter(f => f.answer.trim().length > 0)

  const approvedRecs    = recommendationService.getAll({ founderId: founder.id, status: 'approved' })
    .filter(r => r.disclosureVisible)
  // publicOnly only applies once this founder is actually published — for a
  // draft founder being previewed, `founder` itself is only ever non-null
  // here because RLS already decided this exact viewer is allowed to see it
  // (its own owner, or CAPO staff), so showing their draft content too is
  // no more of a leak than the founder profile itself already is. A real
  // anonymous visitor hitting a draft founder's URL never reaches this line
  // at all — see the founder-not-found branch above.
  // Excludes anything with relatedStoryId set — once an import has been
  // published, it's a real Story now (shown above under Stories by X /
  // Articles Written by CULO's culoWrittenStories), and this list existed
  // to show imports BEFORE that happened. Without this filter, publishing
  // "Culo's Article" (see DashboardProfilePage's handleCuloArticleDecision,
  // which deliberately keeps the original import row status 'published' as
  // a record) left the exact same piece rendering twice on the public page —
  // once as the Story, once again here as its own card. Every dashboard-side
  // list already treats relatedStoryId this same way (see
  // DashboardProfilePage's notPublished/isPublishedStat); this was the one
  // public-facing query that never got the same exclusion.
  // Also excludes anything with no real article body — a source row that
  // was published (or previewed) before the Writer ever produced content
  // for it, or whose write attempt failed/was skipped, has nothing but a
  // title and a source link. Confirmed real: Kirsty Gibbs's "— source" row
  // had no description at all and still rendered a bare, content-free card
  // on her public preview. A blank card isn't a useful public-facing
  // placeholder — hide it from this list until it actually has something.
  const publicImports   = importedContentService.getAll({
    founderId: founder.id,
    publicOnly: founder.status === 'published' || founder.status === 'featured',
  }).filter(i => !i.relatedStoryId && (i.description?.trim().length ?? 0) > 0)

  // Featured picks — stories the founder has chosen to spotlight (see
  // Profile > Content). When they've picked any, the public profile leads
  // with just these instead of the full auto-imported story grid, so a
  // profile built mostly from a bulk archive import doesn't show a wall of
  // repeated or low-quality cover images.
  const featuredVideoStories = (founder.featuredVideoStoryIds ?? [])
    .map(id => getStories({ publicOnly: true }).find(s => s.id === id))
    .filter((s): s is NonNullable<typeof s> => !!s)
  const hasFeaturedPicks = featuredVideoStories.length > 0

  // Unclaimed curated founders never uploaded their own cover photo — a
  // shared Culo-branded banner gives the page a real hero instead of an
  // empty gap, without pretending to be a personal photo.
  const isUnclaimedCurated = founder.profileStatus === 'village-curated' && !founder.userId
  const villageMemberCount = isUnclaimedCurated ? getFounders({ publicOnly: true }).length : 0

  // A Story this founder never actually wrote isn't "Stories by X" just
  // because they've claimed the profile — Culo wrote it (see writtenByCulo
  // in publishStory.ts), and it stays that way, per-article, until the
  // founder's own edit stamps founderEditedAt (see StoryEditor.tsx). These
  // get pulled out of "Stories by X" entirely and shown alongside the
  // imported "Articles Written by CULO" instead, regardless of the
  // founder's overall claimed status.
  const allFounderStories = getStories({ founderId: founder.id, publicOnly: true, includeUnclaimedCurated: true })
  // An unclaimed founder (no userId at all) cannot possibly have personally
  // written or edited anything themselves, regardless of whether the
  // writtenByCulo flag happens to be set — confirmed live as a real bug: a
  // batch of older curated stories never got writtenByCulo stamped true at
  // creation time, which put them in founderOwnStories, which then never
  // rendered anywhere because hasRealStories is forced false for an
  // unclaimed founder. Treating every story as Culo-written for an
  // unclaimed founder (not just ones where the flag is set) closes that gap
  // instead of depending on every past and future curation path to have
  // stamped the flag correctly.
  const culoWrittenStories = allFounderStories.filter(s => isUnclaimedCurated || (s.writtenByCulo && !s.founderEditedAt))
  const founderOwnStories = allFounderStories.filter(s => !isUnclaimedCurated && !(s.writtenByCulo && !s.founderEditedAt))

  // A curated founder with no real published Stories yet has nothing else
  // to lead with — "From Around the Web" is the whole page, so it should
  // come first. A founder with real Stories/Featured picks already has a
  // proper lead; From Around the Web then reads as supplementary and
  // belongs after it, not competing with it for the top of the page.
  // An unclaimed curated founder stays in the "From Around the Web only"
  // shape even once Publish has turned their articles into real Stories —
  // "Stories by X" reads as if they're here writing/publishing themselves,
  // which isn't true until they've actually claimed the profile.
  const founderStoryCount = founderOwnStories.length
  const hasRealStories = !isUnclaimedCurated && founderStoryCount > 0
  const heroImage = founder.coverImage || (isUnclaimedCurated ? '/assets/culo-brand-cover.png' : undefined)

  // A single curated article often IS the entire page for a brand-new
  // profile — clamping its summary to a few lines the same way a list of
  // several would reads as withholding when there's nothing else to see.
  // With just one, show it in full. 1 article: one wide, prominent card.
  // 2 or 3: an evenly-split row, each still bigger than the plain list
  // treatment. 4+: a proper wrapping 3-per-row grid, same column count
  // every row rather than trailing off into a single stacked column.
  const importsLayoutClass =
    publicImports.length === 2 ? 'grid grid-cols-1 sm:grid-cols-2 gap-6' :
    publicImports.length === 3 ? 'grid grid-cols-1 sm:grid-cols-3 gap-6' :
    'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
  const importsCardSize = publicImports.length === 1 ? 'featured' : publicImports.length <= 3 ? 'large' : 'default'
  const importsSection = (publicImports.length > 0 || culoWrittenStories.length > 0) && (
    <section aria-labelledby="founder-imports-heading">
      <h2 id="founder-imports-heading" className="font-heading text-lg font-semibold text-charcoal mb-4">
        Articles Written by CULO
      </h2>
      {/* Culo-written Stories render first, alongside the plain imported
          articles — same section, same heading, since both mean the same
          thing to a reader: Culo wrote this, not the founder. */}
      {culoWrittenStories.length > 0 && (
        <StoryGrid
          stories={culoWrittenStories}
          columns={culoWrittenStories.length === 1 ? 1 : 2}
          cardVariant={culoWrittenStories.length === 1 ? 'horizontal' : 'vertical'}
          showFounder={false}
          className="mb-6"
        />
      )}
      <div className={importsLayoutClass}>
        {publicImports.slice(0, 10).map(item => (
          <ImportedContentCard key={item.id} content={item} size={importsCardSize} founder={founder} />
        ))}
      </div>
      {publicImports.length > 10 && (
        <details className="group mt-4">
          <summary className="cursor-pointer list-none text-sm font-semibold text-primary hover:underline">
            <span className="group-open:hidden">View all {publicImports.length} →</span>
            <span className="hidden group-open:inline">Show fewer</span>
          </summary>
          <div className="flex flex-col gap-4 mt-4">
            {publicImports.slice(10).map(item => (
              <ImportedContentCard key={item.id} content={item} founder={founder} />
            ))}
          </div>
        </details>
      )}
    </section>
  )

  // Series — one shelf per published series this founder runs, each shown
  // with its episodes in order. A series with zero published episodes
  // (everything in it unpublished/draft) has nothing worth showing, so it's
  // dropped rather than rendered as an empty shelf.
  const founderSeriesShelves = getSeriesList({ founderId: founder.id, publicOnly: true })
    .map(series => ({ series, episodes: getSeriesEpisodes(series.id).filter(ep => ep.status === 'published' || ep.status === 'featured') }))
    .filter(shelf => shelf.episodes.length > 0)

  // ── Village Intelligence — aggregate across all content ───────────────────
  // `locations` (cities/regions AI-extracted from content) used to render
  // as plain chips here too — dropped entirely. These are incidental
  // mentions anywhere in a founder's content (a client's city, a place
  // they once visited), not where the founder is based, and nothing
  // distinguished them from the founder's real, correct location shown in
  // the hero above. A Griffith/Sydney founder whose content happened to
  // mention London once ended up with a "London" badge on her own page —
  // confusing at best, and actively wrong-looking at worst.
  const aggregatedIntel = founderIntelRecords.length > 0 ? {
    topics:    [...new Set(founderIntelRecords.flatMap(r => r.primaryTopics))].slice(0, 10),
    questions: [...new Set(founderIntelRecords.flatMap(r => [...r.searchQuestions, ...r.geoQuestions]))].slice(0, 6),
    lessons:   [...new Set(founderIntelRecords.flatMap(r => r.lessons))].slice(0, 4),
    relatedFounderIds:   [...new Set(founderIntelRecords.flatMap(r => r.relatedFounderIds))].filter(id => id !== founder.id).slice(0, 3),
    relatedBusinessIds:  [...new Set(founderIntelRecords.flatMap(r => r.relatedBusinessIds))].slice(0, 3),
  } : null

  // A topic chip is only worth showing as a link once it's a real page
  // worth landing on (TopicPage itself refuses to render below this many
  // stories — see MIN_TOPIC_STORIES) — otherwise it's dead weight, same
  // complaint as the locations chips above, just not as visibly wrong.
  // Below threshold it still shows as plain text rather than disappearing,
  // since the word itself ("technology", "business"...) is still a real,
  // true signal about the founder even without a page behind it yet.
  const publishedStories = getStories({ publicOnly: true })
  function richTopicSlug(label: string): string | null {
    const slug = slugify(label)
    const count = publishedStories.filter(s => s.topics.some(t => t.slug === slug)).length
    return count >= MIN_TOPIC_STORIES ? slug : null
  }

  // Extracted so it can render in two different spots depending on
  // isUnclaimedCurated (see below) rather than being duplicated — an
  // unclaimed curated founder has no real Stories/sidebar content, so
  // this rendering inside the normal 2/3+1/3 grid left it floating oddly
  // to the right of a near-empty main column; it belongs with the
  // full-width "From Around the Web" block instead for that case.
  const exploreFurtherSection = aggregatedIntel && aggregatedIntel.topics.length > 0 && (
    <section aria-labelledby="founder-explore-heading">
      <h2 id="founder-explore-heading" className="font-heading text-lg font-semibold text-charcoal mb-4">
        Topics Covered
      </h2>

      <div className="flex flex-wrap gap-1.5">
        {aggregatedIntel.topics.map(t => {
          const slug = richTopicSlug(t)
          return slug ? (
            <Link key={t} to={`/topics/${slug}`}
              className="font-body text-xs px-2.5 py-0.5 rounded-full bg-secondary/10 text-secondary hover:bg-secondary/20 transition-colors">
              {t}
            </Link>
          ) : (
            <span key={t} className="font-body text-xs px-2.5 py-0.5 rounded-full bg-secondary/10 text-secondary">
              {t}
            </span>
          )
        })}
      </div>
    </section>
  )

  // Intel-driven related businesses — exclude the founder's own (already
  // shown above in "Connect with {founder}"), otherwise a business the
  // founder runs themselves can double up in both sections.
  const intelRelatedBusinesses = aggregatedIntel
    ? aggregatedIntel.relatedBusinessIds
        .map(id => getBusinesses({ publicOnly: true }).find(b => b.id === id))
        .filter((b): b is NonNullable<typeof b> => !!b && !founderOwnedBusinesses.some(fb => fb.id === b.id))
    : []

  return (
    <main className="min-h-screen bg-background" id="founder-profile">

      {/* ── Breadcrumb ──────────────────────────────────────────────────────── */}
      <nav className="bg-surface border-b border-border pt-20 pb-4" aria-label="Breadcrumb">
        <InnerContainer>
          <ol className="flex items-center gap-2 text-sm font-body text-muted" role="list">
            <li><Link to="/" className="hover:text-primary transition-colors">Village</Link></li>
            <li aria-hidden="true" className="text-border">›</li>
            <li><Link to="/founders" className="hover:text-primary transition-colors">Founders</Link></li>
            <li aria-hidden="true" className="text-border">›</li>
            <li className="text-charcoal font-medium truncate" aria-current="page">{founder.name}</li>
          </ol>
        </InnerContainer>
      </nav>

      {/* Back at the top again, per direct request — moving it down to just
          above the evidence strip (it's also still there, see
          ClaimProfileBanner further down) traded away real claims for a
          cleaner hero. Showing it twice is deliberate: top, where every
          visitor sees it before anything else, and bottom, for anyone who
          read the whole page first. */}
      <ClaimProfileBanner founder={founder} />
      <ExitIntentClaimPopup founder={founder} />

      {founder.profileStatus === 'claim-pending' && !founder.userId && (
        <div className="bg-amber-50 border-b border-amber-100" role="note">
          <InnerContainer>
            <div className="py-3 flex items-center gap-2.5">
              <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <p className="font-body text-sm text-amber-800">
                A claim for this profile is currently under review by CULO Village.
              </p>
            </div>
          </InnerContainer>
        </div>
      )}

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section aria-labelledby="founder-name">
        {heroImage && (
          <div className="relative h-64 sm:h-80 md:h-96 overflow-hidden bg-charcoal">
            <CoverImage src={heroImage} alt={founder.coverImage ? `${founder.name}'s cover photo` : 'The Culo Village'} className="w-full h-full object-cover opacity-70" loading="eager" />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/20 to-transparent" aria-hidden="true" />
          </div>
        )}

        <div className="bg-surface border-b border-border pb-12">
          <InnerContainer>
            <div className="flex flex-col gap-6 pt-14 sm:pt-16 -mt-2 sm:-mt-3">
              <div className="flex flex-col sm:flex-row sm:items-end gap-6">
                {/* No real photo yet reads as no avatar at all here, same
                    as FounderCard — a placeholder icon implies there's a
                    photo when there isn't, whether this founder is still
                    unclaimed/curated or has claimed their profile without
                    uploading one themselves. */}
                {founder.avatar && !founder.avatar.includes('/placeholders/') && (
                  <Avatar src={founder.avatar} alt={founder.name} size="xl"
                    className="ring-4 ring-surface shadow-lg flex-shrink-0 w-32 h-32 sm:w-40 sm:h-40 text-3xl" />
                )}
                <div className="flex-1 min-w-0 pt-2">
                  <h1 id="founder-name" className="font-heading text-2xl sm:text-4xl font-bold text-charcoal leading-tight flex flex-wrap items-center gap-2.5">
                    {founder.name}
                    {isVillagePartner && (
                      <img src="/village-partnership-logo.png" alt="Village Partnership Program member"
                        title="Village Partnership Program member"
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-full shrink-0" />
                    )}
                  </h1>
                  <p className="font-body text-base text-primary font-medium mt-1" aria-label="Industry">
                    {founder.industry.name}
                  </p>
                  <p className="font-body text-sm text-muted mt-0.5 flex items-center gap-1.5" aria-label="Location">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    {formatLocationFull(founder.location)}
                  </p>
                  {/* /speaker is a bespoke page authored for Shakas specifically
                      (not a generic per-founder feature), so this link is
                      scoped to her profile rather than shown for every founder. */}
                  {founder.slug === 'shakas-designer' && (
                    <Link to="/speaker" className="inline-block font-body text-sm font-semibold text-primary hover:underline mt-1.5">
                      🎤 Speaker &amp; Press →
                    </Link>
                  )}
                </div>
              </div>
              <FounderSocialLinks founder={founder} bookingUrl={bookingUrl} />
            </div>

            <div className="mt-8 max-w-4xl space-y-4">
              {/* Split on blank lines into real paragraphs instead of one
                  whitespace-pre-wrap block — a bio with several paragraphs
                  (a Culo-written one especially) read as one dense run-on
                  block with no visual break between ideas. */}
              {founder.bio.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean).map((p, i) => (
                <p key={i} className="font-body text-base text-charcoal/80 leading-loose">{p}</p>
              ))}
            </div>

            {founder.topics.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2" aria-label="Topics">
                {founder.topics.map(topic => (
                  <Badge key={topic.id} label={topic.name} variant="secondary" />
                ))}
              </div>
            )}

            {founderOwnedBusinesses.filter(b => b.name && b.slug).length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2.5">
                {founderOwnedBusinesses.filter(b => b.name && b.slug).map(biz => (
                  <Link key={biz.id} to={`/businesses/${biz.slug}`}
                    className="inline-flex items-center gap-2.5 px-4 py-2.5 bg-background rounded-xl border border-border text-sm font-medium text-charcoal hover:border-primary hover:text-primary transition-colors"
                    aria-label={`View ${biz.name} business profile`}>
                    <div className="w-6 h-6 rounded overflow-hidden flex-shrink-0 bg-white ring-1 ring-border flex items-center justify-center p-0.5">
                      <BizLogo logo={biz.logo} name={biz.name} className="text-[10px]" />
                    </div>
                    {biz.name}
                    <span className="text-muted text-xs">→</span>
                  </Link>
                ))}
              </div>
            )}

            {/* Create with CULO CTA — an unclaimed curated founder has no
                account to "continue" anything with yet; the CTA points at
                claiming/joining instead of the Canva creation flow. */}
            <div className="mt-7">
              {isUnclaimedCurated ? (
                <AreYouThisFounderCTA
                  founder={founder}
                  initialLabel="Claim your profile to publish instantly"
                  initialClassName="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white text-base font-semibold rounded-xl hover:bg-[#b05a35] transition-colors"
                />
              ) : (
                <CreateWithCuloCTA variant="button" size="lg" label="Publish your content in The Culo Village" />
              )}
            </div>

            <FeaturedInSection items={founderFeaturedIn} headingId="founder-featured-in-heading" className="mt-7" />
          </InnerContainer>
        </div>
      </section>

      {/* ── Evidence strip ──────────────────────────────────────────────────── */}
      <section className="bg-charcoal py-5" aria-label="Authority metrics">
        <InnerContainer>
          <div className="flex flex-wrap gap-6 sm:gap-10">
            {faqs.length > 0 && (
              <div className="flex flex-col">
                <span className="font-heading text-2xl font-bold text-white">{faqs.length}</span>
                <span className="font-body text-xs text-white/50 uppercase tracking-wide">FAQs answered</span>
              </div>
            )}
            {/* "Publishing on Village since [year]" isn't true yet for an
                unclaimed curated founder — they haven't joined or published
                anything themselves. Village size is real social proof for
                the claim CTA instead: other founders already here. */}
            {isUnclaimedCurated ? (
              <div className="flex flex-col">
                <span className="font-heading text-2xl font-bold text-white">{villageMemberCount}</span>
                <span className="font-body text-xs text-white/50 uppercase tracking-wide">Members in the Village</span>
              </div>
            ) : (
              <div className="flex flex-col">
                <span className="font-heading text-2xl font-bold text-white">{new Date(founder.createdAt).getFullYear()}</span>
                <span className="font-body text-xs text-white/50 uppercase tracking-wide">Publishing on Village since</span>
              </div>
            )}
            {founder.topics.length > 0 && (
              <div className="flex flex-col">
                <span className="font-heading text-2xl font-bold text-white">{founder.topics.length}</span>
                <span className="font-body text-xs text-white/50 uppercase tracking-wide">Topics</span>
              </div>
            )}
          </div>
        </InnerContainer>
      </section>

      {/* From Around the Web only leads when it's the only real content this
          founder has (no published Stories yet) — full page width rather
          than confined to the 2/3-width content column below, since the
          sidebar next to it has nothing of its own to show yet for a
          brand-new curated profile. A founder with real Stories/Featured
          picks gets those first, and this comes after as supplementary
          instead, nested in the normal content column (see further down). */}
      {/* isUnclaimedCurated alone (no imports yet) still needs this block —
          otherwise a brand-new curated founder with zero articles imported
          so far never gets the claim pitch box at all, since it used to be
          nested entirely inside the imports-only gate below. */}
      {!hasRealStories && (importsSection || isUnclaimedCurated) && (
        <div className="pt-14 md:pt-16">
          {/* No mx-auto — the bio/CTA content above (max-w-4xl, no auto
              margin) starts flush at the container's left edge, and
              centering this block would shift its own left edge inward,
              throwing it out of line with everything above it. */}
          <InnerContainer>
            {/* No max-w-5xl — the claim pitch box further down the page
                uses the full InnerContainer width, and a narrower cap here
                made the 3-article grid look out of line with it. */}
            <div className="flex flex-col gap-10">
              {importsSection}
              {isUnclaimedCurated && exploreFurtherSection}
              {isUnclaimedCurated && <ClaimPitchBox founder={founder} />}
            </div>
          </InnerContainer>
        </div>
      )}

      {/* ── Main content + sidebar ───────────────────────────────────────────── */}
      <div className={hasRealStories ? 'py-14 md:py-16' : 'pb-14 md:pb-16'}>
        <InnerContainer>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-14">

            {/* ── Left: Primary content ─────────────────────────────────────── */}
            <div className="lg:col-span-2 flex flex-col gap-14">

              {/* Hand-picked featured stories lead the grid (sortBlogsFirst
                  puts story.featured first, which stays in sync with the
                  founder's Featured stories picks — see toggleFeaturedStory
                  in DashboardProfilePage), then the rest of their published
                  work follows in order of most recently published. Used to
                  hide everything except the picks entirely once any existed —
                  now it's just what's on top, with the rest one "View all"
                  click away via StoryGrid's own built-in expansion. */}
              {!isUnclaimedCurated && (
                <StoryGrid
                  heading={hasFeaturedPicks ? `Featured by ${founder.name}` : `Stories by ${founder.name}`}
                  subheading={hasFeaturedPicks
                    ? undefined
                    : `Blogs, reels and carousels published by ${founder.name} through CULO Village.`}
                  filter={{ founderId: founder.id, publicOnly: true }}
                  excludeIds={culoWrittenStories.map(s => s.id)}
                  sortBlogsFirst
                  hideKey="founder-profile"
                  limit={6}
                  // A single story squeezed into a half-width grid cell
                  // reads as thin/unfinished — the same "one item gets the
                  // wide, prominent treatment" rule the Imports section
                  // below already applies (see importsCardSize) now
                  // applies here too, so a founder with exactly one
                  // published story (like Elle Kress) gets a real, full-
                  // width card instead of a small thumbnail.
                  columns={founderStoryCount === 1 ? 1 : 2}
                  cardVariant={founderStoryCount === 1 ? 'horizontal' : 'vertical'}
                  showSummary
                  showFounder={false}
                  showTopics
                  showCTA
                  hideEmpty
                />
              )}

              {hasRealStories && importsSection}

              {/* Ideas — capped with the rest one "View all" click away
                  (kept in the DOM via a native <details>, so this doesn't
                  cost anything for SEO/GEO discovery — see IdeaGrid). */}
              <IdeaGrid
                heading={`Ideas ${founder.name} talks about`}
                subheading={`Knowledge and insights connected to ${founder.name}'s stories and experiences.`}
                filter={{ founderId: founder.id, publicOnly: true }}
                columns={2}
                cardVariant="default"
                limit={4}
                hideEmpty
              />

              {/* Approved recommendations */}
              {approvedRecs.length > 0 && (
                <section aria-labelledby="founder-recs-heading">
                  <h2 id="founder-recs-heading" className="font-heading text-2xl font-semibold text-charcoal mb-2">
                    Genuine Recommendations
                  </h2>
                  <p className="font-body text-sm text-muted mb-6">
                    Tools and businesses {founder.name} has mentioned in stories and approved with a disclosure.
                  </p>
                  <ul className="flex flex-col gap-2.5" role="list">
                    {approvedRecs.map(rec => (
                      <li key={rec.id} className="bg-surface rounded-xl border border-border px-4 py-3">
                        <p className="font-body text-sm font-semibold text-charcoal leading-snug">{rec.entityName}</p>
                        {rec.disclosureText && (
                          <p className="font-body text-xs text-muted mt-1 leading-relaxed line-clamp-2 italic">
                            {rec.disclosureText}
                          </p>
                        )}
                        {rec.businessId && (
                          <TrackedRecommendationLink
                            founderId={rec.founderId}
                            businessId={rec.businessId}
                            recommendationId={rec.id}
                            storyId={rec.storyId}
                            businessWebsite={getBusiness(rec.businessId)?.website}
                            sourcePage="founder"
                            className="font-body text-xs font-semibold text-primary hover:text-[#b05a35] transition-colors mt-2 block"
                          />
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Timeline */}
              {founder.timeline && founder.timeline.length > 0 && (
                <section aria-labelledby="founder-timeline-heading">
                  <h2 id="founder-timeline-heading" className="font-heading text-2xl font-semibold text-charcoal mb-6">
                    Timeline
                  </h2>
                  <ol className="relative border-l border-border space-y-8 pl-6" role="list">
                    {[...founder.timeline].sort((a, b) => b.date.localeCompare(a.date)).map(entry => (
                      <li key={entry.id} className="relative" role="listitem">
                        <div className="absolute -left-[1.625rem] top-0.5 w-3 h-3 rounded-full bg-primary ring-4 ring-surface" aria-hidden="true" />
                        <time className="font-body text-xs text-muted font-medium block mb-1" dateTime={entry.date}>
                          {new Date(entry.date).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })}
                        </time>
                        <h3 className="font-heading text-base font-semibold text-charcoal mb-1">{entry.title}</h3>
                        <p className="font-body text-sm text-muted leading-relaxed">{entry.description}</p>
                        {entry.linkUrl && (
                          <a href={normalizeUrl(entry.linkUrl)} target="_blank" rel="noopener noreferrer"
                            className="mt-1.5 inline-block text-sm font-medium text-primary hover:text-[#b05a35] transition-colors">
                            {entry.linkLabel ?? 'Learn more'} →
                          </a>
                        )}
                      </li>
                    ))}
                  </ol>
                </section>
              )}

              {/* Library */}
              <LibraryGrid
                heading="Library"
                subheading={`Everything ${founder.name} has intentionally published — free and paid.`}
                filter={{ founderId: founder.id }}
                columns={2}
                hideEmpty
              />

              {/* Events */}
              <EventGrid
                heading="Events &amp; Opportunities"
                subheading={`Events, collaborations and opportunities from ${founder.name}.`}
                filter={{ founderId: founder.id }}
                columns={2}
                cardVariant="default"
                hideEmpty
              />

              {/* FAQ */}
              {faqs.length > 0 && (
                <section aria-labelledby="founder-faq-heading" className="mt-10">
                  <h2 id="founder-faq-heading" className="font-heading text-2xl font-semibold text-charcoal mb-2">
                    Questions &amp; Answers
                  </h2>
                  <p className="font-body text-sm text-muted mb-6">
                    Questions {founder.name} answers about their work and expertise.
                  </p>
                  <div className="flex flex-col gap-4">
                    {faqs.map(faq => (
                      <details
                        key={faq.id}
                        className="group bg-surface rounded-2xl border border-border"
                      >
                        <summary className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer list-none">
                          <h3 className="font-heading text-base font-semibold text-charcoal leading-snug">
                            {faq.question}
                          </h3>
                          <svg
                            className="w-5 h-5 text-muted flex-shrink-0 transition-transform group-open:rotate-180"
                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </summary>
                        <div className="px-6 pb-5">
                          <p className="font-body text-sm text-charcoal/80 leading-relaxed">{faq.answer}</p>
                          {faq.topicIds.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {faq.topicIds.map(tid => (
                                <span key={tid} className="font-body text-xs bg-secondary/10 text-secondary px-2 py-0.5 rounded-full">
                                  {tid.replace(/-/g, ' ')}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </details>
                    ))}
                  </div>
                </section>
              )}

              {/* Series — one binge-able shelf per series this founder runs. */}
              {founderSeriesShelves.length > 0 && (
                <section aria-labelledby="founder-series-heading" className="flex flex-col gap-10">
                  <h2 id="founder-series-heading" className="font-heading text-2xl font-semibold text-charcoal">
                    Series
                  </h2>
                  {founderSeriesShelves.map(({ series, episodes }) => (
                    <div key={series.id}>
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <div>
                          <Link to={`/series/${series.slug}`} className="font-heading text-lg font-semibold text-charcoal hover:text-primary transition-colors">
                            {series.title}
                          </Link>
                          <p className="font-body text-sm text-muted mt-0.5">{episodes.length} episode{episodes.length === 1 ? '' : 's'}</p>
                        </div>
                        <Link to={`/series/${series.slug}`} className="font-body text-sm font-medium text-primary hover:text-[#b05a35] transition-colors shrink-0">
                          See All →
                        </Link>
                      </div>
                      <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
                        {episodes.map((ep, i) => (
                          <Link
                            key={ep.id}
                            to={`/stories/${ep.slug}`}
                            className="shrink-0 w-56 group"
                          >
                            <div className="relative w-56 h-32 rounded-xl overflow-hidden bg-charcoal">
                              <img src={ep.coverImage} alt="" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                              <span className="absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/60 text-white backdrop-blur-sm">
                                Episode {i + 1}
                              </span>
                            </div>
                            <p className="font-body text-sm font-medium text-charcoal mt-2 line-clamp-2 group-hover:text-primary transition-colors">
                              {ep.title}
                            </p>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </section>
              )}

              {/* Featured picks with a video play inline here too, under the
                  arch grid above, so a visitor can watch without leaving. */}
              {featuredVideoStories.some(s => s.reelUrl) && (
                <section aria-labelledby="founder-featured-video-heading">
                  <h2 id="founder-featured-video-heading" className="font-heading text-2xl font-semibold text-charcoal mb-6">
                    Watch
                  </h2>
                  <div className="flex flex-col gap-8">
                    {featuredVideoStories.filter(s => s.reelUrl).map(story => (
                      <div key={story.id}>
                        <ReelContent
                          reelUrl={story.reelUrl}
                          title={story.title}
                          summary={story.summary}
                          landscape
                          storyHref={`/stories/${story.slug}`}
                        />
                      </div>
                    ))}
                  </div>
                </section>
              )}

            </div>

            {/* ── Right sidebar ─────────────────────────────────────────────── */}
            <aside className="lg:col-span-1 flex flex-col gap-8" aria-label="Founder details">

              {/* Business card(s) — every business this founder runs, not just the primary one */}
              {founderOwnedBusinesses.length > 0 && (
                <section aria-labelledby="founder-business-heading">
                  <h2 id="founder-business-heading" className="font-heading text-lg font-semibold text-charcoal mb-4">
                    Connect with {founder.name.split(' ')[0]}
                  </h2>
                  <div className="flex flex-col gap-4">
                    {founderOwnedBusinesses.map(biz => (
                      <BusinessCard key={biz.id} business={biz} founder={founder} variant="default" />
                    ))}
                  </div>
                </section>
              )}

              {/* Imported content — only the first few show by default; the
                  rest stay rendered in the DOM (just visually collapsed via
                  a native <details>) so search and AI crawlers still see the
                  whole list. Moved to lead the content column, directly
                  under the dark evidence strip — a founder's actual
                  written articles (with their real links and a short
                  summary) belong at the top of the page, not buried below
                  the Stories grid. */}

              {/* Explore Further renders in the full-width leading block
                  instead when isUnclaimedCurated — see exploreFurtherSection. */}
              {!isUnclaimedCurated && exploreFurtherSection}

              {/* Connected To, Related Businesses and Related Founders (further
                  below) are all auto-inferred from the relationship/intel
                  graph — real signal for a founder who's actually claimed
                  and is publishing here themselves, but noise for a profile
                  nobody's verified yet (e.g. a shared-topic overlap with an
                  unrelated real founder reading as a genuine "connection"). */}
              {!isUnclaimedCurated && <ConnectedToWidget items={founderConnectedTo} headingId="founder-connected-to-heading" />}

              {/* Intel-driven related businesses */}
              {!isUnclaimedCurated && intelRelatedBusinesses.length > 0 && (
                <section aria-labelledby="founder-intel-businesses-heading">
                  <h2 id="founder-intel-businesses-heading" className="font-heading text-lg font-semibold text-charcoal mb-4">
                    Related Businesses
                  </h2>
                  <div className="flex flex-col gap-2">
                    {intelRelatedBusinesses.map(b => {
                      const bFounder = getFounders({ publicOnly: true }).find(f => f.id === b.founderId)
                      return (
                        <Link
                          key={b.id}
                          to={`/businesses/${b.slug}`}
                          className="flex items-center gap-3 bg-surface rounded-xl p-3 border border-border hover:border-primary hover:shadow-sm transition-all group"
                          aria-label={`View ${b.name}`}
                        >
                          <div className="flex-shrink-0 w-9 h-9 rounded-lg overflow-hidden bg-white ring-2 ring-border flex items-center justify-center p-1">
                            <BizLogo logo={b.logo} name={b.name} className="text-sm" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-body text-sm font-semibold text-charcoal group-hover:text-primary transition-colors truncate">{b.name}</p>
                            <p className="font-body text-xs text-muted truncate">{bFounder?.name ?? b.industry.name}</p>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </section>
              )}

            </aside>
          </div>
        </InnerContainer>
      </div>

      {/* Blue claim banner — the very last thing on the page, right above
          the site's dark footer. The black-box pitch itself lives up in
          the "From Around the Web" section instead (see ClaimPitchBox
          above), not stacked here too. */}
      <ClaimProfileBanner founder={founder} />

    </main>
  )
}
